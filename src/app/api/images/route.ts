import { AzureStorageService } from "@/lib/azure-storage";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const azureStorage = new AzureStorageService(
  process.env.AZURE_STORAGE_CONNECTION_STRING || ""
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const isShared = searchParams.get("isShared")?.toLowerCase() === "true";

    if (!userId && !isShared) {
      return NextResponse.json(
        { error: "ユーザーIDが必要です" },
        { status: 400 }
      );
    }

    let images;
    if (isShared) {
      // 共有コンテナから画像を取得
      const sharedContainer = await azureStorage.getSharedContainerClient();
      images = await azureStorage.getListImages(sharedContainer);
    } else if (userId) {
      // 個人コンテナから画像を取得
      const userContainer =
        await azureStorage.getContainerClientForUser(userId);
      images = await azureStorage.getListImages(userContainer);
    } else {
      return NextResponse.json(
        { error: "ユーザーIDが必要です" },
        { status: 400 }
      );
    }

    // Supabaseからタグ情報を取得
    const { data: dbImages, error } = await supabase
      .from("images")
      .select("blob_name, container_name, tags");

    if (error) {
      throw error;
    }

    // blob_name+container_nameでマッピング
    const tagsMap = new Map(
      (dbImages || []).map((row) => [
        `${row.container_name}/${row.blob_name}`,
        row.tags || [],
      ])
    );

    // 画像リストにSupabaseのタグをマージ
    const imagesWithTags = images.map((img) => ({
      ...img,
      tags: tagsMap.get(`${img.containerName}/${img.blobName}`) || [],
    }));

    return NextResponse.json(imagesWithTags);
  } catch (error) {
    console.error("Failed to fetch images:", error);
    return NextResponse.json(
      { error: "画像一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
