"use client";

import { ImageUploadForm } from "@/components/form/ImageUploadForm";
import { ImagePreviewList } from "@/components/ImagePreviewList";
import { ImageUploadActions } from "@/components/ImageUploadActions";
import NoSSRWrapper from "@/components/NoSSRWrapper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/store/useAuthStore";
import { ICompressionSettings, IImagePreview } from "@/types/types";
import { Image as ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function ImageUpload() {
  const { user } = useAuthStore();
  const t = useTranslations("ImageUpload");
  const [images, setImages] = useState<IImagePreview[]>([]);

  const handleCompressionSettingsChange = (
    index: number,
    settings: ICompressionSettings
  ) => {
    setImages((prev) =>
      prev.map((img, i) =>
        i === index ? { ...img, compressionSettings: settings } : img
      )
    );
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ImageUploadForm setImages={setImages} />

          {images.length > 0 && (
            <NoSSRWrapper>
              <ImagePreviewList
                images={images}
                onRemove={removeImage}
                onCompressionSettingsChange={handleCompressionSettingsChange}
              />
            </NoSSRWrapper>
          )}

          <ImageUploadActions
            images={images}
            setImages={setImages}
            userId={user?.id}
          />
        </CardContent>
      </Card>
    </>
  );
}
