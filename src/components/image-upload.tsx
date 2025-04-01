'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Image as ImageIcon, X, FileType, HardDrive, Calendar, Settings2, Pencil } from "lucide-react";
import Image from "next/image";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ImageEditor } from "@/components/image-editor";
import { toast } from 'sonner';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ImagePreview {
  file: File;
  preview: string;
}

interface CompressionSettings {
  enabled: boolean;
  quality: number;
  maxWidth: number;
  maxHeight: number;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

const DEFAULT_COMPRESSION_SETTINGS: CompressionSettings = {
  enabled: false,
  quality: 80,
  maxWidth: 1920,
  maxHeight: 1080,
};

export function ImageUpload() {
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [compressionSettings, setCompressionSettings] = useState<CompressionSettings>(DEFAULT_COMPRESSION_SETTINGS);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));

      if (newFiles.length !== e.target.files.length) {
        toast.error('画像ファイルのみアップロード可能です');
      }

      const promises = newFiles.map(file => {
        return new Promise<ImagePreview>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              file,
              preview: reader.result as string
            });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises).then(newPreviews => {
        setImages(prev => [...prev, ...newPreviews]);
      });
    }
    // Reset input value to allow selecting the same files again
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (images.length === 0) return;

    const uploadPromises = images.map(async (image) => {
      const formData = new FormData();
      formData.append('file', image.file);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('アップロードに失敗しました');
        }

        const data = await response.json();
        return data.url;
      } catch (error) {
        throw error;
      }
    });

    toast.promise(Promise.all(uploadPromises), {
      loading: '画像をアップロード中...',
      success: () => {
        setImages([]);
        return `${images.length}枚の画像をアップロードしました`;
      },
      error: 'アップロードに失敗しました'
    });
  };

  const handleEditImage = (index: number) => {
    setEditingImageIndex(index);
  };

  const handleSaveEdit = (editedImageUrl: string) => {
    if (editingImageIndex === null) return;

    setImages(prev => prev.map((img, i) =>
      i === editingImageIndex
        ? { ...img, preview: editedImageUrl }
        : img
    ));
    setEditingImageIndex(null);
  };

  const shouldShowCompressionWarning = images.some(img => img.file.size > 1024 * 1024 * 2); // 2MB

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            画像アップロード
          </CardTitle>
          <CardDescription>複数の画像を選択してアップロードできます</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid w-full items-center gap-4">
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="cursor-pointer"
            />

            <Collapsible
              open={isSettingsOpen}
              onOpenChange={setIsSettingsOpen}
              className="border rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Settings2 className="h-4 w-4" />
                  <h4 className="text-sm font-semibold">圧縮設定</h4>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {isSettingsOpen ? '閉じる' : '開く'}
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent className="space-y-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="compression-toggle"
                    checked={compressionSettings.enabled}
                    onCheckedChange={(checked) =>
                      setCompressionSettings(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                  <Label htmlFor="compression-toggle">画像圧縮を有効にする</Label>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>画質 ({compressionSettings.quality}%)</Label>
                    <Slider
                      disabled={!compressionSettings.enabled}
                      value={[compressionSettings.quality]}
                      onValueChange={([value]) =>
                        setCompressionSettings(prev => ({ ...prev, quality: value }))
                      }
                      min={1}
                      max={100}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>最大幅 ({compressionSettings.maxWidth}px)</Label>
                    <Slider
                      disabled={!compressionSettings.enabled}
                      value={[compressionSettings.maxWidth]}
                      onValueChange={([value]) =>
                        setCompressionSettings(prev => ({ ...prev, maxWidth: value }))
                      }
                      min={100}
                      max={3840}
                      step={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>最大高さ ({compressionSettings.maxHeight}px)</Label>
                    <Slider
                      disabled={!compressionSettings.enabled}
                      value={[compressionSettings.maxHeight]}
                      onValueChange={([value]) =>
                        setCompressionSettings(prev => ({ ...prev, maxHeight: value }))
                      }
                      min={100}
                      max={2160}
                      step={100}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {shouldShowCompressionWarning && !compressionSettings.enabled && (
              <div className="text-sm text-yellow-600 dark:text-yellow-500 flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                2MB以上の画像が含まれています。圧縮設定の有効化を推奨します。
              </div>
            )}
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.map((image, index) => (
                <Card key={index} className="relative group overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border flex-shrink-0">
                        <Image
                          src={image.preview}
                          alt={`プレビュー ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate mb-2">
                          {image.file.name}
                        </div>
                        <dl className="space-y-1 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <FileType className="h-4 w-4" />
                            <dt className="sr-only">ファイルタイプ</dt>
                            <dd>{image.file.type}</dd>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <HardDrive className="h-4 w-4" />
                            <dt className="sr-only">ファイルサイズ</dt>
                            <dd>{formatFileSize(image.file.size)}</dd>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <dt className="sr-only">最終更新日</dt>
                            <dd>{formatDate(new Date(image.file.lastModified))}</dd>
                          </div>
                        </dl>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => handleEditImage(index)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          編集
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="画像を削除"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Card>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button
              onClick={handleUpload}
              disabled={images.length === 0}
              className="flex-1"
            >
              <Upload className="mr-2 h-4 w-4" />
              {images.length > 0 ? `${images.length}枚の画像をアップロード` : 'アップロード'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {editingImageIndex !== null && images[editingImageIndex] && (
        <ImageEditor
          imageUrl={images[editingImageIndex].preview}
          onSave={handleSaveEdit}
          onClose={() => setEditingImageIndex(null)}
        />
      )}
    </>
  );
}