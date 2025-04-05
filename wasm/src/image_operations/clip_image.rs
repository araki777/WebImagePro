use wasm_bindgen::prelude::*;
use image::io::Reader as ImageReader;
use image::{GenericImageView, ImageOutputFormat};

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

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgba, RgbaImage, ImageFormat, GenericImageView};

    #[test]
    fn test_clip_image() {
        // テスト用の画像データを作成（200x200の画像、左上が赤、右下が青）
        let original_width = 200;
        let original_height = 200;
        let mut img: RgbaImage = ImageBuffer::new(original_width, original_height);
        for x in 0..original_width {
            for y in 0..original_height {
                if x < 100 && y < 100 {
                    // 左上領域（赤）
                    img.put_pixel(x, y, Rgba([255, 0, 0, 255]));
                } else {
                    // その他の領域（青）
                    img.put_pixel(x, y, Rgba([0, 0, 255, 255]));
                }
            }
        }
        
        // 画像をバイト配列に変換
        let mut input_buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut input_buf), ImageFormat::Png).unwrap();
        
        // テスト対象の関数を実行（左上の赤い部分を切り取り）
        let clip_x = 0;
        let clip_y = 0;
        let clip_width = 100;
        let clip_height = 100;
        let result_buf = clip_image(&input_buf, clip_x, clip_y, clip_width, clip_height);
        
        // 結果を検証
        let result_img = ImageReader::new(std::io::Cursor::new(result_buf))
            .with_guessed_format()
            .unwrap()
            .decode()
            .unwrap();
        
        // 切り取り後のサイズを確認
        let (width, height) = result_img.dimensions();
        assert_eq!(width, clip_width, "幅が指定したサイズになっているはず");
        assert_eq!(height, clip_height, "高さが指定したサイズになっているはず");
        
        // 切り取った画像のすべてのピクセルが赤色であることを確認
        let result_rgba = result_img.to_rgba8();
        for x in 0..clip_width {
            for y in 0..clip_height {
                let pixel = result_rgba.get_pixel(x, y);
                assert_eq!(pixel[0], 255, "赤色が正しく切り取られているはず");
                assert_eq!(pixel[1], 0, "赤色が正しく切り取られているはず");
                assert_eq!(pixel[2], 0, "赤色が正しく切り取られているはず");
                assert_eq!(pixel[3], 255, "アルファ値が保持されているはず");
            }
        }
        
        // 画像の外側を切り取ろうとするケース
        let result_buf = clip_image(&input_buf, 150, 150, 100, 100);
        let result_img = ImageReader::new(std::io::Cursor::new(result_buf))
            .with_guessed_format()
            .unwrap()
            .decode()
            .unwrap();
        
        // 切り取り範囲が調整されていることを確認
        let (width, height) = result_img.dimensions();
        assert_eq!(width, 50, "範囲外の指定が画像内に調整されるはず");
        assert_eq!(height, 50, "範囲外の指定が画像内に調整されるはず");
    }
} 