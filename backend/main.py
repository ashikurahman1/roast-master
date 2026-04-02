from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os 
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# API Key  

api_key = os.getenv("api_key")
if not api_key:
    print("Error: api_key নট ফাউন্ড। Render Settings চেক করুন।")
else:
    genai.configure(api_key=api_key)

# Check Model List
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"Available Model: {m.name}")
except Exception as e:
    print(f"Model listing failed: {e}")

# CORS Middleware 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Roast Master is Live!"}

@app.post("/roast")
async def roast_me(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        
        # Model ব
        model = genai.GenerativeModel('models/gemini-flash-latest')

        prompt = "তুমি একজন রোস্ট মাস্টার। এই ছবিতে থাকা মানুষটির স্টাইল বা ড্রেসআপ নিয়ে বাংলায় ২ লাইনে খুব মজার এবং ফানি একটি রোস্ট করো।"
        
        response = model.generate_content([
            prompt,
            {'mime_type': 'image/jpeg', 'data': image_bytes}
        ])
        
        return {"roast": response.text}
    except Exception as e:
        return {"error": f"AI একটু বিজি আছে! এরর: {str(e)}"}