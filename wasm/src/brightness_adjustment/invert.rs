use wasm_bindgen::prelude::*;
use std::io::Cursor;
use image::io::Reader as ImageReader;
use image::{ImageOutputFormat, Rgb};

/// 反転処理
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

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, RgbImage, Rgb};

    #[test]
    fn test_adjust_invert() {
        // テスト用の画像を作成
        let mut img: RgbImage = ImageBuffer::new(2, 2);
        
        // RGB値が異なる色を設定
        let r = 50u8;
        let g = 100u8;
        let b = 150u8;
        
        img.put_pixel(0, 0, Rgb([r, g, b]));
        img.put_pixel(0, 1, Rgb([r, g, b]));
        img.put_pixel(1, 0, Rgb([r, g, b]));
        img.put_pixel(1, 1, Rgb([r, g, b]));
        
        let mut buf = Vec::new();
        img.write_to(&mut Cursor::new(&mut buf), image::ImageOutputFormat::Png).unwrap();
        
        // 反転処理を適用
        let inverted_bytes = adjust_invert(&buf);
        
        // 処理結果をデコード
        let inverted_img = ImageReader::new(Cursor::new(inverted_bytes))
            .with_guessed_format().unwrap()
            .decode().unwrap()
            .to_rgb8();
        
        // 反転処理が正しく行われていることを確認（255からRGB値を引いた値になっているか）
        let pixel = inverted_img.get_pixel(0, 0);
        
        assert_eq!(pixel[0], 255 - r, "赤チャネルが正しく反転されていません");
        assert_eq!(pixel[1], 255 - g, "緑チャネルが正しく反転されていません");
        assert_eq!(pixel[2], 255 - b, "青チャネルが正しく反転されていません");
    }
    
    #[test]
    fn test_adjust_invert_black_white() {
        // 黒と白のピクセルを含む画像を作成
        let mut img: RgbImage = ImageBuffer::new(2, 2);
        
        img.put_pixel(0, 0, Rgb([0, 0, 0]));       // 黒
        img.put_pixel(0, 1, Rgb([255, 255, 255])); // 白
        img.put_pixel(1, 0, Rgb([255, 255, 255])); // 白
        img.put_pixel(1, 1, Rgb([0, 0, 0]));       // 黒
        
        let mut buf = Vec::new();
        img.write_to(&mut Cursor::new(&mut buf), image::ImageOutputFormat::Png).unwrap();
        
        // 反転処理を適用
        let inverted_bytes = adjust_invert(&buf);
        
        // 処理結果をデコード
        let inverted_img = ImageReader::new(Cursor::new(inverted_bytes))
            .with_guessed_format().unwrap()
            .decode().unwrap()
            .to_rgb8();
        
        // 黒と白が反転していることを確認
        let black_to_white = inverted_img.get_pixel(0, 0);
        let white_to_black = inverted_img.get_pixel(0, 1);
        
        // 黒(0,0,0)は白(255,255,255)に
        assert_eq!(black_to_white[0], 255, "黒→白への反転が正しくありません");
        assert_eq!(black_to_white[1], 255, "黒→白への反転が正しくありません");
        assert_eq!(black_to_white[2], 255, "黒→白への反転が正しくありません");
        
        // 白(255,255,255)は黒(0,0,0)に
        assert_eq!(white_to_black[0], 0, "白→黒への反転が正しくありません");
        assert_eq!(white_to_black[1], 0, "白→黒への反転が正しくありません");
        assert_eq!(white_to_black[2], 0, "白→黒への反転が正しくありません");
    }

    #[test]
    fn test_adjust_invert_empty_input() {
        // 不正な入力（空のバイト配列）でエラーハンドリングをテスト
        let invalid_input: Vec<u8> = Vec::new();
        
        // panicすると期待（このテストはpanicが発生すると成功）
        let result = std::panic::catch_unwind(|| {
            let _ = adjust_invert(&invalid_input);
        });
        
        // panicが発生することを確認
        assert!(result.is_err(), "空の入力でpanicが発生しませんでした");
    }
} 