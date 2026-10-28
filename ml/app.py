import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from predict import predict_weather

app = Flask(__name__)
CORS(app)

METRICS_PATH = os.path.join(os.path.dirname(__file__), 'model', 'metrics.json')

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ONLINE',
        'service': 'Python TensorFlow DNN Weather Prediction Microservice',
        'port': 5001
    })

@app.route('/metrics', methods=['GET'])
def get_metrics():
    if os.path.exists(METRICS_PATH):
        try:
            with open(METRICS_PATH, 'r') as f:
                metrics_data = json.load(f)
            return jsonify(metrics_data)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({
        'status': 'Model not yet trained. Run train_model.py.'
    })

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({'error': 'No input data provided'}), 400

        pred = predict_weather(data)
        return jsonify({
            'success': True,
            'prediction': pred,
            'inputFeatures': data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("[Flask] Starting Python DNN Weather Microservice on http://127.0.0.1:5001")
    app.run(host='127.0.0.1', port=5001, debug=False)
