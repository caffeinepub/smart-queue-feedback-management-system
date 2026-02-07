// Local Storage Mode utilities for Smart Queue & Feedback Management
// Provides versioned, namespaced localStorage for queue and feedback data

const STORAGE_VERSION = 1;
const NAMESPACE = 'sqfm';

// Storage keys
const keys = {
  version: `${NAMESPACE}:version`,
  tokenCounters: `${NAMESPACE}:v${STORAGE_VERSION}:tokenCounters`,
  queueEntries: (serviceId: string) => `${NAMESPACE}:v${STORAGE_VERSION}:queue:${serviceId}`,
  feedback: (serviceId: string) => `${NAMESPACE}:v${STORAGE_VERSION}:feedback:${serviceId}`,
  services: `${NAMESPACE}:v${STORAGE_VERSION}:services`,
};

// Custom event for live updates
const STORAGE_CHANGE_EVENT = 'sqfm:storage:change';

export interface LocalQueueEntry {
  userId: string;
  token: number;
  joinedAt: number;
  status: 'waiting' | 'served' | 'cancelled' | 'noShow';
}

export interface LocalFeedback {
  userId: string;
  rating: number;
  comment: string;
  submittedAt: number;
}

export interface LocalService {
  id: string;
  name: string;
  description: string;
}

interface TokenCounters {
  [serviceId: string]: number;
}

// Initialize storage version
function ensureVersion() {
  const storedVersion = localStorage.getItem(keys.version);
  if (!storedVersion) {
    localStorage.setItem(keys.version, STORAGE_VERSION.toString());
  }
}

// Safe JSON parse with corruption handling
function safeParse<T>(key: string, fallback: T): { data: T; warning?: string } {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { data: fallback };
    const parsed = JSON.parse(raw);
    return { data: parsed };
  } catch (error) {
    console.warn(`[SQFM] Corrupted data in key ${key}, using fallback`, error);
    return {
      data: fallback,
      warning: `Local storage data was corrupted and has been reset. Please rejoin the queue if needed.`,
    };
  }
}

// Write helper that broadcasts changes
function safeWrite(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    // Dispatch custom event for live updates
    window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT, { detail: { key } }));
  } catch (error) {
    console.error(`[SQFM] Failed to write to localStorage key ${key}`, error);
    throw new Error('Failed to save data to local storage');
  }
}

// Token counter management
export function getNextToken(serviceId: string): number {
  ensureVersion();
  const { data: counters } = safeParse<TokenCounters>(keys.tokenCounters, {});
  const currentCounter = counters[serviceId] || 0;
  const nextToken = currentCounter + 1;
  
  counters[serviceId] = nextToken;
  safeWrite(keys.tokenCounters, counters);
  
  return nextToken;
}

// Queue operations
export function getQueueEntries(serviceId: string): { entries: LocalQueueEntry[]; warning?: string } {
  ensureVersion();
  const result = safeParse<LocalQueueEntry[]>(keys.queueEntries(serviceId), []);
  return { entries: result.data, warning: result.warning };
}

export function addQueueEntry(serviceId: string, userId: string): LocalQueueEntry {
  ensureVersion();
  const { entries } = getQueueEntries(serviceId);
  
  // Check if user already has an entry
  const existingIndex = entries.findIndex(e => e.userId === userId);
  if (existingIndex !== -1) {
    const existing = entries[existingIndex];
    if (existing.status === 'waiting') {
      throw new Error('Already in queue');
    }
    // Update existing entry
    const token = existing.token;
    const updated: LocalQueueEntry = {
      userId,
      token,
      joinedAt: Date.now(),
      status: 'waiting',
    };
    entries[existingIndex] = updated;
    safeWrite(keys.queueEntries(serviceId), entries);
    return updated;
  }
  
  // Create new entry with new token
  const token = getNextToken(serviceId);
  const newEntry: LocalQueueEntry = {
    userId,
    token,
    joinedAt: Date.now(),
    status: 'waiting',
  };
  
  entries.push(newEntry);
  safeWrite(keys.queueEntries(serviceId), entries);
  return newEntry;
}

export function updateQueueEntryStatus(
  serviceId: string,
  userId: string,
  status: LocalQueueEntry['status']
): void {
  ensureVersion();
  const { entries } = getQueueEntries(serviceId);
  const index = entries.findIndex(e => e.userId === userId);
  
  if (index === -1) {
    throw new Error('Entry not found');
  }
  
  entries[index] = { ...entries[index], status };
  safeWrite(keys.queueEntries(serviceId), entries);
}

export function getUserQueueEntry(serviceId: string, userId: string): LocalQueueEntry | null {
  const { entries } = getQueueEntries(serviceId);
  return entries.find(e => e.userId === userId) || null;
}

export function getWaitingQueue(serviceId: string): LocalQueueEntry[] {
  const { entries } = getQueueEntries(serviceId);
  return entries
    .filter(e => e.status === 'waiting')
    .sort((a, b) => a.joinedAt - b.joinedAt);
}

export function serveNextInQueue(serviceId: string): string {
  ensureVersion();
  const waiting = getWaitingQueue(serviceId);
  
  if (waiting.length === 0) {
    throw new Error('Queue is empty');
  }
  
  const nextEntry = waiting[0];
  updateQueueEntryStatus(serviceId, nextEntry.userId, 'served');
  return nextEntry.userId;
}

// Feedback operations
export function getFeedbackList(serviceId: string): { feedback: LocalFeedback[]; warning?: string } {
  ensureVersion();
  const result = safeParse<LocalFeedback[]>(keys.feedback(serviceId), []);
  return { feedback: result.data, warning: result.warning };
}

export function addFeedback(serviceId: string, userId: string, rating: number, comment: string): void {
  ensureVersion();
  
  if (rating < 1 || rating > 5) {
    throw new Error('Invalid rating');
  }
  
  const { feedback } = getFeedbackList(serviceId);
  const newFeedback: LocalFeedback = {
    userId,
    rating,
    comment,
    submittedAt: Date.now(),
  };
  
  feedback.push(newFeedback);
  safeWrite(keys.feedback(serviceId), feedback);
}

// Service management (for local mode)
export function getLocalServices(): LocalService[] {
  ensureVersion();
  const { data } = safeParse<LocalService[]>(keys.services, []);
  return data;
}

export function ensureDefaultServices(): void {
  ensureVersion();
  const existing = getLocalServices();
  
  if (existing.length === 0) {
    const defaultServices: LocalService[] = [
      { id: '1', name: 'Customer Support', description: 'General customer support and inquiries' },
      { id: '2', name: 'Technical Support', description: 'Technical assistance and troubleshooting' },
      { id: '3', name: 'Billing', description: 'Billing and payment related queries' },
    ];
    safeWrite(keys.services, defaultServices);
  }
}

// Storage event subscription
export function subscribeToStorageChanges(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(STORAGE_CHANGE_EVENT, handler);
  
  // Also listen to native storage events (for cross-tab updates)
  const storageHandler = (e: StorageEvent) => {
    if (e.key?.startsWith(NAMESPACE)) {
      callback();
    }
  };
  window.addEventListener('storage', storageHandler);
  
  return () => {
    window.removeEventListener(STORAGE_CHANGE_EVENT, handler);
    window.removeEventListener('storage', storageHandler);
  };
}

// Reset all local data
export function resetAllLocalData(): void {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(NAMESPACE)) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Reinitialize version
  ensureVersion();
  
  // Broadcast change
  window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT, { detail: { key: 'reset' } }));
}
