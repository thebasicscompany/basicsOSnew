import { useContext } from "react";
import {
  ObjectRegistryContext,
  type ObjectRegistryContextValue,
} from "@/providers/ObjectRegistryProvider";
import type { Attribute, ObjectConfig } from "@/types/objects";

/**
 * Access the full ObjectRegistry context.
 */
export function useObjectRegistry(): ObjectRegistryContextValue {
  return useContext(ObjectRegistryContext);
}

/**
 * Get all registered (active) objects.
 */
export function useObjects(): ObjectConfig[] {
  const { objects } = useObjectRegistry();
  return objects;
}

/**
 * Get a single object config by slug.
 */
export function useObject(slug: string): ObjectConfig | undefined {
  const { getObject } = useObjectRegistry();
  return getObject(slug);
}

/**
 * Get the merged attribute list for an object (NocoDB columns + overrides).
 */
export function useAttributes(slug: string): Attribute[] {
  const { getAttributes } = useObjectRegistry();
  return getAttributes(slug);
}
