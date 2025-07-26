import { format, parse, parseISO, isValid } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime, formatInTimeZone } from 'date-fns-tz';

/**
 * Date format constants
 * Using European date format (DD/MM/YYYY) as default
 */
export const DATE_FORMATS = {
  DISPLAY_DATE: 'dd/MM/yyyy',
  DISPLAY_DATETIME: 'dd/MM/yyyy HH:mm',
  API_DATE: 'yyyy-MM-dd',
  API_DATETIME: "yyyy-MM-dd'T'HH:mm:ss'Z'",
  PICKER_DATE: 'dd/MM/yyyy',
  CALENDAR_HEADER: 'd MMMM yyyy',
  TIME_ONLY: 'HH:mm'
} as const;

/**
 * Get the user's current timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Format a date for display in the user's timezone
 */
export function formatDate(
  date: Date | string,
  formatStr: string = 'dd/MM/yyyy',
  timezone?: string
): string {
  const tz = timezone || getUserTimezone();
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) {
    console.error('Invalid date provided to formatDate:', date);
    return '';
  }

  return formatInTimeZone(dateObj, tz, formatStr);
}

/**
 * Format a date with time for display
 */
export function formatDateTime(
  date: Date | string,
  timezone?: string
): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm', timezone);
}

/**
 * Format a date for display in calendar views
 */
export function formatCalendarDate(
  date: Date | string,
  timezone?: string
): string {
  return formatDate(date, 'EEEE, d MMMM yyyy', timezone);
}

/**
 * Format time only for display
 */
export function formatTime(
  date: Date | string,
  timezone?: string
): string {
  return formatDate(date, 'HH:mm', timezone);
}

/**
 * Parse a date string with timezone consideration
 */
export function parseDate(
  dateString: string,
  formatStr: string = 'dd/MM/yyyy',
  timezone?: string
): Date {
  const tz = timezone || getUserTimezone();
  const parsedDate = parse(dateString, formatStr, new Date());
  
  if (!isValid(parsedDate)) {
    console.error('Invalid date string provided to parseDate:', dateString);
    return new Date();
  }

  // Convert the parsed date from the specified timezone to UTC
  return zonedTimeToUtc(parsedDate, tz);
}

/**
 * Convert a UTC date to the user's timezone
 */
export function toUserTimezone(
  date: Date | string,
  timezone?: string
): Date {
  const tz = timezone || getUserTimezone();
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) {
    console.error('Invalid date provided to toUserTimezone:', date);
    return new Date();
  }

  return utcToZonedTime(dateObj, tz);
}

/**
 * Convert a date from user's timezone to UTC
 */
export function toUTC(
  date: Date,
  timezone?: string
): Date {
  const tz = timezone || getUserTimezone();
  return zonedTimeToUtc(date, tz);
}

/**
 * Get the start of day in the user's timezone
 */
export function getStartOfDay(
  date: Date | string,
  timezone?: string
): Date {
  const tz = timezone || getUserTimezone();
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  // Convert to user's timezone
  const zonedDate = utcToZonedTime(dateObj, tz);
  
  // Set to start of day
  zonedDate.setHours(0, 0, 0, 0);
  
  // Convert back to UTC
  return zonedTimeToUtc(zonedDate, tz);
}

/**
 * Get the end of day in the user's timezone
 */
export function getEndOfDay(
  date: Date | string,
  timezone?: string
): Date {
  const tz = timezone || getUserTimezone();
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  // Convert to user's timezone
  const zonedDate = utcToZonedTime(dateObj, tz);
  
  // Set to end of day
  zonedDate.setHours(23, 59, 59, 999);
  
  // Convert back to UTC
  return zonedTimeToUtc(zonedDate, tz);
}

/**
 * Check if a date is today in the user's timezone
 */
export function isToday(
  date: Date | string,
  timezone?: string
): boolean {
  const tz = timezone || getUserTimezone();
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const userDate = utcToZonedTime(dateObj, tz);
  const today = utcToZonedTime(new Date(), tz);
  
  return (
    userDate.getFullYear() === today.getFullYear() &&
    userDate.getMonth() === today.getMonth() &&
    userDate.getDate() === today.getDate()
  );
}

/**
 * Format an ISO string to a user-friendly date string
 */
export function formatISODate(
  isoString: string,
  formatStr: string = 'dd/MM/yyyy',
  timezone?: string
): string {
  const date = parseISO(isoString);
  return formatDate(date, formatStr, timezone);
}

/**
 * Get a date formatted for API submission (ISO string in UTC)
 */
export function toAPIDate(
  date: Date | string,
  timezone?: string
): string {
  const tz = timezone || getUserTimezone();
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) {
    console.error('Invalid date provided to toAPIDate:', date);
    return new Date().toISOString();
  }

  // If the date is already in UTC, just return the ISO string
  // Otherwise, convert from user timezone to UTC first
  const utcDate = dateObj.getTimezoneOffset() === 0 
    ? dateObj 
    : zonedTimeToUtc(dateObj, tz);
    
  return utcDate.toISOString();
}