import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Shared type for MaterialCommunityIcons name prop to avoid 'as any'
 */
export type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/**
 * Transaction type constants
 */
export const TRANSACTION_TYPES = {
  EXPENSE: 'EXPENSE',
  INCOME: 'INCOME',
  TRANSFER: 'TRANSFER',
} as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];

/**
 * Category type constants
 */
export const CATEGORY_TYPES = {
  EXPENSE: 'EXPENSE',
  INCOME: 'INCOME',
  BOTH: 'BOTH',
} as const;

export type CategoryType = (typeof CATEGORY_TYPES)[keyof typeof CATEGORY_TYPES];

/**
 * Notification type constants
 */
export const NOTIFICATION_TYPES = {
  BUDGET_WARNING: 'BUDGET_WARNING',
  BUDGET_EXCEEDED: 'BUDGET_EXCEEDED',
  LOW_BALANCE: 'LOW_BALANCE',
  APP_UPDATE: 'APP_UPDATE',
  SYSTEM: 'SYSTEM',
  REMINDER: 'REMINDER',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];
