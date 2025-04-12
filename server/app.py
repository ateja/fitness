from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from pathlib import Path
import time
import base64
from openai import OpenAI
from dotenv import load_dotenv
from functools import wraps
import requests

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Path to exercises directory (adjust as needed)
EXERCISES_DIR = Path('../exercises')

# Load API keys from .env file
openai_key = os.getenv("OPENAI_API_KEY")
if not openai_key:
    raise ValueError("OPENAI_API_KEY not found in .env file")

client = OpenAI(api_key=openai_key)

def validate_token(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No token provided'}), 401
        
        try:
            token = auth_header.split('Bearer ')[1]
            
            # Verify the token using Google's tokeninfo endpoint
            tokeninfo_url = f"https://www.googleapis.com/oauth2/v3/tokeninfo?access_token={token}"
            response = requests.get(tokeninfo_url)
            tokeninfo = response.json()
            
            if 'error' in tokeninfo:
                print(f"Token validation error: {tokeninfo['error']}")
                return jsonify({'error': 'Invalid access token'}), 401
            
            # Verify the token has the required scopes
            required_scopes = [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive.readonly'
            ]
            
            token_scopes = tokeninfo.get('scope', '').split()
            if not all(scope in token_scopes for scope in required_scopes):
                print(f"Missing required scopes. Required: {required_scopes}, Got: {token_scopes}")
                return jsonify({'error': 'Missing required scopes'}), 401
            
            return f(*args, **kwargs)
        except Exception as e:
            print(f"Token validation error: {str(e)}")
            return jsonify({'error': 'Invalid token'}), 401
    
    return decorated_function

def load_exercises():
    exercises = []
    for json_file in EXERCISES_DIR.glob('*.json'):
        with open(json_file, 'r') as f:
            data = json.load(f)
            exercise_name = json_file.stem.replace('_', ' ').replace('-', ' ')
            exercises.append({
                'id': json_file.stem,
                'name': exercise_name,
                'force': data.get('force'),
                'primaryMuscles': data.get('primaryMuscles', [])
            })
    return exercises

@app.route('/exercise/', methods=['GET'])
@validate_token
def get_exercises():
    exercises = load_exercises()
    return jsonify(exercises)

def process_image_with_openai(image_data):
    # Encode the image data to base64
    base64_image = base64.b64encode(image_data).decode("utf-8")
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    { 
                        "type": "text", 
                        "text": (
                            "Analyze this exercise image and provide a JSON response with the following schema:\n"
                            "{\n"
                            "  \"type\": \"object\",\n"
                            "  \"properties\": {\n"
                            "    \"date\": { \"type\": \"string\" },\n"
                            "    \"exercises\": {\n"
                            "      \"type\": \"array\",\n"
                            "      \"items\": {\n"
                            "        \"type\": \"object\",\n"
                            "        \"properties\": {\n"
                            "          \"name\": { \"type\": \"string\" },\n"
                            "          \"sets\": {\n"
                            "            \"type\": \"array\",\n"
                            "            \"items\": {\n"
                            "              \"type\": \"object\",\n"
                            "              \"properties\": {\n"
                            "                \"reps\": { \"type\": \"integer\", \"minimum\": 0 },\n"
                            "                \"weight\": { \"type\": \"number\", \"minimum\": 0 }\n"
                            "              },\n"
                            "              \"required\": [\"reps\", \"weight\"],\n"
                            "              \"additionalProperties\": false\n"
                            "            }\n"
                            "          }\n"
                            "        },\n"
                            "        \"required\": [\"name\", \"sets\"],\n"
                            "        \"additionalProperties\": false\n"
                            "      }\n"
                            "    }\n"
                            "  },\n"
                            "  \"required\": [\"date\", \"exercises\"],\n"
                            "  \"additionalProperties\": false\n"
                            "}\n"
                        )
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        },
                    },
                ],
            }
        ],
        max_tokens=1000
    )
    
    # Print the raw response for debugging
    print("OpenAI Response:", response.choices[0].message.content)
    
    # Clean up the response by removing markdown code block markers
    content = response.choices[0].message.content
    if content.startswith("```json"):
        content = content[7:]  # Remove ```json
    if content.endswith("```"):
        content = content[:-3]  # Remove ```
    content = content.strip()  # Remove any extra whitespace
    
    # Parse the response content as JSON
    try:
        result = json.loads(content)
        return result
    except json.JSONDecodeError as e:
        print("JSON Parse Error:", str(e))
        # If the response isn't valid JSON, return a structured error
        return {
            "error": "Failed to parse OpenAI response",
            "raw_response": content
        }

def get_mock_response():
    return {
        "date": "2024-03-20",
        "exercises": [
            {
                "name": "Bench Press",
                "sets": [
                    {"reps": 10, "weight": 135},
                    {"reps": 8, "weight": 155},
                    {"reps": 6, "weight": 175}
                ]
            },
            {
                "name": "Squat",
                "sets": [
                    {"reps": 12, "weight": 185},
                    {"reps": 10, "weight": 205},
                    {"reps": 8, "weight": 225}
                ]
            }
        ]
    }

@app.route('/upload', methods=['POST'])
@validate_token
def upload_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    image_file = request.files['image']
    if image_file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    # Check if mock upload is enabled
    if os.getenv("USE_MOCK_UPLOAD", "false").lower() == "true":
        result = get_mock_response()
    else:
        # Process the image with OpenAI
        result = process_image_with_openai(image_file.read())
    
    # Return the result directly
    return jsonify(result)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(debug=True, port=5000) 