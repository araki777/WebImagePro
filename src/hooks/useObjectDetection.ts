// import * as wasmExports from "../../wasm/pkg/wasm_image_pro";
import * as wasmExports from "@araki777/wasm-image-pro";
import * as PIXI from "pixi.js";
import { useCallback, useRef, useState } from "react";

export type ObjectDetectionMode = "outline";

export interface DetectedObject {
  class_id: number;
  class_name: string;
  confidence: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export const useObjectDetection = (
  spriteRef: React.RefObject<PIXI.Sprite | null>,
  imageContainerRef: React.RefObject<PIXI.Container | null>,
  imageUrl: string | null
) => {
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const objectGraphicsRef = useRef<PIXI.Graphics | null>(null);

  const detectObjects = useCallback(async () => {
    if (!spriteRef.current || !imageContainerRef.current || !imageUrl)
      return null;

    setIsDetecting(true);

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const imageData = new Uint8Array(arrayBuffer);

      // モデルが事前初期化されているか確認し、されていなければ実行時に自動初期化される
      // detectメソッドが自動的に画像サイズに基づいて適切なモデルを選択

      // オブジェクト検出を実行（最適なサイズは内部で自動的に決定される）
      const result = wasmExports.detect_objects(imageData);

      if (result) {
        const objectCount = result.get_detections_count();
        const objects: DetectedObject[] = [];

        // 検出結果を保存
        for (let i = 0; i < objectCount; i++) {
          const obj = result.get_detection(i);
          if (obj) {
            objects.push({
              class_id: obj.get_class_id(),
              class_name: obj.get_class_name(),
              confidence: obj.get_confidence(),
              x1: obj.get_x1(),
              y1: obj.get_y1(),
              x2: obj.get_x2(),
              y2: obj.get_y2(),
            });
          }
        }

        // 信頼度順にソート
        objects.sort((a, b) => b.confidence - a.confidence);
        setDetectedObjects(objects);

        // 検出されたオブジェクトの枠を描画
        drawObjectBoxes(objects);

        setIsDetecting(false);
        return objects;
      }
    } catch (error) {
      console.error("物体検出中にエラーが発生しました:", error);
    }

    setIsDetecting(false);
    return null;
  }, [spriteRef, imageContainerRef, imageUrl]);

  // 検出されたオブジェクトの枠を描画する関数
  const drawObjectBoxes = useCallback(
    (objects: DetectedObject[]) => {
      if (!spriteRef.current || !imageContainerRef.current) return;

      const sprite = spriteRef.current;
      const scale = sprite.scale;
      const position = sprite.position;
      const rotation = sprite.rotation;

      const originalWidth = sprite.texture.baseTexture.width;
      const originalHeight = sprite.texture.baseTexture.height;
      const displayWidth = sprite.width;
      const displayHeight = sprite.height;

      // 既存のグラフィックスをクリア
      if (objectGraphicsRef.current) {
        objectGraphicsRef.current.clear();
      } else {
        const graphics = new PIXI.Graphics();
        objectGraphicsRef.current = graphics;
        imageContainerRef.current.addChild(graphics);
      }

      // オブジェクトの枠を描画
      if (objectGraphicsRef.current) {
        for (let i = 0; i < objects.length; i++) {
          const object = objects[i];
          const x1 = object.x1;
          const y1 = object.y1;
          const x2 = object.x2;
          const y2 = object.y2;

          // 画像のサイズに合わせて座標を変換
          const displayX1 = (x1 / originalWidth) * displayWidth;
          const displayY1 = (y1 / originalHeight) * displayHeight;
          const displayX2 = (x2 / originalWidth) * displayWidth;
          const displayY2 = (y2 / originalHeight) * displayHeight;

          const centerX = (displayX1 + displayX2) / 2;
          const centerY = (displayY1 + displayY2) / 2;

          // 回転を考慮して座標を計算
          const cos = Math.cos(rotation);
          const sin = Math.sin(rotation);
          const rotatedX1 =
            centerX + (displayX1 - centerX) * cos - (displayY1 - centerY) * sin;
          const rotatedY1 =
            centerY + (displayX1 - centerX) * sin + (displayY1 - centerY) * cos;
          const rotatedX2 =
            centerX + (displayX2 - centerX) * cos - (displayY2 - centerY) * sin;
          const rotatedY2 =
            centerY + (displayX2 - centerX) * sin + (displayY2 - centerY) * cos;

          // スプライトの位置と回転を考慮した最終座標を計算
          const finalX1 = rotatedX1 + position.x - displayWidth / 2;
          const finalY1 = rotatedY1 + position.y - displayHeight / 2;
          const finalX2 = rotatedX2 + position.x - displayWidth / 2;
          const finalY2 = rotatedY2 + position.y - displayHeight / 2;

          // オブジェクトの枠を描画
          objectGraphicsRef.current.lineStyle(4, 0xff0000, 1);
          objectGraphicsRef.current.beginPath();
          objectGraphicsRef.current.moveTo(finalX1, finalY1);
          objectGraphicsRef.current.lineTo(finalX2, finalY1);
          objectGraphicsRef.current.lineTo(finalX2, finalY2);
          objectGraphicsRef.current.lineTo(finalX1, finalY2);
          objectGraphicsRef.current.lineTo(finalX1, finalY1);
          objectGraphicsRef.current.stroke();

          // クラス名とスコアを表示
          if (object.confidence > 0.4) {
            // 信頼度が一定以上の場合のみラベルを表示
            const text = new PIXI.Text(
              `${object.class_name} ${Math.round(object.confidence * 100)}%`,
              {
                fontFamily: "Arial",
                fontSize: 12,
                fill: 0xffffff,
                align: "center",
                stroke: {
                  color: 0x000000,
                  width: 4,
                },
              }
            );
            text.x = finalX1;
            text.y = finalY1 - 20; // ボックスの上にテキストを配置
            objectGraphicsRef.current.addChild(text);
          }
        }
      }
    },
    [spriteRef, imageContainerRef]
  );

  const clearObjectDetection = useCallback(() => {
    setDetectedObjects([]);

    // 描画した枠をクリア
    if (objectGraphicsRef.current) {
      objectGraphicsRef.current.clear();
      objectGraphicsRef.current.removeChildren();
    }
  }, []);

  return {
    detectObjects,
    clearObjectDetection,
    detectedObjects,
    isDetecting,
  };
};
