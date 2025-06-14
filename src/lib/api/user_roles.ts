import { components } from "@/types/api";
import { apiClient } from "../api-client";

export const userRolesApi = {
  get: async (): Promise<
    | components["schemas"]["UserProfile"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient("/user/me/roles", {
      method: "GET",
    });
    return response.json();
  },
  update: async (
    data: components["schemas"]["UserRoleUpdate"]
  ): Promise<
    | components["schemas"]["UserRole"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient("/users/me/role", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.json();
  },
};
