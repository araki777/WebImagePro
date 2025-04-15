import { PixiRefs } from "@/hooks/usePixiRefs";
import * as PIXI from "pixi.js";
import { useEffect } from "react";

interface PixiSetupProps {
  refs: PixiRefs;
  parentContainerSize: { width: number; height: number };
  setShowScrollbars: (show: boolean) => void;
  imageUrl: string | null;
  loadImage: () => void;
  showGrid: boolean;
  drawGrid: () => void;
}

interface PixiSetup {
  createPixiApp: () => void;
  updateBackground: () => void;
}

export const usePixiSetup = ({
  refs,
  parentContainerSize,
  setShowScrollbars,
  imageUrl,
  loadImage,
  showGrid,
  drawGrid,
}: PixiSetupProps): PixiSetup => {
  const {
    pixiContainerRef,
    appRef,
    parentContainerRef,
    componentContainerRef,
    imageContainerRef,
    sizeContainerRef,
  } = refs;

  const createPixiApp = () => {
    if (pixiContainerRef.current && !appRef.current) {
      const parent = pixiContainerRef.current.parentElement;
      if (!parent) return;

      appRef.current = new PIXI.Application();
      appRef.current
        .init({
          width: parent.clientWidth,
          height: parent.clientHeight,
          background: "#f5f5f5", // 背景色を少し変更して、見やすくする
          autoDensity: true,
          resolution: window.devicePixelRatio || 1,
          resizeTo: parent,
        })
        .then(() => {
          if (appRef.current && pixiContainerRef.current) {
            pixiContainerRef.current.appendChild(appRef.current.canvas);

            // 全体の背景を追加（ステージ全体）
            const stageBg = new PIXI.Graphics();
            stageBg.rect(
              0,
              0,
              appRef.current.screen.width,
              appRef.current.screen.height
            );
            stageBg.fill(0xffffff);
            appRef.current.stage.addChild(stageBg);

            // 親コンテナを作成
            const parentContainer = new PIXI.Container();
            appRef.current.stage.addChild(parentContainer);
            parentContainerRef.current = parentContainer;

            // 親コンテナを画面の10倍のサイズに設定
            parentContainer.width =
              appRef.current.screen.width * parentContainerSize.width;
            parentContainer.height =
              appRef.current.screen.height * parentContainerSize.height;

            // 親コンテナを中央に配置（位置を明示的に設定）
            parentContainer.position.set(
              appRef.current.screen.width / 2,
              appRef.current.screen.height / 2
            );

            // クリッピングマスクを追加して、親コンテナの外側が見えないようにする
            const mask = new PIXI.Graphics();
            mask.rect(
              -appRef.current.screen.width / 2,
              -appRef.current.screen.height / 2,
              appRef.current.screen.width,
              appRef.current.screen.height
            );
            mask.fill(0xffffff);
            parentContainer.addChild(mask);
            parentContainer.mask = mask;

            // stageの位置を調整して、親コンテナの中心が初期表示されるようにする
            appRef.current.stage.position.set(0, 0);

            // 親コンテナのイベントモードを'static'に設定（イベント検出可能）
            parentContainer.eventMode = "static";
            // 親コンテナのカーソルスタイルをデフォルトに設定
            parentContainer.cursor = "default";

            // 親コンテナのイベント処理（コンポーネントコンテナのドラッグを妨げないように）
            parentContainer.on("pointerdown", (event) => {
              // コンポーネントコンテナ上でのクリックは処理しない
              if (
                componentContainerRef.current &&
                (event.target === componentContainerRef.current ||
                  event.target.parent === componentContainerRef.current ||
                  event.target.parent?.parent === componentContainerRef.current)
              ) {
                event.stopPropagation();
                return;
              }

              // スクロールバーを表示
              setShowScrollbars(true);

              // 背景部分のドラッグ開始
              const startPosition = { x: event.global.x, y: event.global.y };
              const startContainerPosition = {
                x: parentContainer.position.x,
                y: parentContainer.position.y,
              };

              // ドラッグ処理の関数を定義
              const onDragMove = (moveEvent: PIXI.FederatedPointerEvent) => {
                if (!appRef.current) return;

                // 移動量を計算
                const dx = moveEvent.global.x - startPosition.x;
                const dy = moveEvent.global.y - startPosition.y;

                // 新しい位置を計算
                let newX = startContainerPosition.x + dx;
                let newY = startContainerPosition.y + dy;

                // 親コンテナの寸法を取得
                const parentWidth =
                  appRef.current.screen.width * parentContainerSize.width;
                const parentHeight =
                  appRef.current.screen.height * parentContainerSize.height;

                // 表示領域のサイズを取得
                const viewWidth = appRef.current.screen.width;
                const viewHeight = appRef.current.screen.height;

                // 境界を計算（親コンテナが表示領域から外れないようにする）
                const minX = viewWidth / 2 - parentWidth / 2 + viewWidth / 2;
                const maxX = viewWidth / 2 + parentWidth / 2 - viewWidth / 2;
                const minY = viewHeight / 2 - parentHeight / 2 + viewHeight / 2;
                const maxY = viewHeight / 2 + parentHeight / 2 - viewHeight / 2;

                // 境界チェック - 親コンテナの境界までしかスクロールできないようにする
                newX = Math.max(minX, Math.min(newX, maxX));
                newY = Math.max(minY, Math.min(newY, maxY));

                // 親コンテナの位置を更新
                parentContainer.position.set(newX, newY);

                // スクロールコンテナのスクロール位置も更新
                const scrollContainer = pixiContainerRef.current?.parentElement;
                if (scrollContainer) {
                  // スクロールの最大値を計算（境界と一致させる）
                  const maxScrollX = parentWidth - viewWidth;
                  const maxScrollY = parentHeight - viewHeight;

                  // 位置からスクロール位置を計算
                  const calculatedScrollX =
                    maxScrollX * (1 - (newX - minX) / (maxX - minX));
                  const calculatedScrollY =
                    maxScrollY * (1 - (newY - minY) / (maxY - minY));

                  // スクロール位置を設定
                  scrollContainer.scrollLeft = Math.max(
                    0,
                    Math.min(calculatedScrollX, maxScrollX)
                  );
                  scrollContainer.scrollTop = Math.max(
                    0,
                    Math.min(calculatedScrollY, maxScrollY)
                  );
                }
              };

              // ドラッグ終了処理の関数を定義
              const onDragEnd = () => {
                // イベントリスナーを削除
                appRef.current?.stage.off("pointermove", onDragMove);
                appRef.current?.stage.off("pointerup", onDragEnd);
                appRef.current?.stage.off("pointerupoutside", onDragEnd);
              };

              // イベントリスナーを設定
              appRef.current?.stage.on("pointermove", onDragMove);
              appRef.current?.stage.on("pointerup", onDragEnd);
              appRef.current?.stage.on("pointerupoutside", onDragEnd);
            });

            // コンポーネントコンテナを作成（ドラッグイベント用）
            const componentContainer = new PIXI.Container();
            parentContainer.addChild(componentContainer);
            componentContainerRef.current = componentContainer;

            // 画像用のコンテナを作成
            const imageContainer = new PIXI.Container();
            componentContainer.addChild(imageContainer);
            imageContainerRef.current = imageContainer;

            // サイズ表示用のコンテナを作成
            const sizeContainer = new PIXI.Container();
            componentContainer.addChild(sizeContainer);
            sizeContainerRef.current = sizeContainer;

            // コンポーネントコンテナにドラッグイベントを設定
            componentContainer.eventMode = "static";
            componentContainer.cursor = "grab";

            // 画像コンテナとサイズコンテナのイベントモードも設定
            imageContainer.eventMode = "static";
            imageContainer.cursor = "grab";
            sizeContainer.eventMode = "static";
            sizeContainer.cursor = "grab";

            // コンポーネントコンテナのドラッグイベント
            let isComponentDragging = false;
            let dragStartPosition = { x: 0, y: 0 };
            let initialContainerPosition = { x: 0, y: 0 };

            // ドラッグ開始
            const onDragStart = (event: PIXI.FederatedPointerEvent) => {
              isComponentDragging = true;
              dragStartPosition = { x: event.global.x, y: event.global.y };
              initialContainerPosition = {
                x: componentContainer.x,
                y: componentContainer.y,
              };

              componentContainer.cursor = "grabbing";
              imageContainer.cursor = "grabbing";
              sizeContainer.cursor = "grabbing";

              // グローバルイベントリスナーを設定
              window.addEventListener("mousemove", onDragMove);
              window.addEventListener("mouseup", onDragEnd);
              window.addEventListener("touchmove", onTouchMove, {
                passive: false,
              });
              window.addEventListener("touchend", onDragEnd);
            };

            // マウス移動イベント
            const onDragMove = (event: MouseEvent) => {
              if (!isComponentDragging) return;

              event.preventDefault();

              const dx = event.clientX - dragStartPosition.x;
              const dy = event.clientY - dragStartPosition.y;

              componentContainer.x = initialContainerPosition.x + dx;
              componentContainer.y = initialContainerPosition.y + dy;
            };

            // タッチ移動イベント
            const onTouchMove = (event: TouchEvent) => {
              if (!isComponentDragging || !event.touches[0]) return;

              event.preventDefault();

              const touch = event.touches[0];
              const dx = touch.clientX - dragStartPosition.x;
              const dy = touch.clientY - dragStartPosition.y;

              componentContainer.x = initialContainerPosition.x + dx;
              componentContainer.y = initialContainerPosition.y + dy;
            };

            // ドラッグ終了
            const onDragEnd = () => {
              isComponentDragging = false;

              componentContainer.cursor = "grab";
              imageContainer.cursor = "grab";
              sizeContainer.cursor = "grab";

              // イベントリスナーをクリーンアップ
              window.removeEventListener("mousemove", onDragMove);
              window.removeEventListener("mouseup", onDragEnd);
              window.removeEventListener("touchmove", onTouchMove);
              window.removeEventListener("touchend", onDragEnd);
            };

            // マウスイベント
            componentContainer.on("pointerdown", (event) => {
              onDragStart(event);
            });

            // 子コンテナにも同じイベントを適用
            imageContainer.on("pointerdown", (event) => {
              onDragStart(event);
            });

            sizeContainer.on("pointerdown", (event) => {
              onDragStart(event);
            });

            // 画像があれば読み込む
            if (imageUrl) {
              loadImage();
            }
          }
        });
    }
  };

  // 背景とグリッドを更新する関数を修正
  const updateBackground = () => {
    if (!appRef.current || !parentContainerRef.current) return;

    // 透明な背景を追加（親コンテナサイズは固定）
    const width = appRef.current.screen.width * parentContainerSize.width;
    const height = appRef.current.screen.height * parentContainerSize.height;

    // 既存の子要素をすべて除去（マスクは保持）
    while (parentContainerRef.current.children.length > 1) {
      parentContainerRef.current.removeChildAt(0);
    }

    // 背景（不透明な白色）- 親コンテナ全体を覆う
    const background = new PIXI.Graphics();
    background.rect(-width / 2, -height / 2, width, height);
    background.fill(0xffffff);
    background.eventMode = "none";

    // 境界線を追加（親コンテナの境界を視覚的に示す）
    background.stroke({ width: 2, color: 0x888888, alpha: 0.7 }); // 線の太さを2pxに、透明度を0.7に調整

    // 背景を先頭に追加
    parentContainerRef.current.addChildAt(background, 0);

    // コンポーネントコンテナを追加
    if (componentContainerRef.current) {
      parentContainerRef.current.addChild(componentContainerRef.current);
    }

    // グリッドが表示されていれば描画
    if (showGrid) {
      drawGrid();
    }
  };

  useEffect(() => {
    return () => {
      if (appRef.current?.renderer) {
        appRef.current.destroy(true, true);
        appRef.current = null;
      }
    };
  }, []);

  return {
    createPixiApp,
    updateBackground,
  };
};
