import type { components } from "@/types/api";
import { apiClient } from "../api-client";

export const authApi = {
  signup: async (
    data: components["schemas"]["UserSignUp"]
  ): Promise<
    | components["schemas"]["Token"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },
  signin: async (
    data: components["schemas"]["UserSignIn"]
  ): Promise<
    | components["schemas"]["Token"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient("/auth/signin", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },
  signout: async (): Promise<{ [key: string]: string }> => {
    const response = await apiClient("/auth/logout", {
      method: "POST",
    });
    return response.json();
  },
  github: async (): Promise<components["schemas"]["OAuthResponse"]> => {
    const response = await apiClient("/auth/github", {
      method: "POST",
    });
    return response.json();
  },
  google: async (): Promise<components["schemas"]["OAuthResponse"]> => {
    const response = await apiClient("/auth/google", {
      method: "POST",
    });
    return response.json();
  },
};
