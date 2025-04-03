use wasm_bindgen::prelude::*;
use image::io::Reader as ImageReader;
use image::{GenericImageView, ImageOutputFormat};

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

// 画像の回転
#[wasm_bindgen]
pub fn rotate_image(input: &[u8], degrees: u32) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // 回転処理
    let rotated_image = match degrees {
        90 => img.rotate90(),
        180 => img.rotate180(),
        270 => img.rotate270(),
        _ => img,
    };

    // PNGとして出力
    rotated_image.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

// 画像の反転
#[wasm_bindgen]
pub fn flip_image(input: &[u8], horizontal: bool) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // 反転処理
    let flipped_image = if horizontal {
        img.fliph()
    } else {
        img.flipv()
    };

    // PNGとして出力
    flipped_image.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}