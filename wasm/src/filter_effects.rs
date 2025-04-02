use wasm_bindgen::prelude::*;
use image::io::Reader as ImageReader;
use image::{ImageOutputFormat, imageops, Rgb};
use rand::Rng;

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

/// モーションボカシを適用する
#[wasm_bindgen]
pub fn apply_motion_blur(input: &[u8], angle: f32, distance: f32) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    let mut motion_img = img.to_rgb8();
    let (width, height) = motion_img.dimensions();

    // 角度をラジアンに変換
    let angle_rad = angle.to_radians();
    let cos_angle = angle_rad.cos();
    let sin_angle = angle_rad.sin();

    // モーションボカシを適用（特定の方向へのぼかし）
    for y in 0..height {
        for x in 0..width {
            let mut r_sum = 0f32;
            let mut g_sum = 0f32;
            let mut b_sum = 0f32;
            let mut count = 0;

            // 指定された角度に沿ってぼかしを適用
            for d in 0..=(distance as i32) {
                let dx = (d as f32 * cos_angle) as i32;
                let dy = (d as f32 * sin_angle) as i32;
                let new_x = (x as i32 + dx).max(0).min(width as i32 - 1) as u32;
                let new_y = (y as i32 + dy).max(0).min(height as i32 - 1) as u32;

                let pixel = motion_img.get_pixel(new_x, new_y);
                r_sum += pixel[0] as f32;
                g_sum += pixel[1] as f32;
                b_sum += pixel[2] as f32;
                count += 1;
            }

            // 平均値を計算して適用
            let pixel = motion_img.get_pixel_mut(x, y);
            pixel[0] = (r_sum / count as f32) as u8;
            pixel[1] = (g_sum / count as f32) as u8;
            pixel[2] = (b_sum / count as f32) as u8;
        }
    }

    // PNGとして出力
    motion_img.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

/// シャープ化を適用する
#[wasm_bindgen]
pub fn apply_sharpen(input: &[u8], sigma: f32, threshold: i32) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // シャープ化を適用
    let sharpened_img = imageops::unsharpen(&img, sigma, threshold);

    // PNGとして出力
    sharpened_img.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

/// エッジ検出を適用する（Sobelフィルター）
#[wasm_bindgen]
pub fn apply_edge_detection(input: &[u8], threshold: f32) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // グレースケールに変換
    let gray_img = img.to_luma8();

    // エッジ検出を適用（カスタム実装）
    let mut edges = gray_img.clone();
    let (width, height) = edges.dimensions();

    for y in 1..height-1 {
        for x in 1..width-1 {
            let mut gx = 0i32;
            let mut gy = 0i32;

            // Sobelフィルターのx方向
            gx += -1 * gray_img.get_pixel(x-1, y-1)[0] as i32;
            gx += -2 * gray_img.get_pixel(x-1, y)[0] as i32;
            gx += -1 * gray_img.get_pixel(x-1, y+1)[0] as i32;
            gx += 1 * gray_img.get_pixel(x+1, y-1)[0] as i32;
            gx += 2 * gray_img.get_pixel(x+1, y)[0] as i32;
            gx += 1 * gray_img.get_pixel(x+1, y+1)[0] as i32;

            // Sobelフィルターのy方向
            gy += -1 * gray_img.get_pixel(x-1, y-1)[0] as i32;
            gy += -2 * gray_img.get_pixel(x, y-1)[0] as i32;
            gy += -1 * gray_img.get_pixel(x+1, y-1)[0] as i32;
            gy += 1 * gray_img.get_pixel(x-1, y+1)[0] as i32;
            gy += 2 * gray_img.get_pixel(x, y+1)[0] as i32;
            gy += 1 * gray_img.get_pixel(x+1, y+1)[0] as i32;

            let magnitude = ((gx * gx + gy * gy) as f32).sqrt();
            edges.put_pixel(x, y, image::Luma([if magnitude > threshold { 255 } else { 0 }]));
        }
    }

    // PNGとして出力
    edges.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

/// ノイズ除去を適用する
#[wasm_bindgen]
pub fn apply_noise_reduction(input: &[u8], radius: u32) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    let mut denoised_img = img.to_rgb8();
    let (width, height) = denoised_img.dimensions();

    // メディアンフィルターを適用
    for y in radius..height-radius {
        for x in radius..width-radius {
            let mut r_values = Vec::new();
            let mut g_values = Vec::new();
            let mut b_values = Vec::new();

            // 周辺ピクセルの値を収集
            for dy in -(radius as i32)..=(radius as i32) {
                for dx in -(radius as i32)..=(radius as i32) {
                    let pixel = denoised_img.get_pixel((x as i32 + dx) as u32, (y as i32 + dy) as u32);
                    r_values.push(pixel[0]);
                    g_values.push(pixel[1]);
                    b_values.push(pixel[2]);
                }
            }

            // 各チャンネルの中央値を計算
            r_values.sort();
            g_values.sort();
            b_values.sort();

            let median_r = r_values[r_values.len() / 2];
            let median_g = g_values[g_values.len() / 2];
            let median_b = b_values[b_values.len() / 2];

            // 中央値を適用
            let pixel = denoised_img.get_pixel_mut(x, y);
            pixel[0] = median_r;
            pixel[1] = median_g;
            pixel[2] = median_b;
        }
    }

    // PNGとして出力
    denoised_img.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

/// ビネット効果を適用する
#[wasm_bindgen]
pub fn apply_vignette(input: &[u8], strength: f32) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    let mut vignette_img = img.to_rgb8();
    let (width, height) = vignette_img.dimensions();

    for y in 0..height {
        for x in 0..width {
            let dx = (x as f32 - width as f32 / 2.0) / (width as f32 / 2.0);
            let dy = (y as f32 - height as f32 / 2.0) / (height as f32 / 2.0);
            let distance = (dx * dx + dy * dy).sqrt();
            let factor = (1.0 - distance * strength).max(0.0);

            let pixel = vignette_img.get_pixel_mut(x, y);
            pixel[0] = (pixel[0] as f32 * factor) as u8;
            pixel[1] = (pixel[1] as f32 * factor) as u8;
            pixel[2] = (pixel[2] as f32 * factor) as u8;
        }
    }

    // PNGとして出力
    vignette_img.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

/// HDR効果を適用する
#[wasm_bindgen]
pub fn apply_hdr(input: &[u8], strength: f32) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    let mut hdr_img = img.to_rgb8();
    let (width, height) = hdr_img.dimensions();

    // トーンマッピング用のパラメータ
    let exposure = 1.0 + strength * 0.5; // 露出調整
    let gamma = 1.0 + strength * 0.3;     // ガンマ調整
    let contrast = 1.0 + strength * 0.2;  // コントラスト調整

    for y in 0..height {
        for x in 0..width {
            let pixel = hdr_img.get_pixel_mut(x, y);
            let r = pixel[0] as f32;
            let g = pixel[1] as f32;
            let b = pixel[2] as f32;

            // HDR効果の適用（トーンマッピング）
            let hdr_r = ((r / 255.0 * exposure).powf(1.0 / gamma) * contrast * 255.0).min(255.0) as u8;
            let hdr_g = ((g / 255.0 * exposure).powf(1.0 / gamma) * contrast * 255.0).min(255.0) as u8;
            let hdr_b = ((b / 255.0 * exposure).powf(1.0 / gamma) * contrast * 255.0).min(255.0) as u8;

            pixel[0] = hdr_r;
            pixel[1] = hdr_g;
            pixel[2] = hdr_b;
        }
    }

    // PNGとして出力
    hdr_img.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

/// モザイク効果を適用する
#[wasm_bindgen]
pub fn apply_mosaic(input: &[u8], block_size: u32) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    let mut mosaic_img = img.to_rgb8();
    let (width, height) = mosaic_img.dimensions();

    for y in (0..height).step_by(block_size as usize) {
        for x in (0..width).step_by(block_size as usize) {
            let mut r_sum = 0u32;
            let mut g_sum = 0u32;
            let mut b_sum = 0u32;
            let mut count = 0u32;

            // ブロック内の平均色を計算
            for by in y..(y + block_size).min(height) {
                for bx in x..(x + block_size).min(width) {
                    let pixel = mosaic_img.get_pixel(bx, by);
                    r_sum += pixel[0] as u32;
                    g_sum += pixel[1] as u32;
                    b_sum += pixel[2] as u32;
                    count += 1;
                }
            }

            // 平均色をブロック全体に適用
            let avg_r = (r_sum / count) as u8;
            let avg_g = (g_sum / count) as u8;
            let avg_b = (b_sum / count) as u8;

            for by in y..(y + block_size).min(height) {
                for bx in x..(x + block_size).min(width) {
                    let pixel = mosaic_img.get_pixel_mut(bx, by);
                    pixel[0] = avg_r;
                    pixel[1] = avg_g;
                    pixel[2] = avg_b;
                }
            }
        }
    }

    // PNGとして出力
    mosaic_img.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

/// 油彩効果を適用する
#[wasm_bindgen]
pub fn apply_oil_painting(input: &[u8], radius: u32, intensity: u8) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    let mut oil_img = img.to_rgb8();
    let (width, height) = oil_img.dimensions();

    // 色の量子化レベル（油彩の色の数）
    let quantization_levels = 8usize;
    let quantization_step = 256usize / quantization_levels;

    for y in radius..height-radius {
        for x in radius..width-radius {
            let mut histogram = vec![vec![0; quantization_levels]; 3];
            let mut total = vec![0; 3];

            // 周辺ピクセルのヒストグラムを作成（量子化された色で）
            for dy in -(radius as i32)..=(radius as i32) {
                for dx in -(radius as i32)..=(radius as i32) {
                    let pixel = oil_img.get_pixel((x as i32 + dx) as u32, (y as i32 + dy) as u32);
                    for c in 0..3 {
                        let quantized = pixel[c] as usize / quantization_step;
                        histogram[c][quantized] += 1;
                        total[c] += pixel[c] as u32;
                    }
                }
            }

            // 最も頻出する色を選択
            let mut new_pixel = [0u8; 3];
            for c in 0..3 {
                let mut max_count = 0;
                let mut max_value = 0u8;
                for i in 0..quantization_levels {
                    if histogram[c][i] > max_count {
                        max_count = histogram[c][i];
                        max_value = (i * quantization_step) as u8;
                    }
                }
                new_pixel[c] = max_value;
            }

            // 油彩効果を適用（エッジの強調と色の量子化）
            let pixel = oil_img.get_pixel_mut(x, y);
            for c in 0..3 {
                let diff = (pixel[c] as i32 - new_pixel[c] as i32).abs() as u8;
                if diff > intensity {
                    // エッジの強調
                    let edge_factor = (diff as f32 / 255.0).powf(1.5);
                    let blended = (pixel[c] as f32 * (1.0 - edge_factor) + new_pixel[c] as f32 * edge_factor) as u8;
                    pixel[c] = blended;
                }
            }
        }
    }

    // PNGとして出力
    oil_img.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}