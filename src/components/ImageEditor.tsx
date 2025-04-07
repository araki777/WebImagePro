'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Maximize2, X, Plus, Scissors, Sliders, Sparkles, RotateCw, ImageIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ImageResizer } from '@/components/ImageResizer';
import { RATIOS } from '@/lib/constants';
import { ImageCliper } from '@/components/ImageCliper';
import { IImageEditorProps, IClipRegion, IPosition, IMAGE_FORMATS } from '@/types/types';
import { ImageCliperControls } from '@/components/ImageCliperControls';
import { ImageColorAjustment } from '@/components/ImageColorAjustment';
import { ImageFilter } from '@/components/ImageFilter';
import { getWasmModule } from '@/lib/wasm-loader';
import { ImageTransform } from '@/components/ImageTransform';
import { ImageComposition } from '@/components/ImageComposition';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Step } from 'react-joyride';
import TourGuid from '@/components/common/TourGuid';

export function ImageEditor({ imageUrl, onSave, onClose }: IImageEditorProps) {
  const [activeTab, setActiveTab] = useState("transform");
  const [activeTransformTab, setActiveTransformTab] = useState("resize");
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
  const [selectedFormat, setSelectedFormat] = useState('png');
  const imageRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const steps: Step[] = [
    {
      target: '.image-container',
      content: '編集する画像が表示されます。画像のプレビューを確認しながら編集できます',
      placement: 'auto',
      disableBeacon: true,
      spotlightClicks: true,
      offset: 10,
    },
    {
      target: '.main-tabs',
      content: '4つの主要な編集機能があります：\n- 加工：リサイズ、回転、反転\n- 色調整：明るさ、コントラスト、彩度\n- フィルター：ぼかし、シャープ、エッジ検出\n- 編集・合成：透かし、合成、スタンプ',
      placement: 'left',
      disableBeacon: true,
      spotlightClicks: true,
    },
    {
      target: '.format-select',
      content: '保存する画像のフォーマットを選択できます。PNG、JPEG、WebPから選択可能です',
      placement: 'bottom',
      disableBeacon: true,
      spotlightClicks: true,
    },
    {
      target: '.reset-button',
      content: 'すべての編集を元に戻すことができます。画像を最初の状態にリセットします',
      placement: 'bottom',
      disableBeacon: true,
      spotlightClicks: true,
    },
    {
      target: '.save-button',
      content: '編集した画像を保存します。元の画像を上書きして保存されます',
      placement: 'bottom',
      disableBeacon: true,
      spotlightClicks: true,
    },
    {
      target: '.save-new-button',
      content: '編集した画像を新しい画像として保存します。元の画像はそのまま残ります',
      placement: 'bottom',
      disableBeacon: true,
      spotlightClicks: true,
    }
  ];

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

  useEffect(() => {
    // モーダルが開かれたときにbodyのスクロールを無効にする
    document.body.style.overflow = 'hidden';

    // コンポーネントのアンマウント時にスクロールを有効に戻す
    return () => {
      document.body.style.overflow = 'auto';
      if (processedImageUrl) {
        URL.revokeObjectURL(processedImageUrl);
      }
    };
  }, [processedImageUrl]);

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

  const handleImageReset = async () => {
    if (originalImageBlob) {
      // 既存のURLを解放
      if (processedImageUrl) {
        URL.revokeObjectURL(processedImageUrl);
      }

      // 元の画像を表示
      setProcessedImageUrl(URL.createObjectURL(originalImageBlob));
      setProcessedImageBlob(originalImageBlob);

      // 画像サイズを元に戻す
      setResizeWidth(originalDimensions.width);
      setResizeHeight(originalDimensions.height);

      // 切り抜き領域を元に戻す
      setClipRegion({
        x: 0,
        y: 0,
        width: originalDimensions.width,
        height: originalDimensions.height
      });

      // 色調整の状態をリセット
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

      // フィルターの状態をリセット
      setGaussianBlur(0);
      setMotionBlur({ angle: 0, distance: 0 });
      setSharpen({ sigma: 0, threshold: 0 });
      setEdgeDetection(0);
      setNoiseReduction(0);
      setVignette(0);
      setHdr(0);
      setMosaic(0);
      setOilPainting({ radius: 0, intensity: 0 });

      // アスペクト比の状態をリセット
      setMaintainAspectRatio(true);
      setSelectedRatio(RATIOS[0]);
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
    if (activeTransformTab !== 'clip') return;

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
    if (!isDragging || activeTransformTab !== 'clip') return;

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

  const handleSave = async () => {
    if (!processedImageBlob && !originalImageBlob) return;
    setIsSave(true);

    try {
      const imageToSave = processedImageBlob || originalImageBlob;
      if (!imageToSave) return;
      const arrayBuffer = await imageToSave.arrayBuffer();
      const imageData = new Uint8Array(arrayBuffer);

      const wasm = await getWasmModule();
      const convertedImage = wasm.convert_image_format(imageData, selectedFormat);

      // Blobを作成し、直接それを渡す（base64エンコードせずに）
      const blob = new Blob([convertedImage], { type: `image/${selectedFormat}` });
      // isNewImageをfalseに設定して上書き保存
      onSave(URL.createObjectURL(blob), false, selectedFormat);
    } catch (error) {
      console.error('Error saving image:', error);
    } finally {
      setIsSave(false);
    }
  };

  const handleSaveNew = async () => {
    if (!processedImageBlob && !originalImageBlob) return;
    setIsSave(true);

    try {
      const imageToSave = processedImageBlob || originalImageBlob;
      if (!imageToSave) return;
      const arrayBuffer = await imageToSave.arrayBuffer();
      const imageData = new Uint8Array(arrayBuffer);

      const wasm = await getWasmModule();
      const convertedImage = wasm.convert_image_format(imageData, selectedFormat);

      // Blobを作成し、直接それを渡す（base64エンコードせずに）
      const blob = new Blob([convertedImage], { type: `image/${selectedFormat}` });
      // isNewImageをtrueに設定して新規保存
      onSave(URL.createObjectURL(blob), true, selectedFormat);
    } catch (error) {
      console.error('Error saving image:', error);
    } finally {
      setIsSave(false);
    }
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

  const handleMakeTransparent = async (threshold: number) => {
    if (!originalImageBlob) return;

    const arrayBuffer = await originalImageBlob.arrayBuffer();
    const imageData = new Uint8Array(arrayBuffer);

    const wasm = await getWasmModule();

    if (typeof wasm.make_transparent !== 'function') {
      throw new Error('Make transparent function not found');
    }

    const transparentImage = wasm.make_transparent(imageData, threshold);

    if (!(transparentImage instanceof Uint8Array)) {
      throw new Error('Invalid make transparent result format');
    }

    const transparentBlob = new Blob([transparentImage], { type: 'image/png' });
    updateProcessedImage(transparentBlob);
  };

  const handleAddWatermark = async (watermark: File, x: number, y: number, opacity: number) => {
    if (!originalImageBlob) return;

    const baseArrayBuffer = await originalImageBlob.arrayBuffer();
    const baseImageData = new Uint8Array(baseArrayBuffer);

    const watermarkArrayBuffer = await watermark.arrayBuffer();
    const watermarkImageData = new Uint8Array(watermarkArrayBuffer);

    const wasm = await getWasmModule();

    if (typeof wasm.add_watermark !== 'function') {
      throw new Error('Add watermark function not found');
    }

    const watermarkedImage = wasm.add_watermark(baseImageData, watermarkImageData, x, y, opacity);

    if (!(watermarkedImage instanceof Uint8Array)) {
      throw new Error('Invalid add watermark result format');
    }

    const watermarkedBlob = new Blob([watermarkedImage], { type: 'image/png' });
    updateProcessedImage(watermarkedBlob);
  };

  const handleComposite = async (overlay: File, x: number, y: number) => {
    if (!originalImageBlob) return;

    const baseArrayBuffer = await originalImageBlob.arrayBuffer();
    const baseImageData = new Uint8Array(baseArrayBuffer);

    const overlayArrayBuffer = await overlay.arrayBuffer();
    const overlayImageData = new Uint8Array(overlayArrayBuffer);

    const wasm = await getWasmModule();

    if (typeof wasm.composite !== 'function') {
      throw new Error('Composite function not found');
    }

    const compositeImage = wasm.composite(baseImageData, overlayImageData, x, y);

    if (!(compositeImage instanceof Uint8Array)) {
      throw new Error('Invalid composite result format');
    }

    const compositeBlob = new Blob([compositeImage], { type: 'image/png' });
    updateProcessedImage(compositeBlob);
  };

  const handleAddStamp = async (stamp: File, x: number, y: number) => {
    if (!originalImageBlob) return;

    const baseArrayBuffer = await originalImageBlob.arrayBuffer();
    const baseImageData = new Uint8Array(baseArrayBuffer);

    const stampArrayBuffer = await stamp.arrayBuffer();
    const stampImageData = new Uint8Array(stampArrayBuffer);

    const wasm = await getWasmModule();

    if (typeof wasm.add_stamp !== 'function') {
      throw new Error('Add stamp function not found');
    }

    const stampedImage = wasm.add_stamp(baseImageData, stampImageData, x, y);

    if (!(stampedImage instanceof Uint8Array)) {
      throw new Error('Invalid add stamp result format');
    }

    const stampedBlob = new Blob([stampedImage], { type: 'image/png' });
    updateProcessedImage(stampedBlob);
  };

  return (
    <>
      <TourGuid steps={steps} />
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
        <div className="flex items-center justify-center min-h-screen p-5 sm:p-4">
          <Card className="w-full mx-auto relative py-3">
            <Button
              variant="outline"
              size="icon"
              className="absolute -top-3 -right-3 h-6 w-6 lg:h-8 lg:w-8 rounded-full border-2 bg-background shadow-md hover:scale-105 transition-transform z-10"
              onClick={onClose}
            >
              <X className="h-1 w-1 lg:h-4 lg:w-4" />
            </Button>
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                <div
                  ref={imageContainerRef}
                  className="image-container flex-[1.2] rounded-lg border bg-card h-[500px] relative overflow-hidden"
                  style={{ zIndex: 5 }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <div className="h-[200px] flex-grow relative lg:h-full lg:absolute lg:inset-0 overflow-auto">
                    <div className="h-full w-full flex items-center justify-center p-4">
                      <div ref={imageRef} className="relative min-w-max">
                        <Image
                          src={processedImageUrl || imageUrl}
                          alt="Image being edited"
                          width={originalDimensions.width}
                          height={originalDimensions.height}
                          style={{
                            width: `${resizeWidth}px`,
                            height: `${resizeHeight}px`,
                            objectFit: maintainAspectRatio ? 'contain' : 'fill'
                          }}
                          priority
                          unoptimized
                        />
                        {activeTab === "transform" && activeTransformTab === "clip" && (
                          <ImageCliperControls clipRegion={clipRegion} onMouseDown={handleMouseDown} />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-background/90 px-3 py-1 rounded-md text-[8px] lg:text-sm">
                    {resizeWidth} × {resizeHeight} px
                  </div>
                </div>

                <div className="w-full lg:w-[450px] flex flex-col shrink-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="main-tabs flex-1 gap-2">
                    <TabsList className="w-full flex items-center h-6 lg:h-9">
                      <TabsTrigger value="transform" className="flex items-center justify-center gap-1 min-w-0 px-1.5 sm:px-2 text-[8px] sm:text-xs py-1.5">
                        <Maximize2 className="w-1 h-1 mr-1 lg:w-4 lg:h-4" />
                        加工
                      </TabsTrigger>
                      <TabsTrigger value="color_adjustment" className="flex items-center justify-center gap-1 min-w-0 px-1.5 sm:px-2 text-[8px] sm:text-xs py-1.5">
                        <Sliders className="w-1 h-1 mr-1 lg:w-4 lg:h-4" />
                        色調整
                      </TabsTrigger>
                      <TabsTrigger value="filters" className="flex items-center justify-center gap-1 min-w-0 px-1.5 sm:px-2 text-[8px] sm:text-xs py-1.5">
                        <Sparkles className="w-1 h-1 mr-1 lg:w-4 lg:h-4" />
                        フィルター
                      </TabsTrigger>
                      <TabsTrigger value="composition" className="flex items-center justify-center gap-1 min-w-0 px-1.5 sm:px-2 text-[8px] sm:text-xs py-1.5">
                        <ImageIcon className="w-1 h-1 mr-1 lg:w-4 lg:h-4" />
                        編集・合成
                      </TabsTrigger>
                    </TabsList>

                    <div className="space-y-4">
                      <TabsContent value="transform" className="mt-0">
                        <Tabs value={activeTransformTab} onValueChange={setActiveTransformTab} className="w-full">
                          <TabsList className="w-full flex items-center h-6 lg:h-9">
                            <TabsTrigger value="resize" className="flex items-center justify-center gap-1 min-w-0 px-1.5 sm:px-2 text-[8px] sm:text-xs py-1.5">
                              <Maximize2 className="w-1 h-1 mr-1 lg:w-4 lg:h-4" />
                              リサイズ
                            </TabsTrigger>
                            <TabsTrigger value="clip" className="flex items-center justify-center gap-1 min-w-0 px-1.5 sm:px-2 text-[8px] sm:text-xs py-1.5 clip-tab">
                              <Scissors className="w-1 h-1 mr-1 lg:w-4 lg:h-4" />
                              切り抜き
                            </TabsTrigger>
                            <TabsTrigger value="rotate" className="flex items-center justify-center gap-1 min-w-0 px-1.5 sm:px-2 text-[8px] sm:text-xs py-1.5">
                              <RotateCw className="w-1 h-1 mr-1 lg:w-4 lg:h-4" />
                              回転・反転
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="resize" className="lg:mt-3">
                            <ImageResizer
                              resizeWidth={resizeWidth}
                              resizeHeight={resizeHeight}
                              onWidthChange={handleWidthChange}
                              onHeightChange={handleHeightChange}
                              onAspectRatioChange={handleAspectRatioChange}
                              maintainAspectRatio={maintainAspectRatio}
                            />
                          </TabsContent>

                          <TabsContent value="clip" className="lg:lg:mt-3">
                            <ImageCliper
                              selectedRatio={selectedRatio}
                              onRatioChange={handleRatioChange}
                              onClip={handleClip}
                              isSave={isSave}
                            />
                          </TabsContent>

                          <TabsContent value="rotate" className="lg:mt-3">
                            <ImageTransform
                              onRotate={handleRotate}
                              onFlip={handleFlip}
                              isSave={isSave}
                            />
                          </TabsContent>
                        </Tabs>
                      </TabsContent>

                      <TabsContent value="color_adjustment">
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

                      <TabsContent value="filters">
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

                      <TabsContent value="composition">
                        <ImageComposition
                          onMakeTransparent={handleMakeTransparent}
                          onAddWatermark={handleAddWatermark}
                          onComposite={handleComposite}
                          onAddStamp={handleAddStamp}
                          isSave={isSave}
                        />
                      </TabsContent>
                    </div>
                  </Tabs>

                  <Separator className="my-2" />

                  <div className="space-y-2">
                    <div className="format-select flex items-center gap-3">
                      <div className="text-[8px] lg:text-sm font-medium mb-1">保存形式</div>
                      <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                        <SelectTrigger className="text-[8px] lg:text-sm h-6! lg:h-9! sm:h-8 px-1 py-0">
                          <SelectValue placeholder="フォーマットを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {IMAGE_FORMATS.map((format) => (
                            <SelectItem
                              key={format.value}
                              value={format.value}
                              className="text-[8px] lg:text-sm h-7 sm:h-8"
                            >
                              {format.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-1 gap-2">
                      <Button
                        className="w-full reset-button text-[8px] lg:text-sm h-6 lg:h-9"
                        onClick={() => handleImageReset()}
                      >
                        画像をリセット
                      </Button>
                      <Button
                        className="w-full save-button text-[8px] lg:text-sm h-6 lg:h-9"
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
                        className="w-full save-new-button text-[8px] lg:text-sm sm:col-span-1 h-6 lg:h-9"
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}