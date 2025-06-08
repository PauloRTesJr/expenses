# 🧹 Lint Guide - Code Quality Enforcement

This document outlines the mandatory lint requirements and procedures for the Expenses project.

## 🚨 MANDATORY LINT POLICY

**CRITICAL REQUIREMENT: ALL development tasks MUST run lint verification to ensure code quality and consistency.**

### Required Commands

```bash
# Primary lint command - MUST run before any commit
npm run lint

# Fix automatic lint issues when possible
npm run lint -- --fix
```

### When to Run Lint

**MANDATORY execution before:**

- ✅ Committing any code changes
- ✅ Creating pull requests
- ✅ Deploying to any environment
- ✅ Pushing code to remote repository

**MANDATORY execution after:**

- ✅ Adding new features
- ✅ Bug fixes and hotfixes
- ✅ Code refactoring
- ✅ Resolving merge conflicts
- ✅ Installing new dependencies
- ✅ Updating existing dependencies

### Enforcement Policy

**Zero Tolerance Policy:**

- 🚫 **NO commits** with lint errors
- 🚫 **NO pull requests** with lint warnings
- 🚫 **NO deployments** with lint issues
- 🚫 **NO exceptions** for urgent fixes

**Consequences:**

- PRs with lint issues will be **automatically rejected**
- CI/CD pipeline will **fail** with lint errors
- Code cannot be merged until all lint issues are resolved

## 🔧 ESLint Configuration

### Current Setup

The project uses **Next.js ESLint configuration** with TypeScript support:

```javascript
// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
```

### Rules Enforced

1. **Next.js Core Web Vitals**: Performance and accessibility rules
2. **TypeScript**: Type safety and TypeScript-specific rules
3. **React Hooks**: Proper hooks usage and dependencies
4. **Import/Export**: Module import organization
5. **Code Style**: Consistent formatting and style

## 🛠️ Common Lint Issues and Solutions

### TypeScript Errors

```typescript
// ❌ INCORRECT - Missing type annotation
const fetchData = async () => {
  // ESLint Error: Function lacks return type annotation
};

// ✅ CORRECT - Explicit return type
const fetchData = async (): Promise<DataType[]> => {
  // Implementation
};
```

### React Hooks Errors

```typescript
// ❌ INCORRECT - Missing dependency
useEffect(() => {
  fetchUserData(userId);
}, []); // ESLint Error: Missing dependency 'userId'

// ✅ CORRECT - All dependencies included
useEffect(() => {
  fetchUserData(userId);
}, [userId]);
```

### Import Organization

```typescript
// ❌ INCORRECT - Unorganized imports
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
import { useEffect } from "react";

// ✅ CORRECT - Organized imports
import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";

import { Button } from "./ui/button";
```

### Unused Variables

```typescript
// ❌ INCORRECT - Unused variables
const handleSubmit = (data: FormData, event: Event) => {
  // ESLint Error: 'event' is defined but never used
  processData(data);
};

// ✅ CORRECT - Remove unused or prefix with underscore
const handleSubmit = (data: FormData) => {
  processData(data);
};

// ✅ ALTERNATIVE - Prefix unused parameters
const handleSubmit = (data: FormData, _event: Event) => {
  processData(data);
};
```

## 🔄 Automated Lint Workflow

### Pre-commit Hooks (Recommended)

```bash
# Install husky for pre-commit hooks
npm install --save-dev husky

# Setup pre-commit hook
npx husky add .husky/pre-commit "npm run lint"
```

### VS Code Integration

Add to `.vscode/settings.json`:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

### CI/CD Integration

```yaml
# .github/workflows/quality-check.yml
name: Code Quality Check
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"
      - run: npm ci
      - run: npm run lint
```

## 📊 Lint Reporting

### Check Lint Status

```bash
# Run lint with detailed output
npm run lint -- --format=detailed

# Run lint and output to file
npm run lint -- --output-file=lint-report.txt

# Run lint for specific files
npm run lint -- src/components/forms/
```

### Lint Metrics

Monitor these metrics:

- **Zero errors** (mandatory)
- **Zero warnings** (mandatory for PRs)
- **Consistent rule violations** (identify patterns)
- **Fix-rate** (percentage of auto-fixable issues)

## 🎯 Best Practices

### Daily Workflow

1. **Start of day**: Run `npm run lint` to check current state
2. **Before features**: Ensure clean lint status
3. **During development**: Use IDE extensions for real-time feedback
4. **Before commits**: Always run lint and fix issues
5. **Code reviews**: Verify lint status in PRs

### Team Guidelines

1. **Never commit** with lint errors
2. **Fix warnings** immediately, don't accumulate
3. **Use auto-fix** when available (`--fix` flag)
4. **Understand rules** - don't just disable them
5. **Discuss rule changes** with the team before modifying configuration

### Emergency Procedures

If urgent fixes are needed:

1. **Still run lint** - no exceptions
2. **Create follow-up ticket** for any temporary workarounds
3. **Fix lint issues** in the same PR when possible
4. **Document reasons** for any eslint-disable comments

## 🆘 Troubleshooting

### Common Commands

```bash
# Clear ESLint cache
npm run lint -- --cache-location .eslintcache --clear

# Check ESLint configuration
npm run lint -- --print-config src/app/page.tsx

# Debug ESLint rules
npm run lint -- --debug
```

### Getting Help

1. Check this guide first
2. Review [ESLint documentation](https://eslint.org/docs)
3. Check [Next.js ESLint documentation](https://nextjs.org/docs/app/building-your-application/configuring/eslint)
4. Ask team members for rule clarifications
5. Create GitHub issue for configuration problems

## 📝 Rule Modification Process

To modify lint rules:

1. **Discuss with team** - get consensus on changes
2. **Create ADR** - document the decision
3. **Update configuration** - modify `eslint.config.mjs`
4. **Test thoroughly** - ensure no breaking changes
5. **Update documentation** - reflect changes in this guide
6. **Communicate changes** - inform all team members

---

**Remember: Lint is not optional. It's a quality gate that ensures consistent, maintainable, and error-free code.**
