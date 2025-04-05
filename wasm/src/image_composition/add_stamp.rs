use image::ImageOutputFormat;
use image::io::Reader as ImageReader;
use wasm_bindgen::prelude::*;

/// スタンプを追加
#[wasm_bindgen]
pub fn add_stamp(input: &[u8], stamp: &[u8], x: u32, y: u32) -> Vec<u8> {
    let mut buf = Vec::new();
    let base = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();
    let stamp = ImageReader::new(std::io::Cursor::new(stamp))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    let mut base_rgba = base.to_rgba8();
    let stamp_rgba = stamp.to_rgba8();
    let (width, height) = stamp_rgba.dimensions();

    for i in 0..width {
        for j in 0..height {
            let target_x = x + i;
            let target_y = y + j;
            if target_x < base_rgba.width() && target_y < base_rgba.height() {
                let pixel = base_rgba.get_pixel_mut(target_x, target_y);
                let stamp_pixel = stamp_rgba.get_pixel(i, j);
                let alpha = stamp_pixel[3] as f32 / 255.0;

                pixel[0] = (pixel[0] as f32 * (1.0 - alpha) + stamp_pixel[0] as f32 * alpha) as u8;
                pixel[1] = (pixel[1] as f32 * (1.0 - alpha) + stamp_pixel[1] as f32 * alpha) as u8;
                pixel[2] = (pixel[2] as f32 * (1.0 - alpha) + stamp_pixel[2] as f32 * alpha) as u8;
                pixel[3] = pixel[3].max(stamp_pixel[3]);
            }
        }
    }

    base_rgba.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();
    buf
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgba, RgbaImage, ImageFormat};

    #[test]
    fn test_add_stamp() {
        // ベース画像の作成（白色の画像）
        let mut base_img: RgbaImage = ImageBuffer::new(200, 200);
        for x in 0..200 {
            for y in 0..200 {
                base_img.put_pixel(x, y, Rgba([255, 255, 255, 255]));
            }
        }
        
        // スタンプ画像の作成（赤色の完全に不透明な画像とグラデーション透明度）
        let mut stamp_img: RgbaImage = ImageBuffer::new(40, 40);
        for x in 0..40 {
            for y in 0..40 {
                // 円形のスタンプを作成（中心から離れるほど透明に）
                let center_x = 20.0;
                let center_y = 20.0;
                let dx = (x as f32 - center_x).abs();
                let dy = (y as f32 - center_y).abs();
                let distance = (dx * dx + dy * dy).sqrt();
                
                // 中心からの距離に基づいて透明度を計算
                let alpha = if distance < 20.0 {
                    // 中心に近いほど不透明
                    255 - ((distance / 20.0) * 255.0) as u8
                } else {
                    // 円の外は完全に透明
                    0
                };
                
                stamp_img.put_pixel(x, y, Rgba([255, 0, 0, alpha]));
            }
        }
        
        // 画像をバイト配列に変換
        let mut base_buf = Vec::new();
        let mut stamp_buf = Vec::new();
        base_img.write_to(&mut std::io::Cursor::new(&mut base_buf), ImageFormat::Png).unwrap();
        stamp_img.write_to(&mut std::io::Cursor::new(&mut stamp_buf), ImageFormat::Png).unwrap();
        
        // テスト対象の関数を実行
        let x: u32 = 80;
        let y: u32 = 80;
        let result_buf = add_stamp(&base_buf, &stamp_buf, x, y);
        
        // 結果を検証
        let result_img = ImageReader::new(std::io::Cursor::new(result_buf))
            .with_guessed_format()
            .unwrap()
            .decode()
            .unwrap();
        
        let result_rgba = result_img.to_rgba8();
        
        // スタンプの中心部分をチェック
        let test_x = x + 20; // スタンプの中央
        let test_y = y + 20; // スタンプの中央
        let center_pixel = result_rgba.get_pixel(test_x, test_y);
        
        // 中心部は完全な赤になるはず
        assert_eq!(center_pixel[0], 255, "中心は赤色になるべき");
        assert_eq!(center_pixel[1], 0, "中心は緑成分がないべき");
        assert_eq!(center_pixel[2], 0, "中心は青成分がないべき");
        assert_eq!(center_pixel[3], 255, "中心はアルファ値が最大値を取るべき");
        
        // スタンプの外側（グラデーションの中間部分）をチェック
        let mid_distance = 10;
        let mid_x = x + 20 + mid_distance; // 中心から少し離れた位置
        let mid_y = y + 20;
        let mid_pixel = result_rgba.get_pixel(mid_x, mid_y);
        
        // 中間部分はある程度混ざった色になるはず（正確な値は複雑なので範囲でチェック）
        assert!(mid_pixel[0] > 127, "中間部の赤成分は中程度から高めであるべき");
        assert!(mid_pixel[1] < 128, "中間部の緑成分は中程度から低めであるべき");
        assert!(mid_pixel[2] < 128, "中間部の青成分は中程度から低めであるべき");
        assert_eq!(mid_pixel[3], 255, "アルファ値は最大値を取るべき");
        
        // スタンプ外のエリアをチェック
        let outside_x = 10;
        let outside_y = 10;
        let outside_pixel = result_rgba.get_pixel(outside_x, outside_y);
        
        // スタンプ領域外は元の色のまま
        assert_eq!(outside_pixel[0], 255, "スタンプ外は元の赤色のまま");
        assert_eq!(outside_pixel[1], 255, "スタンプ外は元の緑色のまま");
        assert_eq!(outside_pixel[2], 255, "スタンプ外は元の青色のまま");
        assert_eq!(outside_pixel[3], 255, "スタンプ外は元のアルファ値のまま");
    }
} 