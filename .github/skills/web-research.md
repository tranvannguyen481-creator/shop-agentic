# Skill: Web Research

> **Load this skill** whenever a task requires external knowledge: library docs, latest APIs, security advisories, changelogs, or technology comparisons.

---

## When to Use Web Search

Use the web search / fetch tool when:

| Situation                           | Example                                                |
| ----------------------------------- | ------------------------------------------------------ |
| Library docs or changelog needed    | "What changed in Firestore SDK v11?"                   |
| Feature relies on a third-party API | Adding Stripe, VNPay, OpenAI, Firebase extensions      |
| Best-practice research needed       | "How to handle Firestore transactions safely in 2026?" |
| Version or compatibility check      | "Is React 19 concurrent mode compatible with RHF v7?"  |
| Security advisory lookup            | "Is there a known CVE for multer v2?"                  |
| Comparing alternatives              | "TanStack Query v5 vs SWR — DX and bundle size"        |

**Do NOT use web search when:**

- The answer is in the codebase (`search_workspace` instead)
- The answer is in an existing skill or playbook file
- It is a general coding question with a well-known answer

---

## Search Protocol

### Step 1 — Formulate a precise query

```
❌ "firebase"
✅ "Firebase Admin SDK Node.js v12 Firestore batch write limit 2026"
✅ "VNPay IPN callback signature verification Node.js example"
```

### Step 2 — Prefer official sources

Priority order for credibility:

1. Official docs (firebase.google.com, reactjs.org, tanstack.com, npmjs.com)
2. GitHub repository README / releases
3. Official blog posts / changelogs
4. High-quality community sources (auth0 blog, Kent C. Dodds, etc.)

### Step 3 — Synthesize, don't paste

After fetching, produce a **summary** structured as:

```
**Source:** [page title](url)
**Key findings:**
- Point 1
- Point 2
- Point 3

**Impact on implementation:**
- What to do differently / what to watch out for
```

### Step 4 — Apply to the current task

Translate findings into concrete code or config changes. Do not just report — act on it.

---

## Useful Query Templates

### Check latest version

```
[package-name] latest version release notes npm 2026
```

### Security check

```
[package-name] security vulnerability CVE 2025 2026
```

### Integration guide

```
[service] Node.js Express TypeScript integration example official docs
```

### Migration guide

```
[library] v[old] to v[new] migration guide breaking changes
```

### Firestore-specific

```
Firestore [feature] Node.js Admin SDK official documentation
Cloud Firestore [collection/query pattern] best practices 2026
```

---

## Orchestrator Usage

The Orchestrator should trigger a web research pass **before delegating** when:

- The task mentions an external service (VNPay, Stripe, Firebase extensions, OAuth providers)
- The task involves upgrading a dependency
- The task involves a feature that wasn't in the original project scope (e.g., WebSockets, serverless functions, vector search)

Pass the research findings as part of the delegation context to the sub-agent.
