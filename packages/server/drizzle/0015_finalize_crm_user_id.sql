DROP FUNCTION IF EXISTS "public"."match_context_embeddings"(bigint, vector, integer);
--> statement-breakpoint

CREATE FUNCTION "public"."match_context_embeddings"(
  p_crm_user_id bigint,
  p_query_embedding vector(3072),
  p_match_count int DEFAULT 5
)
RETURNS TABLE (
  entity_type text,
  entity_id bigint,
  chunk_text text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ce.entity_type,
    ce.entity_id,
    ce.chunk_text
  FROM context_embeddings ce
  WHERE ce.crm_user_id = p_crm_user_id
    AND ce.embedding IS NOT NULL
  ORDER BY ce.embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;
