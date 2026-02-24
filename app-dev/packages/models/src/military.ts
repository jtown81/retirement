/**
 * Military Service Data Models
 * No business logic — pure data shapes.
 */

import type { ISODate, USD } from './common';

export interface MilitaryService {
  id: string;
  startDate: ISODate;
  endDate: ISODate;
  branch: string;
  /** Annual basic pay for each year of service (for buyback deposit calculation) */
  annualBasicPayByYear: Record<number, USD>;
  buybackDepositPaid: USD;
  buybackDepositDate?: ISODate;
  /** True if employee has waived military retirement pay */
  militaryRetirementWaived: boolean;
}
