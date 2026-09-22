import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  subWeeks,
  isToday,
  isYesterday,
  parseISO,
} from 'date-fns';
import { vi } from 'date-fns/locale';

export type DateRangeType = 'day' | 'week' | 'month' | 'year' | 'custom';

export interface DateRange {
  from: string; // ISO string
  to: string;   // ISO string
}

export function toISOString(date: Date = new Date()): string {
  return date.toISOString();
}

export function getMonthYear(date: Date = new Date()): string {
  return format(date, 'yyyy-MM');
}

export function getDateRange(type: DateRangeType, referenceDate: Date = new Date()): DateRange {
  switch (type) {
    case 'day':
      return {
        from: startOfDay(referenceDate).toISOString(),
        to: endOfDay(referenceDate).toISOString(),
      };
    case 'week':
      return {
        from: startOfWeek(referenceDate, { weekStartsOn: 1 }).toISOString(),
        to: endOfWeek(referenceDate, { weekStartsOn: 1 }).toISOString(),
      };
    case 'month':
      return {
        from: startOfMonth(referenceDate).toISOString(),
        to: endOfMonth(referenceDate).toISOString(),
      };
    case 'year':
      return {
        from: startOfYear(referenceDate).toISOString(),
        to: endOfYear(referenceDate).toISOString(),
      };
    default:
      return {
        from: startOfMonth(referenceDate).toISOString(),
        to: endOfMonth(referenceDate).toISOString(),
      };
  }
}

export function formatDateHeader(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Hôm nay';
  if (isYesterday(date)) return 'Hôm qua';
  return format(date, 'EEEE, dd/MM/yyyy', { locale: vi });
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'dd/MM/yyyy');
}

export function formatMonthYear(monthYear: string): string {
  // monthYear = "2026-09"
  const [year, month] = monthYear.split('-');
  return `Tháng ${parseInt(month)}/${year}`;
}

export function formatTime(dateStr: string): string {
  return format(parseISO(dateStr), 'HH:mm');
}

export function groupTransactionsByDate<T extends { date: string }>(
  items: T[]
): { dateKey: string; data: T[] }[] {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const key = format(parseISO(item.date), 'yyyy-MM-dd');
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .map(([dateKey, data]) => ({ dateKey, data }));
}

export function getCurrentMonthYear(): string {
  return getMonthYear(new Date());
}
