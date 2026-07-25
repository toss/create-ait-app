# Apps in Toss documentation routing

Fetch documentation at task time. Never create or trust a scaffold-time copy.

## Choose the smallest useful source

1. Start with `https://developers-apps-in-toss.toss.im/llms.txt` when discovering which guide or API
   applies. It is a table of contents with summaries and direct links to focused Markdown pages.
2. For a specific API, feature, permission, configuration field, or deployment step, follow only the
   relevant link from `llms.txt` and fetch that page. Prefer this focused page over the full corpus.
3. Fetch `https://developers-apps-in-toss.toss.im/llms-full.txt` when:
   - the task spans multiple documentation sections;
   - a broad migration, audit, or cross-feature comparison needs corpus-wide search;
   - `llms.txt` does not expose a suitable focused page;
   - the focused page omits context needed to resolve an ambiguity.
4. Search `llms-full.txt` for exact API, type, config key, or heading names. Do not load unrelated
   sections into working context.

## Apply documentation safely

- Compare documentation with installed package versions and local TypeScript types.
- Prefer current official docs when cached knowledge conflicts.
- Do not infer that console, server API, bridge API, and UI guidance share the same requirements.
- If a source is unavailable, say which URL failed and avoid version-sensitive claims.
