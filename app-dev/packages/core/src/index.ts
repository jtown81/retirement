/**
 * @fedplan/core — Barrel Export
 *
 * Re-exports all public APIs from FedPlan packages.
 * This is the main entry point for consuming packages.
 */

// Models
export * from '@fedplan/models';

// Domain modules
export * from '@fedplan/career';
export * from '@fedplan/leave';
export * from '@fedplan/tsp';
export * from '@fedplan/expenses';
export * from '@fedplan/tax';
export * from '@fedplan/military';

// Simulation (depends on all above)
export * from '@fedplan/simulation';

// Validation (depends on all above)
export * from '@fedplan/validation';

// UI (shared components)
export * from '@fedplan/ui';
