import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

/**
 * Create a userEvent instance with real timers
 * to avoid timeout issues in tests
 */
export function setupUser() {
  // Temporarily use real timers for userEvent
  vi.useRealTimers();
  const user = userEvent.setup();
  
  // Return wrapped user methods that restore fake timers after use
  return {
    click: async (...args: Parameters<typeof user.click>) => {
      const result = await user.click(...args);
      vi.useFakeTimers();
      return result;
    },
    type: async (...args: Parameters<typeof user.type>) => {
      const result = await user.type(...args);
      vi.useFakeTimers();
      return result;
    },
    clear: async (...args: Parameters<typeof user.clear>) => {
      const result = await user.clear(...args);
      vi.useFakeTimers();
      return result;
    },
    selectOptions: async (...args: Parameters<typeof user.selectOptions>) => {
      const result = await user.selectOptions(...args);
      vi.useFakeTimers();
      return result;
    },
    tab: async (...args: Parameters<typeof user.tab>) => {
      const result = await user.tab(...args);
      vi.useFakeTimers();
      return result;
    },
    keyboard: async (...args: Parameters<typeof user.keyboard>) => {
      const result = await user.keyboard(...args);
      vi.useFakeTimers();
      return result;
    },
    pointer: user.pointer,
  };
}