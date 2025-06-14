import { components } from "@/types/api";
import { apiClient } from "../api-client";

export const rolesApi = {
  lists: async (): Promise<
    | components["schemas"]["Role"][]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient("/roles", {
      method: "GET",
    });
    return response.json();
  },
  create: async (
    data: components["schemas"]["RoleCreate"]
  ): Promise<
    components["schemas"]["Role"] | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient("/roles", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },
  update: async (
    data: components["schemas"]["RoleUpdate"]
  ): Promise<
    components["schemas"]["Role"] | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient("/roles", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return response.json();
  },
};
