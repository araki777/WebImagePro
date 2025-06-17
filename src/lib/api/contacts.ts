import type { components } from "@/types/api";
import { apiClient } from "../api-client";

export const contactsApi = {
  get: async (): Promise<
    | components["schemas"]["Contact"][]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient<
      | components["schemas"]["Contact"][]
      | components["schemas"]["HTTPValidationError"]
    >("/contacts", {
      method: "GET",
    });
    return response;
  },
  create: async (
    data: components["schemas"]["ContactCreate"]
  ): Promise<
    | components["schemas"]["Contact"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient<
      | components["schemas"]["Contact"]
      | components["schemas"]["HTTPValidationError"]
    >("/contacts", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response;
  },
};
