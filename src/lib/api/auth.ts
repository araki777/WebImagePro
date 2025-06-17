import { components } from "@/types/api";
import { apiClient } from "../api-client";

export const authApi = {
  getMe: async () => {
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
  signin: async (data: { email: string; password: string }) => {
    const response = await apiClient<components["schemas"]["Token"]>(
      "/auth/signin",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      }
    );
    return response;
  },
  signout: async () => {
    const response = await apiClient<{ message: string }>("/auth/signout", {
      method: "POST",
    });
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
  resetPassword: async (
    password: string
  ): Promise<components["schemas"]["HTTPValidationError"]> => {
    const response = await apiClient<
      components["schemas"]["HTTPValidationError"]
    >("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    return response;
  },
  sendEmail: async (
    email: string
  ): Promise<components["schemas"]["HTTPValidationError"]> => {
    const response = await apiClient<
      components["schemas"]["HTTPValidationError"]
    >("/auth/send-email", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return response;
  },
  get_oauth_url: async (provider: string) => {
    const response = await apiClient<components["schemas"]["OAuthResponse"]>(
      `/auth/${provider}`,
      {
        method: "GET",
      }
    );
    return response;
  },
};
