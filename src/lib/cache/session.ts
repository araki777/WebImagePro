export async function getSessionCache(sessionId: string) {
  const res = await fetch(`/api/cache/session?sessionId=${sessionId}`);
  return await res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function setSessionCache(sessionId: string, cacheData: any) {
  await fetch("/api/cache/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, ...cacheData }),
  });
}

export async function deleteSessionCache(sessionId: string) {
  await fetch(`/api/cache/session?sessionId=${sessionId}`, {
    method: "DELETE",
  });
}
