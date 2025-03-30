'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Maximize2, X, Lock, Unlock, Plus, Scissors } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImage: string, isNewImage: boolean) => void;
  onClose: () => void;
}

interface Position {
  x: number;
  y: number;
}

interface ClipRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageEditor({ imageUrl, onSave, onClose }: ImageEditorProps) {
  const [activeTab, setActiveTab] = useState("resize");
  const [resizeWidth, setResizeWidth] = useState(0);
  const [resizeHeight, setResizeHeight] = useState(0);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  
  // 切り抜き関連の状態
  const [clipRegion, setClipRegion] = useState<ClipRegion>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      setOriginalDimensions({ width: img.width, height: img.height });
      setResizeWidth(img.width);
      setResizeHeight(img.height);
      // 初期の切り抜き領域を設定
      setClipRegion({
        x: img.width * 0.1, // 10% のマージン
        y: img.height * 0.1,
        width: img.width * 0.8, // 80% の幅
        height: img.height * 0.8
      });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (maintainAspectRatio && originalDimensions.width > 0) {
      const aspectRatio = originalDimensions.width / originalDimensions.height;
      setResizeHeight(Math.round(resizeWidth / aspectRatio));
    }
  }, [resizeWidth, maintainAspectRatio, originalDimensions]);

  // マウスイベントハンドラー
  const handleMouseDown = (e: React.MouseEvent, handle?: string) => {
    if (activeTab !== 'clip') return;
    
    e.preventDefault(); // ドラッグ操作を防止
    e.stopPropagation(); // イベントの伝播を停止

    const imageElement = imageRef.current;
    if (!imageElement) return;

    const rect = imageElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setDragStart({ x, y });

    if (handle) {
      setResizeHandle(handle);
    } else {
      setResizeHandle(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || activeTab !== 'clip') return;

    const imageElement = imageRef.current;
    if (!imageElement) return;

    const rect = imageElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;

    if (resizeHandle) {
      // リサイズハンドル操作
      const newClipRegion = { ...clipRegion };

      switch (resizeHandle) {
        case 'nw':
          newClipRegion.x = Math.min(clipRegion.x + clipRegion.width - 50, Math.max(0, clipRegion.x + deltaX));
          newClipRegion.y = Math.min(clipRegion.y + clipRegion.height - 50, Math.max(0, clipRegion.y + deltaY));
          newClipRegion.width = clipRegion.width - (newClipRegion.x - clipRegion.x);
          newClipRegion.height = clipRegion.height - (newClipRegion.y - clipRegion.y);
          break;
        case 'ne':
          newClipRegion.y = Math.min(clipRegion.y + clipRegion.height - 50, Math.max(0, clipRegion.y + deltaY));
          newClipRegion.width = Math.max(50, Math.min(resizeWidth - newClipRegion.x, clipRegion.width + deltaX));
          newClipRegion.height = clipRegion.height - (newClipRegion.y - clipRegion.y);
          break;
        case 'sw':
          newClipRegion.x = Math.min(clipRegion.x + clipRegion.width - 50, Math.max(0, clipRegion.x + deltaX));
          newClipRegion.width = clipRegion.width - (newClipRegion.x - clipRegion.x);
          newClipRegion.height = Math.max(50, Math.min(resizeHeight - newClipRegion.y, clipRegion.height + deltaY));
          break;
        case 'se':
          newClipRegion.width = Math.max(50, Math.min(resizeWidth - newClipRegion.x, clipRegion.width + deltaX));
          newClipRegion.height = Math.max(50, Math.min(resizeHeight - newClipRegion.y, clipRegion.height + deltaY));
          break;
      }

      setClipRegion(newClipRegion);
    } else {
      // 切り抜き領域の移動
      setClipRegion(prev => ({
        ...prev,
        x: Math.max(0, Math.min(resizeWidth - prev.width, prev.x + deltaX)),
        y: Math.max(0, Math.min(resizeHeight - prev.height, prev.y + deltaY))
      }));
    }

    setDragStart({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setResizeHandle(null);
  };

  const resizeImage = async () => {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const imageData = new Uint8Array(arrayBuffer);

    const wasm = await import("../../public/wasm/wasm.js");
    await wasm.default();
    
    if (typeof wasm.resize_image !== 'function') {
      throw new Error('Resize function not found');
    }

    const resizedImage = wasm.resize_image(imageData, resizeWidth, resizeHeight);
    
    if (!(resizedImage instanceof Uint8Array)) {
      throw new Error('Invalid resize result format');
    }

    return btoa(
      resizedImage.reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
  };

  const handleResize = async () => {
    if (isResizing) return;
    
    setIsResizing(true);
    try {
      const base64String = await resizeImage();
      onSave(base64String, false);
    } catch (error) {
      console.error('Error during image resize:', error);
    } finally {
      setIsResizing(false);
    }
  };

  const handleSaveNew = async () => {
    if (isResizing) return;
    
    setIsResizing(true);
    try {
      const base64String = await resizeImage();
      onSave(base64String, true);
    } catch (error) {
      console.error('Error during image save:', error);
    } finally {
      setIsResizing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="container flex h-full items-center justify-center p-4">
        <Card className="w-full max-w-[1200px] shadow-lg relative">
          <Button 
            variant="outline"
            size="icon"
            className="absolute -top-3 -right-3 h-8 w-8 rounded-full border-2 bg-background shadow-md hover:scale-105 transition-transform"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardContent className="p-6">
            <div className="flex gap-6">
              <div 
                ref={imageContainerRef}
                className="flex-1 rounded-lg border bg-card h-[600px] relative overflow-hidden"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <div className="h-full w-full overflow-x-scroll overflow-y-scroll">
                  <div className="min-w-fit min-h-full flex items-center justify-center">
                    <div ref={imageRef} className="relative">
                      <Image
                        src={imageUrl}
                        alt="Image being edited"
                        width={resizeWidth}
                        height={resizeHeight}
                        style={{ 
                          maxWidth: 'none',
                          objectFit: 'contain'
                        }}
                        priority
                      />
                      {activeTab === 'clip' && (
                        <>
                          {/* 切り抜き領域の外側を暗くする */}
                          <div className="absolute inset-0 bg-black/50" />
                          
                          {/* 切り抜き領域 */}
                          <div
                            className="absolute border-2 border-white cursor-move"
                            style={{
                              left: `${clipRegion.x}px`,
                              top: `${clipRegion.y}px`,
                              width: `${clipRegion.width}px`,
                              height: `${clipRegion.height}px`
                            }}
                            onMouseDown={handleMouseDown}
                          >
                            {/* 切り抜き領域の中身を表示 */}
                            <div className="absolute inset-0 bg-transparent" />
                            
                            {/* リサイズハンドル */}
                            <div
                              className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-white border-2 border-gray-800 rounded-full cursor-nw-resize"
                              onMouseDown={(e) => handleMouseDown(e, 'nw')}
                            />
                            <div
                              className="absolute -right-1.5 -top-1.5 w-3 h-3 bg-white border-2 border-gray-800 rounded-full cursor-ne-resize"
                              onMouseDown={(e) => handleMouseDown(e, 'ne')}
                            />
                            <div
                              className="absolute -left-1.5 -bottom-1.5 w-3 h-3 bg-white border-2 border-gray-800 rounded-full cursor-sw-resize"
                              onMouseDown={(e) => handleMouseDown(e, 'sw')}
                            />
                            <div
                              className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-white border-2 border-gray-800 rounded-full cursor-se-resize"
                              onMouseDown={(e) => handleMouseDown(e, 'se')}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 bg-background/90 px-3 py-1 rounded-md text-sm">
                  {resizeWidth} × {resizeHeight} px
                </div>
              </div>

              <div className="w-80 flex flex-col">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="resize" className="flex-1">
                      <Maximize2 className="w-4 h-4 mr-2" />
                      リサイズ
                    </TabsTrigger>
                    <TabsTrigger value="clip" className="flex-1">
                      <Scissors className="w-4 h-4 mr-2" />
                      切り抜き
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="resize" className="mt-6 space-y-6">
                    <div className="space-y-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setMaintainAspectRatio(!maintainAspectRatio)}
                      >
                        {maintainAspectRatio ? (
                          <Lock className="w-4 h-4 mr-2" />
                        ) : (
                          <Unlock className="w-4 h-4 mr-2" />
                        )}
                        アスペクト比を{maintainAspectRatio ? 'ロック' : 'アンロック'}
                      </Button>

                      <Separator />

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">幅</Label>
                          <div className="flex items-center gap-4">
                            <Slider
                              value={[resizeWidth]}
                              onValueChange={([value]) => setResizeWidth(value)}
                              min={100}
                              max={originalDimensions.width * 2}
                              step={1}
                              className="flex-1"
                            />
                            <span className="text-sm tabular-nums">
                              {resizeWidth}px
                            </span>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm text-muted-foreground">高さ</Label>
                          <div className="flex items-center gap-4">
                            <Slider
                              value={[resizeHeight]}
                              onValueChange={([value]) => setResizeHeight(value)}
                              min={100}
                              max={originalDimensions.height * 2}
                              step={1}
                              className="flex-1"
                              disabled={maintainAspectRatio}
                            />
                            <span className="text-sm tabular-nums">
                              {resizeHeight}px
                            </span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Button 
                          className="w-full"
                          onClick={handleResize}
                          disabled={isResizing}
                        >
                          {isResizing ? (
                            <span>処理中...</span>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              変更を保存
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline"
                          className="w-full"
                          onClick={handleSaveNew}
                          disabled={isResizing}
                        >
                          {isResizing ? (
                            <span>処理中...</span>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              新規として保存
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setResizeWidth(originalDimensions.width);
                            setResizeHeight(originalDimensions.height);
                          }}
                        >
                          元のサイズにリセット
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="clip" className="mt-6 space-y-6">
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        切り抜き領域をドラッグして移動、または角のハンドルをドラッグしてサイズを変更できます
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}