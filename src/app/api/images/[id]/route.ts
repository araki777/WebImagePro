import { NextRequest, NextResponse } from 'next/server';
import { AzureStorageService } from '@/lib/azure-storage';

const azureStorage = new AzureStorageService(
  process.env.AZURE_STORAGE_CONNECTION_STRING || ''
);

export async function DELETE(
  request: NextRequest,
  {params}: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    
    // Base64デコードしてURLを取得
    const blobUrl = Buffer.from(id, 'base64').toString('utf-8');
    
    await azureStorage.deleteFile(blobUrl);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: '画像の削除に失敗しました' },
      { status: 500 }
    );
  }
}