import { apiClient } from "../api-client";

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const contactsApi = {
  create: async (data: ContactFormData, token: string) => {
    return apiClient("/contacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  },
};
