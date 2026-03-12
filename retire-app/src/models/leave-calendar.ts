/**
 * Leave Calendar Data Models
 * No business logic — pure data shapes for the 12-month calendar view.
 */

import type { ISODate } from './common';

export type LeaveEntryStatus = 'planned' | 'actual';

export type CalendarLeaveType =
  | 'planned-annual'
  | 'planned-sick'
  | 'actual-annual'
  | 'actual-sick';

export type SickLeaveCode = 'LS' | 'DE';

export interface CalendarLeaveEntry {
  id: string;
  date: ISODate;
  leaveType: CalendarLeaveType;
  hours: number; // 1–8
  sickCode?: SickLeaveCode;
  notes?: string;
}

export interface LeaveCarryOver {
  annualLeaveHours: number;
  sickLeaveHours: number;
}

export type AccrualRate = 4 | 6 | 8;

export interface LeaveCalendarYear {
  year: number;
  accrualRatePerPP: AccrualRate;
  carryOver: LeaveCarryOver;
  entries: CalendarLeaveEntry[];
}

export interface LeaveCalendarData {
  years: Record<number, LeaveCalendarYear>;
  activeYear: number;
}
