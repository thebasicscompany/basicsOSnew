/**
 * Context chunk returned from similarity search.
 */
export interface ContextChunk {
  entity_type: string;
  entity_id: number;
  chunk_text: string;
}

/**
 * Result of resolving a user to their sales record.
 */
export interface UserSalesInfo {
  salesId: number;
  apiKey: string | null;
}

/**
 * DB adapter interface for portability.
 * Users can implement this for Supabase, Neon, raw pg, etc.
 */
export interface ContextDbAdapter {
  /** Resolve Supabase user_id to sales row. Returns salesId and Basics API key (null if not set). */
  getSalesByUserId(userId: string): Promise<UserSalesInfo | null>;

  /** Similarity search over context_embeddings for a given sales_id. */
  similaritySearch(
    salesId: number,
    queryEmbedding: number[],
    limit: number
  ): Promise<ContextChunk[]>;

  /** Upsert an embedding for an entity. */
  upsertEmbedding(
    salesId: number,
    entityType: string,
    entityId: number,
    chunkText: string,
    embedding: number[]
  ): Promise<void>;

  /** Delete embeddings for an entity. */
  deleteEmbedding(entityType: string, entityId: number): Promise<void>;
}
