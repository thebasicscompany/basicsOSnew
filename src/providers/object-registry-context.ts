import { createContext } from "react";
import type { Attribute, ObjectConfig } from "@/types/objects";

export interface ObjectRegistryContextValue {
  objects: ObjectConfig[];
  getObject: (slug: string) => ObjectConfig | undefined;
  getAttributes: (slug: string) => Attribute[];
  isLoading: boolean;
  error: Error | null;
}

export const ObjectRegistryContext = createContext<ObjectRegistryContextValue>({
  objects: [],
  getObject: () => undefined,
  getAttributes: () => [],
  isLoading: true,
  error: null,
});
