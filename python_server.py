from flask import Flask, request, jsonify
import torch
import torchvision.transforms as transforms
import torch.nn as nn
from torchvision import models
from PIL import Image

app = Flask(__name__)

MODEL_PATH = 'model.pth'
model = models.resnet50(pretrained=True)
# Number of features in the bottleneck layer
num_ftrs = model.fc.in_features
# Modify output layer
model.fc = nn.Linear(num_ftrs, 5)
model.load_state_dict(torch.load(MODEL_PATH, map_location=torch.device('cpu')))
model.eval()

@app.route('/predict', methods=['POST'])
def predict():
    image = Image.open(request.files['image'])
    transform = transforms.Compose([
        transforms.Resize(size=(224,224)),
        transforms.ToTensor()
    ])
    image_tensor = transform(image).float().unsqueeze(0)
    output = model(image_tensor)
    _, predicted = torch.max(output, 1)
    class_names = ["Eczema", "Acne", "Pigment", "Benign", "Malignant"]

    result = class_names[predicted]

    return jsonify({"prediction": result})

if __name__ == '__main__':
    app.run(port=5000)