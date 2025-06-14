import type { components } from "@/types/api";
import { apiClient } from "../api-client";

export const contactsApi = {
  get: async (): Promise<
    | components["schemas"]["Contact"][]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient("/contacts", {
      method: "GET",
    });
    return response.json();
  },
  create: async (
    data: components["schemas"]["ContactCreate"]
  ): Promise<
    | components["schemas"]["Contact"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient("/contacts", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },
};
