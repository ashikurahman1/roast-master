from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from google.api_core import exceptions
import os 
import time
import logging
import io
import random
from PIL import Image as PILImage
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()

# Load all available API Keys from .env
# Example format in .env: API_KEY_1=..., API_KEY_2=...
api_keys = []
for i in range(1, 11): # Supports up to 10 keys
    key = os.getenv(f"API_KEY_{i}") or os.getenv(f"api_key_{i}")
    if key:
        api_keys.append(key)

# Fallback to single 'api_key' if no numbered keys found
if not api_keys:
    single_key = os.getenv("api_key") or os.getenv("API_KEY")
    if single_key:
        api_keys.append(single_key)

if not api_keys:
    logger.error("কোনো API Key খুঁজে পাওয়া যায়নি! .env ফাইলটি চেক করুন।")
else:
    logger.info(f"Loaded {len(api_keys)} API Keys for rotation.")

# Exact models available for this API Key (matching your models_list.txt)
MODELS = [
    "models/gemini-2.5-flash",
    "models/gemini-2.0-flash",
    "models/gemini-pro-latest",
    "models/gemini-flash-latest",
    "models/gemini-3-flash-preview",
    "models/gemini-3.1-pro-preview",
    "models/gemini-2.0-flash-lite",
    "models/gemini-1.5-flash",
    "models/gemini-1.5-pro",
]

# CORS Middleware 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def resize_image(image_bytes, max_size=(1024, 1024)):
    """Resize image to reduce token usage and improve reliability."""
    try:
        img = PILImage.open(io.BytesIO(image_bytes))
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        img.thumbnail(max_size, PILImage.Resampling.LANCZOS)
        output = io.BytesIO()
        img.save(output, format="JPEG", quality=80) 
        return output.getvalue()
    except Exception as e:
        logger.error(f"Image resize failed: {str(e)}")
        return image_bytes

@app.get("/")
def home():
    return {"message": "Roast Master is Live with Multi-Key Rotation!", "active_keys": len(api_keys)}

@app.post("/roast")
async def roast_me(file: UploadFile = File(...)):
    if not api_keys:
        return {"error": "API Key কনফিগার করা হয়নি। আপনার .env ফাইলটি চেক করুন।"}

    try:
        original_bytes = await file.read()
        if not original_bytes:
            return {"error": "ফাইলটি পাওয়া যায়নি।"}

        image_bytes = resize_image(original_bytes)
        prompt = "তুমি একজন রোস্ট মাস্টার। এই ছবিতে থাকা মানুষটির স্টাইল বা ড্রেসআপ নিয়ে বাংলায় ২ লাইনে খুব মজার এবং ফানি একটি রোস্ট করো।"
        
        # Shuffle keys and models to maximize chance of success
        random.shuffle(api_keys)
        
        last_exception = "No keys/models succeeded"
        
        for current_key in api_keys:
            try:
                # Configure the current key
                genai.configure(api_key=current_key)
                
                # Try with a random model first from the list
                shuffled_models = MODELS.copy()
                random.shuffle(shuffled_models)
                
                for model_name in shuffled_models:
                    try:
                        logger.info(f"Using Key (prefix: {current_key[:5]}...) with Model: {model_name}")
                        model = genai.GenerativeModel(model_name)
                        response = model.generate_content([
                            prompt,
                            {'mime_type': 'image/jpeg', 'data': image_bytes}
                        ])
                        
                        if response and response.text:
                            return {
                                "roast": response.text,
                                "model": model_name
                            }
                    except exceptions.ResourceExhausted:
                        logger.warning(f"Quota exceeded for model {model_name} on current key.")
                        last_exception = "ResourceExhausted"
                        continue # Try next model or next key
                    except Exception as e:
                        logger.error(f"Error with model {model_name}: {str(e)}")
                        last_exception = str(e)
                        continue
                        
            except Exception as e:
                logger.error(f"Failed to configure or use API Key: {str(e)}")
                continue # Try next key
        
        if last_exception == "ResourceExhausted":
            error_msg = "সবগুলো এপিআই কি-র লিমিট এখন বিজি! ২ মিনিট পর আবার ট্রাই করো।"
            retry_after = 120
        else:
            error_msg = f"AI বা ব্যাকএন্ড একটু বিজি আছে! এরর: {last_exception}"
            retry_after = 0
            
        return {"error": error_msg, "retry_after": retry_after}

    except Exception as e:
        logger.error(f"Fatal Server Error: {str(e)}")
        return {"error": f"সার্ভার এরর: {str(e)}"}