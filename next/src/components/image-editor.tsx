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

const RATIOS = [
  { name: "フリー", value: null },
  { name: "1:1", value: 1 },
  { name: "4:3", value: 4/3 },
  { name: "3:2", value: 3/2 },
  { name: "16:9", value: 16/9 },
  { name: "9:16", value: 9/16 },
];

export function ImageEditor({ imageUrl, onSave, onClose }: ImageEditorProps) {
  const [activeTab, setActiveTab] = useState("resize");
  const [resizeWidth, setResizeWidth] = useState(0);
  const [resizeHeight, setResizeHeight] = useState(0);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  
  const [clipRegion, setClipRegion] = useState<ClipRegion>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState(RATIOS[0]);
  const imageRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      setOriginalDimensions({ width: img.width, height: img.height });
      setResizeWidth(img.width);
      setResizeHeight(img.height);
      
      // 初期の切り抜き領域を設定
      const maxWidth = img.width * 0.8;
      const maxHeight = img.height * 0.8;
      
      setClipRegion({
        x: (img.width - maxWidth) / 2,
        y: (img.height - maxHeight) / 2,
        width: maxWidth,
        height: maxHeight
      });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const handleWidthChange = (value: number) => {
    setResizeWidth(value);
    if (maintainAspectRatio && value > 0) {
      const aspectRatio = resizeWidth / resizeHeight;
      setResizeHeight(Math.round(value / aspectRatio));
    }
  };

  const handleHeightChange = (value: number) => {
    setResizeHeight(value);
    if (maintainAspectRatio && value > 0) {
      const aspectRatio = resizeWidth / resizeHeight;
      setResizeWidth(Math.round(value * aspectRatio));
    }
  };

  useEffect(() => {
    // リサイズ時に切り抜き領域が画像からはみ出ないように調整
    setClipRegion(prev => {
      const newRegion = { ...prev };
      
      if (prev.x + prev.width > resizeWidth) {
        if (prev.width > resizeWidth) {
          newRegion.width = resizeWidth;
          newRegion.x = 0;
        } else {
          newRegion.x = resizeWidth - prev.width;
        }
      }
      
      if (prev.y + prev.height > resizeHeight) {
        if (prev.height > resizeHeight) {
          newRegion.height = resizeHeight;
          newRegion.y = 0;
        } else {
          newRegion.y = resizeHeight - prev.height;
        }
      }
      
      return newRegion;
    });
  }, [resizeWidth, resizeHeight]);

  const getScaleFactor = () => {
    if (!imageRef.current || !imageContainerRef.current) return 1;

    const imageRect = imageRef.current.getBoundingClientRect();
    return imageRect.width / resizeWidth;
  };

  const handleMouseDown = (e: React.MouseEvent, handle?: string) => {
    if (activeTab !== 'clip') return;
    
    e.preventDefault();
    e.stopPropagation();

    const imageElement = imageRef.current;
    if (!imageElement) return;

    const rect = imageElement.getBoundingClientRect();
    const scale = getScaleFactor();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setIsDragging(true);
    setDragStart({ x, y });
    setResizeHandle(handle || null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || activeTab !== 'clip') return;

    const imageElement = imageRef.current;
    if (!imageElement) return;

    const rect = imageElement.getBoundingClientRect();
    const scale = getScaleFactor();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    const deltaX = (x - dragStart.x);
    const deltaY = (y - dragStart.y);

    if (resizeHandle) {
      const newClipRegion = { ...clipRegion };
      const minSize = 50;

      switch (resizeHandle) {
        case 'se':
          if (selectedRatio.value === null) {
            // フリーモード
            newClipRegion.width = Math.max(minSize, Math.min(resizeWidth - clipRegion.x, clipRegion.width + deltaX));
            newClipRegion.height = Math.max(minSize, Math.min(resizeHeight - clipRegion.y, clipRegion.height + deltaY));
          } else {
            // 比率固定モード
            const newWidth = Math.max(minSize, Math.min(resizeWidth - clipRegion.x, clipRegion.width + deltaX));
            const newHeight = newWidth / selectedRatio.value;
            
            if (clipRegion.y + newHeight <= resizeHeight) {
              newClipRegion.width = newWidth;
              newClipRegion.height = newHeight;
            } else {
              const maxHeight = resizeHeight - clipRegion.y;
              newClipRegion.height = maxHeight;
              newClipRegion.width = maxHeight * selectedRatio.value;
            }
          }
          break;
        case 'e':
          newClipRegion.width = Math.max(minSize, Math.min(resizeWidth - clipRegion.x, clipRegion.width + deltaX));
          if (selectedRatio.value !== null) {
            newClipRegion.height = newClipRegion.width / selectedRatio.value;
            if (clipRegion.y + newClipRegion.height > resizeHeight) {
              newClipRegion.height = resizeHeight - clipRegion.y;
              newClipRegion.width = newClipRegion.height * selectedRatio.value;
            }
          }
          break;
        case 's':
          newClipRegion.height = Math.max(minSize, Math.min(resizeHeight - clipRegion.y, clipRegion.height + deltaY));
          if (selectedRatio.value !== null) {
            newClipRegion.width = newClipRegion.height * selectedRatio.value;
            if (clipRegion.x + newClipRegion.width > resizeWidth) {
              newClipRegion.width = resizeWidth - clipRegion.x;
              newClipRegion.height = newClipRegion.width / selectedRatio.value;
            }
          }
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

  const handleRatioChange = (ratio: typeof RATIOS[0]) => {
    setSelectedRatio(ratio);

    if (ratio.value === null) return;

    const currentWidth = clipRegion.width;
    const newHeight = currentWidth / ratio.value;

    // 高さが画像からはみ出る場合は幅を調整
    if (clipRegion.y + newHeight > resizeHeight) {
      const adjustedHeight = resizeHeight - clipRegion.y;
      const adjustedWidth = adjustedHeight * ratio.value;
      
      // 調整後の幅が画像幅を超える場合は、中央から計算し直す
      if (adjustedWidth > resizeWidth) {
        const maxWidth = resizeWidth * 0.8;
        const maxHeight = maxWidth / ratio.value;
        
        setClipRegion({
          x: (resizeWidth - maxWidth) / 2,
          y: (resizeHeight - maxHeight) / 2,
          width: maxWidth,
          height: maxHeight
        });
      } else {
        setClipRegion(prev => ({
          ...prev,
          width: adjustedWidth,
          height: adjustedHeight
        }));
      }
    } else {
      setClipRegion(prev => ({
        ...prev,
        height: newHeight
      }));
    }
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

  const handleClip = async () => {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const imageData = new Uint8Array(arrayBuffer);
    console.log(imageData);

    const wasm = await import("../../public/wasm/wasm.js");
    await wasm.default();

    // ここで切り取り処理を実行
    // 画面上で画像が切り取られるが、保存をを押すまでは正式な保存ではない
  }

  const handleSave = async () => {
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
        <Card className="w-full max-w-[1400px] shadow-lg relative">
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
                        width={originalDimensions.width}
                        height={originalDimensions.height}
                        style={{ 
                          width: `${resizeWidth}px`,
                          height: `${resizeHeight}px`,
                          maxWidth: 'none'
                        }}
                        priority
                        unoptimized
                      />
                      {activeTab === 'clip' && (
                        <>
                          <div className="absolute inset-0 bg-black/50" />
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
                            <div className="absolute inset-0 bg-transparent" />
                            {/* 右下のリサイズハンドル */}
                            <div
                              className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-white border-2 border-gray-800 rounded-full cursor-se-resize"
                              onMouseDown={(e) => handleMouseDown(e, 'se')}
                            />
                            {/* 右端のリサイズハンドル */}
                            <div
                              className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-gray-800 rounded-full cursor-e-resize"
                              onMouseDown={(e) => handleMouseDown(e, 'e')}
                            />
                            {/* 下端のリサイズハンドル */}
                            <div
                              className="absolute bottom-[-1.5px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-gray-800 rounded-full cursor-s-resize"
                              onMouseDown={(e) => handleMouseDown(e, 's')}
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

              <div className="w-96 flex flex-col">
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
                              onValueChange={([value]) => handleWidthChange(value)}
                              min={10}
                              max={1000}
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
                              onValueChange={([value]) => handleHeightChange(value)}
                              min={10}
                              max={1000}
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
                      <div className="text-sm text-muted-foreground mb-4">
                        切り抜き領域をドラッグして移動、またはハンドルをドラッグしてサイズを変更できます
                      </div>
                      
                      <Label className="text-sm text-muted-foreground">比率</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {RATIOS.map((ratio) => (
                          <Button
                            key={ratio.name}
                            variant={selectedRatio.name === ratio.name ? "default" : "outline"}
                            className="w-full"
                            onClick={() => handleRatioChange(ratio)}
                          >
                            {ratio.name}
                          </Button>
                        ))}
                      </div>
                      <Button 
                        className="w-full"
                        onClick={handleClip}
                        disabled={isResizing}
                      >
                        切り取りを実行
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator className="my-6" />

                <div className="space-y-2">
                  <Button 
                    className="w-full"
                    onClick={handleSave}
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
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}