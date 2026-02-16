/**
 * Leave Data Models
 * No business logic — pure data shapes.
 */

import type { ISODate } from './common';

export type LeaveType = 'annual' | 'sick' | 'family-care';

export interface LeaveBalance {
  asOf: ISODate;
  annualLeaveHours: number;
  sickLeaveHours: number;
  familyCareUsedCurrentYear: number;
  /** Average annual sick leave usage in hours (e.g., 40). Used for projection modeling. */
  averageAnnualSickLeaveUsage?: number;
}

export interface LeaveEvent {
  id: string;
  date: ISODate;
  type: LeaveType;
  hoursUsed: number;
  notes?: string;
}
