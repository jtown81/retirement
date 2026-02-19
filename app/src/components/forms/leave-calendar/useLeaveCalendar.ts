/**
 * useLeaveCalendar Hook
 *
 * Reads/writes LEAVE_CALENDAR storage, provides CRUD operations for entries,
 * and computes year summary via the bridge.
 *
 * D-2: Removed dual writes to LEAVE_BALANCE. Calendar is the single source of truth;
 * balance is now derived by useAssembleInput from the calendar data.
 */

import { useState, useCallback } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, LeaveCalendarDataSchema, LeaveBalanceSchema } from '@storage/index';
import type {
  LeaveCalendarData,
  LeaveCalendarYear,
  CalendarLeaveEntry,
  AccrualRate,
  LeaveCarryOver,
} from '@models/leave-calendar';
import { computeCalendarYearSummary } from '@modules/leave/calendar-bridge';
import type { CalendarYearSummary } from '@modules/leave/calendar-bridge';

const currentYear = new Date().getFullYear();

function makeDefaultYear(year: number): LeaveCalendarYear {
  return {
    year,
    accrualRatePerPP: 4,
    carryOver: { annualLeaveHours: 0, sickLeaveHours: 0 },
    entries: [],
  };
}

function makeDefaultData(): LeaveCalendarData {
  return {
    years: { [currentYear]: makeDefaultYear(currentYear) },
    activeYear: currentYear,
  };
}

export interface UseLeaveCalendarResult {
  data: LeaveCalendarData;
  activeYearData: LeaveCalendarYear;
  summary: CalendarYearSummary;
  setActiveYear: (year: number) => void;
  setAccrualRate: (rate: AccrualRate) => void;
  setCarryOver: (carryOver: LeaveCarryOver) => void;
  addEntry: (entry: CalendarLeaveEntry) => void;
  addEntries: (entries: CalendarLeaveEntry[]) => void;
  updateEntry: (id: string, updates: Partial<CalendarLeaveEntry>) => void;
  removeEntry: (id: string) => void;
  removeEntries: (ids: string[]) => void;
  clearYear: () => void;
  clearAll: () => void;
}

export function useLeaveCalendar(): UseLeaveCalendarResult {
  const [stored, saveCalendar, removeCalendar] = useLocalStorage(
    STORAGE_KEYS.LEAVE_CALENDAR,
    LeaveCalendarDataSchema,
  );

  // Seed from existing LEAVE_BALANCE if calendar data doesn't exist yet (backward compat)
  const [existingBalance] = useLocalStorage(STORAGE_KEYS.LEAVE_BALANCE, LeaveBalanceSchema);

  const [data, setData] = useState<LeaveCalendarData>(() => {
    if (stored) return stored;
    // Backward compat: seed carry-over from existing balance data
    const defaultData = makeDefaultData();
    if (existingBalance) {
      const yearData = defaultData.years[currentYear];
      yearData.carryOver = {
        annualLeaveHours: existingBalance.annualLeaveHours,
        sickLeaveHours: existingBalance.sickLeaveHours,
      };
    }
    return defaultData;
  });

  const activeYearData: LeaveCalendarYear =
    data.years[data.activeYear] ?? makeDefaultYear(data.activeYear);

  const summary = computeCalendarYearSummary(activeYearData);

  // Persist to storage whenever data changes
  // D-2: Calendar is now the single source of truth; balance is derived by useAssembleInput
  const persist = useCallback(
    (newData: LeaveCalendarData) => {
      setData(newData);
      saveCalendar(newData);
    },
    [saveCalendar],
  );

  // D-2: Removed balance write on mount; calendar is the single source of truth

  const setActiveYear = useCallback(
    (year: number) => {
      const newData = { ...data, activeYear: year };
      if (!newData.years[year]) {
        // Auto-populate carry-over from prior year
        const priorYear = newData.years[year - 1];
        const carryOver: LeaveCarryOver = priorYear
          ? {
              annualLeaveHours: Math.min(
                computeCalendarYearSummary(priorYear).projectedAnnualAfterCap,
                240,
              ),
              sickLeaveHours: Math.max(
                0,
                computeCalendarYearSummary(priorYear).projectedSickEOY,
              ),
            }
          : { annualLeaveHours: 0, sickLeaveHours: 0 };

        newData.years = {
          ...newData.years,
          [year]: {
            ...makeDefaultYear(year),
            accrualRatePerPP: priorYear?.accrualRatePerPP ?? 4,
            carryOver,
          },
        };
      }
      persist(newData);
    },
    [data, persist],
  );

  const setAccrualRate = useCallback(
    (rate: AccrualRate) => {
      const newData = {
        ...data,
        years: {
          ...data.years,
          [data.activeYear]: { ...activeYearData, accrualRatePerPP: rate },
        },
      };
      persist(newData);
    },
    [data, activeYearData, persist],
  );

  const setCarryOver = useCallback(
    (carryOver: LeaveCarryOver) => {
      const newData = {
        ...data,
        years: {
          ...data.years,
          [data.activeYear]: { ...activeYearData, carryOver },
        },
      };
      persist(newData);
    },
    [data, activeYearData, persist],
  );

  const addEntry = useCallback(
    (entry: CalendarLeaveEntry) => {
      const newData = {
        ...data,
        years: {
          ...data.years,
          [data.activeYear]: {
            ...activeYearData,
            entries: [...activeYearData.entries, entry],
          },
        },
      };
      persist(newData);
    },
    [data, activeYearData, persist],
  );

  const addEntries = useCallback(
    (entries: CalendarLeaveEntry[]) => {
      const newData = {
        ...data,
        years: {
          ...data.years,
          [data.activeYear]: {
            ...activeYearData,
            entries: [...activeYearData.entries, ...entries],
          },
        },
      };
      persist(newData);
    },
    [data, activeYearData, persist],
  );

  const updateEntry = useCallback(
    (id: string, updates: Partial<CalendarLeaveEntry>) => {
      const newData = {
        ...data,
        years: {
          ...data.years,
          [data.activeYear]: {
            ...activeYearData,
            entries: activeYearData.entries.map((e) =>
              e.id === id ? { ...e, ...updates } : e,
            ),
          },
        },
      };
      persist(newData);
    },
    [data, activeYearData, persist],
  );

  const removeEntry = useCallback(
    (id: string) => {
      const newData = {
        ...data,
        years: {
          ...data.years,
          [data.activeYear]: {
            ...activeYearData,
            entries: activeYearData.entries.filter((e) => e.id !== id),
          },
        },
      };
      persist(newData);
    },
    [data, activeYearData, persist],
  );

  const removeEntries = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);
      const newData = {
        ...data,
        years: {
          ...data.years,
          [data.activeYear]: {
            ...activeYearData,
            entries: activeYearData.entries.filter((e) => !idSet.has(e.id)),
          },
        },
      };
      persist(newData);
    },
    [data, activeYearData, persist],
  );

  const clearYear = useCallback(() => {
    const newData = {
      ...data,
      years: {
        ...data.years,
        [data.activeYear]: makeDefaultYear(data.activeYear),
      },
    };
    persist(newData);
  }, [data, persist]);

  const clearAll = useCallback(() => {
    removeCalendar();
    setData(makeDefaultData());
  }, [removeCalendar]);

  return {
    data,
    activeYearData,
    summary,
    setActiveYear,
    setAccrualRate,
    setCarryOver,
    addEntry,
    addEntries,
    updateEntry,
    removeEntry,
    removeEntries,
    clearYear,
    clearAll,
  };
}
