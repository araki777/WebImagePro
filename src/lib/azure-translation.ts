export async function translateTags(
  tags: string[],
  to: string[],
  from: string = "en"
): Promise<{ [lang: string]: string[] }> {
  const endpoint = process.env.NEXT_PUBLIC_AZURE_TRANSLATION_URL!;
  const key = process.env.AZURE_TRANSLATION_KEY!;
  const region = process.env.AZURE_TRANSLATION_REGION!;
  const url =
    `${endpoint}/translate?api-version=3.0&from=${from}` +
    to.map((lang) => `&to=${lang}`).join("");

  const body = tags.map((tag) => ({ text: tag }));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Ocp-Apim-Subscription-Region": region,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Azure Translation API error:", errorText);
    throw new Error("Failed to translate tags");
  }

  const data = await response.json();
  const result: { [lang: string]: string[] } = {};
  for (const lang of to) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result[lang] = data.map((item: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const found = item.translations.find((t: any) => t.to === lang);
      return found ? found.text : "";
    });
  }
  return result;
}
