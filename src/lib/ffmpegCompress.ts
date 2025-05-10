import { ICompressionSettings } from "@/lib/constants";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;
let isFFmpegLoaded = false;

async function getFFmpegInstance(): Promise<FFmpeg> {
  if (ffmpegInstance && isFFmpegLoaded) return ffmpegInstance;
  ffmpegInstance = new FFmpeg();
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  await ffmpegInstance.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });
  isFFmpegLoaded = true;
  return ffmpegInstance;
}

export async function compressImageWithFFmpeg(
  file: File,
  compressionSettings: ICompressionSettings
): Promise<File> {
  if (!compressionSettings.enabled) return file;
  const ffmpeg = await getFFmpegInstance();
  const inputFileName = `input_${Date.now()}_${file.name}`;
  const outputFileName = `output_${Date.now()}_${file.name}`;
  try {
    // 入力ファイルの書き込み
    const arrayBuffer = await file.arrayBuffer();
    await ffmpeg.writeFile(inputFileName, new Uint8Array(arrayBuffer));

    // 圧縮コマンドの構築
    const format = compressionSettings.format.toLowerCase();
    let command: string[];
    switch (format) {
      case "jpeg":
      case "jpg": {
        const width = compressionSettings.width ?? 1000;
        const height = compressionSettings.height ?? 1000;
        const quality = compressionSettings.quality ?? 8;
        command = [
          "-i",
          inputFileName,
          "-vf",
          `scale=${width}:${height}`,
          "-c:v",
          "mjpeg",
          "-q:v",
          quality.toString(),
          "-y",
          outputFileName,
        ];
        break;
      }
      case "png": {
        const compression_level = compressionSettings.compression_level ?? 6;
        command = [
          "-i",
          inputFileName,
          "-c:v",
          "png",
          "-compression_level",
          compression_level.toString(),
          "-y",
          outputFileName,
        ];
        break;
      }
      case "webp": {
        const lossless = compressionSettings.lossless ?? false;
        const webp_quality = compressionSettings.webp_quality ?? 80;
        command = [
          "-i",
          inputFileName,
          "-c:v",
          "libwebp",
          ...(lossless
            ? ["-lossless", "1"]
            : ["-q:v", webp_quality.toString()]),
          "-y",
          outputFileName,
        ];
        break;
      }
      default:
        throw new Error(`未対応のフォーマットです: ${format}`);
    }

    // コマンド実行
    const result = await ffmpeg.exec(command);
    if (result !== 0) {
      throw new Error(
        `FFmpegコマンドの実行に失敗しました（終了コード: ${result}）`
      );
    }

    // 圧縮後ファイルの読み込み
    const compressedData = await ffmpeg.readFile(outputFileName);
    // 拡張子を正しく付け直す
    const ext = format === "jpeg" ? "jpg" : format;
    const newFileName = file.name.replace(/\.[^.]+$/, `.${ext}`);
    const compressedBlob = new Blob([compressedData], {
      type: `image/${format}`,
    });
    const compressedFile = new File([compressedBlob], newFileName, {
      type: `image/${format}`,
    });
    return compressedFile;
  } finally {
    // 一時ファイルの削除
    try {
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
    } catch {
      // ignore
    }
  }
}
