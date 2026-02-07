import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface QueueEntry {
    status: QueueEntryStatus;
    userId: Principal;
    joinedAt: Time;
}
export interface Feedback {
    userId: Principal;
    submittedAt: Time;
    comment: string;
    rating: bigint;
}
export interface Service {
    id: bigint;
    name: string;
    createdAt: Time;
    createdBy: Principal;
    description: string;
}
export interface UserProfile {
    name: string;
}
export enum QueueEntryStatus {
    noShow = "noShow",
    cancelled = "cancelled",
    served = "served",
    waiting = "waiting"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createService(name: string, description: string): Promise<bigint>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getQueueSnapshot(serviceId: bigint): Promise<Array<QueueEntry>>;
    getQueueStatus(serviceId: bigint): Promise<bigint>;
    getServiceFeedback(serviceId: bigint): Promise<Array<Feedback>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    joinQueue(serviceId: bigint): Promise<void>;
    leaveQueue(serviceId: bigint): Promise<void>;
    listServices(): Promise<Array<Service>>;
    markNoShow(serviceId: bigint, userId: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    serveNext(serviceId: bigint): Promise<Principal>;
    submitFeedback(serviceId: bigint, rating: bigint, comment: string): Promise<void>;
}
