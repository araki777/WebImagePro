import {
  BlobClient,
  BlobSASPermissions,
  BlobServiceClient,
  ContainerClient,
  generateBlobSASQueryParameters,
  SASProtocol,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

export interface UploadOptions {
  isShared: boolean;
  userId?: string;
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
  blobName: string;
  containerName: string;
  tags: string[];
}

interface UploadMetadata {
  originalName: string;
  uploadedAt: string;
  [key: string]: string;
}

export class AzureStorageService {
  private blobServiceClient: BlobServiceClient;
  private credential: StorageSharedKeyCredential;
  private sharedContainerName: string;

  constructor(
    connectionString: string,
    sharedContainerName: string = "shared-images"
  ) {
    const accountName =
      connectionString.match(/AccountName=([^;]+)/)?.[1] || "";
    const accountKey = connectionString.match(/AccountKey=([^;]+)/)?.[1] || "";
    this.credential = new StorageSharedKeyCredential(accountName, accountKey);
    this.blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      this.credential
    );
    this.sharedContainerName = sharedContainerName;
  }

  private async getContainerClient(
    containerName: string
  ): Promise<ContainerClient> {
    const containerClient =
      this.blobServiceClient.getContainerClient(containerName);
    if (containerName === this.sharedContainerName) {
      await containerClient.createIfNotExists({
        access: "container",
      });
    } else {
      await containerClient.createIfNotExists();
    }
    return containerClient;
  }

  async getContainerClientForUser(userId: string): Promise<ContainerClient> {
    return this.getContainerClient(`user-${userId}`);
  }

  async getSharedContainerClient(): Promise<ContainerClient> {
    return this.getContainerClient(this.sharedContainerName);
  }

  private generateBlobName(originalName: string): string {
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split(".").pop();
    return `${timestamp}-${randomString}.${extension}`;
  }

  private async generateSasUrl(blobClient: BlobClient): Promise<string> {
    const now = new Date();
    const startsOn = new Date(now.getTime() - 5 * 60 * 1000); // 5分前
    const expiresOn = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1日後

    const properties = await blobClient.getProperties();
    const sasOptions = {
      containerName: blobClient.containerName,
      blobName: blobClient.name,
      protocol: SASProtocol.Https,
      startsOn,
      expiresOn,
      permissions: BlobSASPermissions.parse("r"), // 読み取りのみ
      cacheControl: "no-cache",
      contentDisposition: "inline",
      contentType: properties.contentType,
    };

    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      this.credential
    ).toString();

    return `${blobClient.url}?${sasToken}`;
  }

  async getSasUrl(containerName: string, blobName: string): Promise<string> {
    const containerClient = await this.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);
    return this.generateSasUrl(blobClient);
  }

  async getListImages(containerClient: ContainerClient): Promise<BlobImage[]> {
    const images: BlobImage[] = [];
    const isSharedContainer =
      containerClient.containerName === this.sharedContainerName;

    for await (const blob of containerClient.listBlobsFlat()) {
      const blobClient = containerClient.getBlobClient(blob.name);
      const properties = await blobClient.getProperties();

      let url: string;
      if (!isSharedContainer) {
        url = await this.generateSasUrl(blobClient);
      } else {
        url = blobClient.url;
      }

      images.push({
        url,
        name: properties.metadata?.originalName || blob.name,
        contentType: properties.contentType || "application/octet-stream",
        size: properties.contentLength || 0,
        blobName: blob.name,
        containerName: containerClient.containerName,
        tags: properties.metadata?.tags?.split(",") || [],
        uploadedAt: new Date(properties.lastModified || Date.now()),
      });
    }

    return images.sort(
      (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
    );
  }

  async uploadFile(
    file: File | Blob,
    fileName: string,
    options: UploadOptions
  ): Promise<{
    url: string;
    containerName: string;
    blobName: string;
    tags: string[];
  }> {
    const {
      isShared,
      userId,
      contentType = file.type,
      metadata = {},
      onProgress,
    } = options;

    try {
      const containerClient =
        !isShared && userId
          ? await this.getContainerClientForUser(userId)
          : await this.getSharedContainerClient();
      const blobName = this.generateBlobName(fileName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      const uploadMetadata: UploadMetadata = {
        ...metadata,
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
      };

      const arrayBuffer = await file.arrayBuffer();
      await blockBlobClient.uploadData(arrayBuffer, {
        blobHTTPHeaders: {
          blobContentType: contentType,
        },
        metadata: uploadMetadata,
        onProgress: onProgress
          ? (progress) => {
              const percentComplete = Math.round(
                (progress.loadedBytes / file.size) * 100
              );
              onProgress(percentComplete);
            }
          : undefined,
      });

      return {
        url: blockBlobClient.url,
        containerName: containerClient.containerName,
        blobName: blobName,
        tags: Array.isArray(uploadMetadata.tags) ? uploadMetadata.tags : [],
      };
    } catch (error) {
      console.error("File upload failed:", error);
      if (error instanceof Error) {
        throw new Error(
          `ファイルのアップロードに失敗しました: ${error.message}`
        );
      }
      throw error;
    }
  }

  async deleteFile(blobUrl: string): Promise<void> {
    try {
      const url = new URL(blobUrl);
      const containerName = url.pathname.split("/")[1];
      const blobName = url.pathname.split("/").slice(2).join("/");

      const containerClient = await this.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.delete();
    } catch (error) {
      console.error("File deletion failed:", error);
      throw new Error("ファイルの削除に失敗しました");
    }
  }
}
