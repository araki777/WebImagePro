const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export const backend = {
  async healthCheck() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health-check`);
      return await response.json();
    } catch (error) {
      console.error("FastAPI接続エラー", error);
      throw error;
    }
  },
};
