import requests
import numpy as np
import time

# Create a dummy "Normal Walking" signal (Sine wave)
t = np.linspace(0, 10, 128)
ax = np.sin(t)
dummy_signal = np.zeros((128, 6))
dummy_signal[:, 0] = ax # Acc X

payload = {
    "sensor_data": dummy_signal.tolist()
}

print("Sending 'Normal' Walking Data...")
try:
    response = requests.post("http://localhost:5001/predict", json=payload)
    print("Status Code:", response.status_code)
    print("Response:", response.json())
except Exception as e:
    print("Error:", e)

print("\n----------------\n")

# Create a dummy "Agitated" signal (High frequency noise)
noise = np.random.normal(0, 0.5, (128, 6))
agitated_signal = dummy_signal + noise

payload_danger = {
    "sensor_data": agitated_signal.tolist()
}

print("Sending 'Danger' Data (Simulated Tremors)...")
try:
    response = requests.post("http://localhost:5001/predict", json=payload_danger)
    print("Status Code:", response.status_code)
    print("Response:", response.json())
except Exception as e:
    print("Error:", e)
