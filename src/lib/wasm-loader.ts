import wasmInit, * as wasmExports from "../../public/wasm/wasm";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wasmModule: any = null;
let initialized = false;

export const getWasmModule = async () => {
  if (!initialized) {
    try {
      if (typeof window !== 'undefined') {
        // ブラウザ環境では動的にWASMをインポート
        const wasmResponse = await fetch('/wasm/wasm_bg.wasm');
        if (!wasmResponse.ok) {
          throw new Error(`WASM fetch failed: ${wasmResponse.status} ${wasmResponse.statusText}`);
        }
        const buffer = await wasmResponse.arrayBuffer();
        const wasmBinary = await WebAssembly.compile(buffer);
        
        // WASMを初期化
        await wasmInit(wasmBinary);
      } else {
        // Node.js環境では直接初期化
        await wasmInit();
      }
      
      wasmModule = wasmExports;
      initialized = true;
    } catch (error) {
      console.error('WAMSモジュールの初期化に失敗しました:', error);
      console.error(error);
      throw error;
    }
  }

  return wasmModule;
};