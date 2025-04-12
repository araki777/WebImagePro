'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from "@/components/ui/header";
import { useAuthStore } from "@/store/useAuthStore";
import * as PIXI from 'pixi.js';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

export default function EditorPage() {
  // 状態管理
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const [tempWidth, setTempWidth] = useState('');
  const [tempHeight, setTempHeight] = useState('');
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const containerRef = useRef<PIXI.Container | null>(null);
  const gridRef = useRef<PIXI.Graphics | null>(null);
  const spriteRef = useRef<PIXI.Sprite | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 認証関連
  const searchParams = useSearchParams();
  const { user, isLoading, checkUser, signOut } = useAuthStore();

  // 画像の初期状態を保存する変数をuseRefを使って安定させる
  const initialImageStateRef = useRef({
    scale: 1,
    position: { x: 0, y: 0 },
    rotation: 0
  });

  // サイズ表示用のテキストの参照
  const sizeTextRef = useRef<PIXI.Text | null>(null);

  // リサイズ中かどうかを追跡するための参照
  const isResizingRef = useRef(false);

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

    return () => {
      if (appRef.current?.renderer) {
        appRef.current.destroy(true, true);
        appRef.current = null;
      }
    };
  }, [pixiContainerRef.current]);

  const addHandles = (sprite: PIXI.Sprite) => {
    // リサイズハンドルを角と辺の中央ごとに作成
    const resizeHandles = {
      topLeft: new PIXI.Graphics(),
      topRight: new PIXI.Graphics(),
      bottomLeft: new PIXI.Graphics(),
      bottomRight: new PIXI.Graphics(),
      top: new PIXI.Graphics(),
      right: new PIXI.Graphics(),
      bottom: new PIXI.Graphics(),
      left: new PIXI.Graphics()
    };
    
    // 初期サイズを保存
    const initialWidth = sprite.width;
    const initialHeight = sprite.height;
    
    // ハンドルのサイズ
    const handleSize = 8; // ハンドルのサイズ

    const handleColor = 0x1a73e8; // Figmaスタイルの青色
    const handleFillColor = 0xffffff; // 白色の塗りつぶし
    const handleBorderWidth = 1.5; // 境界線の太さ
    
    // リサイズハンドルの描画と配置
    const drawResizeHandle = (handle: PIXI.Graphics, cursorStyle: string) => {
      handle.clear();
      handle.stroke({ width: handleBorderWidth, color: handleColor });
      handle.fill({ color: handleFillColor });
      
      // 角のハンドルと辺の中央のハンドルで同じサイズを使用
      const size = handleSize;
      
      // 四角形のハンドルを描画
      handle.rect(-size/2, -size/2, size, size);
      handle.endFill();
      handle.eventMode = 'static';
      handle.cursor = cursorStyle;
    };
    
    // 角のハンドルを描画（isCorner=trueで設定）
    drawResizeHandle(resizeHandles.topLeft, 'nwse-resize');
    drawResizeHandle(resizeHandles.topRight, 'nesw-resize');
    drawResizeHandle(resizeHandles.bottomLeft, 'nesw-resize');
    drawResizeHandle(resizeHandles.bottomRight, 'nwse-resize');

    // 辺の中央のハンドルを描画
    drawResizeHandle(resizeHandles.top, 'ns-resize');
    drawResizeHandle(resizeHandles.right, 'ew-resize');
    drawResizeHandle(resizeHandles.bottom, 'ns-resize');
    drawResizeHandle(resizeHandles.left, 'ew-resize');
    
    // 角のハンドルの配置（ハンドルが角から確実に外側に出るように配置）
    const offset = handleSize / 2; // 半分のサイズだけオフセット
    resizeHandles.topLeft.position.set(-initialWidth / 2 - offset, -initialHeight / 2 - offset);
    resizeHandles.topRight.position.set(initialWidth / 2 + offset, -initialHeight / 2 - offset);
    resizeHandles.bottomLeft.position.set(-initialWidth / 2 - offset, initialHeight / 2 + offset);
    resizeHandles.bottomRight.position.set(initialWidth / 2 + offset, initialHeight / 2 + offset);

    // 辺の中央のハンドルの配置（ハンドルが辺から確実に外側に出るように配置）
    resizeHandles.top.position.set(0, -initialHeight / 2 - offset);
    resizeHandles.right.position.set(initialWidth / 2 + offset, 0);
    resizeHandles.bottom.position.set(0, initialHeight / 2 + offset);
    resizeHandles.left.position.set(-initialWidth / 2 - offset, 0);
    
    // リサイズ処理
    let isResizing = false;
    let resizeStartX = 0;
    let resizeStartY = 0;
    let activeHandle: string = '';
    
    // リサイズハンドルのイベントを設定する関数
    const setupResizeHandleEvents = (handle: PIXI.Graphics, handleName: string) => {
      handle.on('pointerdown', (event) => {
        isResizing = true;
        activeHandle = handleName;
        resizeStartX = event.global.x;
        resizeStartY = event.global.y;
        
        // 現在のスプライト情報を保存
        const originalWidth = sprite.width;
        const originalHeight = sprite.height;
        const originalPosition = { x: sprite.x, y: sprite.y };
        
        // スプライトのアンカーポイントを保存（中央が0.5）
        const anchorX = sprite.anchor.x;
        const anchorY = sprite.anchor.y;
        
        // スプライトの実際の境界を計算
        const bounds = {
          left: originalPosition.x - originalWidth * anchorX,
          right: originalPosition.x + originalWidth * (1 - anchorX),
          top: originalPosition.y - originalHeight * anchorY,
          bottom: originalPosition.y + originalHeight * (1 - anchorY)
        };
        
        const onResizeMove = (moveEvent: MouseEvent) => {
          if (!isResizing) return;
          
          // 移動距離を計算
          let dx = moveEvent.clientX - resizeStartX;
          let dy = moveEvent.clientY - resizeStartY;
          let newWidth = originalWidth;
          let newHeight = originalHeight;
          let newX = originalPosition.x;
          let newY = originalPosition.y;
          
          // リサイズ方向に応じたサイズと位置の調整
          switch (activeHandle) {
            case 'right':
              // 右側のみ移動（左端は固定）
              newWidth = originalWidth + dx;
              // アンカーポイントの補正（左端を固定するため、位置を右に移動）
              newX = bounds.left + newWidth * anchorX;
              break;
              
            case 'left':
              // 左側のみ移動（右端は固定）
              newWidth = originalWidth - dx;
              // アンカーポイントの補正（右端を固定するため、位置を左に移動）
              newX = bounds.right - newWidth * (1 - anchorX);
              break;
              
            case 'bottom':
              // 下側のみ移動（上端は固定）
              newHeight = originalHeight + dy;
              // アンカーポイントの補正（上端を固定するため、位置を下に移動）
              newY = bounds.top + newHeight * anchorY;
              break;
              
            case 'top':
              // 上側のみ移動（下端は固定）
              newHeight = originalHeight - dy;
              // アンカーポイントの補正（下端を固定するため、位置を上に移動）
              newY = bounds.bottom - newHeight * (1 - anchorY);
              break;
              
            case 'topLeft':
              // 左上のハンドル（右下を固定）
              if (maintainAspectRatio) {
                // アスペクト比維持
                const scale = Math.max(
                  (originalWidth - dx) / originalWidth,
                  (originalHeight - dy) / originalHeight
                );
                newWidth = originalWidth * scale;
                newHeight = originalHeight * scale;
              } else {
                // 自由変形
                newWidth = originalWidth - dx;
                newHeight = originalHeight - dy;
              }
              // 右下を固定
              newX = bounds.right - newWidth * (1 - anchorX);
              newY = bounds.bottom - newHeight * (1 - anchorY);
              break;
              
            case 'topRight':
              // 右上のハンドル（左下を固定）
              if (maintainAspectRatio) {
                // アスペクト比維持
                const scale = Math.max(
                  (originalWidth + dx) / originalWidth,
                  (originalHeight - dy) / originalHeight
                );
                newWidth = originalWidth * scale;
                newHeight = originalHeight * scale;
              } else {
                // 自由変形
                newWidth = originalWidth + dx;
                newHeight = originalHeight - dy;
              }
              // 左下を固定
              newX = bounds.left + newWidth * anchorX;
              newY = bounds.bottom - newHeight * (1 - anchorY);
              break;
              
            case 'bottomLeft':
              // 左下のハンドル（右上を固定）
              if (maintainAspectRatio) {
                // アスペクト比維持
                const scale = Math.max(
                  (originalWidth - dx) / originalWidth,
                  (originalHeight + dy) / originalHeight
                );
                newWidth = originalWidth * scale;
                newHeight = originalHeight * scale;
              } else {
                // 自由変形
                newWidth = originalWidth - dx;
                newHeight = originalHeight + dy;
              }
              // 右上を固定
              newX = bounds.right - newWidth * (1 - anchorX);
              newY = bounds.top + newHeight * anchorY;
              break;
              
            case 'bottomRight':
              // 右下のハンドル（左上を固定）
              if (maintainAspectRatio) {
                // アスペクト比維持
                const scale = Math.max(
                  (originalWidth + dx) / originalWidth,
                  (originalHeight + dy) / originalHeight
                );
                newWidth = originalWidth * scale;
                newHeight = originalHeight * scale;
              } else {
                // 自由変形
                newWidth = originalWidth + dx;
                newHeight = originalHeight + dy;
              }
              // 左上を固定
              newX = bounds.left + newWidth * anchorX;
              newY = bounds.top + newHeight * anchorY;
              break;
          }
          
          // サイズが有効な値かチェック
          if (newWidth <= 1 || newHeight <= 1) return;
          
          // スプライトのサイズと位置を更新
          sprite.width = newWidth;
          sprite.height = newHeight;
          sprite.position.set(newX, newY);
          
          // リサイズ中もサイドバーの数値をリアルタイムで更新
          const updatedWidth = Math.floor(Math.abs(sprite.width));
          const updatedHeight = Math.floor(Math.abs(sprite.height));
          setImageWidth(updatedWidth);
          setImageHeight(updatedHeight);
          setTempWidth(updatedWidth.toString());
          setTempHeight(updatedHeight.toString());
          
          // サイズ表示も更新
          updateSizeDisplayText();
          updateSizeTextPosition();
        };
        
        const onResizeEnd = () => {
          isResizing = false;
          activeHandle = '';
          document.removeEventListener('mousemove', onResizeMove);
          document.removeEventListener('mouseup', onResizeEnd);
          
          // リサイズ後のサイズをサイドバー表示に反映
          if (spriteRef.current) {
            const updatedWidth = Math.floor(Math.abs(spriteRef.current.width));
            const updatedHeight = Math.floor(Math.abs(spriteRef.current.height));
            setImageWidth(updatedWidth);
            setImageHeight(updatedHeight);
            setTempWidth(updatedWidth.toString());
            setTempHeight(updatedHeight.toString());
            
            // サイズ表示も更新
            updateSizeDisplayText();
            updateSizeTextPosition();
          }
        };
        
        document.addEventListener('mousemove', onResizeMove);
        document.addEventListener('mouseup', onResizeEnd);
        
        event.stopPropagation();
      });
    };
    
    // 各ハンドルにイベントを設定
    setupResizeHandleEvents(resizeHandles.topLeft, 'topLeft');
    setupResizeHandleEvents(resizeHandles.topRight, 'topRight');
    setupResizeHandleEvents(resizeHandles.bottomLeft, 'bottomLeft');
    setupResizeHandleEvents(resizeHandles.bottomRight, 'bottomRight');

    // 辺の中央のハンドルにイベントを設定
    setupResizeHandleEvents(resizeHandles.top, 'top');
    setupResizeHandleEvents(resizeHandles.right, 'right');
    setupResizeHandleEvents(resizeHandles.bottom, 'bottom');
    setupResizeHandleEvents(resizeHandles.left, 'left');
    
    // 角のハンドルを追加
    sprite.addChild(resizeHandles.topLeft);
    sprite.addChild(resizeHandles.topRight);
    sprite.addChild(resizeHandles.bottomLeft);
    sprite.addChild(resizeHandles.bottomRight);

    // 辺の中央のハンドルを追加
    sprite.addChild(resizeHandles.top);
    sprite.addChild(resizeHandles.right);
    sprite.addChild(resizeHandles.bottom);
    sprite.addChild(resizeHandles.left);
  };

  const loadImage = useCallback(async () => {
    if (!imageUrl || !appRef.current || !containerRef.current) return;

    try {
      const texture = await PIXI.Assets.load(imageUrl);
      const sprite = new PIXI.Sprite(texture);
      
      // スプライトのアンカーポイントを中心に設定
      sprite.anchor.set(0.5);
      
      // スプライトの位置は0,0に設定
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
      setTempWidth(Math.round(sprite.width).toString());
      setTempHeight(Math.round(sprite.height).toString());

      // ドラッグ機能の追加
      sprite.eventMode = 'static';
      sprite.cursor = 'grab';

      let isDragging = false;
      let dragStart: PIXI.Point | null = null;

      sprite.on('pointerdown', (event) => {
        isDragging = true;
        dragStart = event.global.clone();
        sprite.cursor = 'grabbing';
      });

      sprite.on('pointermove', (event) => {
        if (isDragging && dragStart) {
          const moveX = event.global.x - dragStart.x;
          const moveY = event.global.y - dragStart.y;
          sprite.x += moveX;
          sprite.y += moveY;
          dragStart = event.global.clone();
          
          // 画像移動時にサイズ表示の位置を更新
          updateSizeTextPosition();
        }
      });

      sprite.on('pointerup', () => {
        isDragging = false;
        dragStart = null;
        sprite.cursor = 'grab';
      });

      sprite.on('pointerupoutside', () => {
        isDragging = false;
        dragStart = null;
        sprite.cursor = 'grab';
      });

      // コンテナを空にして新しいスプライトを追加
      containerRef.current.removeChildren();
      containerRef.current.addChild(sprite);
      
      // ハンドルを追加
      addHandles(sprite);
      
      // サイズ表示を追加
      createSizeDisplay();
      
      // コンテナを中央に配置
      centerContainer();
      
    } catch (error) {
      console.error('画像の読み込みに失敗しました:', error);
    }
  }, [imageUrl, appRef.current, containerRef.current]);

  // imageUrlが変わったときに画像を描画
  useEffect(() => {
    if (appRef.current && containerRef.current) {
      loadImage();
    }
  }, [loadImage, appRef.current, containerRef.current]);

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
        background: "#ffffff",
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
        resizeTo: parent
      }).then(() => {
        if (appRef.current && pixiContainerRef.current) {
          pixiContainerRef.current.appendChild(appRef.current.canvas);

          // リサイズイベントの設定
          const handleResize = () => {
            if (appRef.current && parent) {
              appRef.current.renderer.resize(parent.clientWidth, parent.clientHeight);
              if (showGrid) {
                drawGrid();
              }
              
              // リサイズ時にコンテナ位置を再調整
              if (containerRef.current && spriteRef.current) {
                centerContainer();
              }
            }
          };
          window.addEventListener('resize', handleResize);

          // コンテナを作成
          const container = new PIXI.Container();
          appRef.current.stage.addChild(container);
          containerRef.current = container;

          // グリッド用のコンテナを作成（画像の下に配置）
          const gridContainer = new PIXI.Container();
          appRef.current.stage.addChildAt(gridContainer, 0);
          gridRef.current = new PIXI.Graphics();
          gridContainer.addChild(gridRef.current);

          // 画像があれば読み込む
          if (imageUrl) {
            loadImage();
          }
        }
      });
    }
  }

  const drawGrid = () => {
    if (!appRef.current || !gridRef.current) return;

    const width = appRef.current.screen.width;
    const height = appRef.current.screen.height;

    // グラフィックスをクリア
    gridRef.current.clear();
    
    // グリッドの線を描画
    for (let x = 0; x <= width; x += gridSize) {
      gridRef.current.beginPath();
      gridRef.current.moveTo(x, 0);
      gridRef.current.lineTo(x, height);
      gridRef.current.stroke({ width: 1, color: 0x000000, alpha: 0.1 });
    }

    for (let y = 0; y <= height; y += gridSize) {
      gridRef.current.beginPath();
      gridRef.current.moveTo(0, y);
      gridRef.current.lineTo(width, y);
      gridRef.current.stroke({ width: 1, color: 0x000000, alpha: 0.1 });
    }
  };

  // グリッド表示の切り替えとサイズ変更
  useEffect(() => {
    if (!appRef.current || !gridRef.current) return;

    if (showGrid) {
      drawGrid();
    } else {
      gridRef.current.clear();
    }
  }, [showGrid, gridSize]);

  // ホイールによるズーム処理を簡略化
  const handleWheel = (event: WheelEvent) => {
    // デフォルトの動作（ページスクロール）を防ぐだけ
    event.preventDefault();
  }

  // コンテナの初期位置を設定する関数を簡略化
  const centerContainer = () => {
    if (!appRef.current || !containerRef.current || !spriteRef.current) return;
    
    // コンテナをキャンバスの中央に配置
    containerRef.current.position.set(
      appRef.current.screen.width / 2,
      appRef.current.screen.height / 2
    );
  }

  // サイズ表示テキストを作成する関数
  const createSizeDisplay = () => {
    if (!containerRef.current || !spriteRef.current) return;
    
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
    containerRef.current.addChild(sizeText);
    
    // ステート変数も更新
    setImageWidth(displayWidth);
    setImageHeight(displayHeight);
    setTempWidth(displayWidth.toString());
    setTempHeight(displayHeight.toString());
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
    
    // ステート変数も更新（UIと一致させる）、ただしリサイズ中は更新しない
    if (!isResizingRef.current && (imageWidth !== displayWidth || imageHeight !== displayHeight)) {
      setImageWidth(displayWidth);
      setImageHeight(displayHeight);
      setTempWidth(displayWidth.toString());
      setTempHeight(displayHeight.toString());
    }
  }, [imageWidth, imageHeight]);

  // サイズ変更時にテキスト更新
  useEffect(() => {
    updateSizeDisplayText();
    updateSizeTextPosition();
  }, [imageWidth, imageHeight]);

  // 画像の加工をリセットする関数を安全に作り直す
  const resetImageTransform = () => {
    if (!spriteRef.current || !containerRef.current) return;

    try {
      // コンテナから全ての子要素（画像も含む）を削除
      containerRef.current.removeChildren();
      
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
      containerRef.current.addChild(sprite);
      
      // ハンドルを再作成
      addHandles(sprite);
      
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

  // 画像のサイズを変更する関数（サイドバーから幅高さを変更する場合）
  const resizeImage = useCallback(() => {
    if (!spriteRef.current) return;
    
    // 入力値を整数に変換 (必ず整数値を扱う)
    const newWidth = parseInt(tempWidth);
    const newHeight = parseInt(tempHeight);
    
    if (isNaN(newWidth) || isNaN(newHeight) || newWidth <= 0 || newHeight <= 0) {
      // 入力値が不正な場合は、現在の画像サイズに戻す
      const currentWidth = Math.floor(Math.abs(spriteRef.current.width));
      const currentHeight = Math.floor(Math.abs(spriteRef.current.height));
      setTempWidth(currentWidth.toString());
      setTempHeight(currentHeight.toString());
      return;
    }
    
    // リサイズ中フラグをセット
    isResizingRef.current = true;
    
    try {
      // 現在のスプライト情報を保存
      const sprite = spriteRef.current;
      const originalWidth = Math.abs(sprite.width);
      const originalHeight = Math.abs(sprite.height);
      
      // スプライトのアンカーポイントを取得（中央が0.5）
      const anchorX = sprite.anchor.x;
      const anchorY = sprite.anchor.y;
      
      // スプライトの実際の境界を計算
      const bounds = {
        left: sprite.x - originalWidth * anchorX,
        right: sprite.x + originalWidth * (1 - anchorX),
        top: sprite.y - originalHeight * anchorY,
        bottom: sprite.y + originalHeight * (1 - anchorY)
      };
      
      // 左上を固定してサイズ変更（Figmaのデフォルト動作）
      const newX = bounds.left + newWidth * anchorX;
      const newY = bounds.top + newHeight * anchorY;
      
      // PIXIスプライトのサイズと位置を更新
      sprite.width = newWidth * Math.sign(sprite.scale.x);
      sprite.height = newHeight * Math.sign(sprite.scale.y);
      sprite.position.set(newX, newY);
      
      // ステート変数を更新
      setImageWidth(newWidth);
      setImageHeight(newHeight);
      
      // サイズ表示の位置のみ更新
      updateSizeTextPosition();
    } finally {
      // 処理完了後にフラグをリセット
      isResizingRef.current = false;
    }
  }, [tempWidth, tempHeight]);
  
  // アスペクト比を維持しながら幅を変更
  const handleWidthChange = (value: string) => {
    // 入力された幅をステートに保存
    setTempWidth(value);
    
    // アスペクト比固定がオンで、有効な高さと入力値がある場合
    if (maintainAspectRatio && imageHeight > 0 && value !== '') {
      const width = parseInt(value);
      if (!isNaN(width) && width > 0) {
        // 現在のアスペクト比を計算
        const aspectRatio = imageWidth / imageHeight;
        // アスペクト比を維持した新しい高さを計算
        const newHeight = Math.floor(width / aspectRatio);
        setTempHeight(newHeight.toString());
      }
    }
    
    // 入力完了から100msの遅延後にリサイズを実行（連続入力時の処理軽減）
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    resizeTimeoutRef.current = setTimeout(() => {
      resizeImage();
    }, 100);
  };
  
  // 高さの値が変更されたときの処理
  const handleHeightChange = (value: string) => {
    // 入力された高さをステートに保存
    setTempHeight(value);
    
    // アスペクト比固定がオンで、有効な幅と入力値がある場合
    if (maintainAspectRatio && imageWidth > 0 && value !== '') {
      const height = parseInt(value);
      if (!isNaN(height) && height > 0) {
        // 現在のアスペクト比を計算
        const aspectRatio = imageWidth / imageHeight;
        // アスペクト比を維持した新しい幅を計算
        const newWidth = Math.floor(height * aspectRatio);
        setTempWidth(newWidth.toString());
      }
    }
    
    // 入力完了から100msの遅延後にリサイズを実行（連続入力時の処理軽減）
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    resizeTimeoutRef.current = setTimeout(() => {
      resizeImage();
    }, 100);
  };

  // コンポーネントのアンマウント時にタイマーをクリアするクリーンアップ
  useEffect(() => {
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

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
          <div ref={pixiContainerRef} className="w-full h-full" />
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
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="aspect-ratio-toggle" className="text-sm">アスペクト比を固定</Label>
                  <Switch
                    id="aspect-ratio-toggle"
                    checked={maintainAspectRatio}
                    onCheckedChange={setMaintainAspectRatio}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="image-width" className="text-xs">幅 (px)</Label>
                    <Input
                      id="image-width"
                      type="number"
                      value={tempWidth}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="image-height" className="text-xs">高さ (px)</Label>
                    <Input
                      id="image-height"
                      type="number"
                      value={tempHeight}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      className="h-8"
                    />
                  </div>
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