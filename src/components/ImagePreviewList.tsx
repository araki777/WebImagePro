"use client";

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
import {
  DEFAULT_COMPRESSION_SETTINGS,
  ICompressionSettings,
} from "@/lib/constants";
import { compressImageWithFFmpeg } from "@/lib/ffmpegCompress";
import { IImagePreview, IImagePreviewListProps } from "@/types/types";
import { Eye, Settings2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function ImagePreviewList({
  images,
  onRemove,
  onCompressionSettingsChange,
}: IImagePreviewListProps) {
  const t = useTranslations("ImagePreviewList");
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    settings: ICompressionSettings;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

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
      if (!compressionSettings.enabled) {
        return;
      }
      // プレビュー用に圧縮ファイルを生成
      const compressedFile = await compressImageWithFFmpeg(
        image.file,
        compressionSettings
      );
      const compressedUrl = URL.createObjectURL(compressedFile);
      setPreviewImage({
        url: compressedUrl,
        settings: compressionSettings,
        originalSize: image.file.size,
        compressedSize: compressedFile.size,
      });
    } catch (error: unknown) {
      console.error("プレビューの生成中にエラーが発生しました:", error);
      const errorMessage =
        error instanceof Error ? error.message : "不明なエラー";
      throw new Error(`プレビューの生成に失敗しました: ${errorMessage}`);
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`shared-${index}`}>{t("shared")}</Label>
                    <Switch
                      id={`shared-${index}`}
                      checked={image.compressionSettings.isShared}
                      onCheckedChange={(checked) =>
                        handleCompressionSettingsChange(index, {
                          isShared: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`compression-enabled-${index}`}>
                      {t("imageSettingsEnabled")}
                    </Label>
                    <Switch
                      id={`compression-enabled-${index}`}
                      checked={image.compressionSettings.enabled}
                      onCheckedChange={(checked) =>
                        handleCompressionSettingsChange(index, {
                          enabled: checked,
                        })
                      }
                    />
                  </div>
                  {image.compressionSettings.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>{t("format")}</Label>
                        <Select
                          value={image.compressionSettings.format}
                          onValueChange={(value) => {
                            const format = value as "JPEG" | "PNG" | "WebP";
                            const settings: Partial<ICompressionSettings> = {
                              format,
                            };
                            if (format === "JPEG") {
                              settings.quality = 8;
                            } else if (format === "PNG") {
                              settings.compression_level = 6;
                            } else if (format === "WebP") {
                              settings.lossless = false;
                              settings.webp_quality = 80;
                            }
                            handleCompressionSettingsChange(index, settings);
                          }}
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

                      {image.compressionSettings.format === "JPEG" && (
                        <>
                          <Label>画質</Label>
                          <div className="flex items-center gap-2">
                            <Slider
                              value={[image.compressionSettings.quality ?? 8]}
                              min={4}
                              max={31}
                              step={1}
                              onValueChange={([value]) =>
                                handleCompressionSettingsChange(index, {
                                  quality: value,
                                })
                              }
                            />
                            <span className="ml-1 text-sm text-muted-foreground">
                              {image.compressionSettings.quality ?? 8}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                            <span>高品質</span>
                            <span>高圧縮</span>
                          </div>
                          <div className="flex gap-1 mt-1">
                            <div className="flex-1">
                              <Label>幅</Label>
                              <div className="flex items-center gap-1">
                                <Slider
                                  value={[
                                    image.compressionSettings.width ?? 1000,
                                  ]}
                                  min={100}
                                  max={5000}
                                  step={10}
                                  onValueChange={([value]) =>
                                    handleCompressionSettingsChange(index, {
                                      width: value,
                                    })
                                  }
                                />
                                <span className="ml-1 text-sm text-muted-foreground">
                                  {image.compressionSettings.width ?? 1000}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <Label>高さ</Label>
                              <div className="flex items-center gap-1">
                                <Slider
                                  value={[
                                    image.compressionSettings.height ?? 1000,
                                  ]}
                                  min={100}
                                  max={5000}
                                  step={10}
                                  onValueChange={([value]) =>
                                    handleCompressionSettingsChange(index, {
                                      height: value,
                                    })
                                  }
                                />
                                <span className="ml-1 text-sm text-muted-foreground">
                                  {image.compressionSettings.height ?? 1000}
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      {image.compressionSettings.format === "PNG" && (
                        <>
                          <Label>圧縮レベル</Label>
                          <div className="flex items-center gap-2">
                            <Slider
                              value={[
                                image.compressionSettings.compression_level ??
                                  6,
                              ]}
                              min={0}
                              max={9}
                              step={1}
                              onValueChange={([value]) =>
                                handleCompressionSettingsChange(index, {
                                  compression_level: value,
                                })
                              }
                            />
                            <span className="ml-1 text-sm text-muted-foreground">
                              {image.compressionSettings.compression_level ?? 6}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                            <span>低圧縮</span>
                            <span>高圧縮</span>
                          </div>
                        </>
                      )}
                      {image.compressionSettings.format === "WebP" && (
                        <>
                          <Label>ロスレス</Label>
                          <Switch
                            checked={
                              image.compressionSettings.lossless ?? false
                            }
                            onCheckedChange={(checked) =>
                              handleCompressionSettingsChange(index, {
                                lossless: checked,
                              })
                            }
                          />
                          {!(image.compressionSettings.lossless ?? false) && (
                            <>
                              <Label>品質</Label>
                              <div className="flex items-center gap-2">
                                <Slider
                                  value={[
                                    image.compressionSettings.webp_quality ??
                                      80,
                                  ]}
                                  min={0}
                                  max={100}
                                  step={1}
                                  onValueChange={([value]) =>
                                    handleCompressionSettingsChange(index, {
                                      webp_quality: value,
                                    })
                                  }
                                />
                                <span className="ml-1 text-sm text-muted-foreground">
                                  {image.compressionSettings.webp_quality ?? 80}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                                <span>高品質</span>
                                <span>高圧縮</span>
                              </div>
                            </>
                          )}
                        </>
                      )}

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() =>
                              handlePreviewCompression(
                                image,
                                image.compressionSettings ||
                                  DEFAULT_COMPRESSION_SETTINGS
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
                            <div className="grid grid-cols-2 gap-2">
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
                                  {formatFileSize(previewImage.originalSize)}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  フォーマット: {previewImage.settings.format}
                                </p>
                                {previewImage.settings.format === "JPEG" && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    幅: {image.compressionSettings.width ?? "-"}{" "}
                                    px / 高さ:{" "}
                                    {image.compressionSettings.height ?? "-"} px
                                  </p>
                                )}
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
                                <div className="text-sm text-muted-foreground mt-2 space-y-1">
                                  <p>
                                    {t("fileSize")}:{" "}
                                    {formatFileSize(
                                      previewImage.compressedSize
                                    )}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    フォーマット: {previewImage.settings.format}
                                  </p>
                                  {previewImage.settings.format === "JPEG" && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      幅: {previewImage.settings.width ?? "-"}{" "}
                                      px / 高さ:{" "}
                                      {previewImage.settings.height ?? "-"} px
                                    </p>
                                  )}
                                </div>
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
