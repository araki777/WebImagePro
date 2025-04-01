mod color_conversion;

use wasm_bindgen::prelude::*;
use std::io::Cursor;
use image::io::Reader as ImageReader;
use image::{GenericImageView, ImageOutputFormat, imageops, Rgb };
use color_conversion::{rgb_to_hsv, hsv_to_rgb};

// 画像のリサイズ
#[wasm_bindgen]
pub fn resize_image(input: &[u8], width: u32, height: u32) -> Vec<u8> {
    // 出力用のバッファを作成
    let mut buf = Vec::new();

    // 画像データの読み込み
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // 画像のリサイズ
    let resized_image = img.resize(width, height, image::imageops::FilterType::Lanczos3);

    // PNGとして出力
    resized_image.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

// 画像の一部を切り取る
#[wasm_bindgen]
pub fn clip_image(input: &[u8], x: u32, y: u32, width: u32, height: u32) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // 画像のサイズを取得
    let (img_width, img_height) = img.dimensions();

    // 切り取り範囲を画像の範囲内に制限
    let x = x.min(img_width);
    let y = y.min(img_height);
    let width = width.min(img_width - x);
    let height = height.min(img_height - y);

    // 切り取り処理
    let cropped_image = img.crop_imm(x, y, width, height);

    // PNGとして出力
    cropped_image.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

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