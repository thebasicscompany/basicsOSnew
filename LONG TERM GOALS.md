# Long Term Goals

## AI Memory (Optional, Not a Current Blocker)

- Current state is production-ready for now:
  - Server-side tool calling works for chat and voice assistants.
  - Conversation thread/message persistence works (`ai_threads`, `ai_messages`).
  - Tenant/org isolation is in place.
- Long-term memory (`ai_memory_items`) is not fully wired yet and should be implemented when we need durable personalization across sessions.
- Future implementation scope:
  - Extract stable facts/preferences after assistant turns.
  - Store memory with scope (`org`, `user`, `thread`) + importance/TTL.
  - Retrieve relevant memory and inject into assistant prompts.
  - Add dedupe/update policy to avoid memory bloat and stale data.
