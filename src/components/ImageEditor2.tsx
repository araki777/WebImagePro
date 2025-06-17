"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
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
import { FaceDetectionMode, useFaceDetection } from "@/hooks/useFaceDetection";
import { useImageFilters } from "@/hooks/useImageFilters";
import { usePixiRefs } from "@/hooks/usePixiRefs";
import { usePixiSetup } from "@/hooks/usePixiSetup";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import * as PIXI from "pixi.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// WebAssemblyモジュールを直接インポート
import {
  ObjectDetectionMode,
  useObjectDetection,
} from "@/hooks/useObjectDetection";
import init from "@araki777/wasm-image-pro";
// import init from "../../wasm/pkg/wasm_image_pro";

// wasmModuleをany型として宣言
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wasmModule: any;
let wasmInitError: Error | null = null;
let wasmInitialized = false;

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { imagesApi } from "@/lib/api/images";
import { Loader } from "lucide-react";

export default function ImageEditor2() {
  const t = useTranslations("ImageEditor2");
  const router = useRouter();
  // 状態管理
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const [parentContainerSize] = useState({ width: 10, height: 10 }); // 親コンテナの初期サイズは画面の10倍
  const [showScrollbars, setShowScrollbars] = useState(false); // スクロールバーの表示状態
  const [isWasmLoading, setIsWasmLoading] = useState(true); // Wasm読み込み状態
  const [wasmError, setWasmError] = useState<string | null>(null); // Wasmエラー状態
  const isResettingRef = useRef(false); // リセット中かどうかのフラグ
  const [faceDetectionMode, setFaceDetectionMode] =
    useState<FaceDetectionMode | null>(null);
  const [objectDetectionMode, setObjectDetectionMode] =
    useState<ObjectDetectionMode | null>(null);
  const [editingImage, setEditingImage] = useState<{
    name: string;
    url: string;
  } | null>(null);
  // 検出タイプの選択状態
  const [selectedDetection, setSelectedDetection] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMode, setSaveMode] = useState<"edit" | "new">("edit");
  const [isShared, setIsShared] = useState(false);

  // 認証関連
  const searchParams = useSearchParams();
  const { userProfiles, checkUser, signOut } = useAuthStore();

  // PIXI.jsの参照
  const pixiRefs = usePixiRefs();

  // 顔検出のフックを使用
  const { detectFaces, clearFaceDetection, redrawFacesForSave } =
    useFaceDetection(pixiRefs.spriteRef, pixiRefs.imageContainerRef, imageUrl);

  const { detectObjects, clearObjectDetection, redrawBoxesForSave } =
    useObjectDetection(
      pixiRefs.spriteRef,
      pixiRefs.imageContainerRef,
      imageUrl
    );

  const loadImage = useCallback(async () => {
    if (
      !imageUrl ||
      !pixiRefs.appRef.current ||
      !pixiRefs.imageContainerRef.current ||
      !pixiRefs.componentContainerRef.current
    )
      return;

    try {
      await loadImageFromUrl(imageUrl);
    } catch (error) {
      console.error("画像の読み込みに失敗しました:", error);
    }
  }, [
    imageUrl,
    pixiRefs.appRef.current,
    pixiRefs.imageContainerRef.current,
    pixiRefs.componentContainerRef.current,
  ]);

  const loadImageFromUrl = async (url: string) => {
    if (
      !pixiRefs.appRef.current ||
      !pixiRefs.imageContainerRef.current ||
      !pixiRefs.componentContainerRef.current
    )
      return;

    try {
      // BlobURLかどうかを確認
      const isBlobUrl = url.startsWith("blob:");

      let textureToUse;
      if (isBlobUrl) {
        console.log("BlobURLからテクスチャを作成します:", url);

        // 画像要素を作成
        const img = new Image();

        // 画像が読み込まれたらテクスチャを作成するPromise
        const imageLoaded = new Promise<PIXI.Texture>((resolve, reject) => {
          img.onload = () => {
            try {
              // 画像からテクスチャを作成
              const newTexture = PIXI.Texture.from(img);
              resolve(newTexture);
            } catch (e) {
              reject(e);
            }
          };
          img.onerror = (e) =>
            reject(new Error(`画像の読み込みに失敗しました: ${e}`));
        });

        // BlobURLを直接img要素にセット
        img.src = url;

        // テクスチャが準備できるまで待機
        textureToUse = await imageLoaded;

        console.log("Blob URLからテクスチャを作成しました");
      } else {
        // 通常のURLの場合は標準的な方法でロード
        textureToUse = await PIXI.Assets.load(url);
      }

      const sprite = new PIXI.Sprite(textureToUse);

      // スプライトのアンカーポイントを中心に設定
      sprite.anchor.set(0.5);

      // スプライトの位置は0,0に設定（コンテナの中心）
      sprite.x = 0;
      sprite.y = 0;

      // キャンバスサイズを確認または再計算
      let canvasWidth = pixiRefs.appRef.current?.screen.width || 0;
      let canvasHeight = pixiRefs.appRef.current?.screen.height || 0;

      // キャンバスサイズが不正な場合はウィンドウサイズから計算
      if (canvasWidth <= 10 || canvasHeight <= 10) {
        const sidebar = 64; // サイドバーの幅（実際の幅に合わせて調整）
        canvasWidth = window.innerWidth - sidebar;
        canvasHeight = window.innerHeight - 56; // ヘッダーの高さを引く
      }

      // 余白を考慮する係数
      const marginFactor = 0.8;

      // スケールを計算（キャンバスサイズとウィンドウサイズを考慮）
      const scale = Math.min(
        (canvasWidth * marginFactor) / sprite.width,
        (canvasHeight * marginFactor) / sprite.height
      );

      // スケール計算のデバッグログを追加
      console.log("画像読み込み時のサイズ情報:", {
        canvasWidth,
        canvasHeight,
        spriteWidth: sprite.width,
        spriteHeight: sprite.height,
        calculatedScale: scale,
      });

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

      // 画像名をURLから推測してセット（クエリパラメータ除去）
      const urlObj = new URL(url, window.location.origin);
      const pathname = urlObj.pathname;
      const name = pathname.split("/").pop() || "image.png";
      setEditingImage({ name, url });

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
  };

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
    const url = searchParams?.get("url");
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

    const initializeWasm = async () => {
      // すでに初期化されている場合はスキップ
      if (wasmInitialized) {
        setIsWasmLoading(false);
        return;
      }

      // すでにエラーが発生している場合はエラーを表示
      if (wasmInitError) {
        setWasmError(wasmInitError.message || "不明なエラー");
        setIsWasmLoading(false);
        return;
      }

      try {
        console.log("WebAssemblyモジュール初期化中...");
        setIsWasmLoading(true);

        // 初期化が失敗した場合のフォールバックタイマー
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () =>
              reject(new Error("WebAssemblyの読み込みがタイムアウトしました")),
            10000
          );
        });

        // WebAssemblyモジュールを初期化し、エクスポートされた関数を取得
        wasmModule = await Promise.race([init(), timeoutPromise]);
        wasmInitialized = true;
        console.log("WebAssemblyモジュール初期化成功", wasmModule);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Wasmの初期化に失敗しました:", error);
        wasmInitError = error;
        setWasmError(error?.message || "不明なエラー");
      } finally {
        setIsWasmLoading(false);
      }
    };

    initializeWasm();

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

  // 顔検出ボタンのクリックハンドラ
  const handleFaceDetection = async (mode: FaceDetectionMode) => {
    setFaceDetectionMode(mode);
    const result = await detectFaces(mode);
    console.log(result);
    if (!result) {
      toast.error("検出できませんでした");
    }
  };

  // 顔検出のクリア
  const handleClearFaceDetection = () => {
    setFaceDetectionMode(null);
    clearFaceDetection();
  };

  // 物体検出ボタンのクリックハンドラ
  const handleObjectDetection = async () => {
    setObjectDetectionMode("outline");
    const result = await detectObjects();
    if (!result) {
      toast.error("検出できませんでした");
    }
  };

  // オブジェクト検出をクリアする関数
  const handleClearObjectDetection = () => {
    setObjectDetectionMode(null);
    clearObjectDetection();
  };

  const onSaveEdit = async (isNewImage: boolean) => {
    if (
      !pixiRefs.appRef.current ||
      !pixiRefs.spriteRef.current ||
      !pixiRefs.imageContainerRef.current
    )
      return;

    setIsSaving(true);

    try {
      // 元画像のサイズを取得
      const sprite = pixiRefs.spriteRef.current;
      const width = sprite.texture.width;
      const height = sprite.texture.height;

      // オフスクリーンcanvasを作成
      const offscreen = document.createElement("canvas");
      offscreen.width = width;
      offscreen.height = height;
      const ctx = offscreen.getContext("2d");
      if (!ctx) throw new Error("Canvas contextの取得に失敗しました");

      // spriteの現在の状態を保存
      const oldScale = sprite.scale.clone();
      const oldPosition = sprite.position.clone();
      const oldRotation = sprite.rotation;

      // spriteを元画像サイズ・中央・回転なしに一時リセット
      sprite.scale.set(1, 1);
      sprite.position.set(width / 2, height / 2);
      sprite.rotation = 0;

      // 物体検出フレームも保存用状態で再描画
      redrawBoxesForSave(sprite);
      // 顔検出（枠・ぼかし）も保存用状態で再描画
      if (faceDetectionMode) {
        await redrawFacesForSave(faceDetectionMode, sprite);
      }

      // RenderTextureを作成し、imageContainerRefを描画
      const renderer = pixiRefs.appRef.current.renderer;
      const renderTexture = PIXI.RenderTexture.create({ width, height });
      renderer.render(pixiRefs.imageContainerRef.current, { renderTexture });

      // RenderTextureの内容をbase64データURLとして取得し、Image経由でcanvasに描画
      const dataUrl = await renderer.extract.base64(renderTexture);
      await new Promise<void>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          resolve();
        };
        img.onerror = (e) => reject(e);
        img.src = dataUrl;
      });

      // 後始末
      renderTexture.destroy(true);

      // spriteを元の状態に戻す
      sprite.scale = oldScale;
      sprite.position = oldPosition;
      sprite.rotation = oldRotation;
      // 物体検出フレームも元の状態で再描画
      redrawBoxesForSave(sprite);

      // canvasからBlobを生成
      const blob = await new Promise<Blob>((resolve, reject) => {
        offscreen.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Blob生成に失敗しました"));
        }, "image/png");
      });

      // ファイル名を決定
      const fileName = isNewImage
        ? `copy_${editingImage?.name ?? "image"}.png`
        : `${editingImage?.name ?? "image"}.png`;

      // Fileを作成
      const file = new File([blob], fileName, { type: blob.type });

      // アップロード処理
      const formData = new FormData();
      formData.append("file", file);
      formData.append("isShared", isShared.toString());
      formData.append("userId", userProfiles?.id || "");

      const uploadResponse = await imagesApi.full_upload(
        {
          file: file.name,
          target_langs: ["ja", "en"],
        },
        isShared
      );
      if (!uploadResponse) {
        toast.error("アップロードに失敗しました");
        return;
      }

      // 上書き保存の場合は元画像を削除
      if (!isNewImage && editingImage?.url) {
        const encodedUrl = btoa(editingImage.url);
        const deleteResponse = await imagesApi.delete(encodedUrl);
        if (!deleteResponse) {
          toast.error("削除に失敗しました");
          return;
        }
      }
      router.push("/gallery");
      toast.success(isNewImage ? "新規保存しました" : "上書き保存しました");
    } catch (error) {
      console.error("画像の保存エラー:", error);
      toast.error("保存に失敗しました");
      setIsSaving(false);
    }
  };

  // 保存モードの切り替え
  const handleSaveModeChange = (mode: "edit" | "new") => {
    setSaveMode(mode);
  };

  // 共有設定の切り替え
  const handleSharedChange = (shared: boolean) => {
    setIsShared(shared);
  };

  useEffect(() => {
    // パフォーマンスAPIを使用してリロードを検出
    const isReload =
      window.performance &&
      window.performance.navigation.type ===
        window.performance.navigation.TYPE_RELOAD;

    // リロード時は少し遅延させてキャンバスサイズを確実に取得してから画像をロード
    if (isReload && imageUrl) {
      const timer = setTimeout(() => {
        loadImage();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [imageUrl]);

  useEffect(() => {
    const handleResizeEnd = () => {
      if (pixiRefs.spriteRef.current && pixiRefs.appRef.current) {
        // 画面サイズ変更後にスケールを再計算
        const canvasWidth = pixiRefs.appRef.current.screen.width;
        const canvasHeight = pixiRefs.appRef.current.screen.height;
        const marginFactor = 0.8;

        const sprite = pixiRefs.spriteRef.current;
        const newScale = Math.min(
          (canvasWidth * marginFactor) / sprite.texture.width,
          (canvasHeight * marginFactor) / sprite.texture.height
        );

        // 初期状態を更新
        initialImageStateRef.current.scale = newScale;

        // リセット処理を呼び出して適用
        resetImageTransform();
      }
    };

    let resizeTimer: number;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(handleResizeEnd, 300);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!imageUrl) return;

    // リロード状態の確認
    const isReload =
      window.performance &&
      window.performance.navigation.type ===
        window.performance.navigation.TYPE_RELOAD;

    if (isReload) {
      console.log("リロード検出 - リサイズ処理を予約");

      // DOM完全初期化を待つため長めの遅延を設定
      const timer = setTimeout(() => {
        if (pixiRefs.appRef.current && pixiRefs.pixiContainerRef.current) {
          const parent = pixiRefs.pixiContainerRef.current.parentElement;
          if (parent) {
            console.log(
              "リロード後のリサイズ実行:",
              parent.clientWidth,
              parent.clientHeight
            );

            // 親要素のサイズに合わせてキャンバスを明示的にリサイズ
            pixiRefs.appRef.current.renderer.resize(
              parent.clientWidth,
              parent.clientHeight
            );

            // 画像を強制的に再ロード
            loadImage();
          }
        }
      }, 500); // 長めの遅延を設定

      return () => clearTimeout(timer);
    }
  }, [imageUrl]);

  if (!userProfiles) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (isWasmLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-sm text-gray-600">{t("wasmLoading")}</p>
      </div>
    );
  }

  if (wasmError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 p-4 rounded-lg max-w-md">
          <h2 className="text-red-700 text-lg font-medium mb-2">
            {t("error.title")}
          </h2>
          <p className="text-red-600 mb-4">{t("error.wasmLoad")}</p>
          <p className="text-sm text-gray-700 mb-4">{wasmError}</p>
          <div className="flex justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {t("error.reload")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ローディング画面
  if (isSaving) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center fixed inset-0 z-50">
        <div className="flex flex-col items-center">
          <Loader className="w-12 h-12 text-black animate-spin mb-4" />
          <h2 className="text-2xl font-medium text-black">{t("saving")}...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header
        onLogout={signOut}
        userImage={userProfiles?.avatar_url || undefined}
        userName={userProfiles?.display_name || "No Names"}
      />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 relative">
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
        <aside className="w-64 border-l p-4 overflow-y-auto">
          <div className="space-y-4">
            {/* グリッド設定 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">
                  {t("grid.title")}
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
                      {t("grid.size")}
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

            {/* 画像編集アコーディオン */}
            {pixiRefs.spriteRef.current && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="detection">
                  <AccordionTrigger className="py-2 text-sm">
                    {t("detection.title")}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div>
                        <Select
                          onValueChange={(value) => setSelectedDetection(value)}
                          value={selectedDetection}
                        >
                          <SelectTrigger className="w-full mt-2">
                            <SelectValue
                              placeholder={t("detection.selectPlaceholder")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="face-outline">
                              {t("faceDetection.showOutline")}
                            </SelectItem>
                            <SelectItem value="face-blur">
                              {t("faceDetection.blur")}
                            </SelectItem>
                            <SelectItem value="object">
                              {t("objectDetection.title")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* 検出ボタン */}
                      {faceDetectionMode ||
                      faceDetectionMode ||
                      objectDetectionMode ? (
                        <Button
                          className="w-full mt-2 bg-gray-500 hover:bg-gray-600"
                          onClick={() => {
                            handleClearFaceDetection();
                            handleClearObjectDetection();
                          }}
                        >
                          クリア
                        </Button>
                      ) : (
                        <Button
                          className="w-full mt-2 bg-indigo-500 hover:bg-indigo-600"
                          onClick={() => {
                            if (selectedDetection === "face-outline")
                              handleFaceDetection("outline");
                            else if (selectedDetection === "face-blur")
                              handleFaceDetection("blur");
                            else if (selectedDetection === "object")
                              handleObjectDetection();
                          }}
                          disabled={!selectedDetection}
                        >
                          検出する
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {/* 基本調整 */}
                <AccordionItem value="basic">
                  <AccordionTrigger className="py-2 text-sm">
                    {t("accordion.basic")}
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
                            {t("brightness")}
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
                          <span>{t("brightnessLow")}</span>
                          <span>{t("brightnessHigh")}</span>
                        </div>
                      </div>
                      {/* 彩度スライダー */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label
                            htmlFor="saturation-slider"
                            className="text-sm"
                          >
                            {t("saturation")}
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
                          <span>{t("saturationLow")}</span>
                          <span>{t("saturationHigh")}</span>
                        </div>
                      </div>
                      {/* コントラストスライダー */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label htmlFor="contrast-slider" className="text-sm">
                            {t("contrast")}
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
                          <span>{t("contrastLow")}</span>
                          <span>{t("contrastHigh")}</span>
                        </div>
                      </div>
                      {/* 色相回転スライダー */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label
                            htmlFor="hue-rotation-slider"
                            className="text-sm"
                          >
                            {t("hueRotation")}
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
                            {t("sepia")}
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
                          <span>{t("sepiaNone")}</span>
                          <span>{t("sepiaMax")}</span>
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
                          {t("invert")}
                        </Label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 特殊エフェクト */}
                <AccordionItem value="special-effects">
                  <AccordionTrigger className="py-2 text-sm">
                    {t("accordion.specialEffects")}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <p className="text-xs text-gray-500 mb-2">
                        {t("specialEffects.desc")}
                      </p>
                      <Tabs defaultValue="tint" className="w-full">
                        <TabsList className="w-full mb-2 bg-gray-100 p-1 rounded-md">
                          <TabsTrigger
                            value="tint"
                            className="flex-1 px-2 py-1.5 text-xs rounded-sm font-medium"
                          >
                            {t("specialEffects.tint")}
                          </TabsTrigger>
                          <TabsTrigger
                            value="effects"
                            className="flex-1 px-2 py-1.5 text-xs rounded-sm font-medium"
                          >
                            {t("specialEffects.effects")}
                          </TabsTrigger>
                          <TabsTrigger
                            value="blend"
                            className="flex-1 px-2 py-1.5 text-xs rounded-sm font-medium"
                          >
                            {t("specialEffects.blend")}
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
                              aria-label={t("tint.red")}
                            ></button>
                            <button
                              className={`rounded-full h-10 w-10 bg-green-500 hover:bg-green-600 transition-all ${
                                activeColorTint === 0x00ff00
                                  ? "scale-110 ring-2 ring-green-300"
                                  : ""
                              }`}
                              onClick={() => applyTint(0x00ff00)}
                              aria-label={t("tint.green")}
                            ></button>
                            <button
                              className={`rounded-full h-10 w-10 bg-blue-500 hover:bg-blue-600 transition-all ${
                                activeColorTint === 0x0000ff
                                  ? "scale-110 ring-2 ring-blue-300"
                                  : ""
                              }`}
                              onClick={() => applyTint(0x0000ff)}
                              aria-label={t("tint.blue")}
                            ></button>
                            <button
                              className={`rounded-full h-10 w-10 bg-yellow-400 hover:bg-yellow-500 transition-all ${
                                activeColorTint === 0xffff00
                                  ? "scale-110 ring-2 ring-yellow-200"
                                  : ""
                              }`}
                              onClick={() => applyTint(0xffff00)}
                              aria-label={t("tint.yellow")}
                            ></button>
                            <button
                              className={`rounded-full h-10 w-10 bg-purple-500 hover:bg-purple-600 transition-all ${
                                activeColorTint === 0x800080
                                  ? "scale-110 ring-2 ring-purple-300"
                                  : ""
                              }`}
                              onClick={() => applyTint(0x800080)}
                              aria-label={t("tint.purple")}
                            ></button>
                            <button
                              className={`rounded-full h-10 w-10 bg-pink-500 hover:bg-pink-600 transition-all ${
                                activeColorTint === 0xff00ff
                                  ? "scale-110 ring-2 ring-pink-300"
                                  : ""
                              }`}
                              onClick={() => applyTint(0xff00ff)}
                              aria-label={t("tint.pink")}
                            ></button>
                            <button
                              className={`rounded-full h-10 w-10 bg-orange-500 hover:bg-orange-600 transition-all ${
                                activeColorTint === 0xffa500
                                  ? "scale-110 ring-2 ring-orange-300"
                                  : ""
                              }`}
                              onClick={() => applyTint(0xffa500)}
                              aria-label={t("tint.orange")}
                            ></button>
                            <button
                              className={`rounded-full h-10 w-10 bg-teal-500 hover:bg-teal-600 transition-all ${
                                activeColorTint === 0x008080
                                  ? "scale-110 ring-2 ring-teal-300"
                                  : ""
                              }`}
                              onClick={() => applyTint(0x008080)}
                              aria-label={t("tint.teal")}
                            ></button>
                            <button
                              className={`rounded-full h-10 w-10 bg-indigo-500 hover:bg-indigo-600 transition-all ${
                                activeColorTint === 0x4b0082
                                  ? "scale-110 ring-2 ring-indigo-300"
                                  : ""
                              }`}
                              onClick={() => applyTint(0x4b0082)}
                              aria-label={t("tint.indigo")}
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
                              {t("effects.lsd")}
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
                              {t("effects.night")}
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
                              {t("effects.thermal")}
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
                              {t("effects.technicolor")}
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
                              {t("effects.tobgr")}
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
                              {t("effects.vintage")}
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
                                {t("blendMode")}
                              </Label>
                            </div>
                            <Select
                              defaultValue="normal"
                              onValueChange={(value) => {
                                setBlendMode(value);
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder={t("blend.normal")} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">
                                  {t("blend.normal")}
                                </SelectItem>
                                <SelectItem value="color">
                                  {t("blend.color")}
                                </SelectItem>
                                <SelectItem value="multiply">
                                  {t("blend.multiply")}
                                </SelectItem>
                                <SelectItem value="screen">
                                  {t("blend.screen")}
                                </SelectItem>
                                <SelectItem value="overlay">
                                  {t("blend.overlay")}
                                </SelectItem>
                                <SelectItem value="darken">
                                  {t("blend.darken")}
                                </SelectItem>
                                <SelectItem value="lighten">
                                  {t("blend.lighten")}
                                </SelectItem>
                                <SelectItem value="color-dodge">
                                  {t("blend.colorDodge")}
                                </SelectItem>
                                <SelectItem value="color-burn">
                                  {t("blend.colorBurn")}
                                </SelectItem>
                                <SelectItem value="hard-light">
                                  {t("blend.hardLight")}
                                </SelectItem>
                                <SelectItem value="soft-light">
                                  {t("blend.softLight")}
                                </SelectItem>
                                <SelectItem value="difference">
                                  {t("blend.difference")}
                                </SelectItem>
                                <SelectItem value="exclusion">
                                  {t("blend.exclusion")}
                                </SelectItem>
                                <SelectItem value="hue">
                                  {t("blend.hue")}
                                </SelectItem>
                                <SelectItem value="saturation">
                                  {t("blend.saturation")}
                                </SelectItem>
                                <SelectItem value="luminosity">
                                  {t("blend.luminosity")}
                                </SelectItem>
                                <p className="text-xs text-gray-500 mt-1">
                                  {t("blend.desc")}
                                </p>
                              </SelectContent>
                            </Select>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ぼかし効果 */}
                <AccordionItem value="blur">
                  <AccordionTrigger className="py-2 text-sm">
                    {t("accordion.blur")}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {/* 通常ぼかし */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label htmlFor="blur-slider" className="text-sm">
                            {t("blur.all")}
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
                          <span>{t("blur.none")}</span>
                          <span>{t("blur.strong")}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {t("blur.descAll")}
                        </p>
                      </div>
                      {/* 水平ぼかし */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label
                            htmlFor="horizontal-blur-slider"
                            className="text-sm"
                          >
                            {t("blur.horizontal")}
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
                          <span>{t("blur.none")}</span>
                          <span>{t("blur.strong")}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {t("blur.descHorizontal")}
                        </p>
                      </div>
                      {/* 垂直ぼかし */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label
                            htmlFor="vertical-blur-slider"
                            className="text-sm"
                          >
                            {t("blur.vertical")}
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
                          <span>{t("blur.none")}</span>
                          <span>{t("blur.strong")}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {t("blur.descVertical")}
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 高度な調整 */}
                <AccordionItem value="advanced">
                  <AccordionTrigger className="py-2 text-sm">
                    {t("accordion.advanced")}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {/* 透明度 */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label htmlFor="alpha-slider" className="text-sm">
                            {t("alpha")}
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
                          <span>{t("alphaTransparent")}</span>
                          <span>{t("alphaOpaque")}</span>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 変形 */}
                <AccordionItem value="transform">
                  <AccordionTrigger className="py-2 text-sm">
                    {t("accordion.transform")}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        {t("transform.title")}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          className="p-2 bg-gray-100 hover:bg-gray-200 text-sm font-medium rounded transition-colors flex items-center justify-center"
                          onClick={() => rotateImage(-90)}
                        >
                          {t("transform.left90")}
                        </button>
                        <button
                          className="p-2 bg-gray-100 hover:bg-gray-200 text-sm font-medium rounded transition-colors flex items-center justify-center"
                          onClick={() => rotateImage(90)}
                        >
                          {t("transform.right90")}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          className="p-2 bg-gray-100 hover:bg-gray-200 text-sm font-medium rounded transition-colors flex items-center justify-center"
                          onClick={() => flipImage("horizontal")}
                        >
                          {t("transform.flipH")}
                        </button>
                        <button
                          className="p-2 bg-gray-100 hover:bg-gray-200 text-sm font-medium rounded transition-colors flex items-center justify-center"
                          onClick={() => flipImage("vertical")}
                        >
                          {t("transform.flipV")}
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
                  {t("resetAll")}
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
      <div className="flex justify-between items-center p-4 border-t">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push("/gallery")}
            disabled={isSaving}
          >
            {t("cancel")}
          </Button>
          <div className="flex items-center space-x-4">
            <RadioGroup
              value={saveMode}
              onValueChange={(value: string) =>
                handleSaveModeChange(value as "edit" | "new")
              }
              className="flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="edit" id="edit" />
                <Label htmlFor="edit">{t("saveMode.overwrite")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new">{t("saveMode.new")}</Label>
              </div>
            </RadioGroup>
            <div className="flex items-center space-x-2">
              <Switch
                id="shared"
                checked={isShared}
                onCheckedChange={handleSharedChange}
              />
              <Label htmlFor="shared">{t("saveMode.shared")}</Label>
            </div>
          </div>
        </div>
        {pixiRefs.spriteRef.current && (
          <Button
            onClick={() => onSaveEdit(saveMode === "new")}
            disabled={isSaving}
          >
            {isSaving ? t("saving") : t("save")}
          </Button>
        )}
      </div>
    </div>
  );
}
