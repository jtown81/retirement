/**
 * @fedplan/ui — Shared UI Components & Primitives
 *
 * Reusable form and UI components used across FedPlan applications.
 * These components are framework-agnostic and depend only on React, Tailwind, and Radix UI.
 */

// Form Components
export { FormSection } from './components/FormSection';
export type { FormSectionProps } from './components/FormSection';
export { FieldGroup } from './components/FieldGroup';
export type { FieldGroupProps } from './components/FieldGroup';
export { FormErrorSummary } from './components/FormErrorSummary';
export type { FormErrorSummaryProps } from './components/FormErrorSummary';
export { FormStateIndicator } from './components/FormStateIndicator';
export type { FormStateIndicatorProps } from './components/FormStateIndicator';
export { TabCompletionBadge } from './components/TabCompletionBadge';
export type { TabCompletionBadgeProps } from './components/TabCompletionBadge';

// UI Primitives (Radix UI + Tailwind)
export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants } from './components/ui/tabs';
export type { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps } from './components/ui/tabs';
