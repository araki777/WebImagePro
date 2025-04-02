use wasm_bindgen::prelude::*;
use std::io::Cursor;
use image::io::Reader as ImageReader;
use image::{ImageOutputFormat, Rgb};
use crate::color_conversion::{rgb_to_hsv, hsv_to_rgb};

/// 画像の彩度を調整する
#[wasm_bindgen]
pub fn adjust_saturation(input: &[u8], saturation: f32) -> Vec<u8> {
    let mut buf = Vec::new();

    // 画像を読み込み
    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // 画像をRGB8に変換
    let mut img_rgb = img.to_rgb8();

    // 各ピクセルに対して彩度調整を行う
    for pixel in img_rgb.pixels_mut() {
        let (r, g, b) = (pixel.0[0], pixel.0[1], pixel.0[2]);

        // RGBをHSB（HSV）に変換
        let (h, s, v) = rgb_to_hsv(r as f32, g as f32, b as f32);

        // 彩度を調整（0~1で調整するため、saturationに対して操作）
        let new_s = (s * saturation).min(1.0).max(0.0);

        // 調整したHSBからRGBに戻す
        let (new_r, new_g, new_b) = hsv_to_rgb(h, new_s, v);

        // ピクセルの色を更新
        *pixel = Rgb([new_r as u8, new_g as u8, new_b as u8]);
    }

    // PNGとして出力
    img_rgb.write_to(&mut Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

// セピア調整
#[wasm_bindgen]
pub fn adjust_sepia(input: &[u8]) -> Vec<u8> {
    let mut buf = Vec::new();

    // 画像の読み込み
    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // セピアフィルターを適用
    let mut img_rgb = img.to_rgb8();
    for pixel in img_rgb.pixels_mut() {
        let (r, g, b) = (pixel.0[0], pixel.0[1], pixel.0[2]);

        // セピア調整（R, G, Bを調整）
        let tr = (0.393 * r as f32 + 0.769 * g as f32 + 0.189 * b as f32).min(255.0) as u8;
        let tg = (0.349 * r as f32 + 0.686 * g as f32 + 0.168 * b as f32).min(255.0) as u8;
        let tb = (0.272 * r as f32 + 0.534 * g as f32 + 0.131 * b as f32).min(255.0) as u8;

        // ピクセルをセピアに変換
        *pixel = Rgb([tr, tg, tb]);
    }

    // PNGとして出力
    img_rgb.write_to(&mut Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

// カラーバランス調整
#[wasm_bindgen]
pub fn adjust_color_balance(input: &[u8], red_factor: f32, green_factor: f32, blue_factor: f32) -> Vec<u8> {
    let mut buf = Vec::new();

    // 画像の読み込み
    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // 画像をRGB8に変換
    let mut img_rgb = img.to_rgb8();

    // カラーバランス調整
    for pixel in img_rgb.pixels_mut() {
        let r = (pixel.0[0] as f32 * red_factor).clamp(0.0, 255.0) as u8;
        let g = (pixel.0[1] as f32 * green_factor).clamp(0.0, 255.0) as u8;
        let b = (pixel.0[2] as f32 * blue_factor).clamp(0.0, 255.0) as u8;

        *pixel = Rgb([r, g, b]);
    }

    // PNGとして出力
    img_rgb.write_to(&mut Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}