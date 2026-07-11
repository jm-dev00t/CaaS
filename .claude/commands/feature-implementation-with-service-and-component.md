---
name: feature-implementation-with-service-and-component
description: Workflow command scaffold for feature-implementation-with-service-and-component in CaaS.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /feature-implementation-with-service-and-component

Use this workflow when working on **feature-implementation-with-service-and-component** in `CaaS`.

## Goal

Implements a new feature by adding or updating both a service (business logic) and a UI component, often with associated types or data files.

## Common Files

- `src/services/*.ts`
- `src/components/*.tsx`
- `src/types/*.ts`
- `src/data/*.ts`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update a service file in src/services/
- Create or update a component file in src/components/
- Optionally update or create a type definition in src/types/ or a data file in src/data/

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.