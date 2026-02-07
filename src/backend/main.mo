import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  /// Types
  public type Service = {
    id : Nat;
    name : Text;
    description : Text;
    createdBy : Principal;
    createdAt : Time.Time;
  };

  module Service {
    public func compare(service1 : Service, service2 : Service) : Order.Order {
      Nat.compare(service1.id, service2.id);
    };
  };

  public type QueueEntryStatus = {
    #waiting;
    #noShow;
    #cancelled;
    #served;
  };

  public type QueueEntry = {
    userId : Principal;
    joinedAt : Time.Time;
    status : QueueEntryStatus;
  };

  public type Feedback = {
    userId : Principal;
    rating : Nat;
    comment : Text;
    submittedAt : Time.Time;
  };

  public type UserProfile = {
    name : Text;
  };

  /// Persistent State

  var nextServiceId = 1;
  let services = Map.empty<Nat, Service>();
  let feedbacks = Map.empty<Nat, [Feedback]>();
  let queueEntries = Map.empty<Nat, [QueueEntry]>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  public type InitQueueArgs = {
    collection_interval : Int;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Service Management
  public shared ({ caller }) func createService(name : Text, description : Text) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create services");
    };

    let id = nextServiceId;
    let service : Service = {
      id;
      name;
      description;
      createdBy = caller;
      createdAt = Time.now();
    };

    services.add(id, service);
    nextServiceId += 1;
    id;
  };

  public query ({ caller }) func listServices() : async [Service] {
    services.values().toArray().sort();
  };

  // Queue Operations
  public shared ({ caller }) func joinQueue(serviceId : Nat) : async () {
    let service = services.get(serviceId);
    switch (service) {
      case (null) { Runtime.trap("Service does not exist") };
      case (?_) {
        let existingEntry = findUserQueueEntry(serviceId, caller);
        switch (existingEntry) {
          case (?entry) {
            switch (entry.status) {
              case (#waiting) { Runtime.trap("Already in queue") };
              case (_) { () };
            };
          };
          case (null) { () };
        };

        let queueEntry : QueueEntry = {
          userId = caller;
          joinedAt = Time.now();
          status = #waiting;
        };
        updateQueueEntries(serviceId, queueEntry);
      };
    };
  };

  public shared ({ caller }) func leaveQueue(serviceId : Nat) : async () {
    let service = services.get(serviceId);
    switch (service) {
      case (null) { Runtime.trap("Service does not exist") };
      case (?_) {
        let existingEntry = findUserQueueEntry(serviceId, caller);
        switch (existingEntry) {
          case (null) { Runtime.trap("Not in queue") };
          case (?entry) {
            switch (entry.status) {
              case (#cancelled) { Runtime.trap("Already cancelled") };
              case (_) {
                let updatedEntry = {
                  entry with
                  status = #cancelled
                };
                updateQueueEntries(serviceId, updatedEntry);
              };
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func getQueueStatus(serviceId : Nat) : async Nat {
    let service = services.get(serviceId);
    switch (service) {
      case (null) { Runtime.trap("Service does not exist") };
      case (?_) {
        let queue = queueEntries.get(serviceId);
        switch (queue) {
          case (null) { 0 };
          case (?queueList) {
            let activeQueue = queueList.filter(
              func(entry) {
                entry.status == #waiting;
              }
            );

            switch (findUserQueueEntry(serviceId, caller)) {
              case (null) { Runtime.trap("Not in queue") };
              case (?_) {
                let position = activeQueue.findIndex(
                  func(e) {
                    e.userId == caller;
                  }
                );
                switch (position) {
                  case (null) { 0 };
                  case (?pos) { pos + 1 };
                };
              };
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func getQueueSnapshot(serviceId : Nat) : async [QueueEntry] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view queue snapshots");
    };

    let service = services.get(serviceId);
    switch (service) {
      case (null) { Runtime.trap("Service does not exist") };
      case (?_) {
        switch (queueEntries.get(serviceId)) {
          case (null) { [] };
          case (?queueList) { queueList };
        };
      };
    };
  };

  // Staff/Admin Queue Controls
  public shared ({ caller }) func serveNext(serviceId : Nat) : async Principal {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can serve entries");
    };

    let activeQueue = getActiveQueue(serviceId);
    if (activeQueue.isEmpty()) {
      Runtime.trap("Queue is empty");
    };

    let nextEntry = activeQueue[0];
    let updatedEntry = {
      nextEntry with
      status = #served
    };
    updateQueueEntries(serviceId, updatedEntry);
    nextEntry.userId;
  };

  public shared ({ caller }) func markNoShow(serviceId : Nat, userId : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can mark no-shows");
    };

    let entry = findUserQueueEntry(serviceId, userId);
    switch (entry) {
      case (null) { Runtime.trap("Entry not found") };
      case (?existing) {
        if (existing.status != #waiting) {
          Runtime.trap("Not in waiting status");
        };
        let updatedEntry = {
          existing with
          status = #noShow
        };
        updateQueueEntries(serviceId, updatedEntry);
      };
    };
  };

  // Feedback APIs
  public shared ({ caller }) func submitFeedback(serviceId : Nat, rating : Nat, comment : Text) : async () {
    if (rating < 1 or rating > 5) {
      Runtime.trap("Invalid rating");
    };

    let feedback : Feedback = {
      userId = caller;
      rating;
      comment;
      submittedAt = Time.now();
    };

    let existingFeedback = feedbacks.get(serviceId);
    switch (existingFeedback) {
      case (null) { feedbacks.add(serviceId, [feedback]) };
      case (?existing) {
        feedbacks.add(serviceId, existing.concat([feedback]));
      };
    };
  };

  public query ({ caller }) func getServiceFeedback(serviceId : Nat) : async [Feedback] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view service feedback");
    };

    switch (services.get(serviceId)) {
      case (null) { Runtime.trap("Service does not exist") };
      case (?_) {
        switch (feedbacks.get(serviceId)) {
          case (null) { [] };
          case (?feedbackList) { feedbackList };
        };
      };
    };
  };

  // Helper Functions
  func findUserQueueEntry(serviceId : Nat, userId : Principal) : ?QueueEntry {
    switch (queueEntries.get(serviceId)) {
      case (null) { null };
      case (?queue) {
        queue.find(
          func(entry) {
            entry.userId == userId;
          }
        );
      };
    };
  };

  func updateQueueEntries(serviceId : Nat, entry : QueueEntry) {
    let existing = queueEntries.get(serviceId);
    switch (existing) {
      case (null) { queueEntries.add(serviceId, [entry]) };
      case (?queue) {
        let updatedQueue = queue.map(
          func(e) {
            if (e.userId == entry.userId) { entry } else { e };
          }
        );
        let finalQueue = if (updatedQueue.find(func(e) { e.userId == entry.userId }) != null) {
          updatedQueue;
        } else {
          updatedQueue.concat([entry]);
        };
        queueEntries.add(serviceId, finalQueue);
      };
    };
  };

  func getActiveQueue(serviceId : Nat) : [QueueEntry] {
    switch (queueEntries.get(serviceId)) {
      case (null) { [] };
      case (?queue) {
        queue.filter(
          func(entry) {
            entry.status == #waiting;
          }
        );
      };
    };
  };
};
