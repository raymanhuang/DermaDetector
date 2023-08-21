from flask import Flask, request, jsonify
import torch
import torchvision.transforms as transforms
from PIL import