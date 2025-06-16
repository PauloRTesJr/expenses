# Refactor Analysis

This document lists potential refactoring opportunities to improve scalability and maintainability.

## 1. Layered Architecture
- **Observation**: Business logic and Supabase calls are directly in React components.
- **Suggestion**: Introduce a service layer to abstract data access. Components should depend on services instead of making direct API calls. This makes testing and future API changes easier.

## 2. Feature Based Modules
- **Observation**: Files are grouped generically (e.g. `components/`, `hooks/`).
- **Suggestion**: Organize by feature modules (`features/transactions/`, `features/auth/`). Each module contains its components, hooks, services and tests. Large applications use this structure to support independent teams and clear ownership.

## 3. API Error Handling
- **Observation**: Supabase client functions often use `console.log` for errors.
- **Suggestion**: Add a centralized error handler (e.g. `lib/errors.ts`) that logs and normalizes errors. Use typed error classes so the UI can handle different error cases consistently.

## 4. State Management
- **Observation**: Zustand is used for global state, but server state is fetched manually.
- **Suggestion**: Consider React Query or TanStack Query for caching, mutations and real-time updates. This reduces boilerplate around loading states and synchronization.

## 5. Testing Utilities
- **Observation**: Tests mock many Supabase functions individually.
- **Suggestion**: Create utilities for test mocks (e.g. `tests/utils/supabaseMock.ts`) to avoid duplication and simplify test setup.

## 6. Environment Configuration
- **Observation**: Environment variables are accessed directly in multiple files.
- **Suggestion**: Centralize environment config in a single `config.ts` file and import from there. Validate variables at start-up and provide defaults for development.

## 7. Code Splitting and Lazy Loading
- **Observation**: Some pages load large components (e.g. charts) by default.
- **Suggestion**: Use dynamic imports with Suspense to load heavy components only when needed. This improves initial render performance.

## 8. Documentation and ADRs
- **Observation**: The project already uses ADRs. Continue documenting major refactors with new ADR files in `docs/` so changes are well tracked.

These changes will help the project scale as features grow and multiple teams contribute.
