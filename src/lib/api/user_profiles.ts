import type { components } from "@/types/api";
import { apiClient } from "../api-client";

export const userProfilesApi = {
  get: async (): Promise<
    | components["schemas"]["UserProfile"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient("/users/me/profile", {
      method: "GET",
    });
    return response.json();
  },
  update: async (
    data: components["schemas"]["UserProfileUpdate"]
  ): Promise<
    | components["schemas"]["UserProfile"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient("/users/me/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.json();
  },
};
