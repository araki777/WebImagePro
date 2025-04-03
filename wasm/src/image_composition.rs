use image::{Rgba, ImageOutputFormat};
use image::io::Reader as ImageReader;
use wasm_bindgen::prelude::*;

/// 画像の透過処理を実行
#[wasm_bindgen]
pub fn make_transparent(input: &[u8], threshold: u8) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    let mut rgba = img.to_rgba8();
    for pixel in rgba.pixels_mut() {
        if pixel[3] <= threshold {
            *pixel = Rgba([0, 0, 0, 0]);
        }
    }

    rgba.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();
    buf
}

/// ウォーターマークを追加
#[wasm_bindgen]
pub fn add_watermark(
    input: &[u8],
    watermark: &[u8],
    x: u32,
    y: u32,
    opacity: f32,
) -> Vec<u8> {
    let mut buf = Vec::new();
    let base = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();
    let watermark = ImageReader::new(std::io::Cursor::new(watermark))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    let mut base_rgba = base.to_rgba8();
    let watermark_rgba = watermark.to_rgba8();
    let (width, height) = watermark_rgba.dimensions();

    for i in 0..width {
        for j in 0..height {
            let target_x = x + i;
            let target_y = y + j;
            if target_x < base_rgba.width() && target_y < base_rgba.height() {
                let pixel = base_rgba.get_pixel_mut(target_x, target_y);
                let wm_pixel = watermark_rgba.get_pixel(i, j);
                pixel[0] = (pixel[0] as f32 * (1.0 - opacity) + wm_pixel[0] as f32 * opacity) as u8;
                pixel[1] = (pixel[1] as f32 * (1.0 - opacity) + wm_pixel[1] as f32 * opacity) as u8;
                pixel[2] = (pixel[2] as f32 * (1.0 - opacity) + wm_pixel[2] as f32 * opacity) as u8;
                pixel[3] = pixel[3].max(wm_pixel[3]);
            }
        }
    }

    base_rgba.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();
    buf
}

/// 画像を合成（レイヤー）
#[wasm_bindgen]
pub fn composite(input: &[u8], overlay: &[u8], x: u32, y: u32) -> Vec<u8> {
    let mut buf = Vec::new();
    let base = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();
    let overlay = ImageReader::new(std::io::Cursor::new(overlay))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    let mut base_rgba = base.to_rgba8();
    let overlay_rgba = overlay.to_rgba8();
    let (width, height) = overlay_rgba.dimensions();

    for i in 0..width {
        for j in 0..height {
            let target_x = x + i;
            let target_y = y + j;
            if target_x < base_rgba.width() && target_y < base_rgba.height() {
                let pixel = base_rgba.get_pixel_mut(target_x, target_y);
                let overlay_pixel = overlay_rgba.get_pixel(i, j);
                let alpha = overlay_pixel[3] as f32 / 255.0;

                pixel[0] = (pixel[0] as f32 * (1.0 - alpha) + overlay_pixel[0] as f32 * alpha) as u8;
                pixel[1] = (pixel[1] as f32 * (1.0 - alpha) + overlay_pixel[1] as f32 * alpha) as u8;
                pixel[2] = (pixel[2] as f32 * (1.0 - alpha) + overlay_pixel[2] as f32 * alpha) as u8;
                pixel[3] = pixel[3].max(overlay_pixel[3]);
            }
        }
    }

    base_rgba.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();
    buf
}

/// スタンプを追加
#[wasm_bindgen]
pub fn add_stamp(input: &[u8], stamp: &[u8], x: u32, y: u32) -> Vec<u8> {
    let mut buf = Vec::new();
    let base = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();
    let stamp = ImageReader::new(std::io::Cursor::new(stamp))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    let mut base_rgba = base.to_rgba8();
    let stamp_rgba = stamp.to_rgba8();
    let (width, height) = stamp_rgba.dimensions();

    for i in 0..width {
        for j in 0..height {
            let target_x = x + i;
            let target_y = y + j;
            if target_x < base_rgba.width() && target_y < base_rgba.height() {
                let pixel = base_rgba.get_pixel_mut(target_x, target_y);
                let stamp_pixel = stamp_rgba.get_pixel(i, j);
                let alpha = stamp_pixel[3] as f32 / 255.0;

                pixel[0] = (pixel[0] as f32 * (1.0 - alpha) + stamp_pixel[0] as f32 * alpha) as u8;
                pixel[1] = (pixel[1] as f32 * (1.0 - alpha) + stamp_pixel[1] as f32 * alpha) as u8;
                pixel[2] = (pixel[2] as f32 * (1.0 - alpha) + stamp_pixel[2] as f32 * alpha) as u8;
                pixel[3] = pixel[3].max(stamp_pixel[3]);
            }
        }
    }

    base_rgba.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();
    buf
}