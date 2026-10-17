import sys
import cv2
import torch
import fastapi
import numpy

print("Python  :", sys.version.split()[0])
print("OpenCV  :", cv2.__version__)
print("PyTorch :", torch.__version__)
print("FastAPI :", fastapi.__version__)
print("NumPy   :", numpy.__version__)
print("All good!")
