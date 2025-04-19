mod yolo;
pub mod detect;

pub use yolo::{Detection, YoloModel};
pub use detect::{ObjectDetectionResult, DetectedObject, init_yolo_model, detect_objects}; 