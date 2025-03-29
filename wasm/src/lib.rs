use wasm_bindgen::prelude::*;
use image::io::Reader as ImageReader;
use image::ImageOutputFormat;

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