use wasm_bindgen::prelude::*;
use image::io::Reader as ImageReader;
use image::{ImageOutputFormat, imageops};

/// ガウシアンボカシを適用する
#[wasm_bindgen]
pub fn apply_gaussian_blur(input: &[u8], sigma: f32) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // ガウシアンボカシを適用（正規分布に基づく滑らかなぼかし）
    let blurred_img = imageops::blur(&img, sigma);

    // PNGとして出力
    blurred_img.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{RgbImage, Rgb};

    #[test]
    fn test_apply_gaussian_blur() {
        // テスト用のシンプルな画像を作成
        let mut img = RgbImage::new(10, 10);
        
        // 左半分を赤色、右半分を青色に設定
        for y in 0..10 {
            for x in 0..5 {
                img.put_pixel(x, y, Rgb([255, 0, 0]));
            }
            for x in 5..10 {
                img.put_pixel(x, y, Rgb([0, 0, 255]));
            }
        }

        // 画像をPNGにエンコード
        let mut input_buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut input_buf), ImageOutputFormat::Png).unwrap();

        // ガウシアンブラーを適用
        let sigma = 1.5;
        let result = apply_gaussian_blur(&input_buf, sigma);

        // 結果がPNGフォーマットで返されていることを確認
        assert!(!result.is_empty());
        
        // 画像デコードができることを確認
        let decoded = ImageReader::new(std::io::Cursor::new(&result))
            .with_guessed_format()
            .unwrap()
            .decode();
        assert!(decoded.is_ok());
        
        // 元のサイズと同じであることを確認
        let decoded_img = decoded.unwrap();
        assert_eq!(decoded_img.width(), 10);
        assert_eq!(decoded_img.height(), 10);
    }
} 