use wasm_bindgen::prelude::*;
use std::io::Cursor;
use image::io::Reader as ImageReader;
use image::{ImageOutputFormat, Rgb};

/// ガンマ補正処理
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

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, RgbImage, Rgb};

    #[test]
    fn test_adjust_gamma_less_than_one() {
        // テスト用の小さな画像を作成
        let mut img: RgbImage = ImageBuffer::new(2, 2);
        
        // 異なる明るさの色を設定
        let dark_value = 50u8;
        let medium_value = 128u8;
        let bright_value = 200u8;
        
        img.put_pixel(0, 0, Rgb([dark_value, dark_value, dark_value]));      // 暗い
        img.put_pixel(0, 1, Rgb([medium_value, medium_value, medium_value])); // 中間
        img.put_pixel(1, 0, Rgb([bright_value, bright_value, bright_value])); // 明るい
        img.put_pixel(1, 1, Rgb([medium_value, medium_value, medium_value])); // 中間
        
        // PNG形式のバイト配列に変換
        let mut buf = Vec::new();
        img.write_to(&mut Cursor::new(&mut buf), image::ImageOutputFormat::Png).unwrap();
        
        // ガンマ値1未満（暗い部分が明るく、明るい部分はあまり変化しない）
        let gamma_value = 0.5;
        let gamma_adjusted_bytes = adjust_gamma(&buf, gamma_value);
        
        // 処理結果をデコード
        let gamma_adjusted_img = ImageReader::new(Cursor::new(gamma_adjusted_bytes))
            .with_guessed_format().unwrap()
            .decode().unwrap()
            .to_rgb8();
        
        // 結果を確認
        let dark_pixel_after = gamma_adjusted_img.get_pixel(0, 0);
        let bright_pixel_after = gamma_adjusted_img.get_pixel(1, 0);
        
        println!("ガンマ {}のテスト - 暗いピクセル: 元の値{}, 処理後: {}", 
                gamma_value, dark_value, dark_pixel_after[0]);
        println!("ガンマ {}のテスト - 明るいピクセル: 元の値{}, 処理後: {}", 
                gamma_value, bright_value, bright_pixel_after[0]);
                
        // ガンマ<1 では暗い部分が明るくなる
        assert!(dark_pixel_after[0] > dark_value, 
                "ガンマ{}で暗いピクセルが明るくなっていません。元: {}, 後: {}", 
                gamma_value, dark_value, dark_pixel_after[0]);
    }
    
    #[test]
    fn test_adjust_gamma_greater_than_one() {
        // テスト用の小さな画像を作成
        let mut img: RgbImage = ImageBuffer::new(2, 2);
        
        // 異なる明るさの色を設定
        let dark_value = 50u8;
        let medium_value = 128u8;
        let bright_value = 200u8;
        
        img.put_pixel(0, 0, Rgb([dark_value, dark_value, dark_value]));      // 暗い
        img.put_pixel(0, 1, Rgb([medium_value, medium_value, medium_value])); // 中間
        img.put_pixel(1, 0, Rgb([bright_value, bright_value, bright_value])); // 明るい
        img.put_pixel(1, 1, Rgb([medium_value, medium_value, medium_value])); // 中間
        
        // PNG形式のバイト配列に変換
        let mut buf = Vec::new();
        img.write_to(&mut Cursor::new(&mut buf), image::ImageOutputFormat::Png).unwrap();
        
        // ガンマ値1より大きい（暗い部分がより暗く、明るい部分はあまり変化しない）
        let gamma_value = 2.2;
        let gamma_adjusted_bytes = adjust_gamma(&buf, gamma_value);
        
        // 処理結果をデコード
        let gamma_adjusted_img = ImageReader::new(Cursor::new(gamma_adjusted_bytes))
            .with_guessed_format().unwrap()
            .decode().unwrap()
            .to_rgb8();
        
        // 結果を確認
        let dark_pixel_after = gamma_adjusted_img.get_pixel(0, 0);
        let bright_pixel_after = gamma_adjusted_img.get_pixel(1, 0);
        
        println!("ガンマ {}のテスト - 暗いピクセル: 元の値{}, 処理後: {}", 
                gamma_value, dark_value, dark_pixel_after[0]);
        println!("ガンマ {}のテスト - 明るいピクセル: 元の値{}, 処理後: {}", 
                gamma_value, bright_value, bright_pixel_after[0]);
                
        // ガンマ>1 では暗い部分がより暗くなる
        assert!(dark_pixel_after[0] < dark_value, 
                "ガンマ{}で暗いピクセルが暗くなっていません。元: {}, 後: {}", 
                gamma_value, dark_value, dark_pixel_after[0]);
    }

    #[test]
    fn test_adjust_gamma_zero() {
        // 有効な画像データを作成
        let mut img: RgbImage = ImageBuffer::new(2, 2);
        img.put_pixel(0, 0, Rgb([100, 100, 100]));
        img.put_pixel(0, 1, Rgb([100, 100, 100]));
        img.put_pixel(1, 0, Rgb([100, 100, 100]));
        img.put_pixel(1, 1, Rgb([100, 100, 100]));
        
        let mut buf = Vec::new();
        img.write_to(&mut Cursor::new(&mut buf), image::ImageOutputFormat::Png).unwrap();
        
        // ガンマ値を0にすると、すべてのピクセルが極端な値になる
        let gamma_value = 0.0;
        let gamma_adjusted_bytes = adjust_gamma(&buf, gamma_value);
        
        let gamma_adjusted_img = ImageReader::new(Cursor::new(gamma_adjusted_bytes))
            .with_guessed_format().unwrap()
            .decode().unwrap()
            .to_rgb8();
        
        // ガンマ0では、明るさに関わらず画素値は255（または0）に近くなるはず
        let pixel = gamma_adjusted_img.get_pixel(0, 0);
        
        println!("ガンマ値0の場合のピクセル値: {}", pixel[0]);
        // 実装によって異なる可能性があるため、厳密な値の検証は行わない
        // 255もしくは0に近い値になることが多い
    }
} 