import { components } from "@/types/api";
import { apiClient } from "../api-client";

export const imagesApi = {
  upload: async (
    data: components["schemas"]["Body_upload_image_images_upload_post"]
  ): Promise<
    | components["schemas"]["Image"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient<
      | components["schemas"]["Image"]
      | components["schemas"]["HTTPValidationError"]
    >("/images/upload", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response;
  },
  vision_tags: async (
    data: components["schemas"]["VisionRequest"]
  ): Promise<components["schemas"]["VisionResponse"]> => {
    const response = await apiClient<components["schemas"]["VisionResponse"]>(
      "/images/vision-tags",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response;
  },
  translate: async (
    data: components["schemas"]["TranslateRequest"]
  ): Promise<
    | components["schemas"]["TranslateResponse"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient<
      | components["schemas"]["TranslateResponse"]
      | components["schemas"]["HTTPValidationError"]
    >("/images/translate", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response;
  },
  save: async (
    data: components["schemas"]["ImageCreate"]
  ): Promise<
    | components["schemas"]["Image"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient<
      | components["schemas"]["Image"]
      | components["schemas"]["HTTPValidationError"]
    >("/images", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response;
  },
  full_upload: async (
    data: components["schemas"]["Body_full_upload_image_images_full_upload_post"]
  ): Promise<
    | components["schemas"]["Image"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient<
      | components["schemas"]["Image"]
      | components["schemas"]["HTTPValidationError"]
    >("/images/full-upload", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response;
  },
};
