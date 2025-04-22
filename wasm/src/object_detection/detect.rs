use crate::object_detection::yolo::{Detection, YoloModel};
use wasm_bindgen::prelude::*;
use std::cell::RefCell;

// YOLOモデルをバイナリとして埋め込む
const YOLO_MODEL_BYTES: &[u8] = include_bytes!("../../ai_models/yolov8n.onnx");

// WebAssemblyグローバル変数用モジュール
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// グローバルなYOLOモデル（初期化済みのモデルをキャッシュする）
thread_local! {
    static YOLO_MODEL: RefCell<Option<YoloModel>> = RefCell::new(None);
}

// 検出結果をWasm側で扱いやすくするための構造体
#[wasm_bindgen]
#[derive(Clone)]
pub struct ObjectDetectionResult {
    detections: Vec<DetectedObject>,
    width: u32,
    height: u32,
}

// 検出されたオブジェクトの情報を格納する構造体
#[wasm_bindgen]
#[derive(Clone)]
pub struct DetectedObject {
    class_id: u32,
    class_name: String,
    confidence: f32,
    x1: u32,
    y1: u32,
    x2: u32,
    y2: u32,
}

// ObjectDetectionResultのJavaScript向けインターフェース
#[wasm_bindgen]
impl ObjectDetectionResult {
    // 検出されたオブジェクトの数を取得
    pub fn get_detections_count(&self) -> usize {
        self.detections.len()
    }

    // 指定されたインデックスのオブジェクトを取得
    pub fn get_detection(&self, index: usize) -> Option<DetectedObject> {
        self.detections.get(index).cloned()
    }

    // 画像の幅を取得
    pub fn get_width(&self) -> u32 {
        self.width
    }

    // 画像の高さを取得
    pub fn get_height(&self) -> u32 {
        self.height
    }

    // 検出結果をJSON形式の文字列として取得
    pub fn to_json(&self) -> String {
        let mut json = String::from("{\"detections\":[");

        for (i, detection) in self.detections.iter().enumerate() {
            if i > 0 {
                json.push_str(",");
            }

            json.push_str(&format!(
                "{{\"class_id\":{},\"class_name\":\"{}\",\"confidence\":{:.4},\"x1\":{},\"y1\":{},\"x2\":{},\"y2\":{}}}",
                detection.class_id,
                detection.class_name,
                detection.confidence,
                detection.x1,
                detection.y1,
                detection.x2,
                detection.y2
            ));
        }

        json.push_str("],");
        json.push_str(&format!("\"width\":{},\"height\":{}}}", self.width, self.height));

        json
    }

    // 座標情報を含むJSONを取得
    pub fn get_coordinates_json(&self) -> String {
        self.to_json()
    }
}

// DetectedObjectのJavaScript向けインターフェース
#[wasm_bindgen]
impl DetectedObject {
    // クラスIDを取得
    pub fn get_class_id(&self) -> u32 {
        self.class_id
    }

    // クラス名を取得
    pub fn get_class_name(&self) -> String {
        self.class_name.clone()
    }

    // 検出の信頼度を取得
    pub fn get_confidence(&self) -> f32 {
        self.confidence
    }

    // バウンディングボックスの左上X座標
    pub fn get_x1(&self) -> u32 {
        self.x1
    }

    // バウンディングボックスの左上Y座標
    pub fn get_y1(&self) -> u32 {
        self.y1
    }

    // バウンディングボックスの右下X座標
    pub fn get_x2(&self) -> u32 {
        self.x2
    }

    // バウンディングボックスの右下Y座標
    pub fn get_y2(&self) -> u32 {
        self.y2
    }
}

// JavaScript（WebAssembly）から呼び出し可能なオブジェクト検出関数
#[wasm_bindgen]
pub fn detect_objects(image_data: &[u8]) -> Result<ObjectDetectionResult, JsValue> {
    // ログ出力(デバッグ用)
    log("📷 オブジェクト検出開始...");
    log(&format!("📊 画像データサイズ: {} バイト", image_data.len()));

    // 画像データをデコード
    let image = match image::load_from_memory(image_data) {
        Ok(img) => {
            log("✅ 画像のデコードに成功");
            img.to_rgb8()
        },
        Err(e) => {
            log(&format!("❌ 画像のロードに失敗: {}", e));
            return Err(JsValue::from_str(&format!("画像のロードに失敗: {}", e)));
        }
    };

    // 画像のサイズを取得
    let (width, height) = (image.width(), image.height());
    log(&format!("📏 画像サイズ: {}x{}, アスペクト比: {:.2}", width, height, width as f32 / height as f32));

    // オブジェクト検出を実行
    let detections = YOLO_MODEL.with(|yolo| -> Result<Vec<Detection>, JsValue> {
        // モデルがキャッシュされているかチェック
        let is_cached = yolo.borrow().is_some();
        log(&format!("🔍 モデルキャッシュ状態: {}", if is_cached { "キャッシュ済み" } else { "未キャッシュ" }));

        if let Some(model) = &*yolo.borrow() {
            // キャッシュされたモデルを使用
            log(&format!("🔄 キャッシュされたYOLOモデルを使用します (サイズ: {}x{})", model.width, model.height));
            log(&format!("⚙️ モデル設定: 信頼度閾値={}, IoU閾値={}", model.confidence_threshold, model.iou_threshold));

            // 詳細な検出プロセスをログ出力
            log("🔍 letterboxリサイズを使用して検出実行中...");
            let result = model.detect_with_resize(&image);
            log(&format!("✅ 検出完了、結果数: {}", result.len()));
            Ok(result)
        } else {
            // 最適化されたサイズでの初期化に失敗した場合、従来の固定サイズに戻す
            log("⚠️ 固定サイズ(640x640)でモデルを初期化します");
            match YoloModel::new(YOLO_MODEL_BYTES, 640, 640, 0.6, 0.5) {
                Ok(model) => {
                    log("✅ 固定サイズ(640x640)でモデル初期化成功");
                    *yolo.borrow_mut() = Some(model.clone());
                    log("💾 モデルをキャッシュに保存");

                    log("🔍 固定サイズモデルで検出実行中...");
                    let result = model.detect_with_resize(&image);
                    log(&format!("✅ 検出完了、結果数: {}", result.len()));
                    Ok(result)
                },
                Err(e) => {
                    log(&format!("❌ 最終モデル初期化エラー: {:?}", e));
                    Err(JsValue::from_str(&format!("YOLOモデルの初期化に失敗: {:?}", e)))
                }
            }
        }
    })?;

    // 検出結果の詳細をログ出力
    log(&format!("📋 検出結果数: {}", detections.len()));
    if detections.is_empty() {
        log("⚠️ 警告: 検出結果が0件です");
    }

    // 検出結果を変換
    let detected_objects: Vec<DetectedObject> = detections.into_iter()
        .map(|detection| {
            // 検出結果をログ出力
            log(&format!("🔍 検出: クラス={} ({}), 信頼度={:.3}, 座標=[{}, {}, {}, {}]",
                detection.class_id, detection.class_name, detection.confidence,
                detection.x1, detection.y1, detection.x2, detection.y2));

            // バウンディングボックスのサイズをチェック
            let box_width = detection.x2 - detection.x1;
            let box_height = detection.y2 - detection.y1;
            log(&format!("📏 検出ボックスサイズ: {}x{}, 面積: {}",
                box_width, box_height, box_width * box_height));

            DetectedObject {
                class_id: detection.class_id,
                class_name: detection.class_name,
                confidence: detection.confidence,
                x1: detection.x1,
                y1: detection.y1,
                x2: detection.x2,
                y2: detection.y2,
            }
        })
        .collect();

    log(&format!("✅ 物体検出完了: {}個のオブジェクトを検出", detected_objects.len()));

    // 結果を返す
    Ok(ObjectDetectionResult {
        detections: detected_objects,
        width,
        height,
    })
}