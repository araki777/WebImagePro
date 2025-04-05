use wasm_bindgen::prelude::*;
use image::io::Reader as ImageReader;
use image::ImageOutputFormat;

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

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgba, RgbaImage, ImageFormat, GenericImageView};

    #[test]
    fn test_resize_image() {
        // テスト用の画像データを作成（100x100の赤い画像）
        let original_width = 100;
        let original_height = 100;
        let mut img: RgbaImage = ImageBuffer::new(original_width, original_height);
        for x in 0..original_width {
            for y in 0..original_height {
                img.put_pixel(x, y, Rgba([255, 0, 0, 255]));
            }
        }
        
        // 画像をバイト配列に変換
        let mut input_buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut input_buf), ImageFormat::Png).unwrap();
        
        // テスト対象の関数を実行（50x50にリサイズ）
        let new_width = 50;
        let new_height = 50;
        let result_buf = resize_image(&input_buf, new_width, new_height);
        
        // 結果を検証
        let result_img = ImageReader::new(std::io::Cursor::new(result_buf))
            .with_guessed_format()
            .unwrap()
            .decode()
            .unwrap();
        
        // リサイズ後のサイズを確認
        let (width, height) = result_img.dimensions();
        assert_eq!(width, new_width, "幅が指定したサイズになっているはず");
        assert_eq!(height, new_height, "高さが指定したサイズになっているはず");
        
        // 画像の色が保持されているか確認（中央のピクセルをチェック）
        let center_pixel = result_img.get_pixel(new_width / 2, new_height / 2);
        assert_eq!(center_pixel[0], 255, "リサイズ後も赤色が保持されているはず");
        assert_eq!(center_pixel[1], 0, "リサイズ後も緑色が保持されているはず");
        assert_eq!(center_pixel[2], 0, "リサイズ後も青色が保持されているはず");
        assert_eq!(center_pixel[3], 255, "リサイズ後もアルファ値が保持されているはず");
    }
} 