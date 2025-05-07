import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useImageCompression } from "@/hooks/useImageCompression";
import {
  DEFAULT_COMPRESSION_SETTINGS,
  ICompressionSettings,
} from "@/lib/constants";
import { formatFileSize } from "@/lib/utils";
import { IImagePreview, IImagePreviewListProps } from "@/types/types";
import { Eye, Settings2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function ImagePreviewList({
  images,
  onRemove,
  onCompressionSettingsChange,
  compressionSettings,
}: IImagePreviewListProps) {
  const t = useTranslations("ImagePreviewList");
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    settings: ICompressionSettings;
    originalSize: number;
    compressedSize: number;
  } | null>(null);
  const { imageCompression } = useImageCompression();

  const handleCompressionSettingsChange = (
    index: number,
    settings: Partial<ICompressionSettings>
  ) => {
    const currentSettings =
      images[index].compressionSettings || DEFAULT_COMPRESSION_SETTINGS;
    onCompressionSettingsChange(index, { ...currentSettings, ...settings });
  };

  const handlePreviewCompression = async (
    image: IImagePreview,
    compressionSettings: ICompressionSettings
  ) => {
    try {
      if (compressionSettings) return;

      // 画像のコピーを作成
      const response = await fetch(image.preview);
      const blob = await response.blob();
      const imageFile = new File([blob], image.file.name, {
        type: image.file.type,
      });

      console.log(imageFile);

      // 圧縮を適用
      const compressedFile = await imageCompression(
        imageFile,
        compressionSettings
      );
      console.log(compressedFile);
      const compressedUrl = URL.createObjectURL(compressedFile);

      setPreviewImage({
        url: compressedUrl,
        settings: compressionSettings,
        originalSize: image.file.size,
        compressedSize: compressedFile.size,
      });

      // クリーンアップ関数を設定
      return () => {
        if (compressedUrl) {
          URL.revokeObjectURL(compressedUrl);
        }
      };
    } catch (error) {
      console.error("プレビューの生成中にエラーが発生しました:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map((image, index) => (
        <div
          key={`image-${image.id}`}
          className="relative group rounded-lg overflow-hidden border"
        >
          <img
            src={image.preview}
            alt={`Preview ${index + 1}`}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`compression-enabled-${index}`}>
                      {t("compressionEnabled")}
                    </Label>
                    <Switch
                      id={`compression-enabled-${index}`}
                      checked={
                        image.compressionSettings?.enabled ??
                        DEFAULT_COMPRESSION_SETTINGS.enabled
                      }
                      onCheckedChange={(checked) =>
                        handleCompressionSettingsChange(index, {
                          enabled: checked,
                        })
                      }
                    />
                  </div>

                  {(image.compressionSettings?.enabled ??
                    DEFAULT_COMPRESSION_SETTINGS.enabled) && (
                    <>
                      <div className="space-y-2">
                        <Label>{t("format")}</Label>
                        <Select
                          value={
                            image.compressionSettings?.format ??
                            DEFAULT_COMPRESSION_SETTINGS.format
                          }
                          onValueChange={(value) =>
                            handleCompressionSettingsChange(index, {
                              format: value as "JPEG" | "PNG" | "WebP",
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem key="JPEG" value="JPEG">
                              JPEG
                            </SelectItem>
                            <SelectItem key="PNG" value="PNG">
                              PNG
                            </SelectItem>
                            <SelectItem key="WebP" value="WebP">
                              WebP
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{t("quality")}</Label>
                        <Slider
                          value={[
                            image.compressionSettings?.quality ??
                              DEFAULT_COMPRESSION_SETTINGS.quality,
                          ]}
                          min={1}
                          max={100}
                          step={1}
                          onValueChange={([value]) =>
                            handleCompressionSettingsChange(index, {
                              quality: value,
                            })
                          }
                        />
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() =>
                              handlePreviewCompression(
                                image,
                                compressionSettings
                              )
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {t("previewCompression")}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>{t("compressionPreview")}</DialogTitle>
                            <DialogDescription>
                              {t("compressionPreviewDescription")}
                            </DialogDescription>
                          </DialogHeader>
                          {previewImage && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h3 className="text-sm font-medium mb-2">
                                  {t("original")}
                                </h3>
                                <img
                                  src={image.preview}
                                  alt="Original"
                                  className="w-full rounded-lg"
                                />
                                <p className="text-sm text-muted-foreground mt-2">
                                  {t("fileSize")}:{" "}
                                  {formatFileSize(image.file.size)}
                                </p>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium mb-2">
                                  {t("compressed")}
                                </h3>
                                <img
                                  src={previewImage.url}
                                  alt="Compressed"
                                  className="w-full rounded-lg"
                                />
                                <p className="text-sm text-muted-foreground mt-2">
                                  {t("compressionSettings")}:{" "}
                                  {previewImage.settings.format}, {t("quality")}
                                  : {previewImage.settings.quality}%
                                </p>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8 bg-background/80 backdrop-blur-sm"
              onClick={() => onRemove(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
