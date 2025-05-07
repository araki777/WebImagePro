"use client";

import { ImageUploadForm } from "@/components/form/ImageUploadForm";
import { ImagePreviewList } from "@/components/ImagePreviewList";
import { ImageUploadActions } from "@/components/ImageUploadActions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEFAULT_COMPRESSION_SETTINGS } from "@/lib/constants";
import { ICompressionSettings, IImagePreview } from "@/types/types";
import { Image as ImageIcon, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function ImageUpload() {
  const t = useTranslations("ImageUpload");
  // 状態管理: アップロードした画像、設定、編集中の画像インデックスなど
  const [images, setImages] = useState<IImagePreview[]>([]);
  const [compressionSettings, setCompressionSettings] =
    useState<ICompressionSettings>(DEFAULT_COMPRESSION_SETTINGS); // 圧縮設定の状態

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

  // 画像を削除する関数
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // 圧縮設定の警告表示の条件
  const shouldShowCompressionWarning = images.some(
    (img) => img.file.size > 1024 * 1024 * 2
  ); // 2MB

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
          {/* 画像ファイル選択用のインプット */}
          <ImageUploadForm
            setImages={setImages}
            compressionSettings={compressionSettings}
            setCompressionSettings={setCompressionSettings}
          />

          {/* 圧縮設定の警告表示 */}
          {shouldShowCompressionWarning && !compressionSettings.enabled && (
            <div className="text-sm text-yellow-600 dark:text-yellow-500 flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              {t("compressionWarning")}
            </div>
          )}

          {/* アップロードされた画像の表示 */}
          {images.length > 0 && (
            <ImagePreviewList
              images={images}
              onRemove={removeImage}
              onCompressionSettingsChange={handleCompressionSettingsChange}
              compressionSettings={compressionSettings}
            />
          )}

          <ImageUploadActions
            images={images}
            setImages={setImages}
            compressionSettings={compressionSettings}
          />
        </CardContent>
      </Card>
    </>
  );
}
