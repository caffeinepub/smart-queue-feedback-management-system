import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { useLocalStorageMode } from '../features/localStorageMode/useLocalStorageMode';
import type { Service, UserProfile, QueueEntry, Feedback, QueueEntryStatus } from '../backend';
import { Principal } from '@dfinity/principal';
import {
  getQueueEntries,
  addQueueEntry,
  updateQueueEntryStatus,
  getUserQueueEntry,
  getWaitingQueue,
  serveNextInQueue,
  getFeedbackList,
  addFeedback,
  getLocalServices,
  ensureDefaultServices,
  subscribeToStorageChanges,
  type LocalQueueEntry,
  type LocalFeedback,
} from '../utils/sqfmLocalStorage';
import { useEffect } from 'react';

// Helper to convert local status to backend enum
function toQueueEntryStatus(status: LocalQueueEntry['status']): QueueEntryStatus {
  const statusMap: Record<LocalQueueEntry['status'], QueueEntryStatus> = {
    'waiting': 'waiting' as QueueEntryStatus,
    'served': 'served' as QueueEntryStatus,
    'cancelled': 'cancelled' as QueueEntryStatus,
    'noShow': 'noShow' as QueueEntryStatus,
  };
  return statusMap[status];
}

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Service Queries
export function useListServices() {
  const { actor, isFetching: actorFetching } = useActor();
  const { isEnabled: localMode } = useLocalStorageMode();
  const queryClient = useQueryClient();

  const query = useQuery<Service[]>({
    queryKey: ['services', localMode ? 'local' : 'backend'],
    queryFn: async () => {
      if (localMode) {
        ensureDefaultServices();
        const localServices = getLocalServices();
        return localServices.map(s => ({
          id: BigInt(s.id),
          name: s.name,
          description: s.description,
          createdBy: Principal.anonymous(),
          createdAt: BigInt(0),
        }));
      }
      if (!actor) return [];
      return actor.listServices();
    },
    enabled: localMode || (!!actor && !actorFetching),
  });

  // Subscribe to local storage changes
  useEffect(() => {
    if (!localMode) return;
    const unsubscribe = subscribeToStorageChanges(() => {
      queryClient.invalidateQueries({ queryKey: ['services', 'local'] });
    });
    return unsubscribe;
  }, [localMode, queryClient]);

  return query;
}

// Queue Queries
export function useJoinQueue() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const { isEnabled: localMode } = useLocalStorageMode();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serviceId: bigint) => {
      if (localMode) {
        const userId = identity?.getPrincipal().toString() || 'anonymous';
        addQueueEntry(serviceId.toString(), userId);
        return;
      }
      if (!actor) throw new Error('Actor not available');
      return actor.joinQueue(serviceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queueStatus'] });
      queryClient.invalidateQueries({ queryKey: ['queueSnapshot'] });
    },
  });
}

export function useLeaveQueue() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const { isEnabled: localMode } = useLocalStorageMode();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serviceId: bigint) => {
      if (localMode) {
        const userId = identity?.getPrincipal().toString() || 'anonymous';
        updateQueueEntryStatus(serviceId.toString(), userId, 'cancelled');
        return;
      }
      if (!actor) throw new Error('Actor not available');
      return actor.leaveQueue(serviceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queueStatus'] });
      queryClient.invalidateQueries({ queryKey: ['queueSnapshot'] });
    },
  });
}

export function useGetQueueStatus(serviceId: bigint | null, enabled: boolean = true) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const { isEnabled: localMode } = useLocalStorageMode();
  const queryClient = useQueryClient();

  const query = useQuery<bigint>({
    queryKey: ['queueStatus', serviceId?.toString(), localMode ? 'local' : 'backend'],
    queryFn: async () => {
      if (serviceId === null) return BigInt(0);
      
      if (localMode) {
        const userId = identity?.getPrincipal().toString() || 'anonymous';
        const userEntry = getUserQueueEntry(serviceId.toString(), userId);
        
        if (!userEntry || userEntry.status !== 'waiting') {
          throw new Error('Not in queue');
        }
        
        const waiting = getWaitingQueue(serviceId.toString());
        const position = waiting.findIndex(e => e.userId === userId);
        return BigInt(position + 1);
      }
      
      if (!actor) return BigInt(0);
      return actor.getQueueStatus(serviceId);
    },
    enabled: (localMode || (!!actor && !actorFetching)) && serviceId !== null && enabled,
    refetchInterval: localMode ? 3000 : 7000,
    retry: false,
  });

  // Subscribe to local storage changes
  useEffect(() => {
    if (!localMode || !serviceId) return;
    const unsubscribe = subscribeToStorageChanges(() => {
      queryClient.invalidateQueries({ queryKey: ['queueStatus', serviceId.toString(), 'local'] });
    });
    return unsubscribe;
  }, [localMode, serviceId, queryClient]);

  return query;
}

// Admin Queries
export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  const { isEnabled: localMode } = useLocalStorageMode();

  return useQuery<boolean>({
    queryKey: ['isAdmin', localMode ? 'local' : 'backend'],
    queryFn: async () => {
      if (localMode) {
        // In local mode, everyone is admin
        return true;
      }
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: localMode || (!!actor && !actorFetching),
  });
}

export function useGetQueueSnapshot(serviceId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();
  const { isEnabled: localMode } = useLocalStorageMode();
  const queryClient = useQueryClient();

  const query = useQuery<QueueEntry[]>({
    queryKey: ['queueSnapshot', serviceId?.toString(), localMode ? 'local' : 'backend'],
    queryFn: async (): Promise<QueueEntry[]> => {
      if (serviceId === null) return [];
      
      if (localMode) {
        const { entries, warning } = getQueueEntries(serviceId.toString());
        if (warning) {
          console.warn('[SQFM]', warning);
        }
        return entries.map(e => ({
          userId: Principal.fromText(e.userId),
          joinedAt: BigInt(e.joinedAt * 1000000),
          status: toQueueEntryStatus(e.status),
        }));
      }
      
      if (!actor) return [];
      return actor.getQueueSnapshot(serviceId);
    },
    enabled: (localMode || (!!actor && !actorFetching)) && serviceId !== null,
    refetchInterval: localMode ? 3000 : 7000,
  });

  // Subscribe to local storage changes
  useEffect(() => {
    if (!localMode || !serviceId) return;
    const unsubscribe = subscribeToStorageChanges(() => {
      queryClient.invalidateQueries({ queryKey: ['queueSnapshot', serviceId.toString(), 'local'] });
    });
    return unsubscribe;
  }, [localMode, serviceId, queryClient]);

  return query;
}

export function useServeNext() {
  const { actor } = useActor();
  const { isEnabled: localMode } = useLocalStorageMode();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serviceId: bigint) => {
      if (localMode) {
        const userId = serveNextInQueue(serviceId.toString());
        return Principal.fromText(userId);
      }
      if (!actor) throw new Error('Actor not available');
      return actor.serveNext(serviceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queueSnapshot'] });
      queryClient.invalidateQueries({ queryKey: ['queueStatus'] });
    },
  });
}

export function useMarkNoShow() {
  const { actor } = useActor();
  const { isEnabled: localMode } = useLocalStorageMode();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, userId }: { serviceId: bigint; userId: Principal }) => {
      if (localMode) {
        updateQueueEntryStatus(serviceId.toString(), userId.toString(), 'noShow');
        return;
      }
      if (!actor) throw new Error('Actor not available');
      return actor.markNoShow(serviceId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queueSnapshot'] });
      queryClient.invalidateQueries({ queryKey: ['queueStatus'] });
    },
  });
}

// Feedback Queries
export function useSubmitFeedback() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const { isEnabled: localMode } = useLocalStorageMode();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, rating, comment }: { serviceId: bigint; rating: bigint; comment: string }) => {
      if (localMode) {
        const userId = identity?.getPrincipal().toString() || 'anonymous';
        addFeedback(serviceId.toString(), userId, Number(rating), comment);
        return;
      }
      if (!actor) throw new Error('Actor not available');
      return actor.submitFeedback(serviceId, rating, comment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceFeedback'] });
    },
  });
}

export function useGetServiceFeedback(serviceId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();
  const { isEnabled: localMode } = useLocalStorageMode();
  const queryClient = useQueryClient();

  const query = useQuery<Feedback[]>({
    queryKey: ['serviceFeedback', serviceId?.toString(), localMode ? 'local' : 'backend'],
    queryFn: async () => {
      if (serviceId === null) return [];
      
      if (localMode) {
        const { feedback, warning } = getFeedbackList(serviceId.toString());
        if (warning) {
          console.warn('[SQFM]', warning);
        }
        return feedback
          .sort((a, b) => b.submittedAt - a.submittedAt)
          .map(f => ({
            userId: Principal.fromText(f.userId),
            rating: BigInt(f.rating),
            comment: f.comment,
            submittedAt: BigInt(f.submittedAt * 1000000),
          }));
      }
      
      if (!actor) return [];
      return actor.getServiceFeedback(serviceId);
    },
    enabled: (localMode || (!!actor && !actorFetching)) && serviceId !== null,
  });

  // Subscribe to local storage changes
  useEffect(() => {
    if (!localMode || !serviceId) return;
    const unsubscribe = subscribeToStorageChanges(() => {
      queryClient.invalidateQueries({ queryKey: ['serviceFeedback', serviceId.toString(), 'local'] });
    });
    return unsubscribe;
  }, [localMode, serviceId, queryClient]);

  return query;
}

// Local mode specific: Get token for user
export function useGetUserToken(serviceId: bigint | null) {
  const { identity } = useInternetIdentity();
  const { isEnabled: localMode } = useLocalStorageMode();
  const queryClient = useQueryClient();

  const query = useQuery<number | null>({
    queryKey: ['userToken', serviceId?.toString(), 'local'],
    queryFn: async () => {
      if (!localMode || serviceId === null) return null;
      const userId = identity?.getPrincipal().toString() || 'anonymous';
      const entry = getUserQueueEntry(serviceId.toString(), userId);
      return entry?.token || null;
    },
    enabled: localMode && serviceId !== null,
  });

  // Subscribe to local storage changes
  useEffect(() => {
    if (!localMode || !serviceId) return;
    const unsubscribe = subscribeToStorageChanges(() => {
      queryClient.invalidateQueries({ queryKey: ['userToken', serviceId.toString(), 'local'] });
    });
    return unsubscribe;
  }, [localMode, serviceId, queryClient]);

  return query;
}
