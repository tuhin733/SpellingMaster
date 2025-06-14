import { isOnline } from "../config/firebase";

export interface QueuedOperation {
  id: string;
  type: "settings" | "progress" | "statistics" | "results";
  userId: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

const QUEUE_KEY = "operation-queue";
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

export const addToQueue = (
  operation: Omit<QueuedOperation, "id" | "timestamp" | "retryCount">
) => {
  try {
    const queue = getQueue();
    const newOperation: QueuedOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };
    queue.push(newOperation);
    saveQueue(queue);
    return newOperation.id;
  } catch (error) {
    console.error("Failed to add operation to queue:", error);
    throw error;
  }
};

export const removeFromQueue = (operationId: string) => {
  try {
    const queue = getQueue();
    const newQueue = queue.filter((op) => op.id !== operationId);
    saveQueue(newQueue);
  } catch (error) {
    console.error("Failed to remove operation from queue:", error);
    throw error;
  }
};

export const getQueue = (): QueuedOperation[] => {
  try {
    const queueStr = localStorage.getItem(QUEUE_KEY);
    return queueStr ? JSON.parse(queueStr) : [];
  } catch (error) {
    console.error("Failed to get operation queue:", error);
    return [];
  }
};

const saveQueue = (queue: QueuedOperation[]) => {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Failed to save operation queue:", error);
    throw error;
  }
};

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[i]));
      console.log(`Retrying operation, attempt ${i + 2}/${maxRetries}`);
    }
  }
  throw new Error("Max retries exceeded");
};

export const processQueue = async (handlers: {
  settings: (userId: string, data: any) => Promise<void>;
  progress: (userId: string, data: any) => Promise<void>;
  statistics: (userId: string, data: any) => Promise<void>;
  results: (userId: string, data: any) => Promise<void>;
}) => {
  if (!isOnline()) {
    console.log("Offline - skipping queue processing");
    return;
  }

  const queue = getQueue();
  if (queue.length === 0) return;

  const processedIds: string[] = [];
  const failedOperations: QueuedOperation[] = [];

  for (const operation of queue) {
    try {
      const handler = handlers[operation.type];
      if (!handler) {
        console.error(`No handler found for operation type: ${operation.type}`);
        continue;
      }

      await retryOperation(() => handler(operation.userId, operation.data));
      processedIds.push(operation.id);
    } catch (error) {
      console.error(`Failed to process operation ${operation.id}:`, error);
      if (operation.retryCount < MAX_RETRIES - 1) {
        failedOperations.push({
          ...operation,
          retryCount: operation.retryCount + 1,
        });
      }
    }
  }

  // Remove processed operations and update retry counts for failed ones
  const newQueue = queue
    .filter((op) => !processedIds.includes(op.id))
    .map((op) => {
      const failedOp = failedOperations.find((f) => f.id === op.id);
      return failedOp || op;
    });

  saveQueue(newQueue);
};
