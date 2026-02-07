import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Service, UserProfile, QueueEntry, Feedback } from '../backend';
import { Principal } from '@dfinity/principal';

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

  return useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listServices();
    },
    enabled: !!actor && !actorFetching,
  });
}

// Queue Queries
export function useJoinQueue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serviceId: bigint) => {
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serviceId: bigint) => {
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

  return useQuery<bigint>({
    queryKey: ['queueStatus', serviceId?.toString()],
    queryFn: async () => {
      if (!actor || serviceId === null) return BigInt(0);
      return actor.getQueueStatus(serviceId);
    },
    enabled: !!actor && !actorFetching && serviceId !== null && enabled,
    refetchInterval: 7000, // Poll every 7 seconds
    retry: false,
  });
}

// Admin Queries
export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetQueueSnapshot(serviceId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<QueueEntry[]>({
    queryKey: ['queueSnapshot', serviceId?.toString()],
    queryFn: async () => {
      if (!actor || serviceId === null) return [];
      return actor.getQueueSnapshot(serviceId);
    },
    enabled: !!actor && !actorFetching && serviceId !== null,
    refetchInterval: 7000, // Poll every 7 seconds
  });
}

export function useServeNext() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serviceId: bigint) => {
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, userId }: { serviceId: bigint; userId: Principal }) => {
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, rating, comment }: { serviceId: bigint; rating: bigint; comment: string }) => {
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

  return useQuery<Feedback[]>({
    queryKey: ['serviceFeedback', serviceId?.toString()],
    queryFn: async () => {
      if (!actor || serviceId === null) return [];
      return actor.getServiceFeedback(serviceId);
    },
    enabled: !!actor && !actorFetching && serviceId !== null,
  });
}
