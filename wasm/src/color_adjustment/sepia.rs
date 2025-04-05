use wasm_bindgen::prelude::*;
use std::io::Cursor;
use image::io::Reader as ImageReader;
use image::{ImageOutputFormat, Rgb};

/// セピア調整
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

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, RgbImage, Rgb};

    #[test]
    fn test_adjust_sepia() {
        // テスト用の小さな画像を作成
        let mut img: RgbImage = ImageBuffer::new(2, 2);
        
        // 異なる色を設定
        let colors = [
            [200, 200, 200], // 白っぽい
            [100, 100, 100], // グレー
            [255, 0, 0],     // 赤
            [0, 0, 255]      // 青
        ];
        
        img.put_pixel(0, 0, Rgb(colors[0]));
        img.put_pixel(0, 1, Rgb(colors[1]));
        img.put_pixel(1, 0, Rgb(colors[2]));
        img.put_pixel(1, 1, Rgb(colors[3]));
        
        // 画像をPNG形式のバイト配列に変換
        let mut buf = Vec::new();
        img.write_to(&mut Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();
        
        // セピア調整を適用
        let sepia_bytes = adjust_sepia(&buf);
        
        // 処理結果をデコード
        let sepia_img = ImageReader::new(Cursor::new(sepia_bytes))
            .with_guessed_format().unwrap()
            .decode().unwrap()
            .to_rgb8();
        
        // セピアの特徴を確認（R > G > B）
        for y in 0..2 {
            for x in 0..2 {
                let pixel = sepia_img.get_pixel(x, y);
                assert!(pixel[0] >= pixel[1], "セピア調整後のR値がG値以上になっていません ({}, {})", x, y);
                assert!(pixel[1] >= pixel[2], "セピア調整後のG値がB値以上になっていません ({}, {})", x, y);
            }
        }
        
        // 特定のピクセルについて期待される変換をチェック
        let orig_white = colors[0];
        let sepia_white = sepia_img.get_pixel(0, 0);
        
        // セピア係数に基づく変換結果の概算値
        let expected_r = (0.393 * orig_white[0] as f32 + 0.769 * orig_white[1] as f32 + 0.189 * orig_white[2] as f32).min(255.0) as u8;
        let expected_g = (0.349 * orig_white[0] as f32 + 0.686 * orig_white[1] as f32 + 0.168 * orig_white[2] as f32).min(255.0) as u8;
        let expected_b = (0.272 * orig_white[0] as f32 + 0.534 * orig_white[1] as f32 + 0.131 * orig_white[2] as f32).min(255.0) as u8;
        
        // 期待値と実際の値がある程度近いことを確認（浮動小数点の誤差を考慮）
        assert!((sepia_white[0] as i32 - expected_r as i32).abs() <= 2, 
                "セピア調整後のR値が期待と異なります。期待: {}, 実際: {}", expected_r, sepia_white[0]);
        assert!((sepia_white[1] as i32 - expected_g as i32).abs() <= 2, 
                "セピア調整後のG値が期待と異なります。期待: {}, 実際: {}", expected_g, sepia_white[1]);
        assert!((sepia_white[2] as i32 - expected_b as i32).abs() <= 2, 
                "セピア調整後のB値が期待と異なります。期待: {}, 実際: {}", expected_b, sepia_white[2]);
    }
} 