import type { components } from "@/types/api";
import { apiClient } from "../api-client";

export const authApi = {
  getMe: async (): Promise<components["schemas"]["UserResponse"]> => {
    const response = await apiClient<components["schemas"]["UserResponse"]>(
      "/auth/me",
      {
        method: "GET",
      }
    );
    return response;
  },
  signup: async (
    data: components["schemas"]["UserSignUp"]
  ): Promise<
    | components["schemas"]["Token"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient<
      | components["schemas"]["Token"]
      | components["schemas"]["HTTPValidationError"]
    >("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response;
  },
  signin: async (
    data: components["schemas"]["UserSignIn"]
  ): Promise<
    | components["schemas"]["Token"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient<
      | components["schemas"]["Token"]
      | components["schemas"]["HTTPValidationError"]
    >("/auth/signin", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response;
  },
  signout: async (): Promise<{ [key: string]: string }> => {
    const response = await apiClient<{ [key: string]: string }>(
      "/auth/logout",
      {
        method: "POST",
      }
    );
    return response;
  },
  github: async (): Promise<components["schemas"]["OAuthResponse"]> => {
    const response = await apiClient<components["schemas"]["OAuthResponse"]>(
      "/auth/github",
      {
        method: "POST",
      }
    );
    return response;
  },
  google: async (): Promise<components["schemas"]["OAuthResponse"]> => {
    const response = await apiClient<components["schemas"]["OAuthResponse"]>(
      "/auth/google",
      {
        method: "POST",
      }
    );
    return response;
  },
};
