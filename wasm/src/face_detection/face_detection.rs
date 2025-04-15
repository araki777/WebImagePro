use tract_onnx::prelude::*;
use image::{DynamicImage, GenericImageView};
use wasm_bindgen::prelude::*;

// 非公開の実装関数
fn face_detection_impl(input: &[u8]) -> Result<Vec<[f32; 4]>, Box<dyn std::error::Error>> {
    // 埋め込まれたモデルファイルを読み込む
    let model_bytes = include_bytes!("../../ai_models/centerface.onnx");
    
    // 入力画像を読み込む
    let img = image::load_from_memory(input)?;
    let (width, height) = img.dimensions();
    
    // モデルの読み込みと最適化
    let model = tract_onnx::onnx()
        .model_for_read(&mut std::io::Cursor::new(model_bytes))?
        .with_input_fact(0, InferenceFact::dt_shape(f32::datum_type(), tvec!(1, 3, height as i64, width as i64)))?
        .into_optimized()?
        .into_runnable()?;
    
    // 画像の前処理
    let image_data = prepare_image(&img, height, width)?;
    
    // 推論の実行
    let result = model.run(tvec!(image_data.into()))?;
    
    // 結果の後処理
    let boxes = extract_boxes(result, width, height)?;
    
    Ok(boxes)
}

#[wasm_bindgen]
pub fn detect_faces(input: &[u8]) -> Result<Box<[f32]>, JsValue> {
    // 実装関数を呼び出し
    let result = face_detection_impl(input).map_err(|e| JsValue::from_str(&e.to_string()))?;
    
    // 結果を1次元配列に変換
    let mut flat_result = Vec::new();
    for bbox in result {
        flat_result.extend_from_slice(&bbox);
    }
    
    // JavaScriptに返す
    Ok(flat_result.into_boxed_slice())
}

/// 画像から顔を検出する
#[wasm_bindgen]
pub fn face_detection(input: &[u8]) -> Vec<u8> {
    match face_detection_impl(input) {
        Ok(faces) => {
            // 結果を1次元配列に変換
            let mut flat_result = Vec::new();
            for bbox in faces {
                // 各座標をバイト列に変換
                flat_result.extend_from_slice(&bbox.iter().flat_map(|&x| x.to_le_bytes()).collect::<Vec<u8>>());
            }
            flat_result
        },
        Err(_) => {
            // エラーの場合は空のベクターを返す
            Vec::new()
        }
    }
}

fn prepare_image(img: &DynamicImage, height: u32, width: u32) -> TractResult<Tensor> {
    // 画像をRGBに変換し、正規化
    let mut flat_data = Vec::with_capacity((width * height * 3) as usize);
    
    for y in 0..height {
        for x in 0..width {
            let pixel = img.get_pixel(x, y);
            // RGB順、[0, 1]の範囲に正規化
            flat_data.push(pixel[0] as f32 / 255.0);
            flat_data.push(pixel[1] as f32 / 255.0);
            flat_data.push(pixel[2] as f32 / 255.0);
        }
    }
    
    // CHW形式に変換
    let mut chw_data = Vec::with_capacity((width * height * 3) as usize);
    let pixel_count = (width * height) as usize;
    
    // R channel
    for i in 0..pixel_count {
        chw_data.push(flat_data[i * 3]);
    }
    // G channel
    for i in 0..pixel_count {
        chw_data.push(flat_data[i * 3 + 1]);
    }
    // B channel
    for i in 0..pixel_count {
        chw_data.push(flat_data[i * 3 + 2]);
    }
    
    // バッチ次元を追加: [1, 3, height, width]
    Tensor::from_shape(&[1, 3, height as usize, width as usize], &chw_data)
}

fn extract_boxes(result: TVec<TValue>, width: u32, height: u32) -> TractResult<Vec<[f32; 4]>> {
    let mut boxes = Vec::new();
    let tensor = result[0].clone().into_tensor();
    let faces = tensor.to_array_view::<f32>()?;
    
    // 信頼度閾値
    let threshold = 0.5;
    
    for face_idx in 0..faces.shape()[1] {
        let confidence = faces[[0, face_idx, 1]];
        
        if confidence > threshold {
            // バウンディングボックスの座標を取得
            let x1 = faces[[0, face_idx, 2]] * width as f32;
            let y1 = faces[[0, face_idx, 3]] * height as f32;
            let x2 = faces[[0, face_idx, 4]] * width as f32;
            let y2 = faces[[0, face_idx, 5]] * height as f32;
            
            boxes.push([x1, y1, x2, y2]);
        }
    }
    
    Ok(boxes)
}