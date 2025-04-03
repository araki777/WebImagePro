'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Maximize2, X, Plus, Scissors, Sliders, Sparkles, RotateCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ImageResizer } from '@/components/ImageResizer';
import { RATIOS } from '@/lib/constants';
import { ImageCliper } from '@/components/ImageCliper';
import { IImageEditorProps, IClipRegion, IPosition } from '@/types/types';
import { ImageCliperControls } from '@/components/ImageCliperControls';
import { ImageColorAjustment } from '@/components/ImageColorAjustment';
import { ImageFilter } from '@/components/ImageFilter';
import { getWasmModule } from '@/lib/wasm-loader';
import { ImageTransform } from '@/components/ImageTransform';

export function ImageEditor({ imageUrl, onSave, onClose }: IImageEditorProps) {
  const [activeTab, setActiveTab] = useState("transform");
  const [resizeWidth, setResizeWidth] = useState(0);
  const [resizeHeight, setResizeHeight] = useState(0);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [originalImageBlob, setOriginalImageBlob] = useState<Blob | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [processedImageBlob, setProcessedImageBlob] = useState<Blob | null>(null);
  const [clipRegion, setClipRegion] = useState<IClipRegion>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSave, setIsSave] = useState(false);
  const [dragStart, setDragStart] = useState<IPosition>({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState(RATIOS[0]);
  const [brightness, setBrightness] = useState(0);
	const [saturation, setSaturation] = useState(1);
	const [contrast, setContrast] = useState(0);
  const [gamma, setGamma] = useState(1);
  const [threshold, setThreshold] = useState(128);
  const [redFactor, setRedFactor] = useState(1);
  const [greenFactor, setGreenFactor] = useState(1);
  const [blueFactor, setBlueFactor] = useState(1);
  const [isGrayScale, setIsGrayScale] = useState(false);
  const [isSepia, setIsSepia] = useState(false);
  const [isInvert, setIsInvert] = useState(false);
  const [gaussianBlur, setGaussianBlur] = useState(0);
  const [motionBlur, setMotionBlur] = useState({ angle: 0, distance: 0 });
  const [sharpen, setSharpen] = useState({ sigma: 0, threshold: 0 });
  const [edgeDetection, setEdgeDetection] = useState(0);
  const [noiseReduction, setNoiseReduction] = useState(0);
  const [vignette, setVignette] = useState(0);
  const [hdr, setHdr] = useState(0);
  const [mosaic, setMosaic] = useState(0);
  const [oilPainting, setOilPainting] = useState({ radius: 0, intensity: 0 });
  const imageRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadImage = async () => {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      setOriginalImageBlob(blob);

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
      img.src = URL.createObjectURL(blob);
    };

    loadImage();
  }, [imageUrl]);

  const updateProcessedImage = (blob: Blob) => {
    // 既存のURLを解放
    if (processedImageUrl) {
      URL.revokeObjectURL(processedImageUrl);
    }
    setProcessedImageUrl(URL.createObjectURL(blob));
    setProcessedImageBlob(blob);
  };

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

  const handleImageReset = () => {
    if (originalImageBlob) {
      // 既存のURLを解放
      if (processedImageUrl) {
        URL.revokeObjectURL(processedImageUrl);
      }
      setResizeWidth(originalDimensions.width);
      setResizeHeight(originalDimensions.height);
      setClipRegion({ x: 0, y: 0, width: originalDimensions.width, height: originalDimensions.height });
      setBrightness(0);
      setSaturation(1);
      setContrast(0);
      setGamma(1);
      setThreshold(128);
      setRedFactor(1);
      setGreenFactor(1);
      setBlueFactor(1);
      setIsGrayScale(false);
      setIsSepia(false);
      setIsInvert(false);
      setGaussianBlur(0);
      setMotionBlur({ angle: 0, distance: 0 });
      setSharpen({ sigma: 0, threshold: 0 });
      setEdgeDetection(0);
      setNoiseReduction(0);
      setVignette(0);
      setHdr(0);
      setMosaic(0);
      setOilPainting({ radius: 0, intensity: 0 });
      // 元の画像を設定
      setProcessedImageUrl(URL.createObjectURL(originalImageBlob));
    }
  }

  const handleAspectRatioChange = () => {
    setMaintainAspectRatio(!maintainAspectRatio)
  }

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

  // 共通の画像処理関数
  const processImage = async (
    processFunctionName: string,
    ...args: number[]
  ) => {
    if (!originalImageBlob) return;

    const arrayBuffer = await originalImageBlob.arrayBuffer();
    const imageData = new Uint8Array(arrayBuffer);

    const wasm = await getWasmModule();

    if (typeof wasm[processFunctionName] !== 'function') {
      throw new Error(`${processFunctionName} function not found`);
    }

    const adjustedImage = wasm[processFunctionName](imageData, ...args);

    if (!(adjustedImage instanceof Uint8Array)) {
      throw new Error(`Invalid ${processFunctionName} result format`);
    }

    const adjustedBlob = new Blob([adjustedImage], { type: 'image/png' });
    updateProcessedImage(adjustedBlob);
  };

  const handleBrightness = async (brightness: number) => {
    await processImage('adjust_brightness', brightness);
  }

  const handleSaturation = async (saturation: number) => {
    await processImage('adjust_saturation', saturation);
  }

  const handleContrast = async (contrast: number) => {
    await processImage('adjust_contrast', contrast);
  }

  const handleGamma = async (gamma: number) => {
    await processImage('adjust_gamma', gamma);
  }

  const handleGrayscale = async (isGrayScale: boolean) => {
    if (!originalImageBlob) return;

    const arrayBuffer = await originalImageBlob.arrayBuffer();
    const imageData = new Uint8Array(arrayBuffer);

    const wasm = await getWasmModule();

    if (typeof wasm.adjust_grayscale !== 'function') {
      throw new Error('Adjust grayscale function not found');
    }

    const adjustedImage = isGrayScale ? wasm.adjust_grayscale(imageData) : imageData;
    const adjustedBlob = new Blob([adjustedImage], { type: 'image/png' });
    updateProcessedImage(adjustedBlob);
  }

  const handleSepia = async (isSepia: boolean) => {
    if (!originalImageBlob) return;

    const arrayBuffer = await originalImageBlob.arrayBuffer();
    const imageData = new Uint8Array(arrayBuffer);

    const wasm = await getWasmModule();

    if (typeof wasm.adjust_sepia !== 'function') {
      throw new Error('Adjust sepia function not found');
    }

    const adjustedImage = isSepia ? wasm.adjust_sepia(imageData) : imageData;
    const adjustedBlob = new Blob([adjustedImage], { type: 'image/png' });
    updateProcessedImage(adjustedBlob);
  }

  const handleInvert = async (isInvert: boolean) => {
    if (!originalImageBlob) return;

    const arrayBuffer = await originalImageBlob.arrayBuffer();
    const imageData = new Uint8Array(arrayBuffer);

    const wasm = await getWasmModule();

    if (typeof wasm.adjust_invert !== 'function') {
      throw new Error('Adjust invert function not found');
    }

    const adjustedImage = isInvert ? wasm.adjust_invert(imageData) : imageData;
    const adjustedBlob = new Blob([adjustedImage], { type: 'image/png' });
    updateProcessedImage(adjustedBlob);
  }

  const handleThreshold = async (threshold: number) => {
    await processImage('adjust_threshold', threshold);
  }

  const handleColorBalance = async (redFactor: number, greenFactor: number, blueFactor: number) => {
    await processImage('adjust_color_balance', redFactor, greenFactor, blueFactor);
  }

  const handleClip = async () => {
    if (!originalImageBlob) return;

    let imageData: Uint8Array;
    if (processedImageBlob) {
      const arrayBuffer = await processedImageBlob.arrayBuffer();
      imageData = new Uint8Array(arrayBuffer);
    } else {
      const arrayBuffer = await originalImageBlob.arrayBuffer();
      imageData = new Uint8Array(arrayBuffer);
    }

    const wasm = await getWasmModule();

    if (typeof wasm.clip_image !== 'function') {
      throw new Error('Clip function not found');
    }

    const clipedImage = wasm.clip_image(imageData, clipRegion.x, clipRegion.y, clipRegion.width, clipRegion.height);

    if (!(clipedImage instanceof Uint8Array)) {
      throw new Error('Invalid resize result format');
    }

    const clippedBlob = new Blob([clipedImage], { type: 'image/png' });
    updateProcessedImage(clippedBlob);
  }

  const handleRotate = async (degrees: number) => {
    if (!originalImageBlob) return;

    let imageData: Uint8Array;
    if (processedImageBlob) {
      const arrayBuffer = await processedImageBlob.arrayBuffer();
      imageData = new Uint8Array(arrayBuffer);
    } else {
      const arrayBuffer = await originalImageBlob.arrayBuffer();
      imageData = new Uint8Array(arrayBuffer);
    }

    const wasm = await getWasmModule();

    if (typeof wasm.rotate_image !== 'function') {
      throw new Error('Rotate function not found');
    }

    const rotatedImage = wasm.rotate_image(imageData, degrees);

    if (!(rotatedImage instanceof Uint8Array)) {
      throw new Error('Invalid rotate result format');
    }

    const rotatedBlob = new Blob([rotatedImage], { type: 'image/png' });
    updateProcessedImage(rotatedBlob);
  }

  const handleFlip = async (horizontal: boolean) => {
    if (!originalImageBlob) return;

    let imageData: Uint8Array;
    if (processedImageBlob) {
      const arrayBuffer = await processedImageBlob.arrayBuffer();
      imageData = new Uint8Array(arrayBuffer);
    } else {
      const arrayBuffer = await originalImageBlob.arrayBuffer();
      imageData = new Uint8Array(arrayBuffer);
    }

    const wasm = await getWasmModule();

    if (typeof wasm.flip_image !== 'function') {
      throw new Error('Flip function not found');
    }

    const flippedImage = wasm.flip_image(imageData, horizontal);

    if (!(flippedImage instanceof Uint8Array)) {
      throw new Error('Invalid flip result format');
    }

    const flippedBlob = new Blob([flippedImage], { type: 'image/png' });
    updateProcessedImage(flippedBlob);
  }

  const resizeImage = async () => {
    if (!originalImageBlob) {
      throw new Error('No image to resize');
    }

    if (!processedImageBlob) {
      return URL.createObjectURL(originalImageBlob);
    }

    const arrayBuffer = await processedImageBlob.arrayBuffer();
    const imageData = new Uint8Array(arrayBuffer);

    const wasm = await getWasmModule();

    if (typeof wasm.resize_image !== 'function') {
      throw new Error('Resize function not found');
    }

    const resizedImage = wasm.resize_image(imageData, resizeWidth, resizeHeight);

    if (!(resizedImage instanceof Uint8Array)) {
      throw new Error('Invalid resize result format');
    }

    const resizedBlob = new Blob([resizedImage], { type: 'image/png' });
    updateProcessedImage(resizedBlob);

    const base64String = btoa(
      resizedImage.reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    if (!base64String) {
      throw new Error('Failed to convert image to base64');
    }

    return base64String;
  };

  const handleSave = async () => {
    setIsSave(true);
    try {
      const base64String = await resizeImage();
      if (base64String) {
        onSave(base64String, false);
      }
    } catch (error) {
      console.error('Error during image resize:', error);
    }
    setIsSave(false);
  };

  const handleSaveNew = async () => {
    setIsSave(true);
    try {
      const base64String = await resizeImage();
      if (base64String) {
        onSave(base64String, true);
      }
    } catch (error) {
      console.error('Error during image save:', error);
    }
    setIsSave(false);
  };

  const handleGaussianBlur = async (sigma: number) => {
    await processImage('apply_gaussian_blur', sigma);
  }

  const handleMotionBlur = async (angle: number, distance: number) => {
    await processImage('apply_motion_blur', angle, distance);
  }

  const handleSharpen = async (sigma: number, threshold: number) => {
    await processImage('apply_sharpen', sigma, threshold);
  }

  const handleEdgeDetection = async (threshold: number) => {
    await processImage('apply_edge_detection', threshold);
  }

  const handleNoiseReduction = async (radius: number) => {
    await processImage('apply_noise_reduction', radius);
  }

  const handleVignette = async (strength: number) => {
    await processImage('apply_vignette', strength);
  }

  const handleHdr = async (strength: number) => {
    await processImage('apply_hdr', strength);
  }

  const handleMosaic = async (blockSize: number) => {
    await processImage('apply_mosaic', blockSize);
  }

  const handleOilPainting = async (radius: number, intensity: number) => {
    await processImage('apply_oil_painting', radius, intensity);
  }

  useEffect(() => {
    // コンポーネントのアンマウント時にURLを解放
    return () => {
      if (processedImageUrl) {
        URL.revokeObjectURL(processedImageUrl);
      }
    };
  }, [processedImageUrl]);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="flex w-full h-full items-center justify-center p-10">
        <Card className="w-full shadow-lg relative">
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
                className="flex-1 rounded-lg border bg-card h-[500px] relative overflow-hidden"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <div className="h-full w-full overflow-x-scroll overflow-y-scroll">
                  <div className="min-w-fit min-h-full flex items-center justify-center">
                    <div ref={imageRef} className="relative">
                      <Image
                        src={processedImageUrl || imageUrl}
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
                        <ImageCliperControls clipRegion={clipRegion} onMouseDown={handleMouseDown} />
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
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="transform" className="flex-1">
                      <Maximize2 className="w-4 h-4 mr-2" />
                      加工
                    </TabsTrigger>
                    <TabsTrigger value="color_adjustment" className="flex-1">
                      <Sliders className="w-4 h-4 mr-2" />
                      色調整
                    </TabsTrigger>
                    <TabsTrigger value="filters" className="flex-1">
                      <Sparkles className="w-4 h-4 mr-2" />
                      フィルター
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="transform" className="mt-6 space-y-6">
                    <Tabs defaultValue="resize" className="w-full">
                      <TabsList className="w-full grid grid-cols-3">
                        <TabsTrigger value="resize" className="flex-1">
                          <Maximize2 className="w-4 h-4 mr-2" />
                          リサイズ
                        </TabsTrigger>
                        <TabsTrigger value="clip" className="flex-1">
                          <Scissors className="w-4 h-4 mr-2" />
                          切り抜き
                        </TabsTrigger>
                        <TabsTrigger value="rotate" className="flex-1">
                          <RotateCw className="w-4 h-4 mr-2" />
                          回転・反転
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="resize" className="mt-4">
                        <ImageResizer
                          resizeWidth={resizeWidth}
                          resizeHeight={resizeHeight}
                          onWidthChange={handleWidthChange}
                          onHeightChange={handleHeightChange}
                          onAspectRatioChange={handleAspectRatioChange}
                          maintainAspectRatio={maintainAspectRatio}
                        />
                      </TabsContent>

                      <TabsContent value="clip" className="mt-4">
                        <ImageCliper
                          selectedRatio={selectedRatio}
                          onRatioChange={handleRatioChange}
                          onClip={handleClip}
                          isSave={isSave}
                        />
                      </TabsContent>

                      <TabsContent value="rotate" className="mt-4">
                        <ImageTransform
                          onRotate={handleRotate}
                          onFlip={handleFlip}
                          isSave={isSave}
                        />
                      </TabsContent>
                    </Tabs>
                  </TabsContent>

                  <TabsContent value="color_adjustment" className="mt-6 space-y-6">
                    <ImageColorAjustment
                      brightness={brightness}
                      saturation={saturation}
                      contrast={contrast}
                      gamma={gamma}
                      threshold={threshold}
                      redFactor={redFactor}
                      greenFactor={greenFactor}
                      blueFactor={blueFactor}
                      isGrayScale={isGrayScale}
                      isSepia={isSepia}
                      isInvert={isInvert}
                      setBrightness={setBrightness}
                      setSaturation={setSaturation}
                      setContrast={setContrast}
                      setGamma={setGamma}
                      setRedFactor={setRedFactor}
                      setGreenFactor={setGreenFactor}
                      setBlueFactor={setBlueFactor}
                      setThreshold={setThreshold}
                      setIsGrayScale={setIsGrayScale}
                      setIsSepia={setIsSepia}
                      setIsInvert={setIsInvert}
                      onBrightnessChange={handleBrightness}
                      onSaturationChange={handleSaturation}
                      onContrastChange={handleContrast}
                      onGammaChange={handleGamma}
                      onThresholdChange={handleThreshold}
                      onColorBalanceChange={handleColorBalance}
                      onGrayscaleChange={handleGrayscale}
                      onSepiaChange={handleSepia}
                      onInvertChange={handleInvert}
                      isSave={isSave}
                    />
                  </TabsContent>

                  <TabsContent value="filters" className="mt-6 space-y-6">
                    <ImageFilter
                      gaussianBlur={gaussianBlur}
                      motionBlur={motionBlur}
                      sharpen={sharpen}
                      edgeDetection={edgeDetection}
                      noiseReduction={noiseReduction}
                      vignette={vignette}
                      hdr={hdr}
                      mosaic={mosaic}
                      oilPainting={oilPainting}
                      setGaussianBlur={setGaussianBlur}
                      setMotionBlur={setMotionBlur}
                      setSharpen={setSharpen}
                      setEdgeDetection={setEdgeDetection}
                      setNoiseReduction={setNoiseReduction}
                      setVignette={setVignette}
                      setHdr={setHdr}
                      setMosaic={setMosaic}
                      setOilPainting={setOilPainting}
                      onGaussianBlurChange={handleGaussianBlur}
                      onMotionBlurChange={handleMotionBlur}
                      onSharpenChange={handleSharpen}
                      onEdgeDetectionChange={handleEdgeDetection}
                      onNoiseReductionChange={handleNoiseReduction}
                      onVignetteChange={handleVignette}
                      onHdrChange={handleHdr}
                      onMosaicChange={handleMosaic}
                      onOilPaintingChange={handleOilPainting}
                    />
                  </TabsContent>
                </Tabs>

                <Separator className="my-6" />

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => handleImageReset()}
                  >
                    画像をリセット
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => handleSave()}
                    disabled={isSave}
                  >
                    {isSave ? (
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
                    onClick={() => handleSaveNew()}
                    disabled={isSave}
                  >
                    {isSave ? (
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