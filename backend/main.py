import json
import os
import base64  # Import base64 for image encoding
from typing import List, Optional
from fastapi import FastAPI, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import OpenAI  

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ModelConfig(BaseModel):
    model: str
    baseUrl: str
    apiKey: str
    lastUpdated: str

JSON_FILE = "models.json"

@app.get("/models", response_model=List[ModelConfig])
async def get_models():
    if not os.path.exists(JSON_FILE):
        return []
    try:
        with open(JSON_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []

@app.post("/models")
async def save_models(configs: List[ModelConfig]):
    with open(JSON_FILE, "w") as f:
        json_data = [c.dict() for c in configs]
        json.dump(json_data, f, indent=4)
    return {"message": "Saved successfully"}

@app.post("/chat")
async def chat_endpoint(
    user_prompt: str = Form(...),
    messages: str = Form(...),
    model_name: str = Form(...),
    base_url: str = Form(...),   
    api_key: str = Form(...),    
    temperature: float = Form(1.0),
    max_tokens: int = Form(512),
    top_p: float = Form(1.0),
    reasoning_effort: str = Form(None),
    files: List[UploadFile] = File(None) # Accepts list of files
):
    # Prepare client
    client = OpenAI(base_url=base_url, api_key=api_key)
    
    # Parse history
    try:
        message_history = json.loads(messages)
    except:
        message_history = []
        
    if files:
        content_payload = [{"type": "text", "text": user_prompt}]
        
        for file in files:
            file_content = await file.read()
            encoded_image = base64.b64encode(file_content).decode('utf-8')
            
            mime_type = file.content_type or "image/jpeg"
            
            content_payload.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:{mime_type};base64,{encoded_image}"
                }
            })
            
        current_message = {"role": "user", "content": content_payload}
    else:
        current_message = {"role": "user", "content": user_prompt}
    
    full_messages = message_history + [current_message]

    params = {
        "model": model_name,
        "messages": full_messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "top_p": top_p,
        "stream": True,
    }

    if reasoning_effort and reasoning_effort.lower() in ["low", "medium", "high"]:
        params["reasoning_effort"] = reasoning_effort.lower()

    async def response_generator():
        try:
            stream = client.chat.completions.create(**params)
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"Error: {str(e)}"

    return StreamingResponse(response_generator(), media_type="text/plain")