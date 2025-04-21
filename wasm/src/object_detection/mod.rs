mod yolo;
pub mod detect;

pub use yolo::{Detection, YoloModel};
pub use detect::{ObjectDetectionResult, DetectedObject, detect_objects};