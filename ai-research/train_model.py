import numpy as np
import pandas as pd
import os
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from augmentations import generate_stressed_sample
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# --- Configuration ---
DATA_DIR = "UCI HAR Dataset"
groups = ['train', 'test']
# We use Body Acc and Body Gyro (6 channels)
# Note: UCI also has Total Acc (Body + Gravity). 
# Mobile phones usually give Total Acc or Body Acc. Let's stick to Body Acc + Gyro.
FILENAMES = [
    "body_acc_x", "body_acc_y", "body_acc_z",
    "body_gyro_x", "body_gyro_y", "body_gyro_z"
]

def load_group(group, prefix=""):
    """
    Loads the 6 inertial signal files for a group (train/test).
    Returns shape (n_samples, 128, 6)
    """
    loaded = []
    for name in FILENAMES:
        # e.g. UCI HAR Dataset/train/Inertial Signals/body_acc_x_train.txt
        filename = f"{DATA_DIR}/{group}/Inertial Signals/{name}_{group}.txt"
        if not os.path.exists(filename):
            print(f"Error: File not found {filename}")
            return None
        
        # Load (n_samples, 128)
        df = pd.read_csv(filename, delim_whitespace=True, header=None)
        loaded.append(df.values)
    
    # Stack to (n_samples, 128, 6)
    # axis 2 because loaded is list of 6 arrays of shape (n, 128)
    # We want (n, 128, 6)
    loaded = np.dstack(loaded)
    return loaded

def load_labels(group):
    filename = f"{DATA_DIR}/{group}/y_{group}.txt"
    y = pd.read_csv(filename, delim_whitespace=True, header=None)
    return y.values.flatten() # (n_samples, )

def prepare_data():
    print("Loading Data...")
    X_train_raw = load_group('train')
    y_train_raw = load_labels('train')
    
    X_test_raw = load_group('test')
    y_test_raw = load_labels('test')
    
    # Concatenate train and test to get more data, we will split later ourselves
    X_all = np.concatenate((X_train_raw, X_test_raw), axis=0)
    y_all = np.concatenate((y_train_raw, y_test_raw), axis=0)
    
    print(f"Total Combined Data: {X_all.shape}")
    
    # Filter for WALKING activities only (Label 1, 2, 3)
    # 1: Walking, 2: Up, 3: Down
    walking_indices = np.where((y_all == 1) | (y_all == 2) | (y_all == 3))[0]
    
    X_walking = X_all[walking_indices]
    print(f"Walking Samples: {X_walking.shape}")
    
    # Create Dataset
    # Class 0: Normal Walking (The original data)
    X_normal = X_walking
    y_normal = np.zeros(len(X_normal))
    
    # Class 1: Stressed/Danger Walking (Synthetically Augmented)
    print("Generating Synthetic 'Feature' Data (Tremors & Hesitation)...")
    X_stressed = np.array([generate_stressed_sample(x) for x in X_walking])
    y_stressed = np.ones(len(X_stressed))
    
    # Combine
    X = np.concatenate((X_normal, X_stressed), axis=0)
    y = np.concatenate((y_normal, y_stressed), axis=0)
    
    # Shuffle
    indices = np.arange(len(X))
    np.random.shuffle(indices)
    X = X[indices]
    y = y[indices]
    
    return X, y

def build_model(input_shape):
    model = Sequential()
    # LSTM layer to capture time-series patterns (gait rhythm)
    model.add(LSTM(64, input_shape=input_shape, return_sequences=False))
    model.add(Dropout(0.5))
    model.add(Dense(32, activation='relu'))
    model.add(Dense(1, activation='sigmoid')) # Binary classification: 0=Safe, 1=Danger
    
    model.compile(loss='binary_crossentropy', optimizer='adam', metrics=['accuracy'])
    return model

if __name__ == "__main__":
    if not os.path.exists("UCI HAR Dataset"):
        print("Dataset not found! Please run download_data.sh first.")
        exit(1)

    X, y = prepare_data()
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"Training shapes: X={X_train.shape}, y={y_train.shape}")
    
    model = build_model((128, 6))
    
    print("\nStarting Training...")
    history = model.fit(
        X_train, y_train,
        epochs=10,
        batch_size=64,
        validation_data=(X_test, y_test)
    )
    
    print("\nEvaluation:")
    loss, accuracy = model.evaluate(X_test, y_test)
    print(f"Test Accuracy: {accuracy*100:.2f}%")
    
    # Detailed Report
    y_pred_prob = model.predict(X_test)
    y_pred = (y_pred_prob > 0.5).astype(int)
    
    print(classification_report(y_test, y_pred, target_names=['Safe', 'Danger']))
    
    # Save model for later potential use
    model.save("gut_feeling_model.h5")
    print("Model saved to gut_feeling_model.h5")
