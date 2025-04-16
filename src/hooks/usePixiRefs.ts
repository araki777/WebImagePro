import * as PIXI from "pixi.js";
import { useRef } from "react";

export interface PixiRefs {
  pixiContainerRef: React.RefObject<HTMLDivElement>;
  appRef: React.MutableRefObject<PIXI.Application | null>;
  parentContainerRef: React.MutableRefObject<PIXI.Container | null>;
  componentContainerRef: React.MutableRefObject<PIXI.Container | null>;
  imageContainerRef: React.MutableRefObject<PIXI.Container | null>;
  sizeContainerRef: React.MutableRefObject<PIXI.Container | null>;
  spriteRef: React.MutableRefObject<PIXI.Sprite | null>;
  sizeTextRef: React.MutableRefObject<PIXI.Text | null>;
  faceGraphicsRef: React.MutableRefObject<PIXI.Graphics | null>;
}

export const usePixiRefs = (): PixiRefs => {
  // HTMLコンテナの参照
  const pixiContainerRef = useRef<HTMLDivElement>(null);

  // PIXI.jsアプリケーションの参照
  const appRef = useRef<PIXI.Application | null>(null);

  // 親コンテナの参照
  const parentContainerRef = useRef<PIXI.Container | null>(null);
  // コンポーネントコンテナの参照
  const componentContainerRef = useRef<PIXI.Container | null>(null);
  // 画像コンテナの参照
  const imageContainerRef = useRef<PIXI.Container | null>(null);
  // サイズコンテナの参照
  const sizeContainerRef = useRef<PIXI.Container | null>(null);

  // スプライトとテキストの参照
  const spriteRef = useRef<PIXI.Sprite | null>(null);
  const sizeTextRef = useRef<PIXI.Text | null>(null);
  // 顔検出グラフィックスの参照
  const faceGraphicsRef = useRef<PIXI.Graphics | null>(null);

  return {
    pixiContainerRef,
    appRef,
    parentContainerRef,
    componentContainerRef,
    imageContainerRef,
    sizeContainerRef,
    spriteRef,
    sizeTextRef,
    faceGraphicsRef,
  };
};
