import numpy as np


def inject_micro_tremors(signal, noise_level=0.3):
    """
    Injects high-frequency noise to simulate trembling/shaking hands.
    :param signal: Input signal chunk (128, 6)
    :param noise_level: Standard deviation of the Gaussian noise
    :return: Signal with tremors
    """
    noise = np.random.normal(0, noise_level, signal.shape)
    return signal + noise

def inject_agitation(signal, factor=1.5):
    """
    Simulates agitation by increasing the amplitude of the movement.
    :param signal: Input signal chunk (128, 6)
    :param factor: Multiplier for amplitude
    :return: Agitated signal
    """
    return signal * factor

def inject_hesitation(signal, hesitation_prob=0.3):
    """
    Simulates hesitation by dampening the signal amplitude for short bursts.
    """
    modified_signal = signal.copy()
    if np.random.rand() > hesitation_prob:
        return modified_signal

    start = np.random.randint(20, 100)
    duration = np.random.randint(10, 40)
    end = min(start + duration, 128)
    modified_signal[start:end, :] *= 0.1 
    return modified_signal

def generate_stressed_sample(normal_sample):
    """
    Takes a 'Normal Walking' sample and turns it into 'Fear Walking'
    by applying Tremors, Agitation, and Hesitation.
    """
    # 1. Agitation (Walking faster/harder)
    stressed = inject_agitation(normal_sample, factor=1.2)
    
    # 2. Tremor (Shaking)
    stressed = inject_micro_tremors(stressed, noise_level=0.3)
    
    # 3. Hesitation (Pausing/Freezing)
    stressed = inject_hesitation(stressed)
    
    return stressed

