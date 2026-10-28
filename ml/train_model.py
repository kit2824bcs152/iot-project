import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from preprocessing import load_and_preprocess_data, TARGET_COLUMNS, FEATURE_COLUMNS

MODEL_SAVE_PATH_KERAS = os.path.join(os.path.dirname(__file__), 'model', 'weather_dnn.keras')
MODEL_SAVE_PATH_H5 = os.path.join(os.path.dirname(__file__), 'model', 'weather_dnn.h5')
METRICS_SAVE_PATH = os.path.join(os.path.dirname(__file__), 'model', 'metrics.json')

def build_dnn_model(input_dim=7, output_dim=4):
    """
    Constructs the Deep Neural Network architecture:
    Input -> Dense(128, relu) -> Dropout(0.2) -> Dense(64, relu) -> Dropout(0.2) -> Dense(32, relu) -> Output(4, linear)
    """
    model = models.Sequential([
        layers.Input(shape=(input_dim,), name='sensor_input_layer'),
        layers.Dense(128, activation='relu', name='dense_128'),
        layers.Dropout(0.2, name='dropout_1'),
        layers.Dense(64, activation='relu', name='dense_64'),
        layers.Dropout(0.2, name='dropout_2'),
        layers.Dense(32, activation='relu', name='dense_32'),
        layers.Dense(output_dim, activation='linear', name='forecast_output_layer')
    ], name='Weather_DNN_Predictor')

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='mse',
        metrics=['mae', 'mse']
    )
    return model

def train_and_evaluate(epochs=50, batch_size=32):
    print("=" * 60)
    print(">> Starting DNN Training for Weather & Environmental Prediction")
    print("=" * 60)
    
    # 1. Load data
    dataset_path = os.path.join(os.path.dirname(__file__), 'dataset', 'weather_data.csv')
    X_train, X_test, y_train, y_test, scaler_X, scaler_y = load_and_preprocess_data(dataset_path)

    # 2. Build model
    model = build_dnn_model(input_dim=len(FEATURE_COLUMNS), output_dim=len(TARGET_COLUMNS))
    model.summary()

    # 3. Training callbacks
    early_stop = callbacks.EarlyStopping(monitor='val_loss', patience=8, restore_best_weights=True)
    reduce_lr = callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=4, min_lr=1e-5)

    # 4. Fit model
    history = model.fit(
        X_train, y_train,
        validation_split=0.15,
        epochs=epochs,
        batch_size=batch_size,
        callbacks=[early_stop, reduce_lr],
        verbose=1
    )

    # 5. Evaluate on Test Set
    y_pred_scaled = model.predict(X_test)
    y_test_orig = scaler_y.inverse_transform(y_test)
    y_pred_orig = scaler_y.inverse_transform(y_pred_scaled)

    metrics = {
        'architecture': 'Input(7) -> Dense(128) -> Dropout(0.2) -> Dense(64) -> Dropout(0.2) -> Dense(32) -> Output(4)',
        'framework': f'TensorFlow {tf.__version__} / Keras',
        'trainingSamples': int(len(X_train)),
        'testSamples': int(len(X_test)),
        'epochsTrained': len(history.history['loss']),
        'variables': {}
    }

    r2_sum = 0
    for i, col_name in enumerate(TARGET_COLUMNS):
        mae = float(mean_absolute_error(y_test_orig[:, i], y_pred_orig[:, i]))
        mse = float(mean_squared_error(y_test_orig[:, i], y_pred_orig[:, i]))
        rmse = float(np.sqrt(mse))
        r2 = float(r2_score(y_test_orig[:, i], y_pred_orig[:, i]))
        r2_sum += r2

        clean_name = col_name.replace('future_', '')
        metrics['variables'][clean_name] = {
            'mae': round(mae, 3),
            'mse': round(mse, 3),
            'rmse': round(rmse, 3),
            'r2': round(r2, 4)
        }
        print(f"\n[{clean_name.upper()}] Metrics:")
        print(f"   MAE:  {mae:.3f}")
        print(f"   MSE:  {mse:.3f}")
        print(f"   RMSE: {rmse:.3f}")
        print(f"   R2:   {r2:.4f}")

    overall_r2 = r2_sum / len(TARGET_COLUMNS)
    metrics['overallR2Score'] = round(overall_r2, 4)
    metrics['overallAccuracy'] = f"{round(max(0, overall_r2) * 100, 1)}%"

    # 6. Save Model
    model.save(MODEL_SAVE_PATH_KERAS)
    print(f"\n[OK] Model saved to: {MODEL_SAVE_PATH_KERAS}")
    try:
        model.save(MODEL_SAVE_PATH_H5)
    except Exception:
        pass

    with open(METRICS_SAVE_PATH, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"[OK] Metrics saved to: {METRICS_SAVE_PATH}")

    return model, metrics

if __name__ == '__main__':
    train_and_evaluate(epochs=40)
