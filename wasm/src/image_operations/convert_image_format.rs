use wasm_bindgen::prelude::*;
use image::io::Reader as ImageReader;
use image::ImageOutputFormat;

// 画像フォーマットの変換
#[wasm_bindgen]
pub fn convert_image_format(input: &[u8], format: &str) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // フォーマットに応じて出力形式を設定
    let output_format = match format {
        "jpeg" | "jpg" => ImageOutputFormat::Jpeg(90),
        "png" => ImageOutputFormat::Png,
        "gif" => ImageOutputFormat::Gif,
        "bmp" => ImageOutputFormat::Bmp,
        "webp" => ImageOutputFormat::WebP,
        _ => ImageOutputFormat::Png, // デフォルトはPNG
    };

    // 指定されたフォーマットで出力
    img.write_to(&mut std::io::Cursor::new(&mut buf), output_format).unwrap();

    buf
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgba, RgbaImage, ImageFormat};

    #[test]
    fn test_convert_image_format() {
        // テスト用の画像データを作成
        let width = 100;
        let height = 100;
        let mut img: RgbaImage = ImageBuffer::new(width, height);
        
        // 単色の画像を作成
        for x in 0..width {
            for y in 0..height {
                img.put_pixel(x, y, Rgba([255, 0, 0, 255]));
            }
        }
        
        // 画像をPNGのバイト配列に変換
        let mut input_buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut input_buf), ImageFormat::Png).unwrap();
        
        // テスト1: PNGからJPEGへの変換
        let jpeg_format = "jpeg";
        let jpeg_result = convert_image_format(&input_buf, jpeg_format);
        
        // JPEGに変換されたか確認（ヘッダーで判断）
        assert!(is_jpeg(&jpeg_result), "JPEGフォーマットに変換されるはず");
        
        // テスト2: PNGからBMPへの変換
        let bmp_format = "bmp";
        let bmp_result = convert_image_format(&input_buf, bmp_format);
        
        // BMPに変換されたか確認（ヘッダーで判断）
        assert!(is_bmp(&bmp_result), "BMPフォーマットに変換されるはず");
        
        // テスト3: 不明なフォーマット（デフォルトでPNGになるはず）
        let unknown_format = "unknown";
        let default_result = convert_image_format(&input_buf, unknown_format);
        
        // デフォルトでPNGになっているか確認
        assert!(is_png(&default_result), "不明なフォーマットの場合はPNGになるはず");
    }
    
    // JPEGフォーマットかどうかを判定する関数
    fn is_jpeg(data: &[u8]) -> bool {
        // JPEGのマジックナンバーをチェック
        data.len() >= 2 && data[0] == 0xFF && data[1] == 0xD8
    }
    
    // PNGフォーマットかどうかを判定する関数
    fn is_png(data: &[u8]) -> bool {
        // PNGのマジックナンバーをチェック
        data.len() >= 8 && 
        data[0] == 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47 &&
        data[4] == 0x0D && data[5] == 0x0A && data[6] == 0x1A && data[7] == 0x0A
    }
    
    // BMPフォーマットかどうかを判定する関数
    fn is_bmp(data: &[u8]) -> bool {
        // BMPのマジックナンバーをチェック
        data.len() >= 2 && data[0] == 0x42 && data[1] == 0x4D
    }
} 