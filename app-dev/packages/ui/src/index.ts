/**
 * @fedplan/ui — Shared UI Components & Primitives
 *
 * Reusable form and UI components used across FedPlan applications.
 * These components are framework-agnostic and depend only on React, Tailwind, and Radix UI.
 */

// Form Components
export { FormSection } from './components/FormSection';
export { FieldGroup } from './components/FieldGroup';
export { FormErrorSummary } from './components/FormErrorSummary';
export { FormStateIndicator } from './components/FormStateIndicator';
export { TabCompletionBadge } from './components/TabCompletionBadge';

// UI Primitives (Radix UI + Tailwind)
export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants } from './components/ui/tabs';

// Card Primitives
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './components/ui/card';

// Button Primitives
export { Button, buttonVariants } from './components/ui/button';

// Badge Primitives
export { Badge, badgeVariants } from './components/ui/badge';

// Input Primitives
export { Input } from './components/ui/input';

// Label Primitives
export { Label } from './components/ui/label';

// Dialog Primitives
export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from './components/ui/dialog';

// Select Primitives
export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton } from './components/ui/select';
