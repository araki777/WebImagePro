'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from "@/components/ui/header";
import { useAuthStore } from "@/store/useAuthStore";
import * as PIXI from 'pixi.js';

export default function EditorPage() {
  // 状態管理
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const containerRef = useRef<PIXI.Container | null>(null);

  // 認証関連
  const searchParams = useSearchParams();
  const { user, isLoading, checkUser, signOut } = useAuthStore();

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

  const loadImage = useCallback(async () => {
    if (!imageUrl || !appRef.current || !containerRef.current) return;

    try {
      const texture = await PIXI.Assets.load(imageUrl);
      const sprite = new PIXI.Sprite(texture);
      sprite.anchor.set(0.5);
      sprite.x = appRef.current.screen.width / 2;
      sprite.y = appRef.current.screen.height / 2;
      const scale = Math.min(
        (appRef.current.screen.width * 0.8) / sprite.width,
        (appRef.current.screen.height * 0.8) / sprite.height
      );
      sprite.scale.set(scale);

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

      containerRef.current.removeChildren();
      containerRef.current.addChild(sprite);
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
            }
          };
          window.addEventListener('resize', handleResize);

          const container = new PIXI.Container();
          appRef.current.stage.addChild(container);
          containerRef.current = container;

          if (imageUrl) {
            loadImage();
          }
        }
      });
    }
  }

  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();
  }

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
        </aside>
      </div>
    </div>
  );
}