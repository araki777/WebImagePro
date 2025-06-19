import { components } from "@/types/api";
import {
  FullUploadImageRequest,
  UploadImageRequest,
} from "@/types/api-overrides";
import { apiClient } from "../api-client";

export const imagesApi = {
  get_image: async ({
    blob_name,
    is_shared,
  }: {
    blob_name: string;
    is_shared: boolean;
  }): Promise<Blob | components["schemas"]["HTTPValidationError"]> => {
    const searchParams = new URLSearchParams({
      is_shared: is_shared.toString(),
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
    lang,
  }: {
    is_shared: boolean;
    lang: string;
  }): Promise<
    | components["schemas"]["ImageResponse"][]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const queryParams = new URLSearchParams({
      is_shared: is_shared.toString(),
      lang,
    });
    const response = await apiClient<
      | components["schemas"]["ImageResponse"][]
      | components["schemas"]["HTTPValidationError"]
    >(`/images?${queryParams.toString()}`, {
      method: "GET",
    });
    return response;
  },
  upload: async (
    data: UploadImageRequest
  ): Promise<
    | components["schemas"]["BlobUploadResult"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("is_shared", data.is_shared.toString());

    const response = await apiClient<
      | components["schemas"]["BlobUploadResult"]
      | components["schemas"]["HTTPValidationError"]
    >("/images/upload", {
      method: "POST",
      body: formData,
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
    | components["schemas"]["ImageResponse"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient<
      | components["schemas"]["ImageResponse"]
      | components["schemas"]["HTTPValidationError"]
    >("/images", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response;
  },
  full_upload: async (
    data: FullUploadImageRequest
  ): Promise<
    | components["schemas"]["ImageResponse"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("is_shared", data.is_shared.toString());
    formData.append("target_langs", JSON.stringify(data.target_langs));

    const response = await apiClient<
      | components["schemas"]["ImageResponse"]
      | components["schemas"]["HTTPValidationError"]
    >("/images/full-upload", {
      method: "POST",
      body: formData,
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
