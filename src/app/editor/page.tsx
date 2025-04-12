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

  let app: PIXI.Application | null = null;

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
      if (app && app.renderer) {
        app.destroy(true, true);
        app = null;
      }
    };
  }, [pixiContainerRef.current]);

  // 認証状態の確認
  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const createPixiApp = () => {
    if (pixiContainerRef.current && !app) {
      const parent = pixiContainerRef.current.parentElement;
      if (!parent) return;

      app = new PIXI.Application();
      app.init({
        width: parent.clientWidth,
        height: parent.clientHeight,
        background: "#ffffff",
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
        resizeTo: parent
      }).then(() => {
        if (app && pixiContainerRef.current) {
          pixiContainerRef.current.appendChild(app.canvas);

          // リサイズイベントの設定
          const handleResize = () => {
            if (app && parent) {
              app.renderer.resize(parent.clientWidth, parent.clientHeight);
            }
          };
          window.addEventListener('resize', handleResize);

          // 簡単な図形を描画
          const graphics = new PIXI.Graphics();
          graphics.setFillStyle(0x000000);
          graphics.circle(app.screen.width / 2, app.screen.height / 2, 50);
          graphics.fill();
          app.stage.addChild(graphics);
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