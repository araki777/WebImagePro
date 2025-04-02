const wasmPath = process.env.NEXT_PUBLIC_WASM_PATH || "";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wasmModule: any = null;
let initialized = false;

export const getWasmModule = async () => {
  if (!wasmModule) {
    wasmModule = await import(wasmPath);
  }

  if (!initialized) {
    await wasmModule.default();
    initialized = true;
  }

  return wasmModule;
};