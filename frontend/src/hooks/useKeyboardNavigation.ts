import { useEffect, useRef, useCallback } from 'react';

interface KeyboardNavigationOptions {
  /**
   * Grid dimensions for 2D navigation
   */
  grid?: {
    rows: number;
    cols: number;
  };
  /**
   * Selector for focusable elements
   */
  selector?: string;
  /**
   * Whether to loop navigation at boundaries
   */
  loop?: boolean;
  /**
   * Whether to enable arrow key navigation
   */
  enableArrowKeys?: boolean;
  /**
   * Whether to enable tab navigation
   */
  enableTabNavigation?: boolean;
  /**
   * Custom key handlers
   */
  onKeyDown?: (event: KeyboardEvent, currentIndex: number) => boolean;
  /**
   * Callback when selection changes
   */
  onSelectionChange?: (index: number, element: Element) => void;
}

export const useKeyboardNavigation = (options: KeyboardNavigationOptions = {}) => {
  const containerRef = useRef<HTMLElement>(null);
  const currentIndexRef = useRef<number>(0);

  const {
    grid,
    selector = '[tabindex="0"], button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    loop = true,
    enableArrowKeys = true,
    enableTabNavigation = true,
    onKeyDown,
    onSelectionChange,
  } = options;

  const getFocusableElements = useCallback((): NodeListOf<HTMLElement> => {
    if (!containerRef.current) return document.querySelectorAll('');
    return containerRef.current.querySelectorAll(selector);
  }, [selector]);

  const focusElement = useCallback((index: number) => {
    const elements = getFocusableElements();
    if (elements.length === 0) return;

    const clampedIndex = Math.max(0, Math.min(index, elements.length - 1));
    const element = elements[clampedIndex];
    
    if (element) {
      element.focus();
      currentIndexRef.current = clampedIndex;
      onSelectionChange?.(clampedIndex, element);
    }
  }, [getFocusableElements, onSelectionChange]);

  const handleGridNavigation = useCallback((key: string, currentIndex: number): number => {
    if (!grid) return currentIndex;

    const { rows, cols } = grid;
    const row = Math.floor(currentIndex / cols);
    const col = currentIndex % cols;

    switch (key) {
      case 'ArrowUp':
        return loop 
          ? ((row - 1 + rows) % rows) * cols + col
          : Math.max(0, (row - 1) * cols + col);
      case 'ArrowDown':
        return loop
          ? ((row + 1) % rows) * cols + col
          : Math.min((rows - 1) * cols + col, rows * cols - 1);
      case 'ArrowLeft':
        return loop
          ? row * cols + ((col - 1 + cols) % cols)
          : Math.max(row * cols, currentIndex - 1);
      case 'ArrowRight':
        return loop
          ? row * cols + ((col + 1) % cols)
          : Math.min(row * cols + cols - 1, currentIndex + 1);
      default:
        return currentIndex;
    }
  }, [grid, loop]);

  const handleLinearNavigation = useCallback((key: string, currentIndex: number, totalElements: number): number => {
    switch (key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        return loop
          ? (currentIndex - 1 + totalElements) % totalElements
          : Math.max(0, currentIndex - 1);
      case 'ArrowDown':
      case 'ArrowRight':
        return loop
          ? (currentIndex + 1) % totalElements
          : Math.min(totalElements - 1, currentIndex + 1);
      default:
        return currentIndex;
    }
  }, [loop]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!containerRef.current) return;

    const elements = getFocusableElements();
    if (elements.length === 0) return;

    const currentIndex = Array.from(elements).indexOf(document.activeElement as HTMLElement);
    const validCurrentIndex = currentIndex >= 0 ? currentIndex : currentIndexRef.current;

    // Allow custom key handling
    if (onKeyDown && onKeyDown(event, validCurrentIndex)) {
      return;
    }

    // Handle arrow key navigation
    if (enableArrowKeys && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      
      const nextIndex = grid
        ? handleGridNavigation(event.key, validCurrentIndex)
        : handleLinearNavigation(event.key, validCurrentIndex, elements.length);

      focusElement(nextIndex);
    }

    // Handle tab navigation
    if (enableTabNavigation && event.key === 'Tab') {
      const nextIndex = event.shiftKey
        ? (validCurrentIndex - 1 + elements.length) % elements.length
        : (validCurrentIndex + 1) % elements.length;

      if (loop) {
        event.preventDefault();
        focusElement(nextIndex);
      }
    }

    // Handle Enter and Space for activation
    if (['Enter', ' '].includes(event.key)) {
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && Array.from(elements).includes(activeElement)) {
        event.preventDefault();
        activeElement.click();
      }
    }

    // Handle Home/End keys
    if (event.key === 'Home') {
      event.preventDefault();
      focusElement(0);
    }

    if (event.key === 'End') {
      event.preventDefault();
      focusElement(elements.length - 1);
    }
  }, [
    getFocusableElements,
    onKeyDown,
    enableArrowKeys,
    enableTabNavigation,
    grid,
    handleGridNavigation,
    handleLinearNavigation,
    focusElement,
    loop,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const setFocus = useCallback((index: number) => {
    focusElement(index);
  }, [focusElement]);

  const focusFirst = useCallback(() => {
    focusElement(0);
  }, [focusElement]);

  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    focusElement(elements.length - 1);
  }, [focusElement, getFocusableElements]);

  return {
    containerRef,
    setFocus,
    focusFirst,
    focusLast,
    currentIndex: currentIndexRef.current,
  };
};