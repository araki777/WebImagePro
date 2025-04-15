use wasm_bindgen::prelude::*;

// 各モジュールを宣言
pub mod brightness_adjustment;
pub mod color_adjustment;
pub mod color_conversion;
pub mod image_operations;
pub mod image_composition;
pub mod filter_effects;
pub mod face_detection;

// 他のモジュールからのエクスポート
pub use brightness_adjustment::*;
pub use color_adjustment::*;
pub use color_conversion::*;
pub use image_operations::*;
pub use image_composition::*;
pub use filter_effects::*;
pub use face_detection::*;

#[wasm_bindgen]
pub fn greet() -> String {
    "Hello from Rust!".to_string()
}