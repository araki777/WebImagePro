import { AzureStorageService } from "@/lib/azure-storage";
import { getImageTagsFromVision } from "@/lib/azure-vision";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const azureStorage = new AzureStorageService(
  process.env.AZURE_STORAGE_CONNECTION_STRING || ""
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const isShared = formData.get("isShared") === "true";
    const userId = formData.get("userId") as string;

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが見つかりません" },
        { status: 400 }
      );
    }

    if (!userId && !isShared) {
      return NextResponse.json(
        { error: "ユーザーIDが必要です" },
        { status: 400 }
      );
    }

    // ファイルサイズの制限チェック (例: 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "ファイルサイズが大きすぎます (上限: 10MB)" },
        { status: 400 }
      );
    }

    // 画像ファイルの種類チェック
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "画像ファイルのみアップロード可能です" },
        { status: 400 }
      );
    }

    const { url, containerName, blobName } = await azureStorage.uploadFile(
      file,
      file.name,
      {
        isShared,
        userId,
        metadata: {
          contentType: file.type,
          size: file.size.toString(),
        },
      }
    );

    let tags: string[] | null = null;
    let visionError: string | null = null;
    try {
      const sasUrl = await azureStorage.getSasUrl(containerName, blobName);
      tags = await getImageTagsFromVision(sasUrl);
      if (tags === null) {
        visionError = "limit";
      }
    } catch (error) {
      console.error("Computer Vision API error:", error);
      visionError = "error";
    }

    const { error: supabaseError } = await supabase.from("images").upsert([
      {
        container_name: containerName,
        blob_name: blobName,
        tags,
      },
    ]);

    if (supabaseError) {
      console.error("Supabase insert error:", supabaseError);
    }

    return NextResponse.json({ url, tags, visionError });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "アップロードに失敗しました" },
      { status: 500 }
    );
  }
}
