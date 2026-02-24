/**
 * Type definitions for jest-axe
 * Provides accessibility testing utilities for axe-core
 */

declare module 'jest-axe' {
  export interface AxeResults {
    violations: AxeViolation[];
    passes: AxeCheck[];
    incomplete: AxeCheck[];
    inapplicable: AxeCheck[];
  }

  export interface AxeViolation {
    description: string;
    id: string;
    impact: string;
    nodes: AxeNode[];
    tags: string[];
  }

  export interface AxeCheck {
    description: string;
    id: string;
    nodes: AxeNode[];
    tags: string[];
  }

  export interface AxeNode {
    failureSummary?: string;
    html: string;
    impact?: string;
    none: AxeCheckResult[];
    all: AxeCheckResult[];
    any: AxeCheckResult[];
    target: string[];
  }

  export interface AxeCheckResult {
    data: unknown;
    id: string;
    impact: string;
    message: string;
    relatedNodes: Array<{ html: string; target: string[] }>;
  }

  export interface AxeOptions {
    rules?: string[] | Record<string, unknown>;
    runOnly?: {
      type: 'tag' | 'rule';
      values: string[];
    };
  }

  export function axe(
    element: Element | HTMLElement | Document,
    options?: AxeOptions
  ): Promise<AxeResults>;

  export const toHaveNoViolations: {
    toHaveNoViolations(results: AxeResults): { message: () => string; pass: boolean };
  };
}
