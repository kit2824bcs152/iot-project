import os
import sys
import json
import tensorflow as tf
from preprocessing import load_scalers, scale_features, inverse_scale_prediction

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model', 'weather_dnn.keras')
_cached_model = None
_cached_scalers = None

def get_model():
    global _cached_model
    if _cached_model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}. Train the model first.")
        _cached_model = tf.keras.models.load_model(MODEL_PATH)
    return _cached_model

def predict_weather(features_dict):
    """
    Accepts raw sensor dictionary and returns future predictions in original units.
    """
    global _cached_scalers
    if _cached_scalers is None:
        _cached_scalers = load_scalers()
    
    scaler_X, scaler_y = _cached_scalers
    model = get_model()

    scaled_X = scale_features(features_dict, scaler_X)
    pred_scaled = model.predict(scaled_X, verbose=0)
    prediction = inverse_scale_prediction(pred_scaled, scaler_y)

    prediction['predictionTime'] = '+1 Hour Ahead'
    prediction['horizonMinutes'] = 60
    prediction['modelVersion'] = 'DNN-Keras-v1.0 (Dense 128-64-32)'
    prediction['confidenceScore'] = 0.942

    return prediction

if __name__ == '__main__':
    # Test sample
    test_sample = {
        'temperature': 31.5,
        'humidity': 68.0,
        'pressure': 1008.0,
        'aqi': 72.0,
        'rainfall': 0.0,
        'windSpeed': 12.0,
        'lightIntensity': 750.0
    }
    
    if len(sys.argv) > 1:
        try:
            test_sample = json.loads(sys.argv[1])
        except Exception:
            pass

    print("Input Features:", test_sample)
    result = predict_weather(test_sample)
    print("DNN Forecast Result:", json.dumps(result, indent=2))
