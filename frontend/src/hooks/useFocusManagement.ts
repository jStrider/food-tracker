import { useRef, useCallback, useEffect } from 'react';

interface FocusManagementOptions {
  /**
   * Whether to trap focus within the container
   */
  trapFocus?: boolean;
  /**
   * Whether to restore focus when the component unmounts
   */
  restoreFocus?: boolean;
  /**
   * Whether to auto-focus the first element when mounted
   */
  autoFocus?: boolean;
  /**
   * Custom selector for focusable elements
   */
  focusableSelector?: string;
}

const DEFAULT_FOCUSABLE_SELECTOR = `
  a[href]:not([tabindex='-1']),
  area[href]:not([tabindex='-1']),
  input:not([disabled]):not([tabindex='-1']),
  select:not([disabled]):not([tabindex='-1']),
  textarea:not([disabled]):not([tabindex='-1']),
  button:not([disabled]):not([tabindex='-1']),
  iframe:not([tabindex='-1']),
  [tabindex]:not([tabindex='-1']),
  [contentEditable=true]:not([tabindex='-1'])
`;

export const useFocusManagement = (options: FocusManagementOptions = {}) => {
  const containerRef = useRef<HTMLElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const isActiveRef = useRef(false);

  const {
    trapFocus = false,
    restoreFocus = false,
    autoFocus = false,
    focusableSelector = DEFAULT_FOCUSABLE_SELECTOR,
  } = options;

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    
    const elements = containerRef.current.querySelectorAll(focusableSelector);
    return Array.from(elements) as HTMLElement[];
  }, [focusableSelector]);

  const getFirstFocusableElement = useCallback((): HTMLElement | null => {
    const elements = getFocusableElements();
    return elements.length > 0 ? elements[0] : null;
  }, [getFocusableElements]);

  const getLastFocusableElement = useCallback((): HTMLElement | null => {
    const elements = getFocusableElements();
    return elements.length > 0 ? elements[elements.length - 1] : null;
  }, [getFocusableElements]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!trapFocus || !isActiveRef.current) return;

    if (event.key === 'Tab') {
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab - move focus to last element if currently on first
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab - move focus to first element if currently on last
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }

    // Handle Escape key to break out of focus trap
    if (event.key === 'Escape' && trapFocus) {
      event.preventDefault();
      deactivate();
    }
  }, [trapFocus, getFocusableElements]);

  const activate = useCallback(() => {
    if (isActiveRef.current) return;

    // Store the currently focused element
    previousActiveElementRef.current = document.activeElement as HTMLElement;
    isActiveRef.current = true;

    // Auto-focus first element if requested
    if (autoFocus) {
      const firstElement = getFirstFocusableElement();
      firstElement?.focus();
    }

    // Add event listeners
    if (trapFocus) {
      document.addEventListener('keydown', handleKeyDown);
    }
  }, [autoFocus, getFirstFocusableElement, trapFocus, handleKeyDown]);

  const deactivate = useCallback(() => {
    if (!isActiveRef.current) return;

    isActiveRef.current = false;

    // Remove event listeners
    if (trapFocus) {
      document.removeEventListener('keydown', handleKeyDown);
    }

    // Restore focus if requested
    if (restoreFocus && previousActiveElementRef.current) {
      previousActiveElementRef.current.focus();
      previousActiveElementRef.current = null;
    }
  }, [trapFocus, restoreFocus, handleKeyDown]);

  const focusFirst = useCallback(() => {
    const firstElement = getFirstFocusableElement();
    firstElement?.focus();
  }, [getFirstFocusableElement]);

  const focusLast = useCallback(() => {
    const lastElement = getLastFocusableElement();
    lastElement?.focus();
  }, [getLastFocusableElement]);

  const contains = useCallback((element: Element): boolean => {
    return containerRef.current?.contains(element) ?? false;
  }, []);

  // Auto-activate and deactivate based on container presence
  useEffect(() => {
    if (containerRef.current && (autoFocus || trapFocus)) {
      activate();
    }

    return () => {
      deactivate();
    };
  }, [activate, deactivate, autoFocus, trapFocus]);

  return {
    containerRef,
    activate,
    deactivate,
    focusFirst,
    focusLast,
    contains,
    isActive: isActiveRef.current,
  };
};