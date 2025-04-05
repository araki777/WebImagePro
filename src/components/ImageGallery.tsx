'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageEditor } from "@/components/ImageEditor";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from 'sonner';
import { IApiImage } from '@/types/types';
import { ImageList } from '@/components/ImageList';
import { SearchBar } from '@/components/ui/searchBar';
import { Step } from 'react-joyride';
import TourGuid from '@/components/common/TourGuid';

export function ImageGallery() {
  const [images, setImages] = useState<IApiImage[]>([]); // 画像データの状態
  const [loading, setLoading] = useState(true); // ローディング状態
  const [searchQuery, setSearchQuery] = useState(''); // 検索クエリ
  const [editingImage, setEditingImage] = useState<IApiImage | null>(null); // 編集中の画像

  // ツアーガイドのステップを定義
  const getTourSteps = (): Step[] => {
    const baseSteps: Step[] = [
      {
        target: '.search-bar',
        content: '画像名を入力して検索できます。日本語や英語の画像名で検索可能です。',
        placement: 'bottom',
        disableBeacon: true,
        spotlightClicks: true,
      }
    ];

    // 画像がある場合のみ追加のステップを表示
    if (images.length > 0) {
      return [
        ...baseSteps,
        {
          target: '.image-list > div:first-child',
          content: 'アップロードした画像がここに表示されます。画像のサムネイルとファイル名が表示されます。',
          placement: 'right',
          disableBeacon: true,
          spotlightClicks: true,
        },
        {
          target: '.image-list > div:first-child .aspect-video',
          content: '画像のプレビューです。クリックして画像を拡大表示することもできます。',
          placement: 'top',
          disableBeacon: true,
          spotlightClicks: true,
        },
        {
          target: '.image-list > div:first-child button:nth-child(1)',
          content: '編集ボタンをクリックすると画像編集モードが開きます。サイズ変更、切り抜き、色調整など様々な編集が可能です。',
          placement: 'bottom',
          disableBeacon: true,
          spotlightClicks: true,
        },
        {
          target: '.image-list > div:first-child button:nth-child(2)',
          content: 'ダウンロードボタンをクリックすると画像をダウンロードできます。元のファイル名で保存されます。',
          placement: 'bottom',
          disableBeacon: true,
          spotlightClicks: true,
        },
        {
          target: '.image-list > div:first-child button:nth-child(3)',
          content: '削除ボタンをクリックすると画像を削除できます。削除した画像は元に戻せないので注意してください。',
          placement: 'left',
          disableBeacon: true,
          spotlightClicks: true,
        }
      ];
    }
    
    return baseSteps;
  };

  // コンポーネントがマウントされた時に画像データを取得
  useEffect(() => {
    fetchImages();
  }, []);

  // 画像データを取得する関数
  const fetchImages = async () => {
    try {
      const response = await fetch('/api/images'); // 画像データを取得するAPIエンドポイント
      if (!response.ok) throw new Error('画像の取得に失敗しました');

      const data = await response.json(); // レスポンスをJSON形式に変換
      setImages(data.map((img: IApiImage) => ({
        ...img,
        uploadedAt: new Date(img.uploadedAt) // 日付をDateオブジェクトに変換
      })));
    } catch (error: unknown) {
      console.error('画像一覧の取得エラー:', error);
      toast.error('画像一覧の取得に失敗しました', {
        description: 'もう一度お試しください'
      });
    } finally {
      setLoading(false); // ローディング状態を更新
    }
  };

  const filteredImages = images.filter(image =>
    image.name.toLowerCase().includes(searchQuery.toLowerCase()) // 検索クエリに一致する画像をフィルタリング
  );

  // 編集中の画像を設定する関数
  const handleEditImage = (image: IApiImage) => {
    setEditingImage(image); // 編集中の画像を設定
  };

  // 編集中の画像を保存する関数
  const handleSaveEdit = async (editedImageBase64: string, isNewImage: boolean, format: string) => {
    if (!editingImage) return;

    try {
      // Base64からBlobを作成
      const binaryString = atob(editedImageBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: `image/${format}` });

      // 新規保存の場合、ファイル名を変更
      const fileName = isNewImage
        ? `copy_${editingImage.name.replace(/\.[^/.]+$/, '')}.${format}`
        : editingImage.name.replace(/\.[^/.]+$/, '') + '.' + format;

      const file = new File([blob], fileName, { type: `image/${format}` });
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) throw new Error('アップロードに失敗しました');

      // 元の画像を更新する場合のみ古い画像を削除
      if (!isNewImage) {
        const encodedUrl = Buffer.from(editingImage.url).toString('base64');
        await fetch(`/api/images/${encodedUrl}`, { method: 'DELETE' });
      }

      // 画像一覧を更新
      await fetchImages();
      toast.success(isNewImage ? '新規画像として保存しました' : '画像を更新しました');
    } catch (error: unknown) {
      console.error('画像の更新エラー:', error);
      toast.error(isNewImage ? '新規画像の保存に失敗しました' : '画像の更新に失敗しました');
    } finally {
      setEditingImage(null); // 編集中の画像をリセット
    }
  };

  // 画像をダウンロードする関数
  const handleDownload = async (image: IApiImage) => {
    try {
      const response = await fetch(image.url); // 画像のURLを取得
      const blob = await response.blob(); // レスポンスをBlobオブジェクトに変換
      const url = window.URL.createObjectURL(blob); // BlobをURLに変換
      const a = document.createElement('a'); // ダウンロード用のリンクを作成
      a.href = url;
      a.download = image.name; // ダウンロードするファイル名を設定
      document.body.appendChild(a);
      a.click(); // リンクをクリックしてダウンロードを開始
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: unknown) {
      console.error('ダウンロードエラー:', error);
      toast.error('ダウンロードに失敗しました');
    }
  };

  // 画像を削除する関数
  const handleDelete = async (image: IApiImage) => {
    try {
      const encodedUrl = encodeURIComponent(Buffer.from(image.url).toString("base64"));

      const response = await fetch(`/api/images/${encodedUrl}`, {
        method: "DELETE", // 画像を削除するためのDELETEリクエストを送信
      });

      if (!response.ok) throw new Error("削除に失敗しました");

      await fetchImages(); // 画像一覧を更新
      toast.success("画像を削除しました");
    } catch (error) {
      console.error("画像の削除エラー:", error);
      toast.error("画像の削除に失敗しました");
    }
  };

  // ローディング中の表示
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <TourGuid steps={getTourSteps()} />
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            画像ギャラリー
          </CardTitle>
          <CardDescription>アップロードした画像の一覧</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 検索フォーム */}
          <SearchBar query={searchQuery} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)} />
          <ImageList
            images={filteredImages}
            onEditImage={handleEditImage}
            onDownload={handleDownload}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* 画像編集モーダル */}
      {editingImage && (
        <ImageEditor
          imageUrl={editingImage.url}
          onSave={handleSaveEdit}
          onClose={() => setEditingImage(null)}
        />
      )}
    </>
  );
}