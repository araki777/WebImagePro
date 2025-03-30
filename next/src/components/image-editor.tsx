'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Maximize2, X, Lock, Unlock, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImage: string, isNewImage: boolean) => void;
  onClose: () => void;
}

export function ImageEditor({ imageUrl, onSave, onClose }: ImageEditorProps) {
  const [activeTab, setActiveTab] = useState("resize");
  const [resizeWidth, setResizeWidth] = useState(0);
  const [resizeHeight, setResizeHeight] = useState(0);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      setOriginalDimensions({ width: img.width, height: img.height });
      setResizeWidth(img.width);
      setResizeHeight(img.height);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (maintainAspectRatio && originalDimensions.width > 0) {
      const aspectRatio = originalDimensions.width / originalDimensions.height;
      setResizeHeight(Math.round(resizeWidth / aspectRatio));
    }
  }, [resizeWidth, maintainAspectRatio, originalDimensions]);

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
              <div className="flex-1 rounded-lg border bg-card h-[600px] relative overflow-hidden">
                <div className="h-full w-full overflow-x-scroll overflow-y-scroll">
                <div className="min-w-fit min-h-full flex items-center justify-center">
                    <div className="relative">
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
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 bg-background/90 px-3 py-1 rounded-md text-sm">
                  {resizeWidth} × {resizeHeight} px
                </div>
              </div>

              <div className="w-80 flex flex-col">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                  <TabsList className="w-full">
                    <TabsTrigger value="resize" className="flex-1">
                      <Maximize2 className="w-4 h-4 mr-2" />
                      リサイズ
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
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}