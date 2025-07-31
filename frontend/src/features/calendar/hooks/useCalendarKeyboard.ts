import { useEffect } from 'react';
import { useCalendarNavigation } from './useCalendarNavigation';
import { useToast } from '@/hooks/use-toast';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  description: string;
  action: () => void;
}

interface UseCalendarKeyboardOptions {
  enabled?: boolean;
  showHelp?: boolean;
  customShortcuts?: KeyboardShortcut[];
}

export const useCalendarKeyboard = (options: UseCalendarKeyboardOptions = {}) => {
  const { enabled = true, showHelp = true, customShortcuts = [] } = options;
  const { toast } = useToast();
  const {
    navigatePrevious,
    navigateNext,
    navigateToToday,
    changeView
  } = useCalendarNavigation();

  // Default shortcuts
  const defaultShortcuts: KeyboardShortcut[] = [
    {
      key: 'ArrowLeft',
      description: 'Previous period',
      action: navigatePrevious
    },
    {
      key: 'ArrowRight',
      description: 'Next period',
      action: navigateNext
    },
    {
      key: 't',
      description: 'Go to today',
      action: navigateToToday
    },
    {
      key: 'm',
      description: 'Month view',
      action: () => changeView('month')
    },
    {
      key: 'w',
      description: 'Week view',
      action: () => changeView('week')
    },
    {
      key: 'd',
      description: 'Day view',
      action: () => changeView('day')
    },
    {
      key: '?',
      shiftKey: true,
      description: 'Show keyboard shortcuts',
      action: () => showKeyboardHelp()
    }
  ];

  // Merge default and custom shortcuts
  const shortcuts = [...defaultShortcuts, ...customShortcuts];

  // Show keyboard shortcuts help
  const showKeyboardHelp = () => {
    if (!showHelp) return;

    const shortcutList = shortcuts
      .map(s => {
        let keys = [];
        if (s.ctrlKey) keys.push('Ctrl');
        if (s.altKey) keys.push('Alt');
        if (s.shiftKey) keys.push('Shift');
        keys.push(s.key === ' ' ? 'Space' : s.key.toUpperCase());
        return `${keys.join('+')} - ${s.description}`;
      })
      .join('\n');

    toast({
      title: 'Keyboard Shortcuts',
      description: shortcutList,
      duration: 10000 // Show for 10 seconds
    });
  };

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs or textareas
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      // Find matching shortcut
      const shortcut = shortcuts.find(s => {
        const keyMatch = s.key.toLowerCase() === e.key.toLowerCase();
        const ctrlMatch = s.ctrlKey ? e.ctrlKey : !e.ctrlKey;
        const altMatch = s.altKey ? e.altKey : !e.altKey;
        const shiftMatch = s.shiftKey ? e.shiftKey : !e.shiftKey;
        
        return keyMatch && ctrlMatch && altMatch && shiftMatch;
      });

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, shortcuts]);

  return {
    shortcuts,
    showKeyboardHelp,
    isEnabled: enabled
  };
};

// Export default shortcuts for documentation
export const CALENDAR_KEYBOARD_SHORTCUTS = [
  { keys: '←', description: 'Navigate to previous period' },
  { keys: '→', description: 'Navigate to next period' },
  { keys: 'T', description: 'Go to today' },
  { keys: 'M', description: 'Switch to month view' },
  { keys: 'W', description: 'Switch to week view' },
  { keys: 'D', description: 'Switch to day view' },
  { keys: 'Shift + ?', description: 'Show keyboard shortcuts' }
];
