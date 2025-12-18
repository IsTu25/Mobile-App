# 🖼️ NIRAPOTTA - Recognition Dataset (নিরাপত্তা)

This directory acts as the central repository for reference data used by the **AI Face Recognition Module**. Images placed here are used to identify individuals present in SOS video evidence.

---

## 📂 Data Structure

To enable recognition, you must provide both the physical images and a metadata mapping file:

### 1. Identify Reference Images
Place high-quality images (`.jpg`, `.png`) of individuals you wish to recognize in this folder.
- *Example:* `/backend/dataset/person_name.jpg`

### 2. Configure `data.json`
Create or update `data.json` in this directory to map images to identifiable information:

```json
[
  {
    "image": "isfak.jpeg",
    "name": "Md. Isfak Iqbal",
    "email": "isfak@example.com",
    "info": "Registered User / Emergency Contact"
  },
  {
    "image": "suspect_01.png",
    "name": "Unknown Suspect",
    "email": "n/a",
    "info": "Noted for suspicious activity in sector 7"
  }
]
```

---

## 🛠️ How it Works
1. When an SOS video is uploaded, the backend extracts candidate facial frames.
2. The `FaceRecognitionService` computes facial descriptors for these frames.
3. These descriptors are compared against the images listed in `data.json`.
4. If a match is found (Euclidean distance < 0.6), the corresponding metadata is included in the safety report sent to police stations.

---
*Part of the Nirapotta AI Security Pipeline.*
