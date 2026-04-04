import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("api_key") or os.getenv("API_KEY")
print(f"API Key Found: {'Yes' if key else 'No'}")

if key:
    try:
        genai.configure(api_key=key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        print("Testing Gemini 1.5 Flash...")
        response = model.generate_content("Hello")
        print(f"SUCCESS: {response.text}")
    except Exception as e:
        print(f"FAILED: {str(e)}")
else:
    print("ERROR: No API Key found in .env file.")
