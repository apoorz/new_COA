import requests
from PIL import Image
import io

# Create a random RGB image
img = Image.new('RGB', (200, 200), color='blue')
# Save to bytes
img_byte_arr = io.BytesIO()
img.save(img_byte_arr, format='JPEG')
img_byte_arr.seek(0)

print("Sending standard JPEG...")
response = requests.post("http://127.0.0.1:8000/api/register", data={"name": "Test RGB"}, files={"file": ("test.jpg", img_byte_arr, "image/jpeg")})
print("Result:", response.status_code, response.text)

# Create an RGBA image
img_rgba = Image.new('RGBA', (200, 200), color=(255, 0, 0, 128))
img_byte_arr_rgba = io.BytesIO()
img_rgba.save(img_byte_arr_rgba, format='PNG')
img_byte_arr_rgba.seek(0)

print("Sending RGBA PNG...")
response2 = requests.post("http://127.0.0.1:8000/api/register", data={"name": "Test RGBA"}, files={"file": ("test.png", img_byte_arr_rgba, "image/png")})
print("Result:", response2.status_code, response2.text)
