import base64
from openai import OpenAI
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Load API key
openai_key = os.getenv("OPENAI_API_KEY")
if not openai_key:
    raise ValueError("OPENAI_API_KEY not found in .env file")

client = OpenAI(api_key=openai_key)

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

# Image path
image_path = "img1.jpg"
base64_image = encode_image(image_path)

response = client.chat.completions.create(
    model="gpt-4o",  # or "gpt-4-vision-preview"
    messages=[
        {
            "role": "user",
            "content": [
                { "type": "text", "text": "What's in this image?" },
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

# Output the result
print(response.choices[0].message.content)
