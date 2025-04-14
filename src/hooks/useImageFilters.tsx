import * as PIXI from "pixi.js";
import { RefObject, useState } from "react";

export const useImageFilters = (spriteRef: RefObject<PIXI.Sprite | null>) => {
  const [brightness, setBrightness] = useState(0); // 明度の状態 (-100〜100の範囲)
  const [saturation, setSaturation] = useState(0); // 彩度の状態 (-100〜100の範囲)
  const [contrast, setContrast] = useState(0); // コントラストの状態 (-100〜100の範囲)
  const [hueRotation, setHueRotation] = useState(0); // 色相回転の状態 (0〜360の範囲)
  const [sepiaIntensity, setSepiaIntensity] = useState(0); // セピア効果の強度 (0〜100の範囲)
  const [isInverted, setIsInverted] = useState(false); // ネガポジ反転の状態 (true/false)
  const [alpha, setAlpha] = useState(100); // アルファ値の状態 (0〜100の範囲)
  const [blurStrength, setBlurStrength] = useState(0); // ぼかしの強さ (0〜20の範囲)
  const [horizontalBlurStrength, setHorizontalBlurStrength] = useState(0); // 水平ぼかしの強さ (0〜20の範囲)
  const [verticalBlurStrength, setVerticalBlurStrength] = useState(0); // 垂直ぼかしの強さ (0〜20の範囲)
  const [activeColorTint, setActiveColorTint] = useState<number | null>(null); // アクティブなティントの色
  const [activeLSD, setActiveLSD] = useState(false); // LSDエフェクトがアクティブか
  const [activeNight, setActiveNight] = useState(false); // 夜間モードがアクティブか
  const [activePredator, setActivePredator] = useState(false); // 捕食者視点がアクティブか
  const [activeTechnicolor, setActiveTechnicolor] = useState(false); // テクニカラーがアクティブか
  const [activeToBGR, setActiveToBGR] = useState(false); // RGB反転がアクティブか
  const [activeVintage, setActiveVintage] = useState(false); // ビンテージがアクティブか

  // 明度を適用する関数
  const applyBrightness = (value: number) => {
    if (!spriteRef.current) return;

    // 明度の値を0.0〜2.0の範囲に変換（0が通常、-100が暗く、100が明るい）
    const brightnessValue = 1 + value / 100;

    try {
      // 既存のフィルターを取得（存在しない場合は空の配列）
      const existingFilters =
        (spriteRef.current.filters as PIXI.Filter[]) || [];

      // 明度フィルターを探す
      let brightnessFilter = existingFilters.find(
        (f: PIXI.Filter) =>
          f instanceof PIXI.ColorMatrixFilter &&
          (f as any)._filterType === "brightness"
      ) as PIXI.ColorMatrixFilter | undefined;

      // 新しいフィルター配列を作成（スプレッド演算子を使用して既存のフィルターをコピー）
      const newFilters = [...existingFilters];

      if (!brightnessFilter) {
        // 新しいフィルターを作成
        brightnessFilter = new PIXI.ColorMatrixFilter();
        (brightnessFilter as any)._filterType = "brightness";
        // 新しい配列に追加
        newFilters.push(brightnessFilter);
      } else {
        // 既存のフィルターのインデックスを取得し、新しい配列内の同じ位置に再設定
        const index = existingFilters.indexOf(brightnessFilter);
        if (index !== -1) {
          brightnessFilter = new PIXI.ColorMatrixFilter();
          (brightnessFilter as any)._filterType = "brightness";
          newFilters[index] = brightnessFilter;
        } else {
          newFilters.push(brightnessFilter);
        }
      }

      // フィルターをリセットしてから明度を適用
      brightnessFilter.reset();
      brightnessFilter.brightness(brightnessValue, false);

      // フィルターを更新（新しい配列を設定）
      spriteRef.current.filters = newFilters;

      setBrightness(value);
    } catch (error) {
      console.error("明度の適用でエラーが発生しました:", error);
    }
  };

  // 彩度を適用する関数
  const applySaturation = (value: number) => {
    if (!spriteRef.current) return;

    // 彩度の値を0.0〜2.0の範囲に変換（0が通常、-100が彩度なし、100が高彩度）
    const saturationValue = 1 + value / 100;

    try {
      // 既存のフィルターを取得（存在しない場合は空の配列）
      const existingFilters =
        (spriteRef.current.filters as PIXI.Filter[]) || [];

      // 彩度フィルターを探す
      let saturationFilter = existingFilters.find(
        (f: PIXI.Filter) =>
          f instanceof PIXI.ColorMatrixFilter &&
          (f as any)._filterType === "saturation"
      ) as PIXI.ColorMatrixFilter | undefined;

      // 新しいフィルター配列を作成（スプレッド演算子を使用して既存のフィルターをコピー）
      const newFilters = [...existingFilters];

      if (!saturationFilter) {
        // 新しいフィルターを作成
        saturationFilter = new PIXI.ColorMatrixFilter();
        (saturationFilter as any)._filterType = "saturation";
        // 新しい配列に追加
        newFilters.push(saturationFilter);
      } else {
        // 既存のフィルターのインデックスを取得し、新しい配列内の同じ位置に再設定
        const index = existingFilters.indexOf(saturationFilter);
        if (index !== -1) {
          saturationFilter = new PIXI.ColorMatrixFilter();
          (saturationFilter as any)._filterType = "saturation";
          newFilters[index] = saturationFilter;
        } else {
          newFilters.push(saturationFilter);
        }
      }

      // バージョンに依存せず、直接彩度の行列を設定する
      // 彩度の行列を計算
      const r = 0.3086;
      const g = 0.6094;
      const b = 0.082;

      const sr = (1 - saturationValue) * r;
      const sg = (1 - saturationValue) * g;
      const sb = (1 - saturationValue) * b;

      saturationFilter.matrix = [
        sr + saturationValue,
        sg,
        sb,
        0,
        0,
        sr,
        sg + saturationValue,
        sb,
        0,
        0,
        sr,
        sg,
        sb + saturationValue,
        0,
        0,
        0,
        0,
        0,
        1,
        0,
      ] as PIXI.ColorMatrix;

      // フィルターを更新（新しい配列を設定）
      spriteRef.current.filters = newFilters;

      setSaturation(value);
    } catch (error) {
      console.error("彩度の適用でエラーが発生しました:", error);
    }
  };

  // コントラストを適用する関数
  const applyContrast = (value: number) => {
    if (!spriteRef.current) return;

    // コントラストの値を0.0〜2.0の範囲に変換（0が通常、-100が低コントラスト、100が高コントラスト）
    const contrastValue = 1 + value / 100;

    try {
      // 既存のフィルターを取得（存在しない場合は空の配列）
      const existingFilters =
        (spriteRef.current.filters as PIXI.Filter[]) || [];

      // コントラストフィルターを探す
      let contrastFilter = existingFilters.find(
        (f: PIXI.Filter) =>
          f instanceof PIXI.ColorMatrixFilter &&
          (f as any)._filterType === "contrast"
      ) as PIXI.ColorMatrixFilter | undefined;

      // 新しいフィルター配列を作成（スプレッド演算子を使用して既存のフィルターをコピー）
      const newFilters = [...existingFilters];

      if (!contrastFilter) {
        // 新しいフィルターを作成
        contrastFilter = new PIXI.ColorMatrixFilter();
        (contrastFilter as any)._filterType = "contrast";
        // 新しい配列に追加
        newFilters.push(contrastFilter);
      } else {
        // 既存のフィルターのインデックスを取得し、新しい配列内の同じ位置に再設定
        const index = existingFilters.indexOf(contrastFilter);
        if (index !== -1) {
          contrastFilter = new PIXI.ColorMatrixFilter();
          (contrastFilter as any)._filterType = "contrast";
          newFilters[index] = contrastFilter;
        } else {
          newFilters.push(contrastFilter);
        }
      }

      // フィルターをリセットしてからコントラストを適用
      contrastFilter.reset();

      // コントラスト行列を直接設定
      const intercept = (1 - contrastValue) * 0.5 * 255;
      contrastFilter.matrix = [
        contrastValue,
        0,
        0,
        0,
        intercept / 255,
        0,
        contrastValue,
        0,
        0,
        intercept / 255,
        0,
        0,
        contrastValue,
        0,
        intercept / 255,
        0,
        0,
        0,
        1,
        0,
      ] as PIXI.ColorMatrix;

      // フィルターを更新（新しい配列を設定）
      spriteRef.current.filters = newFilters;

      setContrast(value);
    } catch (error) {
      console.error("コントラストの適用でエラーが発生しました:", error);
    }
  };

  // 色相回転を適用する関数
  const applyHueRotation = (value: number) => {
    if (!spriteRef.current) return;

    try {
      // 既存のフィルターを取得（存在しない場合は空の配列）
      const existingFilters =
        (spriteRef.current.filters as PIXI.Filter[]) || [];

      // 色相フィルターを探す
      let hueFilter = existingFilters.find(
        (f: PIXI.Filter) =>
          f instanceof PIXI.ColorMatrixFilter &&
          (f as any)._filterType === "hue"
      ) as PIXI.ColorMatrixFilter | undefined;

      // 新しいフィルター配列を作成（スプレッド演算子を使用して既存のフィルターをコピー）
      const newFilters = [...existingFilters];

      if (!hueFilter) {
        // 新しいフィルターを作成
        hueFilter = new PIXI.ColorMatrixFilter();
        (hueFilter as any)._filterType = "hue";
        // 新しい配列に追加
        newFilters.push(hueFilter);
      } else {
        // 既存のフィルターのインデックスを取得し、新しい配列内の同じ位置に再設定
        const index = existingFilters.indexOf(hueFilter);
        if (index !== -1) {
          hueFilter = new PIXI.ColorMatrixFilter();
          (hueFilter as any)._filterType = "hue";
          newFilters[index] = hueFilter;
        } else {
          newFilters.push(hueFilter);
        }
      }

      // フィルターをリセット
      hueFilter.reset();

      // 色相回転値をラジアンに変換
      const rad = (value * Math.PI) / 180;

      // 色相回転のための行列を計算
      // 色相回転の行列は複雑なので、計算式を使用
      const cosVal = Math.cos(rad);
      const sinVal = Math.sin(rad);

      // RGB→YIQ変換に近い係数を使用
      const lumR = 0.299;
      const lumG = 0.587;
      const lumB = 0.114;

      // 色相回転行列を計算
      const matrix = [
        lumR + cosVal * (1 - lumR) + sinVal * -lumR,
        lumG + cosVal * -lumG + sinVal * -lumG,
        lumB + cosVal * -lumB + sinVal * (1 - lumB),
        0,
        0,

        lumR + cosVal * -lumR + sinVal * 0.143,
        lumG + cosVal * (1 - lumG) + sinVal * 0.14,
        lumB + cosVal * -lumB + sinVal * -0.283,
        0,
        0,

        lumR + cosVal * -lumR + sinVal * -(1 - lumR),
        lumG + cosVal * -lumG + sinVal * lumG,
        lumB + cosVal * (1 - lumB) + sinVal * lumB,
        0,
        0,

        0,
        0,
        0,
        1,
        0,
      ] as PIXI.ColorMatrix;

      // 行列を適用
      hueFilter.matrix = matrix;

      // フィルターを更新
      spriteRef.current.filters = newFilters;

      setHueRotation(value);
    } catch (error) {
      console.error("色相回転の適用でエラーが発生しました:", error);
    }
  };

  // セピアエフェクトを適用する関数
  const applySepia = (value: number) => {
    if (!spriteRef.current) return;

    try {
      // 既存のフィルターを取得（存在しない場合は空の配列）
      const existingFilters =
        (spriteRef.current.filters as PIXI.Filter[]) || [];

      // セピアフィルターを探す
      let sepiaFilter = existingFilters.find(
        (f: PIXI.Filter) =>
          f instanceof PIXI.ColorMatrixFilter &&
          (f as any)._filterType === "sepia"
      ) as PIXI.ColorMatrixFilter | undefined;

      // 新しいフィルター配列を作成（スプレッド演算子を使用して既存のフィルターをコピー）
      const newFilters = [...existingFilters];

      if (!sepiaFilter) {
        // 新しいフィルターを作成
        sepiaFilter = new PIXI.ColorMatrixFilter();
        (sepiaFilter as any)._filterType = "sepia";
        // 新しい配列に追加
        newFilters.push(sepiaFilter);
      } else {
        // 既存のフィルターのインデックスを取得し、新しい配列内の同じ位置に再設定
        const index = existingFilters.indexOf(sepiaFilter);
        if (index !== -1) {
          sepiaFilter = new PIXI.ColorMatrixFilter();
          (sepiaFilter as any)._filterType = "sepia";
          newFilters[index] = sepiaFilter;
        } else {
          newFilters.push(sepiaFilter);
        }
      }

      // フィルターをリセット
      sepiaFilter.reset();

      // セピア効果の強度を計算（0〜1の範囲）
      const intensity = value / 100;

      // セピア効果の行列
      // セピアの効果を適用するための色変換行列
      // 暖色系の褐色効果を表現する
      const r = 0.393 + 0.607 * (1 - intensity);
      const g = 0.769 - 0.769 * intensity;
      const b = 0.189 - 0.189 * intensity;

      const r2 = 0.349 - 0.349 * intensity;
      const g2 = 0.686 + 0.314 * (1 - intensity);
      const b2 = 0.168 - 0.168 * intensity;

      const r3 = 0.272 - 0.272 * intensity;
      const g3 = 0.534 - 0.534 * intensity;
      const b3 = 0.131 + 0.869 * (1 - intensity);

      // セピア効果が0の場合は通常の画像に戻す
      if (intensity <= 0.01) {
        sepiaFilter.matrix = [
          1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0,
        ] as PIXI.ColorMatrix;
      } else {
        // セピア効果の行列を適用
        sepiaFilter.matrix = [
          r,
          g,
          b,
          0,
          0,
          r2,
          g2,
          b2,
          0,
          0,
          r3,
          g3,
          b3,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
        ] as PIXI.ColorMatrix;
      }

      // フィルターを更新
      spriteRef.current.filters = newFilters;

      setSepiaIntensity(value);
    } catch (error) {
      console.error("セピア効果の適用でエラーが発生しました:", error);
    }
  };

  // ネガポジ反転（インバート）を適用する関数
  const applyInvert = (value: boolean) => {
    if (!spriteRef.current) return;

    try {
      // 既存のフィルターを取得（存在しない場合は空の配列）
      const existingFilters =
        (spriteRef.current.filters as PIXI.Filter[]) || [];

      // インバートフィルターを探す
      let invertFilter = existingFilters.find(
        (f: PIXI.Filter) =>
          f instanceof PIXI.ColorMatrixFilter &&
          (f as any)._filterType === "invert"
      ) as PIXI.ColorMatrixFilter | undefined;

      // 新しいフィルター配列を作成（スプレッド演算子を使用して既存のフィルターをコピー）
      const newFilters = [...existingFilters];

      if (!invertFilter) {
        // 新しいフィルターを作成
        invertFilter = new PIXI.ColorMatrixFilter();
        (invertFilter as any)._filterType = "invert";
        // 新しい配列に追加
        newFilters.push(invertFilter);
      } else {
        // 既存のフィルターのインデックスを取得し、新しい配列内の同じ位置に再設定
        const index = existingFilters.indexOf(invertFilter);
        if (index !== -1) {
          invertFilter = new PIXI.ColorMatrixFilter();
          (invertFilter as any)._filterType = "invert";
          newFilters[index] = invertFilter;
        } else {
          newFilters.push(invertFilter);
        }
      }

      // フィルターをリセット
      invertFilter.reset();

      if (value) {
        // ネガポジ反転行列
        // 色を反転させるための行列（RGB値を1から引いた値にする）
        invertFilter.matrix = [
          -1, 0, 0, 0, 1, 0, -1, 0, 0, 1, 0, 0, -1, 0, 1, 0, 0, 0, 1, 0,
        ] as PIXI.ColorMatrix;
      } else {
        // 通常の行列（変更なし）
        invertFilter.matrix = [
          1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0,
        ] as PIXI.ColorMatrix;
      }

      // フィルターを更新
      spriteRef.current.filters = newFilters;

      setIsInverted(value);
    } catch (error) {
      console.error("ネガポジ反転の適用でエラーが発生しました:", error);
    }
  };

  // アルファフィルターを適用する関数
  const applyAlpha = (value: number) => {
    if (!spriteRef.current) return;

    // アルファ値を0.0〜1.0の範囲に変換
    const alphaValue = value / 100;

    try {
      // 既存のフィルターを取得（存在しない場合は空の配列）
      const existingFilters =
        (spriteRef.current.filters as PIXI.Filter[]) || [];

      // アルファフィルターを探す
      let alphaFilter = existingFilters.find(
        (f: PIXI.Filter) => (f as any)._filterType === "alpha"
      ) as PIXI.AlphaFilter | undefined;

      // 新しいフィルター配列を作成（スプレッド演算子を使用して既存のフィルターをコピー）
      const newFilters = [...existingFilters];

      // アルファ値が100の場合（効果なし）は、既存のフィルターがあれば削除
      if (value >= 100) {
        if (alphaFilter) {
          const index = existingFilters.indexOf(alphaFilter);
          if (index !== -1) {
            newFilters.splice(index, 1);
          }
        }
        spriteRef.current.filters = newFilters;
        setAlpha(100);
        return;
      }

      if (!alphaFilter) {
        // 新しいフィルターを作成
        alphaFilter = new PIXI.AlphaFilter({ alpha: alphaValue });
        (alphaFilter as any)._filterType = "alpha";
        newFilters.push(alphaFilter);
      } else {
        // 既存のフィルターのアルファ値を更新
        alphaFilter.alpha = alphaValue;
      }

      // フィルターを更新
      spriteRef.current.filters = newFilters;

      setAlpha(value);
    } catch (error) {
      console.error("アルファ値の適用でエラーが発生しました:", error);
    }
  };

  // ぼかしフィルターを適用する関数
  const applyBlur = (value: number) => {
    if (!spriteRef.current) return;

    try {
      // 既存のフィルターを取得（存在しない場合は空の配列）
      const existingFilters =
        (spriteRef.current.filters as PIXI.Filter[]) || [];

      // ぼかしフィルターを探す
      let blurFilter = existingFilters.find(
        (f: PIXI.Filter) => (f as any)._filterType === "blur"
      ) as PIXI.BlurFilter | undefined;

      // 新しいフィルター配列を作成（スプレッド演算子を使用して既存のフィルターをコピー）
      const newFilters = [...existingFilters];

      // ぼかし強度が0の場合（効果なし）は、既存のフィルターがあれば削除
      if (value <= 0) {
        if (blurFilter) {
          const index = existingFilters.indexOf(blurFilter);
          if (index !== -1) {
            newFilters.splice(index, 1);
          }
        }
        spriteRef.current.filters = newFilters;
        setBlurStrength(0);
        return;
      }

      if (!blurFilter) {
        // 新しいぼかしフィルターを作成
        // BlurFilter({strength, quality, kernelSize})
        blurFilter = new PIXI.BlurFilter({
          strength: value, // ぼかしの強さ
          quality: 3, // 品質（パス回数、高いほど品質が良いが処理が重くなる）
          kernelSize: 5, // カーネルサイズ (5, 7, 9, 11, 13, 15のいずれか)
        });
        (blurFilter as any)._filterType = "blur";

        // パディング値を設定（ぼかしフィルターの場合、パディングを適切に設定しないと端が切れる）
        blurFilter.padding = Math.ceil(value * 2);

        newFilters.push(blurFilter);
      } else {
        // 既存のフィルターの強度を更新
        blurFilter.strength = value;

        // パディング値も更新
        blurFilter.padding = Math.ceil(value * 2);
      }

      // フィルターを更新
      spriteRef.current.filters = newFilters;

      setBlurStrength(value);
    } catch (error) {
      console.error("ぼかし効果の適用でエラーが発生しました:", error);
    }
  };

  // 方向性のあるぼかしフィルターを適用する関数（水平方向）
  const applyHorizontalBlur = (value: number) => {
    if (!spriteRef.current) return;

    try {
      // 既存のフィルターを取得（存在しない場合は空の配列）
      const existingFilters =
        (spriteRef.current.filters as PIXI.Filter[]) || [];

      // 水平ぼかしフィルターを探す
      let horizontalBlurFilter = existingFilters.find(
        (f: PIXI.Filter) => (f as any)._filterType === "horizontalBlur"
      ) as PIXI.BlurFilterPass | undefined;

      // 新しいフィルター配列を作成
      const newFilters = [...existingFilters];

      // ぼかし強度が0の場合は、既存のフィルターがあれば削除
      if (value <= 0) {
        if (horizontalBlurFilter) {
          const index = existingFilters.indexOf(horizontalBlurFilter);
          if (index !== -1) {
            newFilters.splice(index, 1);
          }
        }
        spriteRef.current.filters = newFilters;
        setHorizontalBlurStrength(0);
        return;
      }

      if (!horizontalBlurFilter) {
        // 新しい水平ぼかしフィルターを作成
        horizontalBlurFilter = new PIXI.BlurFilterPass({
          horizontal: true, // 水平方向のぼかし
          strength: value, // ぼかしの強さ
          quality: 3, // 品質
          kernelSize: 5, // カーネルサイズ
        });
        (horizontalBlurFilter as any)._filterType = "horizontalBlur";

        // パディング値を設定
        horizontalBlurFilter.padding = Math.ceil(value * 2);

        newFilters.push(horizontalBlurFilter);
      } else {
        // 既存のフィルターの強度を更新
        horizontalBlurFilter.strength = value;

        // パディング値も更新
        horizontalBlurFilter.padding = Math.ceil(value * 2);
      }

      // フィルターを更新
      spriteRef.current.filters = newFilters;

      setHorizontalBlurStrength(value);
    } catch (error) {
      console.error("水平ぼかし効果の適用でエラーが発生しました:", error);
    }
  };

  // 方向性のあるぼかしフィルターを適用する関数（垂直方向）
  const applyVerticalBlur = (value: number) => {
    if (!spriteRef.current) return;

    try {
      // 既存のフィルターを取得（存在しない場合は空の配列）
      const existingFilters =
        (spriteRef.current.filters as PIXI.Filter[]) || [];

      // 垂直ぼかしフィルターを探す
      let verticalBlurFilter = existingFilters.find(
        (f: PIXI.Filter) => (f as any)._filterType === "verticalBlur"
      ) as PIXI.BlurFilterPass | undefined;

      // 新しいフィルター配列を作成
      const newFilters = [...existingFilters];

      // ぼかし強度が0の場合は、既存のフィルターがあれば削除
      if (value <= 0) {
        if (verticalBlurFilter) {
          const index = existingFilters.indexOf(verticalBlurFilter);
          if (index !== -1) {
            newFilters.splice(index, 1);
          }
        }
        spriteRef.current.filters = newFilters;
        setVerticalBlurStrength(0);
        return;
      }

      if (!verticalBlurFilter) {
        // 新しい垂直ぼかしフィルターを作成
        verticalBlurFilter = new PIXI.BlurFilterPass({
          horizontal: false, // 垂直方向のぼかし
          strength: value, // ぼかしの強さ
          quality: 3, // 品質
          kernelSize: 5, // カーネルサイズ
        });
        (verticalBlurFilter as any)._filterType = "verticalBlur";

        // パディング値を設定
        verticalBlurFilter.padding = Math.ceil(value * 2);

        newFilters.push(verticalBlurFilter);
      } else {
        // 既存のフィルターの強度を更新
        verticalBlurFilter.strength = value;

        // パディング値も更新
        verticalBlurFilter.padding = Math.ceil(value * 2);
      }

      // フィルターを更新
      spriteRef.current.filters = newFilters;

      setVerticalBlurStrength(value);
    } catch (error) {
      console.error("垂直ぼかし効果の適用でエラーが発生しました:", error);
    }
  };

  // カラーブレンドモードを設定する関数
  const setBlendMode = (blendMode: string) => {
    if (!spriteRef.current) return;

    try {
      // PIXI.js v8でのブレンドモード設定
      // 型エラー回避のために型アサーションを使用
      (spriteRef.current as any).blendMode = blendMode;

      console.log(`ブレンドモードを設定: ${blendMode}`);
    } catch (error) {
      console.error("ブレンドモードの設定でエラーが発生しました:", error);
    }
  };

  // 他のエフェクトフィルターを削除する共通関数
  const removeAllEffectFilters = () => {
    if (!spriteRef.current) return;

    const existingFilters = (spriteRef.current.filters as PIXI.Filter[]) || [];
    const newFilters = existingFilters.filter((filter) => {
      // 特殊エフェクトフィルターのタイプリスト
      const effectFilterTypes = [
        "tint",
        "lsd",
        "night",
        "predator",
        "technicolor",
        "toBGR",
        "vintage",
      ];

      // ColorMatrixFilterかつ特殊エフェクトタイプを持つフィルターを削除
      if (filter instanceof PIXI.ColorMatrixFilter) {
        const filterType = (filter as any)._filterType;
        return !effectFilterTypes.includes(filterType);
      }
      return true;
    });

    // 更新したフィルター配列を設定
    spriteRef.current.filters = newFilters;

    // すべてのエフェクト状態をリセット
    setActiveColorTint(null);
    setActiveLSD(false);
    setActiveNight(false);
    setActivePredator(false);
    setActiveTechnicolor(false);
    setActiveToBGR(false);
    setActiveVintage(false);
  };

  // ティントを適用する関数
  const applyTint = (color: number) => {
    if (!spriteRef.current) return;

    try {
      // 同じ色が選択された場合はトグル動作（オフにする）
      if (activeColorTint === color) {
        removeAllEffectFilters();
        return;
      }

      // すべての特殊エフェクトフィルターを一旦削除
      removeAllEffectFilters();

      // 既存のフィルターを取得
      const existingFilters =
        (spriteRef.current.filters as PIXI.Filter[]) || [];

      // 新しいティントフィルターを作成
      const tintFilter = new PIXI.ColorMatrixFilter();
      (tintFilter as any)._filterType = "tint";

      // ティント効果用のカラーマトリックス
      // 色を抽出
      const r = ((color >> 16) & 0xff) / 255;
      const g = ((color >> 8) & 0xff) / 255;
      const b = (color & 0xff) / 255;

      // ティントマトリックス
      const matrix = [
        0.3 * r * 2,
        0.3 * r * 2,
        0.3 * r * 2,
        0,
        0,
        0.59 * g * 2,
        0.59 * g * 2,
        0.59 * g * 2,
        0,
        0,
        0.11 * b * 2,
        0.11 * b * 2,
        0.11 * b * 2,
        0,
        0,
        0,
        0,
        0,
        1,
        0,
      ] as PIXI.ColorMatrix;

      tintFilter.matrix = matrix;

      // フィルターを更新
      spriteRef.current.filters = [...existingFilters, tintFilter];

      // 状態を更新
      setActiveColorTint(color);
    } catch (error) {
      console.error("ティントの適用でエラーが発生しました:", error);
    }
  };

  // LSD効果を適用する関数
  const applyLSD = () => {
    if (!spriteRef.current) return;

    try {
      // 既に有効な場合はトグル動作（オフにする）
      if (activeLSD) {
        removeAllEffectFilters();
        return;
      }

      // すべての特殊エフェクトフィルターを一旦削除
      removeAllEffectFilters();

      // 既存のフィルターを取得
      const existingFilters =
        (spriteRef.current.filters as PIXI.Filter[]) || [];

      // 新しいLSDフィルターを作成
      const lsdFilter = new PIXI.ColorMatrixFilter();
      (lsdFilter as any)._filterType = "lsd";

      // LSD効果用のカラーマトリックス
      lsdFilter.matrix = [
        2, -0.4, 0.5, 0, 0, -0.5, 2, -0.4, 0, 0, -0.4, -0.5, 3, 0, 0, 0, 0, 0,
        1, 0,
      ] as PIXI.ColorMatrix;

      // フィルターを更新
      spriteRef.current.filters = [...existingFilters, lsdFilter];

      // 状態を更新
      setActiveLSD(true);
    } catch (error) {
      console.error("LSD効果の適用でエラーが発生しました:", error);
    }
  };

  // 夜間モードを適用する関数
  const applyNight = () => {
    if (!spriteRef.current) return;

    try {
      // 既に有効な場合はトグル動作（オフにする）
      if (activeNight) {
        removeAllEffectFilters();
        return;
      }

      // すべての特殊エフェクトフィルターを一旦削除
      removeAllEffectFilters();

      // 既存のフィルターを取得
      const existingFilters =
        (spriteRef.current.filters as PIXI.Filter[]) || [];

      // 新しい夜間モードフィルターを作成
      const nightFilter = new PIXI.ColorMatrixFilter();
      (nightFilter as any)._filterType = "night";

      // 夜間モード用のカラーマトリックス
      nightFilter.matrix = [
        0.1, 0.25, 0.5, 0, 0, 0.1, 0.25, 0.5, 0, 0, 0.5, 0.5, 1.0, 0, 0, 0, 0,
        0, 1, 0,
      ] as PIXI.ColorMatrix;

      // フィルターを更新
      spriteRef.current.filters = [...existingFilters, nightFilter];

      // 状態を更新
      setActiveNight(true);
    } catch (error) {
      console.error("夜間モードの適用でエラーが発生しました:", error);
    }
  };

  // 捕食者視点を適用する関数
  const applyPredator = () => {
    if (!spriteRef.current) return;

    try {
      // 既に有効な場合はトグル動作（オフにする）
      if (activePredator) {
        removeAllEffectFilters();
        return;
      }

      // すべての特殊エフェクトフィルターを一旦削除
      removeAllEffectFilters();

      // 既存のフィルターを取得
      const existingFilters =
        (spriteRef.current.filters as PIXI.Filter[]) || [];

      // 新しい捕食者視点フィルターを作成
      const predatorFilter = new PIXI.ColorMatrixFilter();
      (predatorFilter as any)._filterType = "predator";

      // 捕食者視点用のカラーマトリックス
      predatorFilter.matrix = [
        1.5, -0.5, -0.5, 0, 0, -0.5, 1, -0.5, 0, 0, -0.5, -0.5, 1.5, 0, 0, 0, 0,
        0, 1, 0,
      ] as PIXI.ColorMatrix;

      // フィルターを更新
      spriteRef.current.filters = [...existingFilters, predatorFilter];

      // 状態を更新
      setActivePredator(true);
    } catch (error) {
      console.error("捕食者視点の適用でエラーが発生しました:", error);
    }
  };

  // テクニカラーを適用する関数
  const applyTechnicolor = () => {
    if (!spriteRef.current) return;

    try {
      // 既に有効な場合はトグル動作（オフにする）
      if (activeTechnicolor) {
        removeAllEffectFilters();
        return;
      }

      // すべての特殊エフェクトフィルターを一旦削除
      removeAllEffectFilters();

      // 既存のフィルターを取得
      const existingFilters =
        (spriteRef.current.filters as PIXI.Filter[]) || [];

      // 新しいテクニカラーフィルターを作成
      const technicolorFilter = new PIXI.ColorMatrixFilter();
      (technicolorFilter as any)._filterType = "technicolor";

      // テクニカラー効果用のカラーマトリックス
      technicolorFilter.matrix = [
        1.3, -0.3, -0.1, 0, 0, -0.2, 1.2, -0.1, 0, 0, -0.1, -0.3, 1.5, 0, 0, 0,
        0, 0, 1, 0,
      ] as PIXI.ColorMatrix;

      // フィルターを更新
      spriteRef.current.filters = [...existingFilters, technicolorFilter];

      // 状態を更新
      setActiveTechnicolor(true);
    } catch (error) {
      console.error("テクニカラーの適用でエラーが発生しました:", error);
    }
  };

  // 赤と青を入れ替える関数
  const applyToBGR = () => {
    if (!spriteRef.current) return;

    try {
      // 既に有効な場合はトグル動作（オフにする）
      if (activeToBGR) {
        removeAllEffectFilters();
        return;
      }

      // すべての特殊エフェクトフィルターを一旦削除
      removeAllEffectFilters();

      // 既存のフィルターを取得
      const existingFilters =
        (spriteRef.current.filters as PIXI.Filter[]) || [];

      // 新しいRGB反転フィルターを作成
      const toBGRFilter = new PIXI.ColorMatrixFilter();
      (toBGRFilter as any)._filterType = "toBGR";

      // RGB反転用のカラーマトリックス
      toBGRFilter.matrix = [
        0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0,
      ] as PIXI.ColorMatrix;

      // フィルターを更新
      spriteRef.current.filters = [...existingFilters, toBGRFilter];

      // 状態を更新
      setActiveToBGR(true);
    } catch (error) {
      console.error("赤と青の入れ替えでエラーが発生しました:", error);
    }
  };

  // ビンテージ効果を適用する関数
  const applyVintage = () => {
    if (!spriteRef.current) return;

    try {
      // 既に有効な場合はトグル動作（オフにする）
      if (activeVintage) {
        removeAllEffectFilters();
        return;
      }

      // すべての特殊エフェクトフィルターを一旦削除
      removeAllEffectFilters();

      // 既存のフィルターを取得
      const existingFilters =
        (spriteRef.current.filters as PIXI.Filter[]) || [];

      // 新しいビンテージフィルターを作成
      const vintageFilter = new PIXI.ColorMatrixFilter();
      (vintageFilter as any)._filterType = "vintage";

      // ビンテージ効果用のカラーマトリックス
      vintageFilter.matrix = [
        0.6, 0.3, 0.1, 0, 0, 0.2, 0.7, 0.1, 0, 0, 0.15, 0.1, 0.4, 0, 0, 0, 0, 0,
        1, 0,
      ] as PIXI.ColorMatrix;

      // フィルターを更新
      spriteRef.current.filters = [...existingFilters, vintageFilter];

      // 状態を更新
      setActiveVintage(true);
    } catch (error) {
      console.error("ビンテージ効果の適用でエラーが発生しました:", error);
    }
  };

  // フィルターをすべてリセットする関数
  const resetFilters = () => {
    if (!spriteRef.current) return;

    // フィルターをリセット（必ず空の配列を設定する）
    spriteRef.current.filters = [];

    // 状態変数も元に戻す
    setBrightness(0);
    setSaturation(0);
    setContrast(0);
    setHueRotation(0);
    setSepiaIntensity(0);
    setIsInverted(false);
    setAlpha(100);
    setBlurStrength(0);
    setHorizontalBlurStrength(0);
    setVerticalBlurStrength(0);
    setActiveColorTint(null);
    setActiveLSD(false);
    setActiveNight(false);
    setActivePredator(false);
    setActiveTechnicolor(false);
    setActiveToBGR(false);
    setActiveVintage(false);

    // ブレンドモードをリセット
    if (spriteRef.current) {
      (spriteRef.current as any).blendMode = "normal";
    }
  };

  return {
    // 状態
    brightness,
    saturation,
    contrast,
    hueRotation,
    sepiaIntensity,
    isInverted,
    alpha,
    blurStrength,
    horizontalBlurStrength,
    verticalBlurStrength,
    activeColorTint,
    activeLSD,
    activeNight,
    activePredator,
    activeTechnicolor,
    activeToBGR,
    activeVintage,

    // フィルター関数
    applyBrightness,
    applySaturation,
    applyContrast,
    applyHueRotation,
    applySepia,
    applyInvert,
    applyAlpha,
    applyBlur,
    applyHorizontalBlur,
    applyVerticalBlur,
    applyTint,
    applyLSD,
    applyNight,
    applyPredator,
    applyTechnicolor,
    applyToBGR,
    applyVintage,
    setBlendMode,
    resetFilters,
  };
};
