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
import { formatFileSize } from "@/lib/utils";
import { IImagePreview, IImagePreviewListProps } from "@/types/types";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { Eye, Settings2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

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

  const ffmpeg = useRef<FFmpeg | null>(null);
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);

  useEffect(() => {
    const initFFmpeg = async () => {
      try {
        const ffmpegInstance = new FFmpeg();
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
        await ffmpegInstance.load({
          coreURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.js`,
            "text/javascript"
          ),
          wasmURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.wasm`,
            "application/wasm"
          ),
        });
        ffmpeg.current = ffmpegInstance;
        setIsFFmpegLoaded(true);
      } catch (error) {
        console.error("FFmpegの初期化中にエラーが発生しました:", error);
      }
    };

    initFFmpeg();

    return () => {
      if (ffmpeg.current) {
        ffmpeg.current.terminate();
        ffmpeg.current = null;
        setIsFFmpegLoaded(false);
      }
    };
  }, []);

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
    let inputFileName = "";
    let outputFileName = "";
    let compressedUrl = "";

    try {
      if (!compressionSettings.enabled || !isFFmpegLoaded || !ffmpeg.current) {
        return;
      }

      // 画像のコピーを作成
      const response = await fetch(image.preview);
      const blob = await response.blob();
      const imageFile = new File([blob], image.file.name, {
        type: image.file.type,
      });

      // 入力ファイルをFFmpegに書き込む
      const arrayBuffer = await imageFile.arrayBuffer();
      inputFileName = `input_${Date.now()}_${image.file.name}`;
      outputFileName = `output_${Date.now()}_${image.file.name}`;

      try {
        // 入力ファイルの書き込み
        await ffmpeg.current.writeFile(
          inputFileName,
          new Uint8Array(arrayBuffer)
        );

        // 圧縮コマンドの実行
        const quality = compressionSettings.quality;
        const format = compressionSettings.format.toLowerCase();

        // フォーマットに応じたFFmpegコマンドの構築
        let command: string[];
        switch (format) {
          case "jpeg":
          case "jpg":
            command = [
              "-i",
              inputFileName,
              "-c:v",
              "mjpeg",
              "-q:v",
              quality.toString(),
              "-preset",
              "medium",
              "-y",
              outputFileName,
            ];
            break;
          case "png":
            const pngQuality = Math.max(
              0,
              Math.min(9, Math.floor((100 - quality) / 11))
            );
            command = [
              "-i",
              inputFileName,
              "-c:v",
              "png",
              "-compression_level",
              pngQuality.toString(),
              "-y",
              outputFileName,
            ];
            break;
          case "webp":
            command = [
              "-i",
              inputFileName,
              "-c:v",
              "libwebp",
              "-quality",
              quality.toString(),
              "-preset",
              "medium",
              "-y",
              outputFileName,
            ];
            break;
          default:
            throw new Error(`未対応のフォーマットです: ${format}`);
        }

        // コマンド実行
        const result = await ffmpeg.current.exec(command);

        if (result !== 0) {
          throw new Error(
            `FFmpegコマンドの実行に失敗しました（終了コード: ${result}）`
          );
        }

        // 圧縮されたファイルを読み込む
        let compressedData;
        try {
          // ファイルの読み込み
          compressedData = await ffmpeg.current.readFile(outputFileName);
        } catch (readError) {
          console.error("出力ファイルの読み込みに失敗:", readError);
          throw new Error(
            `出力ファイルの読み込みに失敗しました: ${readError instanceof Error ? readError.message : "不明なエラー"}`
          );
        }

        const compressedBlob = new Blob([compressedData], {
          type: `image/${format}`,
        });
        compressedUrl = URL.createObjectURL(compressedBlob);
        const compressedFile = new File([compressedBlob], outputFileName, {
          type: `image/${format}`,
        });

        // 圧縮後のサイズを計算
        const compressedSize = compressedFile.size;

        setPreviewImage({
          url: compressedUrl,
          settings: compressionSettings,
          originalSize: image.file.size,
          compressedSize: compressedSize,
        });
      } finally {
        // 一時ファイルの削除
        if (ffmpeg.current) {
          try {
            if (inputFileName) {
              await ffmpeg.current.deleteFile(inputFileName);
            }
            if (outputFileName) {
              await ffmpeg.current.deleteFile(outputFileName);
            }
          } catch (cleanupError) {
            console.warn(
              "一時ファイルの削除中にエラーが発生しました:",
              cleanupError
            );
          }
        }
      }

      return () => {
        if (compressedUrl) {
          URL.revokeObjectURL(compressedUrl);
        }
      };
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
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
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
                          <span className="text-sm text-muted-foreground min-w-[3ch]">
                            {image.compressionSettings?.quality ??
                              DEFAULT_COMPRESSION_SETTINGS.quality}
                            %
                          </span>
                        </div>
                      </div>

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
                                  {formatFileSize(previewImage.originalSize)}
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
                                <div className="text-sm text-muted-foreground mt-2 space-y-1">
                                  <p>
                                    {t("fileSize")}:{" "}
                                    {formatFileSize(
                                      previewImage.compressedSize
                                    )}
                                  </p>
                                  <p>
                                    {t("compressionSettings")}:{" "}
                                    {previewImage.settings.format},{" "}
                                    {t("quality")}:{" "}
                                    {previewImage.settings.quality}%
                                  </p>
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
