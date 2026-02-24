/**
 * Career Data Models
 * No business logic — pure data shapes.
 */

import type { ISODate, USD, GSGrade, GSStep, PaySystem } from './common';

export interface CareerEvent {
  id: string;
  type: 'hire' | 'promotion' | 'step-increase' | 'locality-change' | 'separation' | 'rehire';
  effectiveDate: ISODate;
  grade: GSGrade;
  step: GSStep;
  localityCode: string;
  paySystem: PaySystem;
  annualSalary: USD;
  notes?: string;
}

export interface CareerProfile {
  id: string;
  scdLeave: ISODate;       // Service Computation Date for leave
  scdRetirement: ISODate;  // Service Computation Date for retirement
  paySystem: PaySystem;
  events: CareerEvent[];
}

export interface PayPeriod {
  payYear: number;
  payPeriod: number;        // 1–26
  grossPay: USD;
  grade: GSGrade;
  step: GSStep;
  localityCode: string;
}
