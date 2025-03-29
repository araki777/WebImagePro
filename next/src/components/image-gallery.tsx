'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageEditor } from "@/components/image-editor";
import { Search, Pencil, Download, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from 'sonner';

interface ApiImage {
  url: string;
  name: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function ImageGallery() {
  const [images, setImages] = useState<ApiImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingImage, setEditingImage] = useState<ApiImage | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/images');
      if (!response.ok) throw new Error('画像の取得に失敗しました');
      
      const data = await response.json();
      setImages(data.map((img: ApiImage) => ({
        ...img,
        uploadedAt: new Date(img.uploadedAt)
      })));
    } catch (error: unknown) {
      console.error('画像一覧の取得エラー:', error);
      toast.error('画像一覧の取得に失敗しました', {
        description: 'もう一度お試しください'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = images.filter(image =>
    image.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditImage = (image: ApiImage) => {
    setEditingImage(image);
  };

  const handleSaveEdit = async (editedImageBase64: string) => {
    if (!editingImage) return;

    try {
      // Base64からBlobを作成
      const binaryString = atob(editedImageBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/png' });
      const file = new File([blob], editingImage.name, { type: 'image/png' });

      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) throw new Error('アップロードに失敗しました');

      // 古い画像を削除
      const encodedUrl = Buffer.from(editingImage.url).toString('base64');
      await fetch(`/api/images/${encodedUrl}`, { method: 'DELETE' });

      // 画像一覧を更新
      await fetchImages();
      toast.success('画像を更新しました');
    } catch (error: unknown) {
      console.error('画像の更新エラー:', error);
      toast.error('画像の更新に失敗しました');
    } finally {
      setEditingImage(null);
    }
  };

  const handleDownload = async (image: ApiImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: unknown) {
      console.error('ダウンロードエラー:', error);
      toast.error('ダウンロードに失敗しました');
    }
  };

  const handleDelete = async (image: ApiImage) => {
    try {
      const encodedUrl = Buffer.from(image.url).toString('base64');
      const response = await fetch(`/api/images/${encodedUrl}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('削除に失敗しました');

      await fetchImages();
      toast.success('画像を削除しました');
    } catch (error: unknown) {
      console.error('画像の削除エラー:', error);
      toast.error('画像の削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            画像ギャラリー
          </CardTitle>
          <CardDescription>アップロードした画像の一覧</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="画像を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {filteredImages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? '検索結果が見つかりません' : '画像がありません'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredImages.map((image) => (
                <Card key={image.url} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="aspect-video relative rounded-lg overflow-hidden mb-4">
                      <Image
                        src={image.url}
                        alt={image.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium truncate">{image.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(image.size)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditImage(image)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          編集
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(image)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          ダウンロード
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(image)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
