import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler

FEATURE_COLUMNS = [
    'temperature',
    'humidity',
    'pressure',
    'aqi',
    'rainfall',
    'windSpeed',
    'lightIntensity'
]

TARGET_COLUMNS = [
    'future_temperature',
    'future_humidity',
    'future_pressure',
    'future_aqi'
]

SCALER_X_PATH = os.path.join(os.path.dirname(__file__), 'model', 'scaler_X.pkl')
SCALER_Y_PATH = os.path.join(os.path.dirname(__file__), 'model', 'scaler_y.pkl')

def load_and_preprocess_data(csv_path='ml/dataset/weather_data.csv', test_size=0.2, random_state=42):
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at {csv_path}. Run generate_dataset.py first.")
    
    df = pd.read_csv(csv_path)
    
    # Handle any potential NaNs
    df = df.dropna(subset=FEATURE_COLUMNS + TARGET_COLUMNS)
    
    X = df[FEATURE_COLUMNS].values
    y = df[TARGET_COLUMNS].values
    
    # Split train/test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, shuffle=True
    )
    
    # Initialize separate scalers for inputs and targets
    scaler_X = MinMaxScaler(feature_range=(0, 1))
    scaler_y = MinMaxScaler(feature_range=(0, 1))
    
    X_train_scaled = scaler_X.fit_transform(X_train)
    X_test_scaled = scaler_X.transform(X_test)
    
    y_train_scaled = scaler_y.fit_transform(y_train)
    y_test_scaled = scaler_y.transform(y_test)
    
    # Save scalers
    os.makedirs(os.path.dirname(SCALER_X_PATH), exist_ok=True)
    joblib.dump(scaler_X, SCALER_X_PATH)
    joblib.dump(scaler_y, SCALER_Y_PATH)
    
    print(f"Dataset processed: {len(X_train)} train rows, {len(X_test)} test rows.")
    return X_train_scaled, X_test_scaled, y_train_scaled, y_test_scaled, scaler_X, scaler_y

def load_scalers():
    if not os.path.exists(SCALER_X_PATH) or not os.path.exists(SCALER_Y_PATH):
        raise FileNotFoundError("Scalers not found. Train the model first.")
    scaler_X = joblib.load(SCALER_X_PATH)
    scaler_y = joblib.load(SCALER_Y_PATH)
    return scaler_X, scaler_y

def scale_features(features_dict, scaler_X):
    """
    Accepts a dictionary of sensor readings and returns a 2D numpy array scaled for model prediction.
    """
    row = [
        float(features_dict.get('temperature', 28.0)),
        float(features_dict.get('humidity', 60.0)),
        float(features_dict.get('pressure', 1013.0)),
        float(features_dict.get('aqi', 60.0)),
        float(features_dict.get('rainfall', 0.0)),
        float(features_dict.get('windSpeed', 10.0)),
        float(features_dict.get('lightIntensity', 500.0)),
    ]
    arr = np.array([row])
    return scaler_X.transform(arr)

def inverse_scale_prediction(pred_scaled, scaler_y):
    """
    Converts scaled model output back to original units.
    """
    pred_orig = scaler_y.inverse_transform(pred_scaled)[0]
    return {
        'predictedTemperature': float(np.round(pred_orig[0], 2)),
        'predictedHumidity': float(np.round(np.clip(pred_orig[1], 0, 100), 2)),
        'predictedPressure': float(np.round(pred_orig[2], 2)),
        'predictedAQI': float(np.round(np.maximum(0, pred_orig[3]), 1)),
    }
