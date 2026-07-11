---
name: feature-implementation-with-package-update
description: Workflow command scaffold for feature-implementation-with-package-update in CaaS.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /feature-implementation-with-package-update

Use this workflow when working on **feature-implementation-with-package-update** in `CaaS`.

## Goal

Implements a new feature that requires adding or updating dependencies, reflected in package.json and package-lock.json, along with new or updated source files.

## Common Files

- `package.json`
- `package-lock.json`
- `src/components/*.tsx`
- `src/services/*.ts`
- `vite.config.ts`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Update package.json and package-lock.json to add or change dependencies
- Implement or update feature in src/components/ or src/services/
- Optionally update configuration files (e.g., vite.config.ts)

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.