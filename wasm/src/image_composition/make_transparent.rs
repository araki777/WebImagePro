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

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, RgbaImage, ImageFormat};

    #[test]
    fn test_make_transparent() {
        // テスト用の画像データを作成
        let mut img: RgbaImage = ImageBuffer::new(100, 100);
        for x in 0..100 {
            for y in 0..100 {
                let alpha = ((x + y) % 255) as u8;
                img.put_pixel(x, y, Rgba([255, 0, 0, alpha]));
            }
        }
        
        // 画像をバイト配列に変換
        let mut input_buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut input_buf), ImageFormat::Png).unwrap();
        
        // テスト対象の関数を実行
        let threshold = 100;
        let result_buf = make_transparent(&input_buf, threshold);
        
        // 結果を検証
        let result_img = ImageReader::new(std::io::Cursor::new(result_buf))
            .with_guessed_format()
            .unwrap()
            .decode()
            .unwrap();
        
        let result_rgba = result_img.to_rgba8();
        
        // 元の画像のアルファ値がthreshold以下のピクセルが透明になっているか確認
        for x in 0..100 {
            for y in 0..100 {
                let original_alpha = ((x + y) % 255) as u8;
                let result_pixel = result_rgba.get_pixel(x, y);
                
                if original_alpha <= threshold {
                    assert_eq!(result_pixel[3], 0, "アルファ値がthreshold以下のピクセルは透明になるべき");
                } else {
                    assert_eq!(result_pixel[3], original_alpha, "アルファ値がthresholdより大きいピクセルは変更されるべきでない");
                }
            }
        }
    }
} 