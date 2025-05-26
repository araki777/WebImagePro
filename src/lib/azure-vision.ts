export async function getImageTagsFromVision(
  url: string
): Promise<string[] | null> {
  const REQUEST_LIMIT_STATUS = 429;
  const visionUrl = `${process.env.NEXT_PUBLIC_AZURE_COMPUTE_VISION_URL}/vision/v3.2/tag`;
  const key = process.env.AZURE_COMPUTE_VISION_KEY || "";

  const response = await fetch(visionUrl, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  if (response.status === REQUEST_LIMIT_STATUS) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Computer Vision API error");
  }

  const data = await response.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.tags.map((tag: any) => tag.name);
}
