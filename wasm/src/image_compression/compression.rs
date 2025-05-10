use wasm_bindgen::prelude::*;
use image::{load_from_memory, ImageFormat};
use std::io::Cursor;

#[wasm_bindgen]
#[derive(Debug, Clone, Copy)]
pub enum Format {
  JPEG,
  PNG,
  WebP,
}

#[wasm_bindgen]
pub fn compress_image(input: &[u8], format: Format, quality: u8) -> Vec<u8> {
  let img = load_from_memory(input).expect("Invalid image");
  let mut out = Cursor::new(Vec::new());

  match format {
    Format::JPEG => {
      let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut out, quality);
      encoder.encode(img.as_bytes(), img.width(), img.height(), img.color()).expect("Failed to encode JPEG");
    }
    Format::PNG => {
      img.write_to(&mut out, ImageFormat::Png).expect("Failed to encode PNG");
    }
    Format::WebP => {
      let mut encoder = image::codecs::webp::WebPEncoder::new_lossless(&mut out);
      encoder.encode(img.as_bytes(), img.width(), img.height(), img.color()).expect("Failed to encode WebP");
    }
  }

  out.into_inner()
}