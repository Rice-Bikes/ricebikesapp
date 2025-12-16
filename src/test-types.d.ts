/**
 * Global test types for the project.
 *
 * This file ensures TypeScript picks up Vitest globals (e.g., `vi`, `describe`, `it`,
 * `expect`, `beforeEach`, `afterEach`) and testing-library custom matchers
 * (from `@testing-library/jest-dom`) in test files under `src/`.
 *
 * Place this file in `src/` so it is included by the project's `tsconfig.json`.
 */

/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />
/// <reference types="jsdom" />

declare global {
  namespace vi {
    // Provide a convenient alias so tests can use `vi.Mock` in type positions.
    // Implementation uses the return type of `vi.fn()` to represent a mock instance.
    export type Mock = ReturnType<(typeof import("vitest"))["vi"]["fn"]>;
  }
}

export {};
