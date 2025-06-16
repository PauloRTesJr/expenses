# ADR-007: Introduce Service Layer and React Query

## Status
Accepted

## Context
Direct Supabase calls were spread across components, making it harder to test and maintain the data access logic. Heavy dashboard charts were loaded on page render, increasing bundle size.

## Decision
- Create a dedicated service layer under `lib/transactions` for transaction-related data access.
- Centralize environment variables in `config.ts`.
- Add a simple error handler in `lib/errors.ts`.
- Use React Query in `DashboardClient` to fetch transactions and manage cache.
- Load `MonthlyAndYearlyCharts` dynamically to reduce initial bundle size.

## Consequences
This structure improves maintainability and allows future teams to extend data access logic more easily. React Query caching reduces manual state handling.

