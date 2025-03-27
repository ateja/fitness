from flask import Flask, jsonify
from flask_cors import CORS
import json
import os
from pathlib import Path

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Path to exercises directory (adjust as needed)
EXERCISES_DIR = Path('../exercises')

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

if __name__ == '__main__':
    app.run(debug=True, port=5000) 