import { NextRequest, NextResponse } from 'next/server';
import { AzureStorageService } from '@/lib/azure-storage';

const azureStorage = new AzureStorageService(
  process.env.AZURE_STORAGE_CONNECTION_STRING || ''
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが見つかりません' },
        { status: 400 }
      );
    }

    // ファイルサイズの制限チェック (例: 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'ファイルサイズが大きすぎます (上限: 10MB)' },
        { status: 400 }
      );
    }

    // 画像ファイルの種類チェック
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '画像ファイルのみアップロード可能です' },
        { status: 400 }
      );
    }

    const url = await azureStorage.uploadFile(file, file.name, {
      metadata: {
        contentType: file.type,
        size: file.size.toString()
      }
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'アップロードに失敗しました' },
      { status: 500 }
    );
  }
}