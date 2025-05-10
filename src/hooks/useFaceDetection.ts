// import * as wasmExports from "../../wasm/pkg/wasm_image_pro";
import * as wasmExports from "@araki777/wasm-image-pro";
import * as PIXI from "pixi.js";
import { useCallback, useRef } from "react";

export type FaceDetectionMode = "outline" | "blur";

export const useFaceDetection = (
  spriteRef: React.RefObject<PIXI.Sprite | null>,
  imageContainerRef: React.RefObject<PIXI.Container | null>,
  imageUrl: string | null
) => {
  const faceGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const blurSpritesRef = useRef<PIXI.Sprite[]>([]);

  const detectFaces = useCallback(
    async (mode: FaceDetectionMode): Promise<boolean> => {
      if (!spriteRef.current || !imageContainerRef.current) return false;

      try {
        if (!imageUrl) {
          throw new Error("画像URLが指定されていません");
        }

        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const imageData = new Uint8Array(arrayBuffer);

        const result = wasmExports.detect_faces(imageData);

        if (result) {
          const faceCount = result.get_faces_count();
          if (faceCount === 0) return false;

          const sprite = spriteRef.current;
          const position = sprite.position;
          const rotation = sprite.rotation;

          const originalWidth = sprite.texture.baseTexture.width;
          const originalHeight = sprite.texture.baseTexture.height;
          const displayWidth = sprite.width;
          const displayHeight = sprite.height;

          if (mode === "blur") {
            // 既存のぼかしスプライトをクリア
            blurSpritesRef.current.forEach((sprite) => {
              sprite.destroy();
            });
            blurSpritesRef.current = [];

            // 既存のグラフィックスをクリア
            if (faceGraphicsRef.current) {
              faceGraphicsRef.current.clear();
              faceGraphicsRef.current.removeChildren();
            }

            // 顔の部分にぼかしを適用
            for (let i = 0; i < faceCount; i++) {
              const face = result.get_face(i);
              if (face) {
                const x1 = face.get_x1();
                const y1 = face.get_y1();
                const x2 = face.get_x2();
                const y2 = face.get_y2();

                const displayX1 = (x1 / originalWidth) * displayWidth;
                const displayY1 = (y1 / originalHeight) * displayHeight;
                const displayX2 = (x2 / originalWidth) * displayWidth;
                const displayY2 = (y2 / originalHeight) * displayHeight;

                const centerX = (displayX1 + displayX2) / 2;
                const centerY = (displayY1 + displayY2) / 2;

                const cos = Math.cos(rotation);
                const sin = Math.sin(rotation);
                const rotatedX1 =
                  centerX +
                  (displayX1 - centerX) * cos -
                  (displayY1 - centerY) * sin;
                const rotatedY1 =
                  centerY +
                  (displayX1 - centerX) * sin +
                  (displayY1 - centerY) * cos;
                const rotatedX2 =
                  centerX +
                  (displayX2 - centerX) * cos -
                  (displayY2 - centerY) * sin;
                const rotatedY2 =
                  centerY +
                  (displayX2 - centerX) * sin +
                  (displayY2 - centerY) * cos;

                const finalX1 = rotatedX1 + position.x - displayWidth / 2;
                const finalY1 = rotatedY1 + position.y - displayHeight / 2;
                const finalWidth = rotatedX2 - rotatedX1;
                const finalHeight = rotatedY2 - rotatedY1;

                // 顔の部分のぼかしスプライトを作成
                const blurSprite = new PIXI.Sprite(sprite.texture);

                // 位置とサイズを顔に合わせる
                blurSprite.position.set(finalX1, finalY1);
                blurSprite.width = finalWidth;
                blurSprite.height = finalHeight;

                // ぼかしフィルターを適用
                const blurFilter = new PIXI.BlurFilter(8);
                blurSprite.filters = [blurFilter];

                // スプライトを追加
                imageContainerRef.current.addChild(blurSprite);
                blurSpritesRef.current.push(blurSprite);
              }
            }
          } else if (mode === "outline") {
            // ぼかしスプライトを削除
            blurSpritesRef.current.forEach((sprite) => {
              sprite.destroy();
            });
            blurSpritesRef.current = [];

            // 既存のグラフィックスをクリア
            if (faceGraphicsRef.current) {
              faceGraphicsRef.current.clear();
              faceGraphicsRef.current.removeChildren();
            } else {
              const graphics = new PIXI.Graphics();
              faceGraphicsRef.current = graphics;
              imageContainerRef.current.addChild(graphics);
            }

            // 顔の枠とランドマークを描画
            if (faceGraphicsRef.current) {
              for (let i = 0; i < faceCount; i++) {
                const face = result.get_face(i);
                if (face) {
                  const x1 = face.get_x1();
                  const y1 = face.get_y1();
                  const x2 = face.get_x2();
                  const y2 = face.get_y2();

                  const displayX1 = (x1 / originalWidth) * displayWidth;
                  const displayY1 = (y1 / originalHeight) * displayHeight;
                  const displayX2 = (x2 / originalWidth) * displayWidth;
                  const displayY2 = (y2 / originalHeight) * displayHeight;

                  const centerX = (displayX1 + displayX2) / 2;
                  const centerY = (displayY1 + displayY2) / 2;

                  const cos = Math.cos(rotation);
                  const sin = Math.sin(rotation);
                  const rotatedX1 =
                    centerX +
                    (displayX1 - centerX) * cos -
                    (displayY1 - centerY) * sin;
                  const rotatedY1 =
                    centerY +
                    (displayX1 - centerX) * sin +
                    (displayY1 - centerY) * cos;
                  const rotatedX2 =
                    centerX +
                    (displayX2 - centerX) * cos -
                    (displayY2 - centerY) * sin;
                  const rotatedY2 =
                    centerY +
                    (displayX2 - centerX) * sin +
                    (displayY2 - centerY) * cos;

                  const finalX1 = rotatedX1 + position.x - displayWidth / 2;
                  const finalY1 = rotatedY1 + position.y - displayHeight / 2;
                  const finalX2 = rotatedX2 + position.x - displayWidth / 2;
                  const finalY2 = rotatedY2 + position.y - displayHeight / 2;

                  // 顔の枠を描画
                  faceGraphicsRef.current.lineStyle(4, 0xff0000, 1);
                  faceGraphicsRef.current.beginPath();
                  faceGraphicsRef.current.moveTo(finalX1, finalY1);
                  faceGraphicsRef.current.lineTo(finalX2, finalY1);
                  faceGraphicsRef.current.lineTo(finalX2, finalY2);
                  faceGraphicsRef.current.lineTo(finalX1, finalY2);
                  faceGraphicsRef.current.lineTo(finalX1, finalY1);
                  faceGraphicsRef.current.stroke();

                  // ランドマークを描画
                  const landmarkCount = face.get_landmarks_count();
                  for (let j = 0; j < landmarkCount; j++) {
                    const landmark = face.get_landmark(j);
                    if (landmark) {
                      const lx =
                        (landmark.get_x() / originalWidth) * displayWidth;
                      const ly =
                        (landmark.get_y() / originalHeight) * displayHeight;
                      const rotatedLx =
                        centerX + (lx - centerX) * cos - (ly - centerY) * sin;
                      const rotatedLy =
                        centerY + (lx - centerX) * sin + (ly - centerY) * cos;
                      const finalLx = rotatedLx + position.x - displayWidth / 2;
                      const finalLy =
                        rotatedLy + position.y - displayHeight / 2;

                      faceGraphicsRef.current.lineStyle(2, 0xff0000, 1);
                      faceGraphicsRef.current.beginPath();
                      faceGraphicsRef.current.arc(
                        finalLx,
                        finalLy,
                        4,
                        0,
                        Math.PI * 2
                      );
                      faceGraphicsRef.current.stroke();
                    }
                  }
                }
              }
            }
          }
          return true;
        }
        return false;
      } catch (error) {
        console.error("顔検出中にエラーが発生しました:", error);
        return false;
      }
    },
    [spriteRef, imageContainerRef, imageUrl]
  );

  const clearFaceDetection = useCallback(() => {
    if (faceGraphicsRef.current) {
      faceGraphicsRef.current.clear();
      faceGraphicsRef.current.removeChildren();
    }

    // ぼかしスプライトを削除
    blurSpritesRef.current.forEach((sprite) => {
      sprite.destroy();
    });
    blurSpritesRef.current = [];
  }, []);

  // 保存用に一時的なスプライト状態で顔検出（枠・ぼかし）を再描画する関数
  const redrawFacesForSave = async (
    mode: FaceDetectionMode,
    spriteForSave: PIXI.Sprite
  ) => {
    if (!imageUrl || !imageContainerRef.current) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const imageData = new Uint8Array(arrayBuffer);
      const result = wasmExports.detect_faces(imageData);
      if (!result) return;
      const faceCount = result.get_faces_count();
      if (faceCount === 0) return;
      const sprite = spriteForSave;
      const position = sprite.position;
      const rotation = sprite.rotation;
      const originalWidth = sprite.texture.baseTexture.width;
      const originalHeight = sprite.texture.baseTexture.height;
      const displayWidth = sprite.width;
      const displayHeight = sprite.height;
      // 既存のグラフィックス・ぼかしをクリア
      if (faceGraphicsRef.current) {
        faceGraphicsRef.current.clear();
        faceGraphicsRef.current.removeChildren();
      }
      blurSpritesRef.current.forEach((sprite) => sprite.destroy());
      blurSpritesRef.current = [];
      if (mode === "blur") {
        for (let i = 0; i < faceCount; i++) {
          const face = result.get_face(i);
          if (face) {
            const x1 = face.get_x1();
            const y1 = face.get_y1();
            const x2 = face.get_x2();
            const y2 = face.get_y2();
            const displayX1 = (x1 / originalWidth) * displayWidth;
            const displayY1 = (y1 / originalHeight) * displayHeight;
            const displayX2 = (x2 / originalWidth) * displayWidth;
            const displayY2 = (y2 / originalHeight) * displayHeight;
            const centerX = (displayX1 + displayX2) / 2;
            const centerY = (displayY1 + displayY2) / 2;
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);
            const rotatedX1 =
              centerX +
              (displayX1 - centerX) * cos -
              (displayY1 - centerY) * sin;
            const rotatedY1 =
              centerY +
              (displayX1 - centerX) * sin +
              (displayY1 - centerY) * cos;
            const rotatedX2 =
              centerX +
              (displayX2 - centerX) * cos -
              (displayY2 - centerY) * sin;
            const rotatedY2 =
              centerY +
              (displayX2 - centerX) * sin +
              (displayY2 - centerY) * cos;
            const finalX1 = rotatedX1 + position.x - displayWidth / 2;
            const finalY1 = rotatedY1 + position.y - displayHeight / 2;
            const finalWidth = rotatedX2 - rotatedX1;
            const finalHeight = rotatedY2 - rotatedY1;
            const blurSprite = new PIXI.Sprite(sprite.texture);
            blurSprite.position.set(finalX1, finalY1);
            blurSprite.width = finalWidth;
            blurSprite.height = finalHeight;
            const blurFilter = new PIXI.BlurFilter(8);
            blurSprite.filters = [blurFilter];
            imageContainerRef.current.addChild(blurSprite);
            blurSpritesRef.current.push(blurSprite);
          }
        }
      } else if (mode === "outline") {
        if (!faceGraphicsRef.current) {
          const graphics = new PIXI.Graphics();
          faceGraphicsRef.current = graphics;
          imageContainerRef.current.addChild(graphics);
        }
        if (faceGraphicsRef.current) {
          for (let i = 0; i < faceCount; i++) {
            const face = result.get_face(i);
            if (face) {
              const x1 = face.get_x1();
              const y1 = face.get_y1();
              const x2 = face.get_x2();
              const y2 = face.get_y2();
              const displayX1 = (x1 / originalWidth) * displayWidth;
              const displayY1 = (y1 / originalHeight) * displayHeight;
              const displayX2 = (x2 / originalWidth) * displayWidth;
              const displayY2 = (y2 / originalHeight) * displayHeight;
              const centerX = (displayX1 + displayX2) / 2;
              const centerY = (displayY1 + displayY2) / 2;
              const cos = Math.cos(rotation);
              const sin = Math.sin(rotation);
              const rotatedX1 =
                centerX +
                (displayX1 - centerX) * cos -
                (displayY1 - centerY) * sin;
              const rotatedY1 =
                centerY +
                (displayX1 - centerX) * sin +
                (displayY1 - centerY) * cos;
              const rotatedX2 =
                centerX +
                (displayX2 - centerX) * cos -
                (displayY2 - centerY) * sin;
              const rotatedY2 =
                centerY +
                (displayX2 - centerX) * sin +
                (displayY2 - centerY) * cos;
              const finalX1 = rotatedX1 + position.x - displayWidth / 2;
              const finalY1 = rotatedY1 + position.y - displayHeight / 2;
              const finalX2 = rotatedX2 + position.x - displayWidth / 2;
              const finalY2 = rotatedY2 + position.y - displayHeight / 2;
              faceGraphicsRef.current.lineStyle(4, 0xff0000, 1);
              faceGraphicsRef.current.beginPath();
              faceGraphicsRef.current.moveTo(finalX1, finalY1);
              faceGraphicsRef.current.lineTo(finalX2, finalY1);
              faceGraphicsRef.current.lineTo(finalX2, finalY2);
              faceGraphicsRef.current.lineTo(finalX1, finalY2);
              faceGraphicsRef.current.lineTo(finalX1, finalY1);
              faceGraphicsRef.current.stroke();
              // ランドマークも描画
              const landmarkCount = face.get_landmarks_count();
              for (let j = 0; j < landmarkCount; j++) {
                const landmark = face.get_landmark(j);
                if (landmark) {
                  const lx = (landmark.get_x() / originalWidth) * displayWidth;
                  const ly =
                    (landmark.get_y() / originalHeight) * displayHeight;
                  const rotatedLx =
                    centerX + (lx - centerX) * cos - (ly - centerY) * sin;
                  const rotatedLy =
                    centerY + (lx - centerX) * sin + (ly - centerY) * cos;
                  const finalLx = rotatedLx + position.x - displayWidth / 2;
                  const finalLy = rotatedLy + position.y - displayHeight / 2;
                  faceGraphicsRef.current.lineStyle(2, 0xff0000, 1);
                  faceGraphicsRef.current.beginPath();
                  faceGraphicsRef.current.arc(
                    finalLx,
                    finalLy,
                    4,
                    0,
                    Math.PI * 2
                  );
                  faceGraphicsRef.current.stroke();
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("保存用顔検出再描画エラー", e);
    }
  };

  return {
    detectFaces,
    clearFaceDetection,
    redrawFacesForSave,
  };
};
