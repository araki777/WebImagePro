// 各モジュールを宣言
pub mod brightness_adjustment;
pub mod color_adjustment;
pub mod color_conversion;
pub mod image_operations;
pub mod image_composition;
pub mod filter_effects;
pub mod face_detection;
pub mod object_detection;
pub mod image_compression;

pub use object_detection::detect::{detect_objects, ObjectDetectionResult, DetectedObject};
pub use face_detection::detect::{detect_faces, Face, FaceDetectionResult, Landmark};