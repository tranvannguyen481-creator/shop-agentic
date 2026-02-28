---
agent: agent
description: Research an external library, API or pattern before integrating into shop-agentic
---

# Research Prompt

Use this prompt before integrating a new external dependency or making technology decisions.

---

## Instructions for Copilot

1. Read `.github/skills/web-research.md` for research methodology.
2. Read `.github/playbooks/02-architecture-decisions.md` to understand existing tech choices.
3. Research the topic thoroughly before making a recommendation.
4. Focus on compatibility with the existing stack:
   - Backend: Express 4, TypeScript 5.9, Firebase Admin SDK, Zod v4
   - Frontend: React 19, Vite 6, TypeScript 5, TanStack Query v5, React Hook Form v7

---

## Research Request Template

```
Topic:
<What you want to research — a library, API, pattern, or decision>

Problem statement:
<What problem are you trying to solve?>

Current approach (if any):
<How is this currently handled in the project, if at all?>

Constraints:
- Must be compatible with: <list relevant stack pieces>
- Must NOT introduce: <any hard constraints>
- Bundle size concern: <yes/no>
- Must work with TypeScript strict mode: yes (always)

Output wanted:
[ ] Recommendation + reasoning
[ ] Code example of integration
[ ] Comparison of 2–3 options
[ ] Migration plan from current approach
```

---

## Example Usage

```
Topic:
Real-time updates for order status changes

Problem statement:
Currently the order status page requires manual refresh to see updates.
We want to show status changes in real time when Firestore documents update.

Current approach:
HTTP polling every 5 seconds via React Query's refetchInterval.

Constraints:
- Must work with Firebase/Firestore (we already have the SDK)
- Must NOT add a separate WebSocket/Socket.io server
- Bundle size concern: no (web app only, not mobile)
- Must work with TypeScript strict mode: yes

Output wanted:
[x] Recommendation + reasoning
[x] Code example of integration
```

---

## Research Output Format

Structure your research response as:

```
## Problem
<Restate the problem clearly>

## Options Considered
### Option 1: <name>
- How it works: ...
- Pros: ...
- Cons: ...
- Compatibility: ...

### Option 2: <name>
...

## Recommendation
<Which option and why>

## Integration Plan
<Step-by-step how to add it to the project>

## Code Example
<Working TypeScript/React code snippet>

## References
<Links to docs, GitHub, etc.>
```
