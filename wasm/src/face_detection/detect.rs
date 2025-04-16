use crate::face_detection::center_face;
use image::imageops;
use wasm_bindgen::prelude::*;

use center_face::CenterFace;

#[wasm_bindgen]
#[derive(Clone)]
pub struct FaceDetectionResult {
    faces: Vec<Face>,
    width: u32,
    height: u32,
}

#[wasm_bindgen]
#[derive(Clone)]
pub struct Face {
    x1: u32,
    y1: u32,
    x2: u32,
    y2: u32,
    score: f32,
    landmarks: Vec<Landmark>,
}

#[wasm_bindgen]
#[derive(Clone)]
pub struct Landmark {
    x: u32,
    y: u32,
}

#[wasm_bindgen]
impl FaceDetectionResult {
    pub fn get_faces_count(&self) -> usize {
        self.faces.len()
    }

    pub fn get_face(&self, index: usize) -> Option<Face> {
        self.faces.get(index).cloned()
    }

    pub fn get_width(&self) -> u32 {
        self.width
    }

    pub fn get_height(&self) -> u32 {
        self.height
    }
}

#[wasm_bindgen]
impl Face {
    pub fn get_x1(&self) -> u32 {
        self.x1
    }

    pub fn get_y1(&self) -> u32 {
        self.y1
    }

    pub fn get_x2(&self) -> u32 {
        self.x2
    }

    pub fn get_y2(&self) -> u32 {
        self.y2
    }

    pub fn get_score(&self) -> f32 {
        self.score
    }

    pub fn get_landmarks_count(&self) -> usize {
        self.landmarks.len()
    }

    pub fn get_landmark(&self, index: usize) -> Option<Landmark> {
        self.landmarks.get(index).cloned()
    }
}

#[wasm_bindgen]
impl Landmark {
    pub fn get_x(&self) -> u32 {
        self.x
    }

    pub fn get_y(&self) -> u32 {
        self.y
    }
}

#[wasm_bindgen]
pub fn detect_faces(image_data: &[u8]) -> Result<FaceDetectionResult, JsValue> {
    // 画像データをデコード
    let image = image::load_from_memory(image_data)
        .map_err(|e| JsValue::from_str(&format!("Failed to load image: {}", e)))?;
    let image = image.to_rgb8();

    // 画像のサイズを取得
    let (width, height) = (image.width(), image.height());

    // モデルの入力サイズを計算（32の倍数に調整）
    let model_width = ((width as f32 / 32.0).ceil() * 32.0) as u32;
    let model_height = ((height as f32 / 32.0).ceil() * 32.0) as u32;

    // CenterFaceモデルの初期化
    let cf = CenterFace::new(model_width, model_height)
        .map_err(|e| JsValue::from_str(&format!("Failed to initialize model: {}", e)))?;

    // 画像をモデルの入力サイズにリサイズ
    let resized_image = imageops::resize(
        &image,
        model_width,
        model_height,
        imageops::FilterType::Triangle,
    );

    // 顔検出の実行
    let faces = cf.detect_with_resize(&resized_image)
        .map_err(|e| JsValue::from_str(&format!("Failed to detect faces: {}", e)))?;

    // 検出結果を元の画像サイズにスケーリング
    let scale_x = width as f32 / model_width as f32;
    let scale_y = height as f32 / model_height as f32;

    // WASM用の結果に変換
    let wasm_faces: Vec<Face> = faces.into_iter().map(|f| {
        let x1 = (f.x1 as f32 * scale_x) as u32;
        let y1 = (f.y1 as f32 * scale_y) as u32;
        let x2 = (f.x2 as f32 * scale_x) as u32;
        let y2 = (f.y2 as f32 * scale_y) as u32;

        let landmarks: Vec<Landmark> = f.landmarks.into_iter().map(|lm| {
            Landmark {
                x: (lm.0 as f32 * scale_x) as u32,
                y: (lm.1 as f32 * scale_y) as u32,
            }
        }).collect();

        Face {
            x1,
            y1,
            x2,
            y2,
            score: f.score,
            landmarks,
        }
    }).collect();

    Ok(FaceDetectionResult {
        faces: wasm_faces,
        width,
        height,
    })
}