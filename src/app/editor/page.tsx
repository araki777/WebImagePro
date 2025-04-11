'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from "@/components/ui/header";
import { useAuthStore } from "@/store/useAuthStore";

export default function EditorPage() {
  // 状態管理
  const [imageUrl, setImageUrl] = useState<string | null>(null); // URLパラメータから取得した画像URL
  const [image, setImage] = useState<HTMLImageElement | null>(null); // 読み込んだ画像要素
  const [backgroundOffset, setBackgroundOffset] = useState({ x: 0, y: 0 }); // 背景キャンバスの位置オフセット
  const [isDragging, setIsDragging] = useState(false); // ドラッグ中かどうかの状態
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 }); // ドラッグ開始時の位置

  // 参照
  const canvasRef = useRef<HTMLCanvasElement>(null); // 画像を表示するキャンバス
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null); // 背景グリッドを表示するキャンバス
  const containerRef = useRef<HTMLDivElement>(null); // コンテナ要素

  // 認証関連
  const searchParams = useSearchParams();
  const { user, isLoading, checkUser, signOut } = useAuthStore();

  // 画像の読み込み処理
  useEffect(() => {
    const url = searchParams.get('url');
    console.log('URLパラメータ:', url);

    if (url) {
      setImageUrl(url);
      const img = new Image();
      img.crossOrigin = 'anonymous'; // CORS対応

      img.onload = () => {
        console.log('画像の読み込み成功:', {
          width: img.width,
          height: img.height,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        });
        setImage(img);
      };

      img.onerror = (error) => {
        console.error('画像の読み込みに失敗しました:', error);
      };

      console.log('画像の読み込みを開始します');
      img.src = url;
    } else {
      console.error('URLパラメータが見つかりません');
    }
  }, [searchParams]);

  // 背景キャンバスの初期化と描画
  useEffect(() => {
    const backgroundCanvas = backgroundCanvasRef.current;
    if (!backgroundCanvas) return;

    const ctx = backgroundCanvas.getContext('2d');
    if (!ctx) return;

    const parent = backgroundCanvas.parentElement;
    if (!parent) return;

    const parentWidth = parent.clientWidth;
    const parentHeight = parent.clientHeight;

    // キャンバスのサイズを画面の4倍に設定（無限スクロールのため）
    const canvasWidth = parentWidth * 4;
    const canvasHeight = parentHeight * 4;
    backgroundCanvas.width = canvasWidth;
    backgroundCanvas.height = canvasHeight;

    // グリッド線のパターンを作成
    const gridSize = 50;
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = gridSize;
    patternCanvas.height = gridSize;

    // パターンを作成して背景に適用（効率的なグリッド描画）
    const pattern = ctx.createPattern(patternCanvas, 'repeat');
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
  }, []);

  // 画像キャンバスの初期化と描画
  useEffect(() => {
    if (!image) {
      console.log('画像が読み込まれるのを待機中...');
      return;
    }

    const initializeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        console.log('キャンバスを待機中...');
        requestAnimationFrame(initializeCanvas);
        return;
      }

      const parent = canvas.parentElement;
      if (!parent) {
        console.error('親要素が見つかりません');
        return;
      }

      const parentWidth = parent.clientWidth;
      const parentHeight = parent.clientHeight;

      canvas.width = parentWidth;
      canvas.height = parentHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('2Dコンテキストの取得に失敗しました');
        return;
      }

      // 画像のアスペクト比を維持しながら、親要素の80%のサイズに収まるように計算
      const imageAspectRatio = image.width / image.height;
      const parentAspectRatio = parentWidth / parentHeight;

      let drawWidth, drawHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (imageAspectRatio > parentAspectRatio) {
        // 画像が横長の場合
        drawWidth = parentWidth * 0.8;
        drawHeight = drawWidth / imageAspectRatio;
        offsetX = (parentWidth - drawWidth) / 2;
        offsetY = (parentHeight - drawHeight) / 2;
      } else {
        // 画像が縦長の場合
        drawHeight = parentHeight * 0.8;
        drawWidth = drawHeight * imageAspectRatio;
        offsetX = (parentWidth - drawWidth) / 2;
        offsetY = (parentHeight - drawHeight) / 2;
      }

      // キャンバスをクリアして画像を描画
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

      // リサイズ時に再描画
      const observer = new ResizeObserver(() => {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageAspectRatio = image.width / image.height;
        const parentAspectRatio = parent.clientWidth / parent.clientHeight;

        let drawWidth, drawHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (imageAspectRatio > parentAspectRatio) {
          drawWidth = parent.clientWidth * 0.8;
          drawHeight = drawWidth / imageAspectRatio;
          offsetX = (parent.clientWidth - drawWidth) / 2;
          offsetY = (parent.clientHeight - drawHeight) / 2;
        } else {
          drawHeight = parent.clientHeight * 0.8;
          drawWidth = drawHeight * imageAspectRatio;
          offsetX = (parent.clientWidth - drawWidth) / 2;
          offsetY = (parent.clientHeight - drawHeight) / 2;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
      });

      observer.observe(parent);
      return () => observer.disconnect();
    };

    initializeCanvas();
  }, [image]);

  // 認証状態の確認
  useEffect(() => {
    checkUser();
  }, [checkUser]);

  // ドラッグイベントハンドラ
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - backgroundOffset.x,
      y: e.clientY - backgroundOffset.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    // ドラッグ範囲を制限せず、自由に移動できるように
    setBackgroundOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // タッチイベントハンドラ
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - backgroundOffset.x,
      y: touch.clientY - backgroundOffset.y
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];

    setBackgroundOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // ローディング中の表示
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden fixed inset-0">
      <Header
        onLogout={signOut}
        userImage={user.user_metadata.avatar_url}
        userName={user.user_metadata.full_name || user.email}
      />
      <main className="mx-auto h-[calc(100vh-3.5rem)] overflow-hidden">
        {!imageUrl ? (
          <div className="flex items-center justify-center h-full">
            <p>画像が見つかりません</p>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="flex-1 h-full overflow-hidden relative"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* 背景キャンバス（グリッド表示） */}
            <canvas
              ref={backgroundCanvasRef}
              className="w-full h-full"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${backgroundOffset.x}px), calc(-50% + ${backgroundOffset.y}px))`,
                backgroundColor: 'white',
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: 'none',
                width: '400%',
                height: '400%',
              }}
            />
            {/* 画像キャンバス */}
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${backgroundOffset.x}px), calc(-50% + ${backgroundOffset.y}px))`,
                backgroundColor: 'transparent',
                pointerEvents: 'none',
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}