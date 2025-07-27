import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';

/**
 * Wrapper to handle async operations with proper timer management
 */
export async function withRealTimers<T>(
  callback: () => Promise<T>
): Promise<T> {
  vi.useRealTimers();
  try {
    const result = await callback();
    return result;
  } finally {
    vi.useFakeTimers();
  }
}

/**
 * Create a user event instance that automatically manages timers
 */
export function createUser() {
  return {
    async click(element: Element) {
      return withRealTimers(async () => {
        const user = userEvent.setup();
        return user.click(element);
      });
    },
    async type(element: Element, text: string) {
      return withRealTimers(async () => {
        const user = userEvent.setup();
        return user.type(element, text);
      });
    },
    async clear(element: Element) {
      return withRealTimers(async () => {
        const user = userEvent.setup();
        return user.clear(element);
      });
    },
    async selectOptions(element: Element, values: string | string[]) {
      return withRealTimers(async () => {
        const user = userEvent.setup();
        return user.selectOptions(element, values);
      });
    },
  };
}