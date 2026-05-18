```markdown
# CaaS Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill provides a comprehensive guide to the development patterns, coding conventions, and workflows used in the CaaS (Content as a Service) repository. The codebase is written in TypeScript, leverages the Vite framework for fast development, and follows clear, conventional commit and code organization standards. This document will help you quickly understand how to contribute features, fix bugs, add tests, and maintain consistency across the project.

## Coding Conventions

**File Naming**
- Use camelCase for file names.
  - Example: `userService.ts`, `userProfileComponent.tsx`

**Import Style**
- Use relative imports for modules within the project.
  - Example:
    ```typescript
    import { fetchUser } from '../services/userService';
    ```

**Export Style**
- Use named exports for all modules.
  - Example:
    ```typescript
    // In src/services/userService.ts
    export function fetchUser(id: string) { ... }
    ```

**Commit Messages**
- Follow [Conventional Commits](https://www.conventionalcommits.org/) with these prefixes: `feat`, `fix`, `chore`, `test`, `ci`.
  - Example: `feat: add user profile component`

## Workflows

### Feature Implementation with Service and Component
**Trigger:** When adding a new feature that requires both backend logic (service) and frontend display (component).
**Command:** `/new-feature`

1. Create or update a service file in `src/services/`.
    ```typescript
    // src/services/userService.ts
    export function getUserData(id: string) {
      // business logic here
    }
    ```
2. Create or update a component file in `src/components/`.
    ```tsx
    // src/components/UserProfile.tsx
    import { getUserData } from '../services/userService';

    export function UserProfile({ userId }: { userId: string }) {
      // UI logic here
    }
    ```
3. Optionally, update or create a type definition in `src/types/` or a data file in `src/data/`.
    ```typescript
    // src/types/user.ts
    export type User = { id: string; name: string; };
    ```

---

### Feature Implementation with Package Update
**Trigger:** When adding a feature that depends on a new library or package.
**Command:** `/add-dependency-feature`

1. Update `package.json` and `package-lock.json` to add or change dependencies.
    ```json
    // package.json
    {
      "dependencies": {
        "axios": "^1.3.0"
      }
    }
    ```
2. Implement or update the feature in `src/components/` or `src/services/`.
    ```typescript
    // src/services/apiService.ts
    import axios from 'axios';
    export function fetchData(url: string) {
      return axios.get(url);
    }
    ```
3. Optionally, update configuration files (e.g., `vite.config.ts`).

---

### Unit Test Addition for Service or Utility
**Trigger:** When adding or improving test coverage for a service or utility.
**Command:** `/add-unit-test`

1. Create or update test files in `src/services/*.test.ts` or `src/utils/*.test.ts`.
    ```typescript
    // src/services/userService.test.ts
    import { getUserData } from './userService';

    test('returns user data', () => {
      expect(getUserData('123')).toEqual({ id: '123', name: 'Alice' });
    });
    ```
2. Update `package.json` and `package-lock.json` if new test dependencies are needed.
3. Optionally, update test configuration (e.g., `vite.config.ts`).

---

### Feature Enhancement or Bugfix Touching Multiple Components and Services
**Trigger:** When fixing a bug or enhancing a feature that affects several parts of the app.
**Command:** `/multi-file-fix`

1. Update multiple files in `src/components/`.
2. Update related files in `src/services/`.
3. Update context or data files as needed (e.g., `src/contexts/`, `src/data/`).
4. Optionally, update the main entry point (`src/App.tsx`).

    ```tsx
    // src/components/UpdatedComponent.tsx
    import { updatedService } from '../services/updatedService';

    export function UpdatedComponent() {
      // Enhanced logic here
    }
    ```

## Testing Patterns

- Test files follow the pattern `*.test.*` (e.g., `userService.test.ts`).
- Tests are typically colocated with the services or utilities they cover.
- The testing framework is not explicitly specified; check the project dependencies for more details.
- Example test:
    ```typescript
    // src/utils/calc.test.ts
    import { add } from './calc';

    test('adds numbers', () => {
      expect(add(2, 3)).toBe(5);
    });
    ```

## Commands

| Command                | Purpose                                                        |
|------------------------|----------------------------------------------------------------|
| /new-feature           | Add a new feature with both service and component              |
| /add-dependency-feature| Add a feature that requires updating or adding dependencies    |
| /add-unit-test         | Add or improve unit tests for services or utilities            |
| /multi-file-fix        | Perform a bugfix or enhancement across multiple files          |
```
