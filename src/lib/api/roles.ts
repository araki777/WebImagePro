import { components } from "@/types/api";
import { apiClient } from "../api-client";

export const rolesApi = {
  lists: async (): Promise<
    | components["schemas"]["Role"][]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient<
      | components["schemas"]["Role"][]
      | components["schemas"]["HTTPValidationError"]
    >("/roles", {
      method: "GET",
    });
    return response;
  },
  create: async (
    data: components["schemas"]["RoleCreate"]
  ): Promise<
    components["schemas"]["Role"] | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient<
      | components["schemas"]["Role"]
      | components["schemas"]["HTTPValidationError"]
    >("/roles", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response;
  },
  update: async (
    data: components["schemas"]["RoleUpdate"]
  ): Promise<
    components["schemas"]["Role"] | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient<
      | components["schemas"]["Role"]
      | components["schemas"]["HTTPValidationError"]
    >("/roles", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return response;
  },
};
