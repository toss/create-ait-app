# TDS Mobile documentation routing

Fetch documentation at task time. Never create or trust a scaffold-time copy.

## Choose the smallest useful source

1. Start with `https://tossmini-docs.toss.im/tds-mobile/llms.txt` to find a component or topic. It is
   an index with summaries and links to focused `llm.txt` pages.
2. For one component, token, pattern, or prop question, fetch only the linked focused page from the
   index.
3. Fetch `https://tossmini-docs.toss.im/tds-mobile/llms-full.txt` when:
   - composing or comparing several components;
   - auditing a whole screen or doing a broad migration;
   - the index has no suitable focused page;
   - a focused page lacks cross-cutting context.
4. Search the full document for exact component, prop, token, or heading names and use only the
   relevant sections.

## Apply documentation safely

- Check installed `@toss/tds-mobile`, React, and React DOM versions first.
- Respect deprecation notices from the current focused page or full corpus.
- Prefer current official docs when cached knowledge conflicts.
- If a source is unavailable, say which URL failed and avoid version-sensitive claims.
