use wasm_bindgen::prelude::*;
use std::io::Cursor;
use image::io::Reader as ImageReader;
use image::{ImageOutputFormat, Rgb, Luma, imageops};

/// 画像の明るさを調整する
#[wasm_bindgen]
pub fn adjust_brightness(input: &[u8], brightness: i32) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // 明るさ調整（正の値で明るく、負の値で暗くなる）
    let adjusted_img = imageops::brighten(&img, brightness);

    // PNGとして出力
    adjusted_img.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

/// 画像のコントラストを調整する
#[wasm_bindgen]
pub fn adjust_contrast(input: &[u8], contrast: f32) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // コントラスト調整
    let adjusted_img = img.adjust_contrast(contrast);

    // PNGとして出力
    adjusted_img.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

// ガンマ補正処理
#[wasm_bindgen]
pub fn adjust_gamma(input: &[u8], gamma: f32) -> Vec<u8> {
    let mut buf = Vec::new();

    // 画像の読み込み
    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // 画像をRGB8に変換
    let mut img_rgb = img.to_rgb8();

    // ガンマ補正（各ピクセルのRGB値を補正）
    for pixel in img_rgb.pixels_mut() {
        let (r, g, b) = (pixel.0[0] as f32, pixel.0[1] as f32, pixel.0[2] as f32);

        // ガンマ補正を適用
        let gamma_corrected_r = (r / 255.0).powf(gamma) * 255.0;
        let gamma_corrected_g = (g / 255.0).powf(gamma) * 255.0;
        let gamma_corrected_b = (b / 255.0).powf(gamma) * 255.0;

        // ピクセルの色を更新
        *pixel = Rgb([
            gamma_corrected_r.clamp(0.0, 255.0) as u8,
            gamma_corrected_g.clamp(0.0, 255.0) as u8,
            gamma_corrected_b.clamp(0.0, 255.0) as u8,
        ]);
    }

    // PNGとして出力
    img_rgb.write_to(&mut Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

// グレースケール変換
#[wasm_bindgen]
pub fn adjust_grayscale(input: &[u8]) -> Vec<u8> {
    let mut buf = Vec::new();

    // 画像の読み込み
    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // グレースケール変換
    let img_gray = img.to_luma8();

    // グレースケール画像をPNGとして出力
    img_gray.write_to(&mut Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

// 反転処理
#[wasm_bindgen]
pub fn adjust_invert(input: &[u8]) -> Vec<u8> {
    let mut buf = Vec::new();

    // 画像の読み込み
    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // 反転処理
    let mut img_rgb = img.to_rgb8();
    for pixel in img_rgb.pixels_mut() {
        let (r, g, b) = (pixel.0[0], pixel.0[1], pixel.0[2]);

        // 反転処理（RGB値を255から引く）
        *pixel = Rgb([255 - r, 255 - g, 255 - b]);
    }

    // PNGとして出力
    img_rgb.write_to(&mut Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

// 画像の白黒変換（2値化）
#[wasm_bindgen]
pub fn adjust_threshold(input: &[u8], threshold: u8) -> Vec<u8> {
    let mut buf = Vec::new();

    // 画像の読み込み
    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // 画像をグレースケールに変換
    let img_gray = img.to_luma8();

    let mut img_binary = img_gray.clone();

    for pixel in img_binary.pixels_mut() {
        let gray_value = pixel.0[0];
        let new_value = if gray_value >= threshold { 255 } else { 0 };
        *pixel = Luma([new_value]);
    }

    // PNGとして出力
    img_binary.write_to(&mut Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}