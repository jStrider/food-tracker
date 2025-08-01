import { useRef, useCallback } from 'react';

type AnnouncementPriority = 'polite' | 'assertive';

interface AnnouncementOptions {
  /**
   * Priority level for screen reader announcements
   */
  priority?: AnnouncementPriority;
  /**
   * Delay before making the announcement (in milliseconds)
   */
  delay?: number;
  /**
   * Whether to clear previous announcements
   */
  clearPrevious?: boolean;
}

export const useAnnouncements = () => {
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const announce = useCallback((
    message: string,
    options: AnnouncementOptions = {}
  ) => {
    const {
      priority = 'polite',
      delay = 100,
      clearPrevious = true,
    } = options;

    // Clear any pending announcements
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Clear previous message if requested
    if (clearPrevious && liveRegionRef.current) {
      liveRegionRef.current.textContent = '';
    }

    // Schedule the announcement
    timeoutRef.current = setTimeout(() => {
      if (liveRegionRef.current) {
        liveRegionRef.current.setAttribute('aria-live', priority);
        liveRegionRef.current.textContent = message;
      }
    }, delay);
  }, []);

  const announceNavigation = useCallback((
    currentItem: string,
    position: { current: number; total: number },
    context?: string
  ) => {
    const positionText = `${position.current} of ${position.total}`;
    const contextText = context ? ` in ${context}` : '';
    const message = `${currentItem}, ${positionText}${contextText}`;
    
    announce(message, { priority: 'polite' });
  }, [announce]);

  const announceSelection = useCallback((
    selectedItem: string,
    action?: string
  ) => {
    const actionText = action ? ` ${action}` : ' selected';
    const message = `${selectedItem}${actionText}`;
    
    announce(message, { priority: 'assertive' });
  }, [announce]);

  const announceError = useCallback((
    error: string,
    context?: string
  ) => {
    const contextText = context ? ` in ${context}` : '';
    const message = `Error${contextText}: ${error}`;
    
    announce(message, { priority: 'assertive' });
  }, [announce]);

  const announceSuccess = useCallback((
    success: string,
    details?: string
  ) => {
    const detailsText = details ? `. ${details}` : '';
    const message = `Success: ${success}${detailsText}`;
    
    announce(message, { priority: 'polite' });
  }, [announce]);

  const announceLoading = useCallback((
    loadingMessage: string = 'Loading'
  ) => {
    announce(`${loadingMessage}...`, { priority: 'polite' });
  }, [announce]);

  const announceLoadingComplete = useCallback((
    completionMessage: string = 'Content loaded'
  ) => {
    announce(completionMessage, { priority: 'polite' });
  }, [announce]);

  // Create the live region element
  const createLiveRegion = useCallback(() => {
    return (
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      />
    );
  }, []);

  return {
    announce,
    announceNavigation,
    announceSelection,
    announceError,
    announceSuccess,
    announceLoading,
    announceLoadingComplete,
    createLiveRegion,
  };
};