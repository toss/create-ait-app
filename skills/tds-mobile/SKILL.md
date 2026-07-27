---
name: tds-mobile
description: Build, change, debug, or review React 18 Apps in Toss interfaces that use @toss/tds-mobile. Use for TDS Mobile components, tokens, patterns, accessibility, and TDS-specific Apps in Toss UI work.
---

# TDS Mobile

Read [documentation-routing.md](references/documentation-routing.md) before TDS work. Follow its
index, component-page, and full-corpus selection rules.

1. Inspect installed React and TDS package versions before selecting APIs.
2. Load current official documentation according to the routing reference.
3. Treat fetched official documentation as source of truth for components, props, tokens, and usage
   rules.
4. Keep React and React DOM on major version 18 unless current TDS peer dependencies explicitly
   allow the intended upgrade.
5. Verify typecheck and build after each TDS integration change.

Do not rely on a scaffold-time documentation snapshot. If the URL cannot be fetched, report that limitation before making version-sensitive claims.
