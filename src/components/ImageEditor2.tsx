"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Header } from "@/components/ui/header";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useImageFilters } from "@/hooks/useImageFilters";
import { usePixiRefs } from "@/hooks/usePixiRefs";
import { usePixiSetup } from "@/hooks/usePixiSetup";
import { useAuthStore } from "@/store/useAuthStore";
import { useSearchParams } from "next/navigation";
import * as PIXI from "pixi.js";
import { useCallback, useEffect, useRef, useState } from "react";

export default function ImageEditor2() {
  // 状態管理
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const [parentContainerSize] = useState({ width: 10, height: 10 }); // 親コンテナの初期サイズは画面の10倍
  const [showScrollbars, setShowScrollbars] = useState(false); // スクロールバーの表示状態
  const isResettingRef = useRef(false); // リセット中かどうかのフラグ

  // 認証関連
  const searchParams = useSearchParams();
  const { user, isLoading, checkUser, signOut } = useAuthStore();

  // PIXI.jsの参照
  const pixiRefs = usePixiRefs();

  const loadImage = useCallback(async () => {
    if (
      !imageUrl ||
      !pixiRefs.appRef.current ||
      !pixiRefs.imageContainerRef.current ||
      !pixiRefs.componentContainerRef.current
    )
      return;

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
        (pixiRefs.appRef.current.screen.width * 0.8) / sprite.width,
        (pixiRefs.appRef.current.screen.height * 0.8) / sprite.height
      );
      sprite.scale.set(scale);

      // 初期状態を保存
      initialImageStateRef.current = {
        scale: scale,
        position: { x: 0, y: 0 },
        rotation: 0,
      };

      // スプライトの参照を保存
      pixiRefs.spriteRef.current = sprite;

      // 画像の実際のサイズを状態に保存
      setImageWidth(Math.round(sprite.width));
      setImageHeight(Math.round(sprite.height));

      // コンテナを空にして新しいスプライトを追加
      pixiRefs.imageContainerRef.current.removeChildren();
      pixiRefs.imageContainerRef.current.addChild(sprite);

      // サイズ表示を追加
      createSizeDisplay();

      // コンポーネントコンテナのサイズを設定
      if (pixiRefs.componentContainerRef.current) {
        // 画像のサイズに余白を加えて設定
        const padding = 20; // 余白
        pixiRefs.componentContainerRef.current.width = sprite.width + padding;
        pixiRefs.componentContainerRef.current.height =
          sprite.height + padding + 30; // サイズ表示の高さ分を追加

        // コンポーネントコンテナの位置を親コンテナの中心に設定
        pixiRefs.componentContainerRef.current.position.set(0, 0);

        // 統一されたサイズと位置を計算
        const hitAreaWidth = sprite.width + padding * 2;
        const hitAreaHeight = sprite.height + padding * 2 + 30;
        const hitAreaX = -sprite.width / 2 - padding;
        const hitAreaY = -sprite.height / 2 - padding;

        // 明示的なヒットエリアを設定（背景と同じサイズ）
        const hitArea = new PIXI.Rectangle(
          hitAreaX,
          hitAreaY,
          hitAreaWidth,
          hitAreaHeight
        );
        pixiRefs.componentContainerRef.current.hitArea = hitArea;

        // イベントモード設定を確認
        pixiRefs.componentContainerRef.current.eventMode = "static";
        pixiRefs.componentContainerRef.current.interactiveChildren = true;

        // 子コンテナのイベントモードも設定
        if (pixiRefs.imageContainerRef.current) {
          pixiRefs.imageContainerRef.current.eventMode = "static";
          pixiRefs.imageContainerRef.current.interactiveChildren = true;
        }

        if (pixiRefs.sizeContainerRef.current) {
          pixiRefs.sizeContainerRef.current.eventMode = "static";
          pixiRefs.sizeContainerRef.current.interactiveChildren = true;
        }
      }

      // コンテナを中央に配置
      centerContainer();
    } catch (error) {
      console.error("画像の読み込みに失敗しました:", error);
    }
  }, [
    imageUrl,
    pixiRefs.appRef.current,
    pixiRefs.imageContainerRef.current,
    pixiRefs.componentContainerRef.current,
  ]);

  const drawGrid = () => {
    if (!pixiRefs.appRef.current || !pixiRefs.parentContainerRef.current)
      return;

    // 親コンテナのサイズに合わせてグリッドを描画（固定サイズ）
    const width =
      pixiRefs.appRef.current.screen.width * parentContainerSize.width;
    const height =
      pixiRefs.appRef.current.screen.height * parentContainerSize.height;

    // グリッドのみを削除（背景とコンポーネントは保持）
    // 子要素を一時保存
    const children = [...pixiRefs.parentContainerRef.current.children];
    const background = children[0]; // 最初の子要素は背景
    const componentContainer = pixiRefs.componentContainerRef.current;

    // コンテナを空にする
    pixiRefs.parentContainerRef.current.removeChildren();

    // 背景を再追加
    if (background) {
      pixiRefs.parentContainerRef.current.addChild(background);
    }

    // グリッドの線を描画
    const gridGraphics = new PIXI.Graphics();
    for (let x = -width / 2; x <= width / 2; x += gridSize) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(x, -height / 2);
      gridGraphics.lineTo(x, height / 2);
      gridGraphics.stroke({ width: 1, color: 0x000000, alpha: 0.1 });
    }

    for (let y = -height / 2; y <= height / 2; y += gridSize) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(-width / 2, y);
      gridGraphics.lineTo(width / 2, y);
      gridGraphics.stroke({ width: 1, color: 0x000000, alpha: 0.1 });
    }

    // グリッドのカーソルスタイルを設定し、手のジェスチャーを無効化
    gridGraphics.cursor = "default";

    // グリッドを親コンテナに追加
    pixiRefs.parentContainerRef.current.addChild(gridGraphics);

    // コンポーネントコンテナを再追加
    if (componentContainer) {
      pixiRefs.parentContainerRef.current.addChild(componentContainer);
    }
  };

  // PIXI.jsのセットアップ
  const { createPixiApp, updateBackground } = usePixiSetup({
    refs: pixiRefs,
    parentContainerSize,
    setShowScrollbars,
    imageUrl,
    loadImage,
    showGrid,
    drawGrid,
  });

  // 画像フィルターフックを使用
  const {
    brightness,
    saturation,
    contrast,
    hueRotation,
    sepiaIntensity,
    isInverted,
    alpha,
    blurStrength,
    horizontalBlurStrength,
    verticalBlurStrength,
    activeColorTint,
    activeLSD,
    activeNight,
    activePredator,
    activeTechnicolor,
    activeToBGR,
    activeVintage,
    applyBrightness,
    applySaturation,
    applyContrast,
    applyHueRotation,
    applySepia,
    applyInvert,
    applyAlpha,
    applyBlur,
    applyHorizontalBlur,
    applyVerticalBlur,
    applyTint,
    applyLSD,
    applyNight,
    applyPredator,
    applyTechnicolor,
    applyToBGR,
    applyVintage,
    setBlendMode,
    resetFilters,
  } = useImageFilters(pixiRefs.spriteRef);

  // 画像の初期状態を保存する変数をuseRefを使って安定させる
  const initialImageStateRef = useRef({
    scale: 1,
    position: { x: 0, y: 0 },
    rotation: 0,
  });

  useEffect(() => {
    const url = searchParams.get("url");
    if (url) {
      setImageUrl(url);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!pixiRefs.pixiContainerRef.current) return;
    createPixiApp();

    // ウィンドウのリサイズに対応
    const handleResize = () => {
      if (
        !pixiRefs.appRef.current ||
        !pixiRefs.parentContainerRef.current ||
        !pixiRefs.pixiContainerRef.current
      )
        return;

      const parent = pixiRefs.pixiContainerRef.current.parentElement;
      if (!parent) return;

      const scale = Math.min(
        parent.clientWidth / pixiRefs.appRef.current.screen.width,
        parent.clientHeight / pixiRefs.appRef.current.screen.height
      );
      pixiRefs.parentContainerRef.current.scale.set(scale);

      // 親コンテナを中央に配置
      pixiRefs.parentContainerRef.current.position.set(
        (parent.clientWidth - pixiRefs.appRef.current.screen.width * scale) / 2,
        (parent.clientHeight - pixiRefs.appRef.current.screen.height * scale) /
          2
      );
    };

    window.addEventListener("resize", handleResize);

    // スクロールイベントハンドラを追加
    const scrollContainer = pixiRefs.pixiContainerRef.current.parentElement;
    if (scrollContainer) {
      const handleScroll = () => {
        if (!pixiRefs.appRef.current || !pixiRefs.parentContainerRef.current)
          return;

        // リセット中はスクロールバーを表示しない
        if (isResettingRef.current) {
          return;
        }

        // スクロールバーを表示
        setShowScrollbars(true);

        // 親コンテナの寸法を取得
        const parentWidth =
          pixiRefs.appRef.current.screen.width * parentContainerSize.width;
        const parentHeight =
          pixiRefs.appRef.current.screen.height * parentContainerSize.height;

        // 表示領域のサイズを取得
        const viewWidth = pixiRefs.appRef.current.screen.width;
        const viewHeight = pixiRefs.appRef.current.screen.height;

        // 境界を計算（親コンテナが表示領域から外れないようにする - ドラッグ処理と同じ計算式を使用）
        const minX = viewWidth / 2 - parentWidth / 2 + viewWidth / 2;
        const maxX = viewWidth / 2 + parentWidth / 2 - viewWidth / 2;
        const minY = viewHeight / 2 - parentHeight / 2 + viewHeight / 2;
        const maxY = viewHeight / 2 + parentHeight / 2 - viewHeight / 2;

        // スクロールの最大値を計算（境界と一致させる）
        const maxScrollX = parentWidth - viewWidth;
        const maxScrollY = parentHeight - viewHeight;

        // スクロール位置を取得
        const currentScrollX = scrollContainer.scrollLeft;
        const currentScrollY = scrollContainer.scrollTop;

        // スクロール位置が境界を超えないように制限
        if (
          currentScrollX < 0 ||
          currentScrollX > maxScrollX ||
          currentScrollY < 0 ||
          currentScrollY > maxScrollY
        ) {
          scrollContainer.scrollLeft = Math.max(
            0,
            Math.min(currentScrollX, maxScrollX)
          );
          scrollContainer.scrollTop = Math.max(
            0,
            Math.min(currentScrollY, maxScrollY)
          );
          return;
        }

        // スクロール位置からPIXI表示位置を計算（境界と一致させる）
        const newX = (maxX - minX) * (1 - currentScrollX / maxScrollX) + minX;
        const newY = (maxY - minY) * (1 - currentScrollY / maxScrollY) + minY;

        // 親コンテナの位置を更新
        pixiRefs.parentContainerRef.current.position.set(newX, newY);
      };

      scrollContainer.addEventListener("scroll", handleScroll);

      return () => {
        if (pixiRefs.appRef.current?.renderer) {
          pixiRefs.appRef.current.destroy(true, true);
          pixiRefs.appRef.current = null;
        }
        window.removeEventListener("resize", handleResize);
        scrollContainer.removeEventListener("scroll", handleScroll);
      };
    }

    return () => {
      if (pixiRefs.appRef.current?.renderer) {
        pixiRefs.appRef.current.destroy(true, true);
        pixiRefs.appRef.current = null;
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [pixiRefs.pixiContainerRef.current, parentContainerSize]);

  // wheelイベント処理を追加
  useEffect(() => {
    document.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      document.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // ホイールによるスクロール処理を修正
  const handleWheel = (event: WheelEvent) => {
    // デフォルトの動作（ページスクロール）を防ぐ
    event.preventDefault();

    if (!pixiRefs.parentContainerRef.current || !pixiRefs.appRef.current)
      return;

    // スクロールバーを表示
    setShowScrollbars(true);

    // スクロール速度係数（小さいほど遅く、大きいほど速く）
    const scrollSpeed = 5;

    // 親コンテナの現在位置を取得
    const currentX = pixiRefs.parentContainerRef.current.position.x;
    const currentY = pixiRefs.parentContainerRef.current.position.y;

    // 親コンテナの寸法を取得
    const parentWidth =
      pixiRefs.appRef.current.screen.width * parentContainerSize.width;
    const parentHeight =
      pixiRefs.appRef.current.screen.height * parentContainerSize.height;

    // 表示領域のサイズを取得
    const viewWidth = pixiRefs.appRef.current.screen.width;
    const viewHeight = pixiRefs.appRef.current.screen.height;

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
    let newX = currentX - deltaX / scrollSpeed;
    let newY = currentY - deltaY / scrollSpeed;

    // 境界チェック - 親コンテナの境界までしかスクロールできないようにする
    newX = Math.max(minX, Math.min(newX, maxX));
    newY = Math.max(minY, Math.min(newY, maxY));

    // 親コンテナの位置を更新
    pixiRefs.parentContainerRef.current.position.set(newX, newY);

    // スクロールコンテナのスクロール位置も更新
    const scrollContainer = pixiRefs.pixiContainerRef.current?.parentElement;
    if (scrollContainer) {
      // スクロールの最大値を計算（境界と一致させる）
      const maxScrollX = parentWidth - viewWidth;
      const maxScrollY = parentHeight - viewHeight;

      // 位置からスクロール位置を計算
      const calculatedScrollX =
        maxScrollX * (1 - (newX - minX) / (maxX - minX));
      const calculatedScrollY =
        maxScrollY * (1 - (newY - minY) / (maxY - minY));

      // スクロール位置を設定（境界を超えない範囲で）
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

  // 初期化後、ドラッグ可能な透明な背景を追加
  useEffect(() => {
    if (!pixiRefs.appRef.current || !pixiRefs.parentContainerRef.current)
      return;

    // 初期表示時に実行
    updateBackground();
  }, [pixiRefs.appRef.current, pixiRefs.parentContainerRef.current]);

  // グリッド表示の変更時に再描画
  useEffect(() => {
    if (pixiRefs.parentContainerRef.current && pixiRefs.appRef.current) {
      updateBackground();
    }
  }, [showGrid, gridSize]);

  // imageUrlが変わったときに画像を描画
  useEffect(() => {
    if (pixiRefs.appRef.current && pixiRefs.imageContainerRef.current) {
      loadImage();
    }
  }, [loadImage, pixiRefs.appRef.current, pixiRefs.imageContainerRef.current]);

  // 認証状態の確認
  useEffect(() => {
    checkUser();
  }, [checkUser]);

  // グリッド表示の切り替えとサイズ変更
  useEffect(() => {
    if (!pixiRefs.appRef.current || !pixiRefs.parentContainerRef.current)
      return;
    if (showGrid) {
      drawGrid();
    } else {
      // グリッドだけを削除
      const children = [...pixiRefs.parentContainerRef.current.children];
      if (children.length > 1) {
        // 背景は保持、グリッドがあれば削除
        const background = children[0];
        const componentContainer = pixiRefs.componentContainerRef.current;

        pixiRefs.parentContainerRef.current.removeChildren();

        // 背景を再追加
        if (background) {
          pixiRefs.parentContainerRef.current.addChild(background);
        }

        // コンポーネントコンテナを再追加
        if (componentContainer) {
          pixiRefs.parentContainerRef.current.addChild(componentContainer);
        }
      }
    }
  }, [showGrid, gridSize]);

  // ウィンドウのリサイズ時にグリッドを再描画
  useEffect(() => {
    if (showGrid) {
      drawGrid();
    }
  }, [pixiRefs.parentContainerRef.current?.scale.x]);

  // コンテナの初期位置を設定する関数を改善
  const centerContainer = () => {
    if (
      !pixiRefs.appRef.current ||
      !pixiRefs.imageContainerRef.current ||
      !pixiRefs.spriteRef.current ||
      !pixiRefs.parentContainerRef.current ||
      !pixiRefs.componentContainerRef.current
    )
      return;

    // コンポーネントコンテナの位置をリセット（親コンテナの中心に配置）
    pixiRefs.componentContainerRef.current.position.set(0, 0);

    // 親コンテナをキャンバスの中央に配置
    pixiRefs.parentContainerRef.current.position.set(
      pixiRefs.appRef.current.screen.width / 2,
      pixiRefs.appRef.current.screen.height / 2
    );

    // stageの位置を0,0に設定して、親コンテナの中心が表示されるようにする
    pixiRefs.appRef.current.stage.position.set(0, 0);

    // スクロール位置も中央に設定
    const scrollContainer = pixiRefs.pixiContainerRef.current?.parentElement;
    if (scrollContainer) {
      // 親コンテナが中央に来るようにスクロール位置を計算
      const parentWidth =
        pixiRefs.appRef.current.screen.width * parentContainerSize.width;
      const parentHeight =
        pixiRefs.appRef.current.screen.height * parentContainerSize.height;
      const viewWidth = pixiRefs.appRef.current.screen.width;
      const viewHeight = pixiRefs.appRef.current.screen.height;

      // 中央に配置するスクロール位置を計算
      const centerScrollX = (parentWidth - viewWidth) / 2;
      const centerScrollY = (parentHeight - viewHeight) / 2;

      // スクロール位置を中央に設定
      scrollContainer.scrollLeft = centerScrollX;
      scrollContainer.scrollTop = centerScrollY;

      // 初期位置ではスクロールバーを非表示に
      setShowScrollbars(false);
    }
  };

  // サイズ表示テキストを作成する関数
  const createSizeDisplay = () => {
    if (!pixiRefs.sizeContainerRef.current || !pixiRefs.spriteRef.current)
      return;

    // 既存のサイズ表示があれば削除
    if (pixiRefs.sizeTextRef.current && pixiRefs.sizeTextRef.current.parent) {
      pixiRefs.sizeTextRef.current.parent.removeChild(
        pixiRefs.sizeTextRef.current
      );
    }

    // テキストスタイルを設定
    const textStyle = new PIXI.TextStyle({
      fontFamily: "Arial",
      fontSize: 12,
      fill: 0x000000,
      align: "center",
    });

    // 実際の画像のサイズを計算（テクスチャの元のサイズ）
    const sprite = pixiRefs.spriteRef.current;

    // 現在の表示サイズを計算
    const displayWidth = Math.floor(Math.abs(sprite.width));
    const displayHeight = Math.floor(Math.abs(sprite.height));

    // サイズ表示テキストを作成
    const sizeText = new PIXI.Text({
      text: `${displayWidth} × ${displayHeight}`,
      style: textStyle,
    });

    // テキストのアンカーポイントを中央に設定
    sizeText.anchor.set(0.5, 0);

    // テキストの位置を更新
    updateSizeTextPosition(sizeText);

    // 参照を保存
    pixiRefs.sizeTextRef.current = sizeText;

    // コンテナに追加（画像ではなく）
    pixiRefs.sizeContainerRef.current.addChild(sizeText);

    // ステート変数も更新
    setImageWidth(displayWidth);
    setImageHeight(displayHeight);
  };

  // サイズテキストの位置を画像の位置に基づいて更新する関数
  const updateSizeTextPosition = (text = pixiRefs.sizeTextRef.current) => {
    if (!pixiRefs.spriteRef.current || !text) return;

    // 画像の位置を取得
    const sprite = pixiRefs.spriteRef.current;

    // テキストを画像の下に配置（画像の中ではなく）
    text.x = sprite.x;
    text.y = sprite.y + Math.abs(sprite.height) / 2 + 10;
  };

  // サイズ表示テキストの内容を更新する関数
  const updateSizeDisplayText = useCallback(() => {
    if (!pixiRefs.sizeTextRef.current || !pixiRefs.spriteRef.current) return;

    // 実際の表示サイズを計算（スケールと反転を考慮）
    const sprite = pixiRefs.spriteRef.current;
    // 小数点以下を切り捨て、整数値のみを扱う
    const displayWidth = Math.floor(Math.abs(sprite.width));
    const displayHeight = Math.floor(Math.abs(sprite.height));

    // テキストを更新
    pixiRefs.sizeTextRef.current.text = `${displayWidth} × ${displayHeight}`;

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
    if (
      !pixiRefs.spriteRef.current ||
      !pixiRefs.imageContainerRef.current ||
      !pixiRefs.appRef.current
    )
      return;

    try {
      // リセット中フラグをオン
      isResettingRef.current = true;

      // スクロールバーを非表示にする（先に設定）
      setShowScrollbars(false);

      // コンテナから全ての子要素（画像も含む）を削除
      pixiRefs.imageContainerRef.current.removeChildren();

      // スプライトを変数に保存して参照を維持
      const sprite = pixiRefs.spriteRef.current;

      // スプライトのプロパティを初期状態に戻す
      sprite.scale.set(initialImageStateRef.current.scale);
      sprite.position.set(
        initialImageStateRef.current.position.x,
        initialImageStateRef.current.position.y
      );
      sprite.rotation = initialImageStateRef.current.rotation;

      // フィルターをリセット
      resetFilters();

      // スプライトを再度コンテナに追加
      pixiRefs.imageContainerRef.current.addChild(sprite);

      // サイズ表示を追加
      createSizeDisplay();

      // コンテナを中央に配置
      centerContainer();

      // サイズ表示も更新（初期状態のサイズを反映）
      updateSizeDisplayText();

      // スクロール位置を中央に設定（タイマーで遅延実行して状態更新後に実行）
      setTimeout(() => {
        const scrollContainer =
          pixiRefs.pixiContainerRef.current?.parentElement;
        if (scrollContainer && pixiRefs.appRef.current) {
          // 親コンテナが中央に来るようにスクロール位置を計算
          const parentWidth =
            pixiRefs.appRef.current.screen.width * parentContainerSize.width;
          const parentHeight =
            pixiRefs.appRef.current.screen.height * parentContainerSize.height;
          const viewWidth = pixiRefs.appRef.current.screen.width;
          const viewHeight = pixiRefs.appRef.current.screen.height;

          // 中央に配置するスクロール位置を計算
          const centerScrollX = (parentWidth - viewWidth) / 2;
          const centerScrollY = (parentHeight - viewHeight) / 2;

          // スクロール位置を中央に設定
          scrollContainer.scrollLeft = centerScrollX;
          scrollContainer.scrollTop = centerScrollY;

          // リセット中フラグをオフ（少し遅延させる）
          setTimeout(() => {
            isResettingRef.current = false;
          }, 50);
        }
      }, 0);

      console.log("リセット完了: スプライトを再配置しました");
    } catch (error) {
      console.error("リセット中にエラーが発生しました:", error);
      isResettingRef.current = false;
    }
  };

  // 画像を回転させる関数
  const rotateImage = (degrees: number) => {
    if (!pixiRefs.spriteRef.current) return;

    // ラジアンに変換
    const radians = (degrees * Math.PI) / 180;

    // 現在の回転角に加算
    pixiRefs.spriteRef.current.rotation += radians;

    // サイズ表示を更新
    updateSizeDisplayText();
    updateSizeTextPosition();
  };

  // 画像を水平・垂直に反転させる関数
  const flipImage = (direction: "horizontal" | "vertical") => {
    if (!pixiRefs.spriteRef.current) return;

    if (direction === "horizontal") {
      // 水平反転（X軸方向のスケールの符号を反転）
      pixiRefs.spriteRef.current.scale.x *= -1;
    } else {
      // 垂直反転（Y軸方向のスケールの符号を反転）
      pixiRefs.spriteRef.current.scale.y *= -1;
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
            className="w-full h-full relative"
            style={{
              overflow: "auto",
              position: "relative",
              scrollbarWidth: "thin",
              scrollbarColor: "#888 #f1f1f1",
              ...(showScrollbars
                ? {}
                : {
                    msOverflowStyle: "none" /* IE, Edge */,
                    scrollbarWidth: "none" /* Firefox */,
                  }),
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                width: 8px;
                height: 8px;
              }
              div::-webkit-scrollbar-track {
                background: #f1f1f1;
              }
              div::-webkit-scrollbar-thumb {
                background: #888;
                border-radius: 4px;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: #555;
              }
              ${!showScrollbars
                ? `
                div::-webkit-scrollbar {
                  width: 0;
                  height: 0;
                  background: transparent;
                  display: none;
                }
                `
                : ""}
            `}</style>
            <div
              style={{
                width: `${parentContainerSize.width * 100}%`,
                height: `${parentContainerSize.height * 100}%`,
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: "none",
              }}
            />
            <div
              ref={pixiRefs.pixiContainerRef}
              className="w-full h-full"
              style={{
                position: "sticky",
                top: 0,
                left: 0,
              }}
            />
          </div>
        </main>
        <aside className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <div className="space-y-4">
            {/* グリッド設定 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">
                  グリッド設定
                </h3>
                <Switch
                  id="grid-toggle"
                  checked={showGrid}
                  onCheckedChange={setShowGrid}
                />
              </div>

              {showGrid && (
                <div className="space-y-3 rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="grid-size" className="text-sm">
                      グリッドサイズ
                    </Label>
                    <span className="text-sm font-medium text-gray-900">
                      {gridSize}px
                    </span>
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
            </div>

            {/* 画像サイズ表示 */}
            {pixiRefs.spriteRef.current && (
              <div className="rounded-lg border border-gray-200 p-3">
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  画像サイズ
                </h3>
                <div className="text-sm text-gray-500">
                  {imageWidth} × {imageHeight} px
                </div>
              </div>
            )}

            {/* 画像編集アコーディオン */}
            {pixiRefs.spriteRef.current && (
              <Accordion type="single" collapsible className="w-full">
                {/* 基本調整 */}
                <AccordionItem value="basic">
                  <AccordionTrigger className="py-2 text-sm">
                    基本調整
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {/* 明るさスライダー */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label
                            htmlFor="brightness-slider"
                            className="text-sm"
                          >
                            明るさ
                          </Label>
                          <span className="text-sm font-medium text-gray-900">
                            {brightness}
                          </span>
                        </div>
                        <Slider
                          id="brightness-slider"
                          min={-100}
                          max={100}
                          step={1}
                          value={[brightness]}
                          onValueChange={(value) => applyBrightness(value[0])}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>暗く</span>
                          <span>明るく</span>
                        </div>
                      </div>

                      {/* 彩度スライダー */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label
                            htmlFor="saturation-slider"
                            className="text-sm"
                          >
                            彩度
                          </Label>
                          <span className="text-sm font-medium text-gray-900">
                            {saturation}
                          </span>
                        </div>
                        <Slider
                          id="saturation-slider"
                          min={-100}
                          max={100}
                          step={1}
                          value={[saturation]}
                          onValueChange={(value) => applySaturation(value[0])}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>低く</span>
                          <span>高く</span>
                        </div>
                      </div>

                      {/* コントラストスライダー */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label htmlFor="contrast-slider" className="text-sm">
                            コントラスト
                          </Label>
                          <span className="text-sm font-medium text-gray-900">
                            {contrast}
                          </span>
                        </div>
                        <Slider
                          id="contrast-slider"
                          min={-100}
                          max={100}
                          step={1}
                          value={[contrast]}
                          onValueChange={(value) => applyContrast(value[0])}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>低く</span>
                          <span>高く</span>
                        </div>
                      </div>

                      {/* 色相回転スライダー */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label
                            htmlFor="hue-rotation-slider"
                            className="text-sm"
                          >
                            色相回転
                          </Label>
                          <span className="text-sm font-medium text-gray-900">
                            {hueRotation}°
                          </span>
                        </div>
                        <Slider
                          id="hue-rotation-slider"
                          min={0}
                          max={360}
                          step={1}
                          value={[hueRotation]}
                          onValueChange={(value) => applyHueRotation(value[0])}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0°</span>
                          <span>360°</span>
                        </div>
                      </div>

                      {/* セピア効果スライダー */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label htmlFor="sepia-slider" className="text-sm">
                            セピア
                          </Label>
                          <span className="text-sm font-medium text-gray-900">
                            {sepiaIntensity}
                          </span>
                        </div>
                        <Slider
                          id="sepia-slider"
                          min={0}
                          max={100}
                          step={1}
                          value={[sepiaIntensity]}
                          onValueChange={(value) => applySepia(value[0])}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>なし</span>
                          <span>最大</span>
                        </div>
                      </div>

                      {/* ネガポジ反転 */}
                      <div className="flex items-center space-x-2 mt-2">
                        <Switch
                          id="invert-switch"
                          checked={isInverted}
                          onCheckedChange={applyInvert}
                        />
                        <Label htmlFor="invert-switch" className="text-sm">
                          ネガポジ反転
                        </Label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 特殊エフェクト */}
                <AccordionItem value="special-effects">
                  <AccordionTrigger className="py-2 text-sm">
                    特殊エフェクト
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <p className="text-xs text-gray-500 mb-2">
                        ワンクリックでエフェクトを適用できます
                      </p>

                      <Tabs defaultValue="tint" className="w-full">
                        <TabsList className="w-full mb-2 bg-gray-100 p-1 rounded-md">
                          <TabsTrigger
                            value="tint"
                            className="flex-1 px-2 py-1.5 text-xs rounded-sm font-medium"
                          >
                            ティント
                          </TabsTrigger>
                          <TabsTrigger
                            value="effects"
                            className="flex-1 px-2 py-1.5 text-xs rounded-sm font-medium"
                          >
                            特殊効果
                          </TabsTrigger>
                          <TabsTrigger
                            value="blend"
                            className="flex-1 px-2 py-1.5 text-xs rounded-sm font-medium"
                          >
                            ブレンド
                          </TabsTrigger>
                        </TabsList>

                        {/* ティント タブ */}
                        <TabsContent value="tint" className="mt-2">
                          <div className="grid grid-cols-3 gap-2 place-items-center">
                            <button
                              className={`rounded-full h-10 w-10 bg-red-500 hover:bg-red-600 transition-all ${
                                activeColorTint === 0xff0000
                                  ? "scale-110 ring-2 ring-red-300"
                                  : ""
                              }`}
                              onClick={() => applyTint(0xff0000)}
                              aria-label="赤色ティント"
                            ></button>
                            <button
                              className={`rounded-full h-10 w-10 bg-green-500 hover:bg-green-600 transition-all ${
                                activeColorTint === 0x00ff00
                                  ? "scale-110 ring-2 ring-green-300"
                                  : ""
                              }`}
                              onClick={() => applyTint(0x00ff00)}
                              aria-label="緑色ティント"
                            ></button>
                            <button
                              className={`rounded-full h-10 w-10 bg-blue-500 hover:bg-blue-600 transition-all ${
                                activeColorTint === 0x0000ff
                                  ? "scale-110 ring-2 ring-blue-300"
                                  : ""
                              }`}
                              onClick={() => applyTint(0x0000ff)}
                              aria-label="青色ティント"
                            ></button>
                            <button
                              className={`rounded-full h-10 w-10 bg-yellow-400 hover:bg-yellow-500 transition-all ${
                                activeColorTint === 0xffff00
                                  ? "scale-110 ring-2 ring-yellow-200"
                                  : ""
                              }`}
                              onClick={() => applyTint(0xffff00)}
                              aria-label="黄色ティント"
                            ></button>
                            <button
                              className={`rounded-full h-10 w-10 bg-purple-500 hover:bg-purple-600 transition-all ${
                                activeColorTint === 0x800080
                                  ? "scale-110 ring-2 ring-purple-300"
                                  : ""
                              }`}
                              onClick={() => applyTint(0x800080)}
                              aria-label="紫色ティント"
                            ></button>
                            <button
                              className={`rounded-full h-10 w-10 bg-pink-500 hover:bg-pink-600 transition-all ${
                                activeColorTint === 0xff00ff
                                  ? "scale-110 ring-2 ring-pink-300"
                                  : ""
                              }`}
                              onClick={() => applyTint(0xff00ff)}
                              aria-label="ピンク色ティント"
                            ></button>
                            <button
                              className={`rounded-full h-10 w-10 bg-orange-500 hover:bg-orange-600 transition-all ${
                                activeColorTint === 0xffa500
                                  ? "scale-110 ring-2 ring-orange-300"
                                  : ""
                              }`}
                              onClick={() => applyTint(0xffa500)}
                              aria-label="オレンジ色ティント"
                            ></button>
                            <button
                              className={`rounded-full h-10 w-10 bg-teal-500 hover:bg-teal-600 transition-all ${
                                activeColorTint === 0x008080
                                  ? "scale-110 ring-2 ring-teal-300"
                                  : ""
                              }`}
                              onClick={() => applyTint(0x008080)}
                              aria-label="ティール色ティント"
                            ></button>
                            <button
                              className={`rounded-full h-10 w-10 bg-indigo-500 hover:bg-indigo-600 transition-all ${
                                activeColorTint === 0x4b0082
                                  ? "scale-110 ring-2 ring-indigo-300"
                                  : ""
                              }`}
                              onClick={() => applyTint(0x4b0082)}
                              aria-label="インディゴ色ティント"
                            ></button>
                          </div>
                        </TabsContent>

                        {/* 特殊効果 タブ */}
                        <TabsContent value="effects" className="mt-2">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              className={`p-2 text-sm font-medium rounded transition-colors flex items-center justify-center
                                ${
                                  activeLSD
                                    ? "bg-blue-500 text-white hover:bg-blue-600"
                                    : "bg-gray-100 hover:bg-gray-200"
                                }`}
                              onClick={() => applyLSD()}
                            >
                              サイケデリック
                            </button>
                            <button
                              className={`p-2 text-sm font-medium rounded transition-colors flex items-center justify-center
                                ${
                                  activeNight
                                    ? "bg-blue-500 text-white hover:bg-blue-600"
                                    : "bg-gray-100 hover:bg-gray-200"
                                }`}
                              onClick={() => applyNight()}
                            >
                              夜間モード
                            </button>
                            <button
                              className={`p-2 text-sm font-medium rounded transition-colors flex items-center justify-center
                                ${
                                  activePredator
                                    ? "bg-blue-500 text-white hover:bg-blue-600"
                                    : "bg-gray-100 hover:bg-gray-200"
                                }`}
                              onClick={() => applyPredator()}
                            >
                              熱感知
                            </button>
                            <button
                              className={`p-2 text-sm font-medium rounded transition-colors flex items-center justify-center
                                ${
                                  activeTechnicolor
                                    ? "bg-blue-500 text-white hover:bg-blue-600"
                                    : "bg-gray-100 hover:bg-gray-200"
                                }`}
                              onClick={() => applyTechnicolor()}
                            >
                              テクニカラー
                            </button>
                            <button
                              className={`p-2 text-sm font-medium rounded transition-colors flex items-center justify-center
                                ${
                                  activeToBGR
                                    ? "bg-blue-500 text-white hover:bg-blue-600"
                                    : "bg-gray-100 hover:bg-gray-200"
                                }`}
                              onClick={() => applyToBGR()}
                            >
                              RGB反転
                            </button>
                            <button
                              className={`p-2 text-sm font-medium rounded transition-colors flex items-center justify-center
                                ${
                                  activeVintage
                                    ? "bg-blue-500 text-white hover:bg-blue-600"
                                    : "bg-gray-100 hover:bg-gray-200"
                                }`}
                              onClick={() => applyVintage()}
                            >
                              ビンテージ
                            </button>
                          </div>
                        </TabsContent>

                        {/* ブレンド タブ */}
                        <TabsContent value="blend" className="mt-2">
                          <div>
                            <div className="flex items-center justify-between">
                              <Label
                                htmlFor="blend-mode-select"
                                className="text-sm"
                              >
                                ブレンドモード
                              </Label>
                            </div>
                            <Select
                              defaultValue="normal"
                              onValueChange={(value) => {
                                setBlendMode(value);
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="通常" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">通常</SelectItem>
                                <SelectItem value="color">カラー</SelectItem>
                                <SelectItem value="multiply">乗算</SelectItem>
                                <SelectItem value="screen">
                                  スクリーン
                                </SelectItem>
                                <SelectItem value="overlay">
                                  オーバーレイ
                                </SelectItem>
                                <SelectItem value="darken">
                                  比較（暗）
                                </SelectItem>
                                <SelectItem value="lighten">
                                  比較（明）
                                </SelectItem>
                                <SelectItem value="color-dodge">
                                  覆い焼き
                                </SelectItem>
                                <SelectItem value="color-burn">
                                  焼き込み
                                </SelectItem>
                                <SelectItem value="hard-light">
                                  ハードライト
                                </SelectItem>
                                <SelectItem value="soft-light">
                                  ソフトライト
                                </SelectItem>
                                <SelectItem value="difference">
                                  差の絶対値
                                </SelectItem>
                                <SelectItem value="exclusion">除外</SelectItem>
                                <SelectItem value="hue">色相</SelectItem>
                                <SelectItem value="saturation">彩度</SelectItem>
                                <SelectItem value="luminosity">輝度</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                              画像全体のブレンドモードを変更します
                            </p>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ぼかし効果 */}
                <AccordionItem value="blur">
                  <AccordionTrigger className="py-2 text-sm">
                    ぼかし効果
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {/* 通常ぼかし */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label htmlFor="blur-slider" className="text-sm">
                            全体ぼかし
                          </Label>
                          <span className="text-sm font-medium text-gray-900">
                            {blurStrength}
                          </span>
                        </div>
                        <Slider
                          id="blur-slider"
                          min={0}
                          max={20}
                          step={1}
                          value={[blurStrength]}
                          onValueChange={(value) => applyBlur(value[0])}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>なし</span>
                          <span>強く</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          画像全体をぼかします
                        </p>
                      </div>

                      {/* 水平ぼかし */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label
                            htmlFor="horizontal-blur-slider"
                            className="text-sm"
                          >
                            水平ぼかし
                          </Label>
                          <span className="text-sm font-medium text-gray-900">
                            {horizontalBlurStrength}
                          </span>
                        </div>
                        <Slider
                          id="horizontal-blur-slider"
                          min={0}
                          max={20}
                          step={1}
                          value={[horizontalBlurStrength]}
                          onValueChange={(value) =>
                            applyHorizontalBlur(value[0])
                          }
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>なし</span>
                          <span>強く</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          水平方向のぼかします
                        </p>
                      </div>

                      {/* 垂直ぼかし */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label
                            htmlFor="vertical-blur-slider"
                            className="text-sm"
                          >
                            垂直ぼかし
                          </Label>
                          <span className="text-sm font-medium text-gray-900">
                            {verticalBlurStrength}
                          </span>
                        </div>
                        <Slider
                          id="vertical-blur-slider"
                          min={0}
                          max={20}
                          step={1}
                          value={[verticalBlurStrength]}
                          onValueChange={(value) => applyVerticalBlur(value[0])}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>なし</span>
                          <span>強く</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          垂直方向のぼかします
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 高度な調整 */}
                <AccordionItem value="advanced">
                  <AccordionTrigger className="py-2 text-sm">
                    高度な調整
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {/* 透明度 */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label htmlFor="alpha-slider" className="text-sm">
                            透明度
                          </Label>
                          <span className="text-sm font-medium text-gray-900">
                            {alpha}%
                          </span>
                        </div>
                        <Slider
                          id="alpha-slider"
                          min={0}
                          max={100}
                          step={1}
                          value={[alpha]}
                          onValueChange={(value) => applyAlpha(value[0])}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>透明</span>
                          <span>不透明</span>
                        </div>
                      </div>

                      {/* ブレンドモードをタブに移動したので削除 */}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 変形 */}
                <AccordionItem value="transform">
                  <AccordionTrigger className="py-2 text-sm">
                    画像変形
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        回転/反転
                      </h3>

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
                          onClick={() => flipImage("horizontal")}
                        >
                          水平反転
                        </button>
                        <button
                          className="p-2 bg-gray-100 hover:bg-gray-200 text-sm font-medium rounded transition-colors flex items-center justify-center"
                          onClick={() => flipImage("vertical")}
                        >
                          垂直反転
                        </button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {/* リセットボタン */}
            {pixiRefs.spriteRef.current && (
              <div className="pt-2">
                <button
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors"
                  onClick={resetImageTransform}
                >
                  すべてリセット
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  位置・サイズ・回転・画像加工をすべて初期状態に戻します
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
