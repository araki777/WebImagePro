"use client";

import TourGuid from "@/components/common/TourGuid";
import { ImageList } from "@/components/ImageList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SearchBar } from "@/components/ui/searchBar";
import { useRouter } from "@/i18n/routing";
import { IApiImage } from "@/types/types";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Step } from "react-joyride";
import { toast } from "sonner";

export function ImageGallery() {
  const t = useTranslations("ImageGallery");
  const router = useRouter();
  const [images, setImages] = useState<IApiImage[]>([]); // 画像データの状態
  const [loading, setLoading] = useState(true); // ローディング状態
  const [searchQuery, setSearchQuery] = useState(""); // 検索クエリ

  // ツアーガイドのステップを定義
  const getTourSteps = (): Step[] => {
    const baseSteps: Step[] = [
      {
        target: ".search-bar",
        content: t("tour.searchBar"),
        placement: "bottom",
        disableBeacon: true,
        spotlightClicks: true,
      },
    ];

    if (images.length > 0) {
      return [
        ...baseSteps,
        {
          target: ".image-list > div:first-child",
          content: t("tour.imageList"),
          placement: "right",
          disableBeacon: true,
          spotlightClicks: true,
        },
        {
          target: ".image-list > div:first-child .aspect-video",
          content: t("tour.preview"),
          placement: "top",
          disableBeacon: true,
          spotlightClicks: true,
        },
        {
          target: ".image-list > div:first-child button:nth-child(1)",
          content: t("tour.edit"),
          placement: "bottom",
          disableBeacon: true,
          spotlightClicks: true,
        },
        {
          target: ".image-list > div:first-child button:nth-child(2)",
          content: t("tour.download"),
          placement: "bottom",
          disableBeacon: true,
          spotlightClicks: true,
        },
        {
          target: ".image-list > div:first-child button:nth-child(3)",
          content: t("tour.delete"),
          placement: "left",
          disableBeacon: true,
          spotlightClicks: true,
        },
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
      const response = await fetch("/api/images");
      if (!response.ok) throw new Error(t("error.fetchFailed"));
      const data = await response.json();
      setImages(
        data.map((img: IApiImage) => ({
          ...img,
          uploadedAt: new Date(img.uploadedAt),
        }))
      );
    } catch (error: unknown) {
      console.error("画像一覧の取得エラー:", error);
      toast.error(t("error.fetchFailed"), {
        description: t("error.tryAgain"),
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = images.filter(
    (image) => image.name.toLowerCase().includes(searchQuery.toLowerCase()) // 検索クエリに一致する画像をフィルタリング
  );

  // 編集中の画像を設定する関数
  const handleEditImage = (image: IApiImage) => {
    router.push(`/editor?url=${encodeURIComponent(image.url)}`);
  };

  // 画像をダウンロードする関数
  const handleDownload = async (image: IApiImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = image.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: unknown) {
      console.error("ダウンロードエラー:", error);
      toast.error(t("error.downloadFailed"));
    }
  };

  // 画像を削除する関数
  const handleDelete = async (image: IApiImage) => {
    try {
      const encodedUrl = encodeURIComponent(
        Buffer.from(image.url).toString("base64")
      );
      const response = await fetch(`/api/images/${encodedUrl}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(t("error.deleteFailed"));
      await fetchImages();
      toast.success(t("success.delete"));
    } catch (error) {
      console.error("画像の削除エラー:", error);
      toast.error(t("error.deleteFailed"));
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
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 検索フォーム */}
          <SearchBar
            query={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
          />
          <ImageList
            images={filteredImages}
            onEditImage={handleEditImage}
            onDownload={handleDownload}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </>
  );
}
