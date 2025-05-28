import { translateTags } from "@/lib/azure-translation";
import { LANGUAGES } from "@/lib/constants";
import { ITagsByLang } from "@/types/types";

export async function getImageTagsFromVision(
  url: string
): Promise<ITagsByLang | null> {
  const REQUEST_LIMIT_STATUS = 429;
  const visionUrl = `${process.env.NEXT_PUBLIC_AZURE_COMPUTE_VISION_URL}/vision/v3.2/tag`;
  const key = process.env.AZURE_COMPUTE_VISION_KEY || "";

  const tagsByLang: ITagsByLang = {};

  const responseEn = await fetch(visionUrl, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  if (responseEn.status === REQUEST_LIMIT_STATUS) {
    return null;
  }
  if (!responseEn.ok) {
    throw new Error("Computer Vision API error");
  }

  const dataEn = await responseEn.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enTags = dataEn.tags.map((tag: any) => tag.name);
  tagsByLang["en"] = enTags;

  const targetLangs = LANGUAGES.filter((lang) => lang !== "en");
  const translations = await translateTags(enTags, targetLangs);

  for (const lang of targetLangs) {
    tagsByLang[lang] = translations[lang];
  }

  return tagsByLang;
}
