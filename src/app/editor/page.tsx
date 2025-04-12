'use client';

import React, { useEffect, useRef, useState } from 'react';
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

    // imageUrlが変わったときに画像を描画
    useEffect(() => {
      if (!imageUrl || !appRef.current) return;
  
      PIXI.Assets.load(imageUrl).then((texture) => {
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.x = appRef.current!.screen.width / 2;
        sprite.y = appRef.current!.screen.height / 2;
        const scale = Math.min(
          (appRef.current!.screen.width * 0.8) / sprite.width,
          (appRef.current!.screen.height * 0.8) / sprite.height
        );
        sprite.scale.set(scale);
        containerRef.current?.removeChildren();
        containerRef.current?.addChild(sprite);
      });
    }, [imageUrl]);

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

          if (imageUrl && appRef.current) {
            PIXI.Assets.load(imageUrl).then((texture) => {
              const sprite = new PIXI.Sprite(texture);
              sprite.anchor.set(0.5);
              sprite.x = appRef.current!.screen.width / 2;
              sprite.y = appRef.current!.screen.height / 2;
              const scale = Math.min(
                (appRef.current!.screen.width * 0.8) / sprite.width,
                (appRef.current!.screen.height * 0.8) / sprite.height
              );
              sprite.scale.set(scale);
              container.addChild(sprite);
            });
          }
        }
      });
    }
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