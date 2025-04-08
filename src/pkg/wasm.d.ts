/* tslint:disable */
/* eslint-disable */
/**
 * 画像の明るさを調整する
 */
export function adjust_brightness(input: Uint8Array, brightness: number): Uint8Array;
/**
 * グレースケール変換
 */
export function adjust_grayscale(input: Uint8Array): Uint8Array;
/**
 * 反転処理
 */
export function adjust_invert(input: Uint8Array): Uint8Array;
/**
 * セピア調整
 */
export function adjust_sepia(input: Uint8Array): Uint8Array;
/**
 * カラーバランス調整
 */
export function adjust_color_balance(input: Uint8Array, red_factor: number, green_factor: number, blue_factor: number): Uint8Array;
export function resize_image(input: Uint8Array, width: number, height: number): Uint8Array;
export function rotate_image(input: Uint8Array, degrees: number): Uint8Array;
/**
 * 画像の透過処理を実行
 */
export function make_transparent(input: Uint8Array, threshold: number): Uint8Array;
/**
 * 画像のコントラストを調整する
 */
export function adjust_contrast(input: Uint8Array, contrast: number): Uint8Array;
/**
 * ガンマ補正処理
 */
export function adjust_gamma(input: Uint8Array, gamma: number): Uint8Array;
/**
 * 画像の白黒変換（2値化）
 */
export function adjust_threshold(input: Uint8Array, threshold: number): Uint8Array;
/**
 * 画像の彩度を調整する
 */
export function adjust_saturation(input: Uint8Array, saturation: number): Uint8Array;
export function clip_image(input: Uint8Array, x: number, y: number, width: number, height: number): Uint8Array;
export function flip_image(input: Uint8Array, horizontal: boolean): Uint8Array;
export function convert_image_format(input: Uint8Array, format: string): Uint8Array;
/**
 * ウォーターマークを追加
 */
export function add_watermark(input: Uint8Array, watermark: Uint8Array, x: number, y: number, opacity: number): Uint8Array;
/**
 * 画像を合成（レイヤー）
 */
export function composite(input: Uint8Array, overlay: Uint8Array, x: number, y: number): Uint8Array;
/**
 * スタンプを追加
 */
export function add_stamp(input: Uint8Array, stamp: Uint8Array, x: number, y: number): Uint8Array;
/**
 * ガウシアンボカシを適用する
 */
export function apply_gaussian_blur(input: Uint8Array, sigma: number): Uint8Array;
/**
 * モーションボカシを適用する
 */
export function apply_motion_blur(input: Uint8Array, angle: number, distance: number): Uint8Array;
/**
 * シャープ化を適用する
 */
export function apply_sharpen(input: Uint8Array, sigma: number, threshold: number): Uint8Array;
/**
 * エッジ検出を適用する（Sobelフィルター）
 */
export function apply_edge_detection(input: Uint8Array, threshold: number): Uint8Array;
/**
 * ノイズ除去を適用する
 */
export function apply_noise_reduction(input: Uint8Array, radius: number): Uint8Array;
/**
 * ビネット効果を適用する
 */
export function apply_vignette(input: Uint8Array, strength: number): Uint8Array;
/**
 * HDR効果を適用する
 */
export function apply_hdr(input: Uint8Array, strength: number): Uint8Array;
/**
 * モザイク効果を適用する
 */
export function apply_mosaic(input: Uint8Array, block_size: number): Uint8Array;
/**
 * 油彩効果を適用する
 */
export function apply_oil_painting(input: Uint8Array, radius: number, intensity: number): Uint8Array;
export function greet(): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly adjust_brightness: (a: number, b: number, c: number) => [number, number];
  readonly adjust_grayscale: (a: number, b: number) => [number, number];
  readonly adjust_invert: (a: number, b: number) => [number, number];
  readonly adjust_sepia: (a: number, b: number) => [number, number];
  readonly adjust_color_balance: (a: number, b: number, c: number, d: number, e: number) => [number, number];
  readonly resize_image: (a: number, b: number, c: number, d: number) => [number, number];
  readonly rotate_image: (a: number, b: number, c: number) => [number, number];
  readonly make_transparent: (a: number, b: number, c: number) => [number, number];
  readonly adjust_contrast: (a: number, b: number, c: number) => [number, number];
  readonly adjust_gamma: (a: number, b: number, c: number) => [number, number];
  readonly adjust_threshold: (a: number, b: number, c: number) => [number, number];
  readonly adjust_saturation: (a: number, b: number, c: number) => [number, number];
  readonly clip_image: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
  readonly flip_image: (a: number, b: number, c: number) => [number, number];
  readonly convert_image_format: (a: number, b: number, c: number, d: number) => [number, number];
  readonly add_watermark: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number];
  readonly composite: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
  readonly add_stamp: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
  readonly apply_gaussian_blur: (a: number, b: number, c: number) => [number, number];
  readonly apply_motion_blur: (a: number, b: number, c: number, d: number) => [number, number];
  readonly apply_sharpen: (a: number, b: number, c: number, d: number) => [number, number];
  readonly apply_edge_detection: (a: number, b: number, c: number) => [number, number];
  readonly apply_noise_reduction: (a: number, b: number, c: number) => [number, number];
  readonly apply_vignette: (a: number, b: number, c: number) => [number, number];
  readonly apply_hdr: (a: number, b: number, c: number) => [number, number];
  readonly apply_mosaic: (a: number, b: number, c: number) => [number, number];
  readonly apply_oil_painting: (a: number, b: number, c: number, d: number) => [number, number];
  readonly greet: () => [number, number];
  readonly __wbindgen_export_0: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
