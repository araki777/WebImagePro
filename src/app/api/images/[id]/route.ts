import { AzureStorageService } from "@/lib/azure-storage";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const azureStorage = new AzureStorageService(
  process.env.AZURE_STORAGE_CONNECTION_STRING || ""
);

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;

    // Base64デコードしてURLを取得
    const blobUrl = Buffer.from(id, "base64").toString("utf-8");

    await azureStorage.deleteFile(blobUrl);

    // blob_name, container_nameを抽出
    const url = new URL(blobUrl);
    const containerName = url.pathname.split("/")[1];
    const blobName = url.pathname.split("/").slice(2).join("/");

    // Supabaseのimagesテーブルからも削除
    await supabase
      .from("images")
      .delete()
      .match({ blob_name: blobName, container_name: containerName });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "画像の削除に失敗しました" },
      { status: 500 }
    );
  }
}
