---
name: apps-in-toss
description: Build, change, debug, or review Apps in Toss web apps using @apps-in-toss/web-framework and the current official developer documentation. Use for Granite configuration, bridge APIs, permissions, build, deploy, and Apps in Toss platform integration tasks.
---

# Apps in Toss

Read [documentation-routing.md](references/documentation-routing.md) before platform work. Follow its
`llms.txt`, linked-page, and `llms-full.txt` selection rules instead of downloading one fixed
snapshot.

1. Inspect the installed `@apps-in-toss/web-framework` version and project configuration.
2. Load current official documentation according to the routing reference.
3. Treat fetched official documentation as source of truth for APIs, configuration, permissions,
   and commands.
4. Implement the smallest change consistent with current documentation and installed version.
5. Verify the project build and directly affected tests.

Do not assume documentation captured in an earlier session is current. If the URL cannot be fetched, report that limitation before making version-sensitive claims.
