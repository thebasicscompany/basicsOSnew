import { createContext, useContext } from "react";
import type {
  AttachmentData,
  AttachmentMediaCategory,
  AttachmentVariant,
} from "./attachments-utils";

export interface AttachmentsContextValue {
  variant: AttachmentVariant;
}

export const AttachmentsContext = createContext<AttachmentsContextValue | null>(
  null,
);

export interface AttachmentContextValue {
  data: AttachmentData;
  mediaCategory: AttachmentMediaCategory;
  onRemove?: () => void;
  variant: AttachmentVariant;
}

export const AttachmentContext = createContext<AttachmentContextValue | null>(
  null,
);

export const useAttachmentsContext = () =>
  useContext(AttachmentsContext) ?? { variant: "grid" as const };

export const useAttachmentContext = () => {
  const ctx = useContext(AttachmentContext);
  if (!ctx) {
    throw new Error("Attachment components must be used within <Attachment>");
  }
  return ctx;
};
