'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from "@/components/ui/header";
import { useAuthStore } from "@/store/useAuthStore";

export default function EditorPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const { user, isLoading, checkUser, signOut } = useAuthStore();
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedImage, setSelectedImage] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [rotationHandle, setRotationHandle] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // タッチイベントの状態を管理
  const touchState = useRef<{
    initialDistance: number | null;
    initialScale: number;
    initialPosition: { x: number; y: number };
  }>({
    initialDistance: null,
    initialScale: 1,
    initialPosition: { x: 0, y: 0 },
  });

  // 2点間の距離を計算する関数
  const getDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 2点の中点を計算する関数
  const getMidpoint = (touch1: Touch, touch2: Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  // 画像の選択状態を管理する関数
  const handleImageSelect = (e: React.MouseEvent) => {
    if (!image) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 画像の位置とサイズを計算（キャンバス座標系）
    const imageRect = {
      x: (canvas.width - image.width) / 2,
      y: (canvas.height - image.height) / 2,
      width: image.width,
      height: image.height
    };

    // クリック位置が画像内かどうかをチェック
    if (
      x >= imageRect.x &&
      x <= imageRect.x + imageRect.width &&
      y >= imageRect.y &&
      y <= imageRect.y + imageRect.height
    ) {
      setSelectedImage({
        ...imageRect,
        rotation: 0
      });
    } else {
      setSelectedImage(null);
    }
  };

  // リサイズハンドルの描画
  const drawResizeHandles = (ctx: CanvasRenderingContext2D, rect: { x: number; y: number; width: number; height: number }) => {
    const handleSize = 8;
    const handles = [
      { x: rect.x, y: rect.y }, // 左上
      { x: rect.x + rect.width, y: rect.y }, // 右上
      { x: rect.x, y: rect.y + rect.height }, // 左下
      { x: rect.x + rect.width, y: rect.y + rect.height } // 右下
    ];

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;

    handles.forEach(handle => {
      ctx.beginPath();
      ctx.rect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
      ctx.fill();
      ctx.stroke();
    });
  };

  // 回転ハンドルの描画
  const drawRotationHandle = (ctx: CanvasRenderingContext2D, rect: { x: number; y: number; width: number; height: number }) => {
    const handleSize = 8;
    const handleY = rect.y - 20;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.rect(rect.x + rect.width / 2 - handleSize / 2, handleY - handleSize / 2, handleSize, handleSize);
    ctx.fill();
    ctx.stroke();
  };

  // マウスイベントハンドラを更新
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!selectedImage) {
      handleImageSelect(e);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // リサイズハンドルのチェック
    const handleSize = 8;
    const handles = [
      { x: selectedImage.x, y: selectedImage.y }, // 左上
      { x: selectedImage.x + selectedImage.width, y: selectedImage.y }, // 右上
      { x: selectedImage.x, y: selectedImage.y + selectedImage.height }, // 左下
      { x: selectedImage.x + selectedImage.width, y: selectedImage.y + selectedImage.height } // 右下
    ];

    for (let i = 0; i < handles.length; i++) {
      const handle = handles[i];
      if (
        x >= handle.x - handleSize / 2 &&
        x <= handle.x + handleSize / 2 &&
        y >= handle.y - handleSize / 2 &&
        y <= handle.y + handleSize / 2
      ) {
        setIsResizing(true);
        setResizeHandle(['nw', 'ne', 'sw', 'se'][i]);
        setDragStart({ x, y });
        return;
      }
    }

    // 回転ハンドルのチェック
    const rotationHandleY = selectedImage.y - 20;
    if (
      x >= selectedImage.x + selectedImage.width / 2 - handleSize / 2 &&
      x <= selectedImage.x + selectedImage.width / 2 + handleSize / 2 &&
      y >= rotationHandleY - handleSize / 2 &&
      y <= rotationHandleY + handleSize / 2
    ) {
      setRotationHandle(true);
      setDragStart({ x, y });
      return;
    }

    // 画像の移動
    setIsDragging(true);
    setLastPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectedImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isResizing && resizeHandle) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;

      setSelectedImage(prev => {
        if (!prev) return null;

        const newImage = { ...prev };
        switch (resizeHandle) {
          case 'nw':
            newImage.x += dx;
            newImage.y += dy;
            newImage.width -= dx;
            newImage.height -= dy;
            break;
          case 'ne':
            newImage.y += dy;
            newImage.width += dx;
            newImage.height -= dy;
            break;
          case 'sw':
            newImage.x += dx;
            newImage.width -= dx;
            newImage.height += dy;
            break;
          case 'se':
            newImage.width += dx;
            newImage.height += dy;
            break;
        }
        return newImage;
      });

      setDragStart({ x, y });
    } else if (rotationHandle) {
      const centerX = selectedImage.x + selectedImage.width / 2;
      const centerY = selectedImage.y + selectedImage.height / 2;
      const angle = Math.atan2(y - centerY, x - centerX);
      setSelectedImage(prev => prev ? { ...prev, rotation: angle } : null);
    } else if (isDragging) {
      const dx = e.clientX - lastPosition.x;
      const dy = e.clientY - lastPosition.y;
      
      setSelectedImage(prev => prev ? {
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      } : null);
      
      setLastPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setRotationHandle(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    // マウスホイールの方向に応じてスケールを変更
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(10, scale * delta));
    
    // マウスの位置を取得
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // ズーム前のマウス座標（キャンバス座標系）
    const beforeX = (mouseX - position.x) / scale;
    const beforeY = (mouseY - position.y) / scale;

    // ズーム後のマウス座標を一致させるための新しい位置を計算
    const newX = mouseX - beforeX * newScale;
    const newY = mouseY - beforeY * newScale;

    // 新しい位置を設定
    setPosition({
      x: newX,
      y: newY
    });
    
    setScale(newScale);
  };

  // タッチイベントハンドラ
  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();
      touchState.current.initialDistance = getDistance(e.touches[0], e.touches[1]);
      touchState.current.initialScale = scale;
      touchState.current.initialPosition = position;
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      setLastPosition({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2 && touchState.current.initialDistance !== null) {
      e.preventDefault();
      e.stopPropagation();
      
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const newScale = (currentDistance / touchState.current.initialDistance) * touchState.current.initialScale;
      const limitedScale = Math.max(0.1, Math.min(10, newScale));
      
      // 2本指の中点を基準にズーム
      const midpoint = getMidpoint(e.touches[0], e.touches[1]);
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // ズーム前の相対位置
        const relativeX = (midpoint.x - centerX) / touchState.current.initialScale;
        const relativeY = (midpoint.y - centerY) / touchState.current.initialScale;
        
        // ズーム後の相対位置
        const newRelativeX = (midpoint.x - centerX) / limitedScale;
        const newRelativeY = (midpoint.y - centerY) / limitedScale;
        
        setPosition(prev => ({
          x: prev.x + (newRelativeX - relativeX),
          y: prev.y + (newRelativeY - relativeY),
        }));
      }
      
      setScale(limitedScale);
    } else if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      const dx = touch.clientX - lastPosition.x;
      const dy = touch.clientY - lastPosition.y;
      
      setPosition(prev => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      
      setLastPosition({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (e.touches.length === 0) {
      e.preventDefault();
      e.stopPropagation();
      touchState.current.initialDistance = null;
      setIsDragging(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // グローバルなイベント制御
    const preventDefault = (e: Event) => {
      e.preventDefault();
    };

    const options = { passive: false };

    // キャンバスイベント
    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      handleWheel(e as unknown as React.WheelEvent);
    };

    // タッチイベントのハンドラ
    const handleTouchStartNative = (e: TouchEvent) => {
      e.preventDefault();
      handleTouchStart(e);
    };

    const handleTouchMoveNative = (e: TouchEvent) => {
      e.preventDefault();
      handleTouchMove(e);
    };

    const handleTouchEndNative = (e: TouchEvent) => {
      e.preventDefault();
      handleTouchEnd(e);
    };

    // イベントリスナーの追加
    canvas.addEventListener('touchstart', handleTouchStartNative, options);
    canvas.addEventListener('touchmove', handleTouchMoveNative, options);
    canvas.addEventListener('touchend', handleTouchEndNative, options);
    canvas.addEventListener('touchcancel', handleTouchEndNative, options);
    canvas.addEventListener('wheel', handleWheelNative, options);

    // グローバルイベント
    document.addEventListener('touchmove', preventDefault, options);
    document.addEventListener('wheel', preventDefault, options);

    return () => {
      // イベントリスナーの削除
      canvas.removeEventListener('touchstart', handleTouchStartNative);
      canvas.removeEventListener('touchmove', handleTouchMoveNative);
      canvas.removeEventListener('touchend', handleTouchEndNative);
      canvas.removeEventListener('touchcancel', handleTouchEndNative);
      canvas.removeEventListener('wheel', handleWheelNative);

      document.removeEventListener('touchmove', preventDefault);
      document.removeEventListener('wheel', preventDefault);
    };
  }, [isDragging, lastPosition, position, scale]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  // 画像の読み込み
  useEffect(() => {
    const url = searchParams.get('url');
    console.log('URL:', url);
    if (url) {
      setImageUrl(url);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        console.log('画像の読み込み成功:', img.width, img.height);
        setImage(img);
      };
      img.onerror = (error) => {
        console.error('画像の読み込みに失敗しました:', error);
      };
      img.src = url;
    }
  }, [searchParams]);

  // キャンバスの初期化と画像の描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // キャンバスのサイズを親要素に合わせる
    const parent = canvas.parentElement;
    if (!parent) return;

    const parentWidth = parent.clientWidth;
    const parentHeight = parent.clientHeight;

    // Canvasのサイズを親要素と同じに設定
    canvas.width = parentWidth;
    canvas.height = parentHeight;

    // 画像が存在する場合は描画
    if (image) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

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
    }

    // リサイズ時に再初期化
    const observer = new ResizeObserver(() => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      if (image) {
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
      }
    });

    observer.observe(parent);
    return () => observer.disconnect();
  }, [image, scale]);

  // グリッドの描画
  const drawGrid = () => {
    const gridCanvas = gridCanvasRef.current;
    if (!gridCanvas || !containerRef.current) return;

    const container = containerRef.current;
    const ctx = gridCanvas.getContext('2d');
    if (!ctx) return;

    // キャンバスのサイズを親要素に合わせる
    gridCanvas.width = container.clientWidth;
    gridCanvas.height = container.clientHeight;

    // グリッドの設定
    const gridSize = 20; // グリッドの間隔
    const gridColor = '#e5e7eb'; // グリッドの色

    ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    
    if (!showGrid) return;

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    // 縦線
    for (let x = 0; x < gridCanvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, gridCanvas.height);
      ctx.stroke();
    }

    // 横線
    for (let y = 0; y < gridCanvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(gridCanvas.width, y);
      ctx.stroke();
    }
  };

  // リサイズ時にグリッドを再描画
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      drawGrid();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [showGrid]);

  // スケール変更時にグリッドを再描画
  useEffect(() => {
    drawGrid();
  }, [scale]);

  // 画像の描画関数を更新
  const drawImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const parentWidth = parent.clientWidth;
    const parentHeight = parent.clientHeight;

    // 画像のアスペクト比を維持しながら、親要素の80%のサイズに収まるように計算
    const imageAspectRatio = image.width / image.height;
    const parentAspectRatio = parentWidth / parentHeight;

    let drawWidth, drawHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (imageAspectRatio > parentAspectRatio) {
      drawWidth = parentWidth * 0.8;
      drawHeight = drawWidth / imageAspectRatio;
      offsetX = (parentWidth - drawWidth) / 2;
      offsetY = (parentHeight - drawHeight) / 2;
    } else {
      drawHeight = parentHeight * 0.8;
      drawWidth = drawHeight * imageAspectRatio;
      offsetX = (parentWidth - drawWidth) / 2;
      offsetY = (parentHeight - drawHeight) / 2;
    }

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 画像を描画
    ctx.save();
    if (selectedImage) {
      ctx.translate(selectedImage.x + selectedImage.width / 2, selectedImage.y + selectedImage.height / 2);
      ctx.rotate(selectedImage.rotation);
      ctx.translate(-(selectedImage.x + selectedImage.width / 2), -(selectedImage.y + selectedImage.height / 2));
    }
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();

    // 選択状態の描画
    if (selectedImage) {
      // 選択枠の描画
      ctx.save();
      ctx.translate(selectedImage.x + selectedImage.width / 2, selectedImage.y + selectedImage.height / 2);
      ctx.rotate(selectedImage.rotation);
      ctx.translate(-(selectedImage.x + selectedImage.width / 2), -(selectedImage.y + selectedImage.height / 2));
      
      // 白い枠線の描画
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(selectedImage.x, selectedImage.y, selectedImage.width, selectedImage.height);
      
      // リサイズハンドルの描画
      drawResizeHandles(ctx, selectedImage);
      ctx.restore();
    }
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
      <main className="mx-auto h-[calc(100vh-3.5rem)]">
        {!imageUrl ? (
          <div className="flex items-center justify-center h-full">
            <p>画像が見つかりません</p>
          </div>
        ) : (
          <div 
            className="flex flex-col md:flex-row h-full"
            style={{ 
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              msUserSelect: 'none',
            }}
          >
            <div 
              ref={containerRef}
              className="flex-1 h-[calc(100%-16rem)] md:h-full overflow-hidden relative"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ 
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                msUserSelect: 'none',
              }}
            >
              {/* グリッドキャンバス（ズームしない） */}
              <canvas
                ref={gridCanvasRef}
                className="w-full h-full"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 1,
                  pointerEvents: 'none',
                }}
              />
              {/* メインキャンバスコンテナ（ズームする） */}
              <div 
                id="canvas-container"
                className="absolute inset-0 flex items-center justify-center"
                style={{ 
                  transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                  transformOrigin: '0 0',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  zIndex: 2,
                }}
              >
                {/* メインキャンバス（画像表示用） */}
                <canvas
                  ref={canvasRef}
                  className="w-full h-full"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 2,
                    backgroundColor: 'transparent',
                  }}
                />
              </div>
            </div>
            <div className="w-full md:w-64 bg-white border border-t-0 md:border-t h-64 md:h-full flex-shrink-0">
              <h2 className="text-lg font-semibold mb-4 p-4">編集ツール</h2>
              <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">グリッド表示</span>
                  <button
                    onClick={() => setShowGrid(!showGrid)}
                    className={`px-3 py-1 rounded-md text-sm ${
                      showGrid ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {showGrid ? 'ON' : 'OFF'}
                  </button>
                </div>
                <p className="text-sm text-gray-500">編集ツールは準備中です</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 