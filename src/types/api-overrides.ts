import type { components } from "@/types/api";

export interface FullUploadImageRequest
  extends Omit<components["schemas"]["FullUploadImageRequest"], "file"> {
  file: File;
}
