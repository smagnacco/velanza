import { env } from '../env.js';

let activeCount = 0;
const queue: Array<() => void> = [];

function dequeue() {
  if (queue.length > 0 && activeCount < env.LLM_CONCURRENCY_LIMIT) {
    const next = queue.shift()!;
    next();
  }
}

export async function withConcurrencyLimit<T>(fn: () => Promise<T>): Promise<T> {
  await new Promise<void>((resolve) => {
    if (activeCount < env.LLM_CONCURRENCY_LIMIT) {
      resolve();
    } else {
      queue.push(resolve);
    }
  });

  activeCount++;
  try {
    return await fn();
  } finally {
    activeCount--;
    dequeue();
  }
}

export function getActiveCount(): number {
  return activeCount;
}
