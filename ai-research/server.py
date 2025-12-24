import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

print("Loading Model...")
model = tf.keras.models.load_model('gut_feeling_model.h5')
print("Model Loaded!")

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        # Expecting 'sensor_data': [[ax, ay, az, gx, gy, gz], ... 128 times ...]
        sensor_data = np.array(data['sensor_data'])
        
        # Reshape to (1, 128, 6)
        if sensor_data.shape != (128, 6):
            return jsonify({"error": f"Invalid shape. Expected (128, 6), got {sensor_data.shape}"}), 400
            
        input_data = np.expand_dims(sensor_data, axis=0)
        
        prediction = model.predict(input_data)
        risk_score = float(prediction[0][0])
        
        print(f"Risk Score: {risk_score}")
        
        return jsonify({
            "risk_score": risk_score,
            "status": "DANGER" if risk_score > 0.8 else "SAFE"
        })
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run on port 5001 to avoid conflict with Node backend (3000) or React (8081)
    app.run(host='0.0.0.0', port=5001)
