import { NextResponse } from 'next/server';
import { AzureStorageService } from '@/lib/azure-storage';

const azureStorage = new AzureStorageService(
  process.env.AZURE_STORAGE_CONNECTION_STRING || ''
);

export async function GET() {
  try {
    const images = await azureStorage.listImages();
    return NextResponse.json(images);
  } catch (error) {
    console.error('Failed to fetch images:', error);
    return NextResponse.json(
      { error: '画像一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}