import type { components } from "@/types/api";

export interface UploadImageRequest
  extends Omit<
    components["schemas"]["Body_upload_image_images_upload_post"],
    "file"
  > {
  file: File;
}

export interface FullUploadImageRequest
  extends Omit<
    components["schemas"]["Body_full_upload_image_images_full_upload_post"],
    "file"
  > {
  file: File;
}
