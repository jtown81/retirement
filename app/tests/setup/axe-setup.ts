import { axe, toHaveNoViolations } from 'jest-axe';
import { expect } from 'vitest';

expect.extend(toHaveNoViolations);

// Re-export axe for use in tests
export { axe };
