'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon, Settings2 } from "lucide-react";
import { ImageEditor } from "@/components/ImageEditor";
import { DEFAULT_COMPRESSION_SETTINGS } from '@/lib/constants';
import { ICompressionSettings, IImagePreview } from '@/types/types';
import { ImagePreviewList } from '@/components/ImagePreviewList';
import { ImageUploadForm } from '@/components/form/ImageUploadForm';
import { ImageUploadActions } from '@/components/ImageUploadActions';
import Joyride, { Step } from 'react-joyride';

export function ImageUpload() {
  // 状態管理: アップロードした画像、設定、編集中の画像インデックスなど
  const [images, setImages] = useState<IImagePreview[]>([]);
  const [compressionSettings, setCompressionSettings] = useState<ICompressionSettings>(DEFAULT_COMPRESSION_SETTINGS); // 圧縮設定の状態
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null); // 編集中の画像のインデックス
  const [run, setRun] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);

  const steps: Step[] = [
    {
      target: '.upload-header',
      content: 'ここでファイルを選択する',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.compression-settings',
      content: '画像の圧縮設定を調整できます。画質とファイルサイズのバランスを調整しましょう',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.upload-button',
      content: '選択した画像をアップロードするボタンです。複数の画像を一括でアップロードできます',
      placement: 'bottom',
      disableBeacon: true,
    }
  ];

  useEffect(() => {
    if (stepIndex >= steps.length) {
      setRun(false);
    }
  }, [stepIndex, steps.length]);

  const handleJoyrideCallback = (data: { type: string; index: number }) => {
    const { type, index } = data;
    if (type === 'step:after') {
      setStepIndex(index + 1);
    }
    if (type === 'step:before') {
      setStepIndex(index - 1);
    }
  };

  // 画像を削除する関数
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // 画像を編集する際の処理
  const handleEditImage = (index: number) => {
    setEditingImageIndex(index);
  };

  // 編集した画像を保存する関数
  const handleSaveEdit = (editedImageUrl: string) => {
    if (editingImageIndex === null) return;

    setImages(prev => prev.map((img, i) =>
      i === editingImageIndex
        ? { ...img, preview: editedImageUrl }
        : img
    ));
    setEditingImageIndex(null);
  };

  // 圧縮設定の警告表示の条件
  const shouldShowCompressionWarning = images.some(img => img.file.size > 1024 * 1024 * 2); // 2MB

  return (
    <>
      <Joyride
        steps={steps}
        continuous
        showSkipButton
        showProgress
        run={run}
        stepIndex={stepIndex}
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#2563eb',
            zIndex: 10000,
          }
        }}
        disableOverlayClose
        spotlightPadding={5}
        floaterProps={{
          disableAnimation: true,
        }}
      />
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            画像アップロード
          </CardTitle>
          <CardDescription>複数の画像を選択してアップロードできます</CardDescription>
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
              2MB以上の画像が含まれています。圧縮設定の有効化を推奨します。
            </div>
          )}

          {/* アップロードされた画像の表示 */}
          {images.length > 0 && (
            <ImagePreviewList
              images={images}
              onRemove={removeImage}
              onEdit={handleEditImage}
            />
          )}

          <ImageUploadActions
            images={images}
            setImages={setImages}
          />
        </CardContent>
      </Card>

      {/* 画像編集中のプレビュー */}
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