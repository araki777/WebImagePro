import { components } from "@/types/api";
import { apiClient } from "../api-client";

export const imagesApi = {
  get_image: async ({
    blob_name,
    is_shared,
    user_id,
  }: {
    blob_name: string;
    is_shared: boolean;
    user_id: string;
  }): Promise<Blob | components["schemas"]["HTTPValidationError"]> => {
    const searchParams = new URLSearchParams({
      is_shared: is_shared.toString(),
      user_id,
    });
    const response = await apiClient<
      Blob | components["schemas"]["HTTPValidationError"]
    >(`/images/${blob_name}?${searchParams.toString()}`, {
      method: "GET",
    });
    return response;
  },
  get_images: async ({
    is_shared,
    user_id,
    lang,
  }: {
    is_shared: boolean;
    user_id: string;
    lang: string;
  }): Promise<
    | components["schemas"]["ImageWithTags"][]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const queryParams = new URLSearchParams({
      is_shared: is_shared.toString(),
      user_id,
      lang,
    });
    const response = await apiClient<
      | components["schemas"]["ImageWithTags"][]
      | components["schemas"]["HTTPValidationError"]
    >(`/images?${queryParams.toString()}`, {
      method: "GET",
    });
    return response;
  },
  upload: async (
    data: components["schemas"]["UploadImageRequest"]
  ): Promise<
    | components["schemas"]["BlobUploadResult"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient<
      | components["schemas"]["BlobUploadResult"]
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
    data: components["schemas"]["FullUploadImageRequest"]
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
  delete: async (
    image_id: string
  ): Promise<components["schemas"]["HTTPValidationError"]> => {
    const response = await apiClient<
      components["schemas"]["HTTPValidationError"]
    >("/images/delete", {
      method: "DELETE",
      body: JSON.stringify({ image_id }),
    });
    return response;
  },
};
