import wasmInit, * as wasmExports from "../../wasm/pkg/wasm";
import wasmBinary from "../../wasm/pkg/wasm_bg.wasm?module";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wasmModule: any = null;
let initialized = false;

export const getWasmModule = async () => {
  if (!initialized) {
    try {
      // WASMを初期化
      await wasmInit(wasmBinary);
      wasmModule = wasmExports;
      initialized = true;
    } catch (error) {
      console.error('WAMSモジュールの初期化に失敗しました:', error);
      throw error;
    }
  }

  return wasmModule;
};