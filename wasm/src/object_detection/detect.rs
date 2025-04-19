use crate::object_detection::yolo::{Detection, YoloModel};
use wasm_bindgen::prelude::*;
use std::cell::RefCell;

// YOLOモデルをバイナリとして埋め込む
const YOLO_MODEL_BYTES: &[u8] = include_bytes!("../../ai_models/yolo11n.onnx");

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
// 検出されたオブジェクトの配列と、元の画像サイズを格納
#[wasm_bindgen]
#[derive(Clone)]
pub struct ObjectDetectionResult {
    detections: Vec<DetectedObject>,
    width: u32,
    height: u32,
}

// 検出されたオブジェクトの情報を格納する構造体
// バウンディングボックスの座標、クラスID、クラス名、信頼度を含む
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

    // 座標情報のみを含むJSONを取得
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

// YOLOモデルを初期化する関数
// キャッシュ用にグローバル変数にモデルを保存する
#[wasm_bindgen]
pub fn init_yolo_model() -> bool {
    match YoloModel::new(YOLO_MODEL_BYTES) {
        Ok(model) => {
            YOLO_MODEL.with(|yolo| {
                *yolo.borrow_mut() = Some(model);
            });
            log("YOLOモデルを正常に初期化しました");
            true
        },
        Err(e) => {
            log(&format!("モデル初期化エラー: {:?}", e));
            false
        }
    }
}

// JavaScript（WebAssembly）から呼び出し可能なオブジェクト検出関数
// 画像データを受け取り、検出されたオブジェクトの情報を返す
#[wasm_bindgen]
pub fn detect_objects(image_data: &[u8]) -> Result<ObjectDetectionResult, JsValue> {
    // ログ出力(デバッグ用)
    log("オブジェクト検出開始...");
    log(&format!("画像データサイズ: {} バイト", image_data.len()));
    
    // 画像データをデコード
    let image = image::load_from_memory(image_data)
        .map_err(|e| JsValue::from_str(&format!("画像のロードに失敗: {}", e)))?;
    let image = image.to_rgb8();

    // 画像のサイズを取得
    let (width, height) = (image.width(), image.height());
    
    // オブジェクト検出を実行 - 初期化済みのモデルがあればそれを使用し、なければ新規作成
    let detections = YOLO_MODEL.with(|yolo| -> Result<Vec<Detection>, JsValue> {
        if let Some(model) = &*yolo.borrow() {
            // キャッシュされたモデルを使用
            log("キャッシュされたYOLOモデルを使用します");
            Ok(model.detect_with_resize(&image))
        } else {
            // 新しくモデルを初期化
            log("モデルが初期化されていないため、その場で初期化します");
            match YoloModel::new(YOLO_MODEL_BYTES) {
                Ok(model) => {
                    // モデルをキャッシュに保存
                    *yolo.borrow_mut() = Some(model.clone());
                    
                    // 検出実行
                    Ok(model.detect_with_resize(&image))
                },
                Err(e) => {
                    log(&format!("モデル初期化エラー: {:?}", e));
                    Err(JsValue::from_str("YOLOモデルの初期化に失敗しました"))
                }
            }
        }
    })?;
    
    // 検出結果のデバッグ情報を出力
    log(&format!("モデル推論完了 - 検出数: {}", detections.len()));
    for (i, det) in detections.iter().enumerate() {
        log(&format!(
            "Detection #{}: クラス={}, 信頼度={:.4}, 座標=({}, {}, {}, {})",
            i, det.class_name, det.confidence, det.x1, det.y1, det.x2, det.y2
        ));
    }

    // 検出結果をWasm用の構造体に変換
    let wasm_detections = detections.into_iter()
        .map(|d| {
            DetectedObject {
                class_id: d.class_id,
                class_name: d.class_name,
                confidence: d.confidence,
                x1: d.x1,
                y1: d.y1,
                x2: d.x2,
                y2: d.y2,
            }
        })
        .collect();
    
    // 結果のオブジェクトを作成
    let result = ObjectDetectionResult {
        detections: wasm_detections,
        width,
        height,
    };
    
    // 検証のため結果のサマリーをログ出力
    log(&format!("検出結果の要約: {} オブジェクト, 画像サイズ {}x{}", 
                result.get_detections_count(), width, height));
    
    Ok(result)
}