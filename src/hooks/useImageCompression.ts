import init, * as wasmExports from "../../wasm/pkg/wasm_image_pro";
// import init, * as wasmExports from "@araki777/wasm-image-pro";
import { ICompressionSettings } from "@/lib/constants";
import { useCallback, useEffect, useState } from "react";

export const useImageCompression = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeWasm = async () => {
      try {
        await init();
        setIsInitialized(true);
      } catch (error) {
        console.error("WebAssemblyの初期化に失敗しました:", error);
      }
    };

    initializeWasm();
  }, []);

  const imageCompression = useCallback(
    async (file: File, settings: ICompressionSettings) => {
      try {
        if (!isInitialized) {
          throw new Error("WebAssemblyが初期化されていません");
        }

        if (!file) {
          throw new Error("ファイルが指定されていません");
        }

        // ファイルをArrayBufferに変換
        const arrayBuffer = await file.arrayBuffer();
        const imageData = new Uint8Array(arrayBuffer);

        // フォーマットを設定から取得
        const format =
          settings.format === "JPEG"
            ? wasmExports.Format.JPEG
            : settings.format === "PNG"
              ? wasmExports.Format.PNG
              : wasmExports.Format.WebP;

        // WebAssemblyで画像を圧縮
        const compressedData = wasmExports.compress_image(
          imageData,
          format,
          settings.quality
        );

        // 圧縮されたデータをBlobに変換
        const compressedBlob = new Blob([compressedData], { type: file.type });

        // BlobをFileに変換
        return new File([compressedBlob], file.name, {
          type: file.type,
          lastModified: file.lastModified,
        });
      } catch (error) {
        console.error("画像圧縮中にエラーが発生しました:", error);
        throw error;
      }
    },
    [isInitialized]
  );

  return {
    imageCompression,
    isInitialized,
  };
};
