'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from "@/components/ui/header";
import { useAuthStore } from "@/store/useAuthStore";
import * as PIXI from 'pixi.js';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export default function ImageEditor2() {
  // 状態管理
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const [parentContainerSize, setParentContainerSize] = useState({ width: 3, height: 3 }); // 親コンテナの初期サイズは固定
  const [showScrollbar, setShowScrollbar] = useState(false); // スクロールバーの表示状態
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const parentContainerRef = useRef<PIXI.Container | null>(null);
  const componentContainerRef = useRef<PIXI.Container | null>(null);
  const imageContainerRef = useRef<PIXI.Container | null>(null);
  const sizeContainerRef = useRef<PIXI.Container | null>(null);
  const spriteRef = useRef<PIXI.Sprite | null>(null);
  const sizeTextRef = useRef<PIXI.Text | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null); // スクロールタイムアウト用ref

  // 認証関連
  const searchParams = useSearchParams();
  const { user, isLoading, checkUser, signOut } = useAuthStore();

  // 画像の初期状態を保存する変数をuseRefを使って安定させる
  const initialImageStateRef = useRef({
    scale: 1,
    position: { x: 0, y: 0 },
    rotation: 0
  });

  useEffect(() => {
    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
    }
  }, []);

  useEffect(() => {
    const url = searchParams.get('url');
    if (url) {
      setImageUrl(url);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!pixiContainerRef.current) return;
    createPixiApp();

    // ウィンドウのリサイズに対応
    const handleResize = () => {
      if (!appRef.current || !parentContainerRef.current || !pixiContainerRef.current) return;

      const parent = pixiContainerRef.current.parentElement;
      if (!parent) return;

      const scale = Math.min(
        parent.clientWidth / appRef.current.screen.width,
        parent.clientHeight / appRef.current.screen.height
      );
      parentContainerRef.current.scale.set(scale);

      // 親コンテナを中央に配置
      parentContainerRef.current.position.set(
        (parent.clientWidth - appRef.current.screen.width * scale) / 2,
        (parent.clientHeight - appRef.current.screen.height * scale) / 2
      );
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (appRef.current?.renderer) {
        appRef.current.destroy(true, true);
        appRef.current = null;
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [pixiContainerRef.current]);

  // 初期化後、ドラッグ可能な透明な背景を追加
  useEffect(() => {
    if (!appRef.current || !parentContainerRef.current) return;

    // 初期表示時に実行
    updateBackground();
  }, [appRef.current, parentContainerRef.current]);

  // グリッド表示の変更時に再描画
  useEffect(() => {
    if (parentContainerRef.current && appRef.current) {
      updateBackground();
    }
  }, [showGrid, gridSize]);

  const loadImage = useCallback(async () => {
    if (!imageUrl || !appRef.current || !imageContainerRef.current || !componentContainerRef.current) return;

    try {
      const texture = await PIXI.Assets.load(imageUrl);
      const sprite = new PIXI.Sprite(texture);

      // スプライトのアンカーポイントを中心に設定
      sprite.anchor.set(0.5);

      // スプライトの位置は0,0に設定（コンテナの中心）
      sprite.x = 0;
      sprite.y = 0;

      // スプライトのスケールを調整して画面内に収める
      const scale = Math.min(
        (appRef.current.screen.width * 0.8) / sprite.width,
        (appRef.current.screen.height * 0.8) / sprite.height
      );
      sprite.scale.set(scale);

      // 初期状態を保存
      initialImageStateRef.current = {
        scale: scale,
        position: { x: 0, y: 0 },
        rotation: 0
      };

      // スプライトの参照を保存
      spriteRef.current = sprite;

      // 画像の実際のサイズを状態に保存
      setImageWidth(Math.round(sprite.width));
      setImageHeight(Math.round(sprite.height));

      // コンテナを空にして新しいスプライトを追加
      imageContainerRef.current.removeChildren();
      imageContainerRef.current.addChild(sprite);

      // サイズ表示を追加
      createSizeDisplay();

      // コンポーネントコンテナのサイズを設定
      if (componentContainerRef.current) {
        // 画像のサイズに余白を加えて設定
        const padding = 20; // 余白
        componentContainerRef.current.width = sprite.width + padding;
        componentContainerRef.current.height = sprite.height + padding + 30; // サイズ表示の高さ分を追加

        // コンポーネントコンテナの位置を親コンテナの中心に設定
        componentContainerRef.current.position.set(0, 0);
      }

      // コンテナを中央に配置
      centerContainer();

    } catch (error) {
      console.error('画像の読み込みに失敗しました:', error);
    }
  }, [imageUrl, appRef.current, imageContainerRef.current, componentContainerRef.current]);

  // imageUrlが変わったときに画像を描画
  useEffect(() => {
    if (appRef.current && imageContainerRef.current) {
      loadImage();
    }
  }, [loadImage, appRef.current, imageContainerRef.current]);

  // 認証状態の確認
  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const createPixiApp = () => {
    if (pixiContainerRef.current && !appRef.current) {
      const parent = pixiContainerRef.current.parentElement;
      if (!parent) return;

      appRef.current = new PIXI.Application();
      appRef.current.init({
        width: parent.clientWidth,
        height: parent.clientHeight,
        background: "#f5f5f5", // 背景色を少し変更して、見やすくする
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
        resizeTo: parent
      }).then(() => {
        if (appRef.current && pixiContainerRef.current) {
          pixiContainerRef.current.appendChild(appRef.current.canvas);

          // 全体の背景を追加（ステージ全体）
          const stageBg = new PIXI.Graphics();
          stageBg.beginFill(0xFFFFFF);
          stageBg.drawRect(0, 0, appRef.current.screen.width, appRef.current.screen.height);
          stageBg.endFill();
          appRef.current.stage.addChild(stageBg);

          // 親コンテナを作成
          const parentContainer = new PIXI.Container();
          appRef.current.stage.addChild(parentContainer);
          parentContainerRef.current = parentContainer;

          // 親コンテナを画面の3倍のサイズに設定（初期サイズ）
          parentContainer.width = appRef.current.screen.width * parentContainerSize.width;
          parentContainer.height = appRef.current.screen.height * parentContainerSize.height;

          // 親コンテナを中央に配置（位置を明示的に設定）
          parentContainer.position.set(
            appRef.current.screen.width / 2,
            appRef.current.screen.height / 2
          );

          // クリッピングマスクを追加して、親コンテナの外側が見えないようにする
          const mask = new PIXI.Graphics();
          mask.beginFill(0xFFFFFF);
          mask.drawRect(
            -appRef.current.screen.width / 2,
            -appRef.current.screen.height / 2,
            appRef.current.screen.width,
            appRef.current.screen.height
          );
          mask.endFill();
          parentContainer.addChild(mask);
          parentContainer.mask = mask;

          // stageの位置を調整して、親コンテナの中心が初期表示されるようにする
          appRef.current.stage.position.set(0, 0);

          // 親コンテナのイベントモードを'static'に設定（イベント検出可能）
          parentContainer.eventMode = 'static';
          // 親コンテナのカーソルスタイルをデフォルトに設定
          parentContainer.cursor = 'default';

          // 親コンテナのイベント処理（コンポーネントコンテナのドラッグを妨げないように）
          parentContainer.on('pointerdown', (event) => {
            // コンポーネントコンテナ上でのクリックは処理しない
            if (componentContainerRef.current &&
               (event.target === componentContainerRef.current ||
                event.target.parent === componentContainerRef.current ||
                event.target.parent?.parent === componentContainerRef.current)) {
              event.stopPropagation();
              return;
            }

            // スクロールバーを表示
            setShowScrollbar(true);

            // 既存のタイムアウトがあればクリア
            if (scrollTimeoutRef.current) {
              clearTimeout(scrollTimeoutRef.current);
            }

            // 背景部分のドラッグ開始
            const startPosition = { x: event.global.x, y: event.global.y };
            const startContainerPosition = { x: parentContainer.position.x, y: parentContainer.position.y };

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
              const parentWidth = appRef.current.screen.width * parentContainerSize.width;
              const parentHeight = appRef.current.screen.height * parentContainerSize.height;

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
            };

            // ドラッグ終了処理の関数を定義
            const onDragEnd = () => {
              // イベントリスナーを削除
              appRef.current?.stage.off('pointermove', onDragMove);
              appRef.current?.stage.off('pointerup', onDragEnd);
              appRef.current?.stage.off('pointerupoutside', onDragEnd);

              // 一定時間後にスクロールバーを非表示にする
              scrollTimeoutRef.current = setTimeout(() => {
                setShowScrollbar(false);
              }, 1500); // 1.5秒後に非表示
            };

            // イベントリスナーを設定
            appRef.current?.stage.on('pointermove', onDragMove);
            appRef.current?.stage.on('pointerup', onDragEnd);
            appRef.current?.stage.on('pointerupoutside', onDragEnd);
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
          componentContainer.eventMode = 'static';
          componentContainer.cursor = 'grab';

          // コンポーネントコンテナのドラッグイベント
          let isComponentDragging = false;
          let componentDragStart: { x: number, y: number } | null = null;

          componentContainer.on('pointerdown', (event) => {
            isComponentDragging = true;
            componentDragStart = { x: event.global.x, y: event.global.y };
            componentContainer.cursor = 'grabbing';
          });

          componentContainer.on('pointermove', (event) => {
            if (isComponentDragging && componentDragStart) {
              const moveX = event.global.x - componentDragStart.x;
              const moveY = event.global.y - componentDragStart.y;
              componentContainer.x += moveX;
              componentContainer.y += moveY;
              componentDragStart = { x: event.global.x, y: event.global.y };
            }
          });

          componentContainer.on('pointerup', () => {
            isComponentDragging = false;
            componentDragStart = null;
            componentContainer.cursor = 'grab';
          });

          componentContainer.on('pointerupoutside', () => {
            isComponentDragging = false;
            componentDragStart = null;
            componentContainer.cursor = 'grab';
          });

          // 画像があれば読み込む
          if (imageUrl) {
            loadImage();
          }
        }
      });
    }
  }

  const drawGrid = () => {
    if (!appRef.current || !parentContainerRef.current) return;

    // 親コンテナのサイズに合わせてグリッドを描画（固定サイズ）
    const width = appRef.current.screen.width * parentContainerSize.width;
    const height = appRef.current.screen.height * parentContainerSize.height;

    // グリッドのみを削除（背景とコンポーネントは保持）
    // 子要素を一時保存
    const children = [...parentContainerRef.current.children];
    const background = children[0]; // 最初の子要素は背景
    const componentContainer = componentContainerRef.current;

    // コンテナを空にする
    parentContainerRef.current.removeChildren();

    // 背景を再追加
    if (background) {
      parentContainerRef.current.addChild(background);
    }

    // グリッドの線を描画
    const gridGraphics = new PIXI.Graphics();
    for (let x = -width/2; x <= width/2; x += gridSize) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(x, -height/2);
      gridGraphics.lineTo(x, height/2);
      gridGraphics.stroke({ width: 1, color: 0x000000, alpha: 0.1 });
    }

    for (let y = -height/2; y <= height/2; y += gridSize) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(-width/2, y);
      gridGraphics.lineTo(width/2, y);
      gridGraphics.stroke({ width: 1, color: 0x000000, alpha: 0.1 });
    }

    // グリッドのカーソルスタイルを設定し、手のジェスチャーを無効化
    gridGraphics.cursor = 'default';

    // グリッドを親コンテナに追加
    parentContainerRef.current.addChild(gridGraphics);

    // コンポーネントコンテナを再追加
    if (componentContainer) {
      parentContainerRef.current.addChild(componentContainer);
    }
  };

  // グリッド表示の切り替えとサイズ変更
  useEffect(() => {
    if (!appRef.current || !parentContainerRef.current) return;
    if (showGrid) {
      drawGrid();
    } else {
      // グリッドだけを削除
      const children = [...parentContainerRef.current.children];
      if (children.length > 1) {
        // 背景は保持、グリッドがあれば削除
        const background = children[0];
        const componentContainer = componentContainerRef.current;

        parentContainerRef.current.removeChildren();

        // 背景を再追加
        if (background) {
          parentContainerRef.current.addChild(background);
        }

        // コンポーネントコンテナを再追加
        if (componentContainer) {
          parentContainerRef.current.addChild(componentContainer);
        }
      }
    }
  }, [showGrid, gridSize]);

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
    background.beginFill(0xFFFFFF, 1); // 完全不透明な白
    background.drawRect(
      -width/2,
      -height/2,
      width,
      height
    );
    background.endFill();
    background.eventMode = 'none';

    // 境界線を追加（親コンテナの境界を視覚的に示す）
    background.lineStyle(2, 0x888888, 0.7); // 線の太さを2pxに、透明度を0.7に調整
    background.drawRect(
      -width/2,
      -height/2,
      width,
      height
    );

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

  // ウィンドウのリサイズ時にグリッドを再描画
  useEffect(() => {
    if (showGrid) {
      drawGrid();
    }
  }, [parentContainerRef.current?.scale.x]);

  // ホイールによるスクロール処理を修正
  const handleWheel = (event: WheelEvent) => {
    // デフォルトの動作（ページスクロール）を防ぐ
    event.preventDefault();

    if (!parentContainerRef.current || !appRef.current) return;

    // スクロールバーを表示
    setShowScrollbar(true);

    // 既存のタイムアウトがあればクリア
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // 一定時間後にスクロールバーを非表示にする
    scrollTimeoutRef.current = setTimeout(() => {
      setShowScrollbar(false);
    }, 1500); // 1.5秒後に非表示

    // スクロール速度係数（小さいほど遅く、大きいほど速く）
    const scrollSpeed = 5;

    // 親コンテナの現在位置を取得
    const currentX = parentContainerRef.current.position.x;
    const currentY = parentContainerRef.current.position.y;

    // 親コンテナの寸法を取得
    const parentWidth = appRef.current.screen.width * parentContainerSize.width;
    const parentHeight = appRef.current.screen.height * parentContainerSize.height;

    // 表示領域のサイズを取得
    const viewWidth = appRef.current.screen.width;
    const viewHeight = appRef.current.screen.height;

    // 境界を計算（親コンテナが表示領域から外れないようにする）
    const minX = viewWidth / 2 - parentWidth / 2 + viewWidth / 2;
    const maxX = viewWidth / 2 + parentWidth / 2 - viewWidth / 2;
    const minY = viewHeight / 2 - parentHeight / 2 + viewHeight / 2;
    const maxY = viewHeight / 2 + parentHeight / 2 - viewHeight / 2;

    // ホイールの動きに応じて移動量を計算
    let deltaX = event.deltaX;
    let deltaY = event.deltaY;

    // Shiftキーが押されている場合、deltaYを横スクロールに使用
    if (event.shiftKey) {
      deltaX = event.deltaY;
      deltaY = 0;
    }

    // 新しい位置を計算
    let newX = currentX - (deltaX / scrollSpeed);
    let newY = currentY - (deltaY / scrollSpeed);

    // 境界チェック - 親コンテナの境界までしかスクロールできないようにする
    newX = Math.max(minX, Math.min(newX, maxX));
    newY = Math.max(minY, Math.min(newY, maxY));

    // 親コンテナの位置を更新
    parentContainerRef.current.position.set(newX, newY);
  }

  // コンテナの初期位置を設定する関数を改善
  const centerContainer = () => {
    if (!appRef.current || !imageContainerRef.current || !spriteRef.current || !parentContainerRef.current || !componentContainerRef.current) return;

    // コンポーネントコンテナの位置をリセット（親コンテナの中心に配置）
    componentContainerRef.current.position.set(0, 0);

    // 親コンテナをキャンバスの中央に配置
    parentContainerRef.current.position.set(
      appRef.current.screen.width / 2,
      appRef.current.screen.height / 2
    );

    // stageの位置を0,0に設定して、親コンテナの中心が表示されるようにする
    appRef.current.stage.position.set(0, 0);
  }

  // サイズ表示テキストを作成する関数
  const createSizeDisplay = () => {
    if (!sizeContainerRef.current || !spriteRef.current) return;

    // 既存のサイズ表示があれば削除
    if (sizeTextRef.current && sizeTextRef.current.parent) {
      sizeTextRef.current.parent.removeChild(sizeTextRef.current);
    }

    // テキストスタイルを設定
    const textStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0x000000,
      align: 'center'
    });

    // 実際の画像のサイズを計算（テクスチャの元のサイズ）
    const sprite = spriteRef.current;

    // 現在の表示サイズを計算
    const displayWidth = Math.floor(Math.abs(sprite.width));
    const displayHeight = Math.floor(Math.abs(sprite.height));

    // サイズ表示テキストを作成
    const sizeText = new PIXI.Text({
      text: `${displayWidth} × ${displayHeight}`,
      style: textStyle
    });

    // テキストのアンカーポイントを中央に設定
    sizeText.anchor.set(0.5, 0);

    // テキストの位置を更新
    updateSizeTextPosition(sizeText);

    // 参照を保存
    sizeTextRef.current = sizeText;

    // コンテナに追加（画像ではなく）
    sizeContainerRef.current.addChild(sizeText);

    // ステート変数も更新
    setImageWidth(displayWidth);
    setImageHeight(displayHeight);
  };

  // サイズテキストの位置を画像の位置に基づいて更新する関数
  const updateSizeTextPosition = (text = sizeTextRef.current) => {
    if (!spriteRef.current || !text) return;

    // 画像の位置を取得
    const sprite = spriteRef.current;

    // テキストを画像の下に配置（画像の中ではなく）
    text.x = sprite.x;
    text.y = sprite.y + (Math.abs(sprite.height) / 2) + 10;
  };

  // サイズ表示テキストの内容を更新する関数
  const updateSizeDisplayText = useCallback(() => {
    if (!sizeTextRef.current || !spriteRef.current) return;

    // 実際の表示サイズを計算（スケールと反転を考慮）
    const sprite = spriteRef.current;
    // 小数点以下を切り捨て、整数値のみを扱う
    const displayWidth = Math.floor(Math.abs(sprite.width));
    const displayHeight = Math.floor(Math.abs(sprite.height));

    // テキストを更新
    sizeTextRef.current.text = `${displayWidth} × ${displayHeight}`;

    // ステート変数も更新（UIと一致させる）
    if (imageWidth !== displayWidth || imageHeight !== displayHeight) {
      setImageWidth(displayWidth);
      setImageHeight(displayHeight);
    }
  }, [imageWidth, imageHeight]);

  // サイズ変更時にテキスト更新
  useEffect(() => {
    updateSizeDisplayText();
    updateSizeTextPosition();
  }, [imageWidth, imageHeight]);

  // 画像の加工をリセットする関数を安全に作り直す
  const resetImageTransform = () => {
    if (!spriteRef.current || !imageContainerRef.current) return;

    try {
      // コンテナから全ての子要素（画像も含む）を削除
      imageContainerRef.current.removeChildren();

      // スプライトを変数に保存して参照を維持
      const sprite = spriteRef.current;

      // スプライトのプロパティを初期状態に戻す
      sprite.scale.set(initialImageStateRef.current.scale);
      sprite.position.set(
        initialImageStateRef.current.position.x,
        initialImageStateRef.current.position.y
      );
      sprite.rotation = initialImageStateRef.current.rotation;

      // スプライトを再度コンテナに追加
      imageContainerRef.current.addChild(sprite);

      // サイズ表示を追加
      createSizeDisplay();

      // コンテナを中央に配置
      centerContainer();

      // サイズ表示も更新（初期状態のサイズを反映）
      updateSizeDisplayText();

      console.log("リセット完了: スプライトを再配置しました");
    } catch (error) {
      console.error("リセット中にエラーが発生しました:", error);
    }
  };

  // 画像を回転させる関数
  const rotateImage = (degrees: number) => {
    if (!spriteRef.current) return;

    // ラジアンに変換
    const radians = (degrees * Math.PI) / 180;

    // 現在の回転角に加算
    spriteRef.current.rotation += radians;

    // サイズ表示を更新
    updateSizeDisplayText();
    updateSizeTextPosition();
  };

  // 画像を水平・垂直に反転させる関数
  const flipImage = (direction: 'horizontal' | 'vertical') => {
    if (!spriteRef.current) return;

    if (direction === 'horizontal') {
      // 水平反転（X軸方向のスケールの符号を反転）
      spriteRef.current.scale.x *= -1;
    } else {
      // 垂直反転（Y軸方向のスケールの符号を反転）
      spriteRef.current.scale.y *= -1;
    }

    // サイズ表示を更新
    updateSizeDisplayText();
    updateSizeTextPosition();
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-background">
        <Header
          onLogout={signOut}
          userImage={user.user_metadata.avatar_url}
          userName={user.user_metadata.full_name || user.email}
        />
        <div className="flex h-[calc(100vh-3.5rem)]">
          <main className="flex-1 h-full overflow-hidden">
            <div
              ref={pixiContainerRef}
              className={`w-full h-full ${showScrollbar ? 'scrollable' : 'no-scrollbar'}`}
              style={{
                overflow: 'auto'
              }}
            />
            <style jsx global>{`
              .no-scrollbar::-webkit-scrollbar {
                width: 0;
                height: 0;
                background: transparent;
              }
              .no-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
              .scrollable::-webkit-scrollbar {
                width: 8px;
                height: 8px;
              }
              .scrollable::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.05);
                border-radius: 4px;
              }
              .scrollable::-webkit-scrollbar-thumb {
                background: rgba(0, 0, 0, 0.2);
                border-radius: 4px;
              }
              .scrollable::-webkit-scrollbar-thumb:hover {
                background: rgba(0, 0, 0, 0.3);
              }
            `}</style>
          </main>
          <aside className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">グリッド設定</h3>
                <div className="flex items-center justify-between">
                  <Label htmlFor="grid-toggle" className="text-sm">グリッド表示</Label>
                  <Switch
                    id="grid-toggle"
                    checked={showGrid}
                    onCheckedChange={setShowGrid}
                  />
                </div>
              </div>
              {showGrid && (
                <div className="space-y-3 rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="grid-size" className="text-sm">グリッドサイズ</Label>
                    <span className="text-sm font-medium text-gray-900">{gridSize}px</span>
                  </div>
                  <Slider
                    id="grid-size"
                    min={5}
                    max={100}
                    step={5}
                    value={[gridSize]}
                    onValueChange={(value) => setGridSize(value[0])}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>5px</span>
                    <span>100px</span>
                  </div>
                </div>
              )}

              {/* 画像サイズ設定 */}
              {spriteRef.current && (
                <div className="space-y-3 rounded-lg border border-gray-200 p-3">
                  <h3 className="text-sm font-medium text-gray-900">画像サイズ</h3>
                  <div className="text-sm text-gray-500">
                    {imageWidth} × {imageHeight} px
                  </div>
                </div>
              )}

              {/* 画像回転/反転設定 */}
              {spriteRef.current && (
                <div className="space-y-3 rounded-lg border border-gray-200 p-3">
                  <h3 className="text-sm font-medium text-gray-900">画像回転/反転</h3>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="p-2 bg-gray-100 hover:bg-gray-200 text-sm font-medium rounded transition-colors flex items-center justify-center"
                      onClick={() => rotateImage(-90)}
                    >
                      左に90°
                    </button>
                    <button
                      className="p-2 bg-gray-100 hover:bg-gray-200 text-sm font-medium rounded transition-colors flex items-center justify-center"
                      onClick={() => rotateImage(90)}
                    >
                      右に90°
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="p-2 bg-gray-100 hover:bg-gray-200 text-sm font-medium rounded transition-colors flex items-center justify-center"
                      onClick={() => flipImage('horizontal')}
                    >
                      水平反転
                    </button>
                    <button
                      className="p-2 bg-gray-100 hover:bg-gray-200 text-sm font-medium rounded transition-colors flex items-center justify-center"
                      onClick={() => flipImage('vertical')}
                    >
                      垂直反転
                    </button>
                  </div>
                </div>
              )}

              {/* 画像加工リセットボタン */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">画像編集</h3>
                <button
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors"
                  onClick={resetImageTransform}
                >
                  加工をリセット
                </button>
                <p className="text-xs text-gray-500 mt-1">位置・サイズ・回転を初期状態に戻します</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
  );
}