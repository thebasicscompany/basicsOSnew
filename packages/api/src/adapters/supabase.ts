import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ContextDbAdapter, ContextChunk } from "./types.js";

type SalesRow = {
  id: number;
  basics_api_key: string | null;
};

export function createSupabaseAdapter(
  supabaseUrl: string,
  serviceRoleKey: string
): ContextDbAdapter {
  const supabase: SupabaseClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return {
    async getSalesByUserId(userId: string) {
      const { data, error } = await supabase
        .from("sales")
        .select("id, basics_api_key")
        .eq("user_id", userId)
        .single();

      if (error || !data) return null;
      const row = data as SalesRow;
      return { salesId: row.id, apiKey: row.basics_api_key };
    },

    async similaritySearch(
      salesId: number,
      queryEmbedding: number[],
      limit: number
    ): Promise<ContextChunk[]> {
      const embeddingStr = `[${queryEmbedding.join(",")}]`;
      const { data, error } = await supabase.rpc("match_context_embeddings", {
        p_sales_id: salesId,
        p_query_embedding: embeddingStr,
        p_match_count: limit,
      });

      if (error) {
        console.error("[supabase-adapter] similaritySearch error:", error);
        return [];
      }

      return (data ?? []).map((row: { entity_type: string; entity_id: number; chunk_text: string }) => ({
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        chunk_text: row.chunk_text,
      }));
    },

    async upsertEmbedding(
      salesId: number,
      entityType: string,
      entityId: number,
      chunkText: string,
      embedding: number[]
    ): Promise<void> {
      const embeddingStr = `[${embedding.join(",")}]`;
      const { error } = await supabase.from("context_embeddings").upsert(
        {
          sales_id: salesId,
          entity_type: entityType,
          entity_id: entityId,
          chunk_text: chunkText,
          embedding: embeddingStr,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "sales_id,entity_type,entity_id",
        }
      );

      if (error) {
        console.error("[supabase-adapter] upsertEmbedding error:", error);
        throw error;
      }
    },

    async deleteEmbedding(entityType: string, entityId: number): Promise<void> {
      const { error } = await supabase
        .from("context_embeddings")
        .delete()
        .eq("entity_type", entityType)
        .eq("entity_id", entityId);

      if (error) {
        console.error("[supabase-adapter] deleteEmbedding error:", error);
        throw error;
      }
    },
  };
}
