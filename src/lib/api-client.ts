const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const UNAUTHORIZED_STATUS = 401;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headres: HeadersInit = {};

  if (!(options.body instanceof FormData)) {
    headres["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headres,
      ...options.headers,
    },
    credentials: "include",
  });

  // 401エラーの場合
  if (response.status === UNAUTHORIZED_STATUS) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError(UNAUTHORIZED_STATUS, "Unauthorized");
  }

  // エラーレスポンスの場合
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorBody.detail || "API Error");
  }

  // 成功レスポンスの場合
  return response.json();
}
