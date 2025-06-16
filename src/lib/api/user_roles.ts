import { components } from "@/types/api";
import { apiClient } from "../api-client";

export const userRolesApi = {
  get: async (): Promise<
    | components["schemas"]["UserRole"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient<
      | components["schemas"]["UserRole"]
      | components["schemas"]["HTTPValidationError"]
    >("/user/me/roles", {
      method: "GET",
    });
    return response;
  },
  update: async (
    data: components["schemas"]["UserRoleUpdate"]
  ): Promise<
    | components["schemas"]["UserRole"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient<
      | components["schemas"]["UserRole"]
      | components["schemas"]["HTTPValidationError"]
    >("/users/me/role", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response;
  },
};
