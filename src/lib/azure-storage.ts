import { BlobServiceClient, ContainerClient, generateBlobSASQueryParameters, SASProtocol, BlobSASPermissions, BlobClient, StorageSharedKeyCredential } from '@azure/storage-blob';

export interface UploadOptions {
  containerName?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  onProgress?: (progress: number) => void;
}

export interface BlobImage {
  url: string;
  name: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
}

export class AzureStorageService {
  private blobServiceClient: BlobServiceClient;
  private defaultContainerName: string;
  private credential: StorageSharedKeyCredential;

  constructor(
    connectionString: string,
    defaultContainerName: string = 'images'
  ) {
    const accountName = connectionString.match(/AccountName=([^;]+)/)?.[1] || '';
    const accountKey = connectionString.match(/AccountKey=([^;]+)/)?.[1] || '';
    this.credential = new StorageSharedKeyCredential(accountName, accountKey);
    this.blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      this.credential
    );
    this.defaultContainerName = defaultContainerName;
  }

  private async getContainerClient(containerName?: string): Promise<ContainerClient> {
    const container = containerName || this.defaultContainerName;
    const containerClient = this.blobServiceClient.getContainerClient(container);
    await containerClient.createIfNotExists();
    return containerClient;
  }

  private generateBlobName(originalName: string): string {
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${timestamp}-${randomString}.${extension}`;
  }

  private async generateSasUrl(blobClient: BlobClient): Promise<string> {
    const now = new Date();
    const startsOn = new Date(now.getTime() - 5 * 60 * 1000); // 5分前
    const expiresOn = new Date(now.getTime() + 60 * 60 * 1000); // 1時間後

    const properties = await blobClient.getProperties();
    const sasOptions = {
      containerName: this.defaultContainerName,
      blobName: blobClient.name,
      protocol: SASProtocol.Https,
      startsOn,
      expiresOn,
      permissions: BlobSASPermissions.parse("r"), // 読み取りのみ
      cacheControl: 'no-cache',
      contentDisposition: 'inline',
      contentType: properties.contentType
    };

    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      this.credential
    ).toString();

    return `${blobClient.url}?${sasToken}`;
  }

  async listImages(containerName?: string): Promise<BlobImage[]> {
    try {
      const containerClient = await this.getContainerClient(containerName);
      const images: BlobImage[] = [];

      for await (const blob of containerClient.listBlobsFlat()) {
        const blobClient = containerClient.getBlobClient(blob.name);
        const properties = await blobClient.getProperties();
        const sasUrl = await this.generateSasUrl(blobClient);

        images.push({
          url: sasUrl,
          name: properties.metadata?.originalName || blob.name,
          contentType: properties.contentType || 'application/octet-stream',
          size: properties.contentLength || 0,
          uploadedAt: new Date(properties.lastModified || Date.now())
        });
      }

      return images.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    } catch (error) {
      console.error('Failed to list images:', error);
      throw new Error('画像一覧の取得に失敗しました');
    }
  }

  async uploadFile(
    file: File | Blob,
    fileName: string,
    options: UploadOptions = {}
  ): Promise<string> {
    const {
      containerName,
      contentType = file.type,
      metadata = {},
      onProgress
    } = options;

    try {
      const containerClient = await this.getContainerClient(containerName);
      const blobName = this.generateBlobName(fileName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      const uploadMetadata = {
        ...metadata,
        originalName: fileName,
        uploadedAt: new Date().toISOString()
      };

      const arrayBuffer = await file.arrayBuffer();
      await blockBlobClient.uploadData(arrayBuffer, {
        blobHTTPHeaders: {
          blobContentType: contentType
        },
        metadata: uploadMetadata,
        onProgress: onProgress ? (progress) => {
          const percentComplete = Math.round((progress.loadedBytes / file.size) * 100);
          onProgress(percentComplete);
        } : undefined
      });

      return blockBlobClient.url;
    } catch (error) {
      console.error('File upload failed:', error);
      throw new Error('ファイルのアップロードに失敗しました');
    }
  }

  async deleteFile(blobUrl: string): Promise<void> {
    try {
      const url = new URL(blobUrl);
      const containerName = url.pathname.split('/')[1];
      const blobName = url.pathname.split('/').slice(2).join('/');

      const containerClient = await this.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.delete();
    } catch (error) {
      console.error('File deletion failed:', error);
      throw new Error('ファイルの削除に失敗しました');
    }
  }
}