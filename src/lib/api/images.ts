import { components } from "@/types/api";
import { apiClient } from "../api-client";

export const imagesApi = {
  upload: async (
    data: components["schemas"]["Body_upload_image_images_upload_post"]
  ): Promise<
    | components["schemas"]["Image"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient("/images/upload", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },
  vision_tags: async (
    data: components["schemas"]["VisionRequest"]
  ): Promise<components["schemas"]["VisionResponse"]> => {
    const response = await apiClient("/images/vision-tags", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },
  translate: async (
    data: components["schemas"]["TranslateRequest"]
  ): Promise<
    | components["schemas"]["TranslateResponse"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient("/images/translate", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },
  save: async (
    data: components["schemas"]["ImageCreate"]
  ): Promise<
    | components["schemas"]["Image"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient("/images", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },
  full_upload: async (
    data: components["schemas"]["Body_full_upload_image_images_full_upload_post"]
  ): Promise<
    | components["schemas"]["Image"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient("/images/full-upload", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },
};
