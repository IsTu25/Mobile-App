# Dataset for Recognition

Place your reference images here. Supported formats: .jpg, .png.

Also, please create a `data.json` file in this directory with the following structure:

```json
[
  {
    "image": "person1.jpg",
    "name": "John Doe",
    "email": "john@example.com",
    "info": "Wanted for xyz"
  },
  {
    "image": "person2.png",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "info": "Missing person"
  }
]
```

The system will load these images and compare them against the frames from the SOS video.
