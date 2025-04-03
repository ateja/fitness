from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from pathlib import Path
import time
import base64
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Path to exercises directory (adjust as needed)
EXERCISES_DIR = Path('../exercises')

# Load API key from .env file
openai_key = os.getenv("OPENAI_API_KEY")
if not openai_key:
    raise ValueError("OPENAI_API_KEY not found in .env file")

client = OpenAI(api_key=openai_key)

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

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    image_file = request.files['image']
    if image_file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    # Process the image with OpenAI
    result = process_image_with_openai(image_file.read())
    
    # Return the result directly
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000) 