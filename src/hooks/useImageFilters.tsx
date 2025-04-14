import * as PIXI from "pixi.js";
import { RefObject, useState } from "react";

export const useImageFilters = (spriteRef: RefObject<PIXI.Sprite | null>) => {
  const [brightness, setBrightness] = useState(0); // 明度の状態 (-100〜100の範囲)
  const [saturation, setSaturation] = useState(0); // 彩度の状態 (-100〜100の範囲)
  const [contrast, setContrast] = useState(0); // コントラストの状態 (-100〜100の範囲)
  const [hueRotation, setHueRotation] = useState(0); // 色相回転の状態 (0〜360の範囲)
  const [sepiaIntensity, setSepiaIntensity] = useState(0); // セピア効果の強度 (0〜100の範囲)
  const [isInverted, setIsInverted] = useState(false); // ネガポジ反転の状態 (true/false)

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
  };

  return {
    // 状態
    brightness,
    saturation,
    contrast,
    hueRotation,
    sepiaIntensity,
    isInverted,

    // フィルター関数
    applyBrightness,
    applySaturation,
    applyContrast,
    applyHueRotation,
    applySepia,
    applyInvert,
    resetFilters,
  };
};
