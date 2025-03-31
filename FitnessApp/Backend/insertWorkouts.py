import json
import jwt
import requests
import base64

import requests.auth

KEYS_FILE_PATH = 'keys.txt'
WORKOUTS_FILE_PATH = 'workouts.json'
EXERCISES_FILE_PATH = 'exercises.json'
API_URL = 'http://0.0.0.0:8080/api/workout/add_workout'

def read_keys(file_path):
    """Read API keys from a file, one per line."""
    with open(file_path, mode='r') as file:
        keys = file.readline().strip()
        while keys:
            yield keys
            keys = file.readline().strip()

def read_workouts(file_path):
    """Read workout data from a JSON file."""
    with open(file_path, mode='r') as file:
        return json.load(file)

def load_exercises(file_path):
    """Load exercise data from a JSON file."""
    with open(file_path, mode='r') as file:
        return json.load(file)['exercises']

def create_jwt_token(data):
    """Create a JWT token using HS256."""
    key = data['key']
    return jwt.encode(payload=data, key=base64.b64decode(key), algorithm='HS256')

def send_workout_data(workout_data, api_key):
    """Send workout data to API with proper authentication headers."""
    
    # Encode API key for safe transmission
    encoded_api_key = base64.b64encode(api_key.encode()).decode()

    j = {"token": create_jwt_token(workout_data)}
    
    headers = {
        "Authorization": f"ApiKey {encoded_api_key}",  # API Key encoded in Base64
        "Content-Type": "application/json",
        "Accept": "*/*"
    }


    # Debugging Output
    print("---- DEBUG REQUEST ----")
    print("URL:", API_URL)
    print("Headers:", headers)
    print("Payload:", json.dumps(j, indent=2))
    print("-----------------------")

    # POST request with JSON body and headers
    response = requests.post(API_URL, json=j, headers=headers)  # Ensure proper JSON is sent
    return response

def main():
    """Main function to process workouts and send them to the API."""
    workouts = read_workouts(WORKOUTS_FILE_PATH)
    exercises = load_exercises(EXERCISES_FILE_PATH)
    i = 0

    for key in read_keys(KEYS_FILE_PATH):
        api_key = key.strip()  # Raw API Key for Authorization
        working = workouts["workouts"][i]
        working["workoutType"] = "strength"
        working["key"] = base64.b64encode(api_key.encode()).decode('utf-8')  # Encoded only for JWT
        working["exercises"] = exercises

        # Send the workout data
        response = send_workout_data(working, api_key)  
        
        if response.status_code < 200 or response.status_code > 299:
            print(f"Failed to insert workout. Status code: {response.status_code}, message: {response.text}")
            break
        else:
            print(f"Successfully inserted workout: {working}")

        i += 1

if __name__ == "__main__":
    main()
