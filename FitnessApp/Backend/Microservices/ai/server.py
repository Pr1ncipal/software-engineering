import sys
import os
from flask_cors import CORS

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))

from flask import Flask, request, jsonify, session
import requests
from AI_resources.getData import get_data, get_userName

app = Flask(__name__)
app.config["SESSION_TYPE"] = "filesystem"
CORS(app)

OLLAMA_SERVER_URL_GEN = "http://10.150.200.25:5000/api/generate"
OLLAMA_SERVER_URL_CHAT = "http://10.150.200.25:5000/api/chat"

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    response = requests.post(OLLAMA_SERVER_URL_GEN, json={
        "model": "llama3:latest",
        "prompt": data.get("prompt"),
        "stream": False
    })
    response_json = response.json()
    print("Ollama Response:", response_json)
    return jsonify(response_json)

# user_data = 72

@app.route('/user_name', methods=['POST'])
def get_username():
    data = request.json
    user_id = data.get("user_id", 72)
    info = get_userName(user_id)
    print(info)
    if info:
        return jsonify(info)
    else:
        return jsonify({"error": "User not found"}), 404


@app.route('/chat', methods=['POST'])
def chat():
    print("Chat endpoint called")
    data = request.json
    user_message = data.get("message", "")
    user_id = data.get("user_id", 72)  # fallback to 72, once login is working that gets user_id 
    
    user_info = get_data(user_id)    
    
    # Extract recent workout info (if available)
    recent = user_info.get("workout")
    workout_context = ""
    if recent:
        workout_context += f"""
    Recent Workout:
    - Name: {recent.get('name')}
    - Type: {recent.get('type')}
    - Start Time: {recent.get('start')}
    - End Time: {recent.get('end')}
    """

        if recent.get("exercises"):
            workout_context += "\n- Exercises Performed:"
            for ex in recent["exercises"]:
                workout_context += f"\n  • {ex['name']} | Sets: {ex['sets']}"
    
    print("User Info:", user_info)    

    # Construct a prompt with user context
    # Construct the user profile context
    context = f"""
    You are a concise and friendly personal fitness AI trainer.

    The following is background information about the user. Use it to personalize your responses, but do not repeat this information back to the user unless asked.

    User Profile:
    - Name: {user_info['user']['first_name']} {user_info['user']['last_name']}
    - Sex: {user_info['user']['sex']}
    - Age: {user_info['user']['age']} years
    - Weight: {user_info['stats']['weight']} lbs
    - Height: {user_info['stats']['height']} cm
    - Goal Weight: {user_info['stats']['goal']} lbs
    """

    # 🏋️ If there's a recent workout, add it
    recent_workout = user_info.get("recent_workout")
    if recent_workout:
        context += f"""

    Recent Workout Summary:
    - Name: {recent_workout['name']}
    - Type: {recent_workout['type']}
    - Start Time: {recent_workout['start']}
    - End Time: {recent_workout['end']}
    - Exercises:
    """
        for exercise in recent_workout.get("exercises", []):
            context += f"  • {exercise['name']}\n"
            for s in exercise['sets']:
                context += f"    - {s}\n"

    # 🧑‍🏫 Final system instruction
    context += """

    Your job is to answer the user's fitness-related questions clearly and briefly. Avoid long introductions or excessive motivation unless asked.

    Only respond to fitness-related topics like:
    - training advice
    - progress tracking
    - weight loss tips
    - personalized workout plans
    - motivational messages (if asked)

    If the user's message is vague or just a greeting, respond briefly and ask a simple follow-up question to guide the conversation.
    """





    ollama_request = {
        "model": "llama3:latest",
        "messages": [
            {"role": "system", "content": context},
            {"role": "user", "content": user_message}
        ],
        "stream": False
    }

    # 🧠 Debug: see exactly what you're sending to Ollama
    import json
    print("🧠 Sending to Ollama:\n", json.dumps(ollama_request, indent=2))

    try:
        ollama_response = requests.post(OLLAMA_SERVER_URL_CHAT, json=ollama_request)
        response_data = ollama_response.json()
        return jsonify({
            "response": response_data.get("message", {}).get("content", "No response from model.")
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# WORKING VERSION 3/23/25
# @app.route('/chat', methods=['POST'])
# def chat():
#     data = request.json
#     user_message = data.get("message", "")
#     if not user_message:
#         return jsonify({"error": "No message provided"}), 400
    
#     ollama_request = {
#         "model": "llama3:latest",  
#         "messages": [
#             {"role": "system", "content": "You are a personal trainer who helps users improve their fitness through customized workout routines, \
#                 exercise tips, and motivation. Only respond to fitness related questions, do not what so ever answer any other qustions the user \
#                 may as. (DO NOT PROVIDE ALTERNATIVE RESPONSES, IF IT IS NOT IN THE FITNESS SCOPE THEN DECLINE TO ANSWER PERIOD Keep responses concise and focused on fitness."},
#             {"role": "user", "content": user_message}
#         ],
#         "stream": False
#     }
   
#     try:
#         ollama_response = requests.post(OLLAMA_SERVER_URL_CHAT, json=ollama_request)
#         ollama_data = ollama_response.json()
#         return jsonify({
#             "response": ollama_data.get("message", {}).get("content", "Error: No response received")
#         })
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

@app.route('/clear_session', methods=['POST'])
def clear_session():
    session.pop("history", None)
    return jsonify({"message": "Session cleared successfully"})

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0")

#========================================================================================================
# WHISPER API SERVER WORKS IF U HAVE MONEY I THINK
#==========================================================================================================
# from flask import Flask, request, jsonify, session
# from flask_cors import CORS
# import requests
# import tempfile
# import os
# import openai
# import whisper
# # For local Whisper model (alternative to OpenAI API)
# import torch
# from io import BytesIO

# app = Flask(__name__)
# app.config["SESSION_TYPE"] = "filesystem"
# CORS(app)

# OLLAMA_SERVER_URL_GEN = "http://10.150.200.25:5000/api/generate"
# OLLAMA_SERVER_URL_CHAT = "http://10.150.200.25:5000/api/chat"

# # Choose ONE of these options:

# # Option 1: Use OpenAI's API for Whisper
# openai.api_key = ""  # Set your OpenAI API key here

# # Option 2: Use local Whisper model (offline)
# # Initialize the Whisper model
# WHISPER_MODEL_SIZE = "base"  # Options: "tiny", "base", "small", "medium", "large"
# whisper_model = whisper.load_model(WHISPER_MODEL_SIZE)

# @app.route('/generate', methods=['POST'])
# def generate():
#     data = request.json
#     response = requests.post(OLLAMA_SERVER_URL_GEN, json={
#         "model": "llama3:latest",
#         "prompt": data.get("prompt"),
#         "stream": False
#     })
#     response_json = response.json()
#     print("Ollama Response:", response_json)
#     return jsonify(response_json)

# @app.route('/chat', methods=['POST'])
# def chat():
#     data = request.json
#     user_message = data.get("message", "")
#     if not user_message:
#         return jsonify({"error": "No message provided"}), 400
    
#     ollama_request = {
#         "model": "llama3:latest",  
#         "messages": [
#             {"role": "system", "content": "You are a personal trainer who helps users improve their fitness through customized workout routines, \
#                 exercise tips, and motivation. Only respond to fitness related questions, do not what so ever answer any other qustions the user \
#                 may as. (DO NOT PROVIDE ALTERNATIVE RESPONSES, IF IT IS NOT IN THE FITNESS SCOPE THEN DECLINE TO ANSWER PERIOD Keep responses concise and focused on fitness."},
#             {"role": "user", "content": user_message}
#         ],
#         "stream": False
#     }
   
#     try:
#         ollama_response = requests.post(OLLAMA_SERVER_URL_CHAT, json=ollama_request)
#         ollama_data = ollama_response.json()
#         return jsonify({
#             "response": ollama_data.get("message", {}).get("content", "Error: No response received")
#         })
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# # @app.route('/transcribe', methods=['POST'])
# # def transcribe_audio():
# #     if 'audio' not in request.files:
# #         return jsonify({"error": "No audio file provided"}), 400
    
# #     audio_file = request.files['audio']
    
# #     # Save the uploaded audio to a temporary file
# #     with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_audio:
# #         audio_file.save(temp_audio.name)
# #         temp_audio_path = temp_audio.name
    
# #     try:
# #         # CHOOSE ONE of these transcription methods:
        
# #         # Option 1: Use OpenAI's API
# #         # with open(temp_audio_path, "rb") as audio_file:
# #         #     transcript = openai.Audio.transcribe("whisper-1", audio_file)
# #         #     text = transcript["text"]
        
# #         # Option 2: Use local Whisper model
# #         result = whisper_model.transcribe(temp_audio_path)
# #         text = result["text"]
        
# #         # Clean up the temporary file
# #         os.unlink(temp_audio_path)
        
# #         return jsonify({"text": text})
    
# #     except Exception as e:
# #         # Clean up the temporary file in case of error
# #         if os.path.exists(temp_audio_path):
# #             os.unlink(temp_audio_path)
        
# #         print(f"Transcription error: {str(e)}")
# #         return jsonify({"error": str(e)}), 500

# import tempfile
# import os
# import subprocess  # Needed for Option 2
# # from openai import OpenAI  # Needed for Option 3

# @app.route('/transcribe', methods=['POST'])
# def transcribe_audio():
#     if 'audio' not in request.files:
#         return jsonify({"error": "No audio file provided"}), 400
    
#     audio_file = request.files['audio']
    
#     # Create a temporary file with a guaranteed extension
#     temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.webm')
#     temp_file_path = temp_file.name
#     temp_file.close()  # Close the file so it can be written to
    
#     try:
#         # Save the audio to the temporary file
#         audio_file.save(temp_file_path)
        
#         # Check if file exists and has content
#         if not os.path.exists(temp_file_path) or os.path.getsize(temp_file_path) == 0:
#             return jsonify({"error": "Failed to save audio file"}), 500
        
#         # OPTION 1: Process with Whisper directly
#         # result = whisper_model.transcribe(temp_file_path)
#         # text = result["text"]
        
#         # OPTION 2: Convert audio format first using FFmpeg
#         # converted_path = temp_file_path + ".wav"
#         # subprocess.run(['ffmpeg', '-i', temp_file_path, converted_path])
#         # result = whisper_model.transcribe(converted_path)
#         # text = result["text"]
        
#         #api_key_sam = ""
#         #api_key_adrian = ""
        
#         # OPTION 3: Use OpenAI API v1.x
#         from openai import OpenAI
#         client = OpenAI(api_key = "")
#         with open(temp_file_path, "rb") as audio_file:
#             transcript = client.audio.transcriptions.create(
#                 model="whisper-1",
#                 file=audio_file
#             )
#         text = transcript.text
        
#         # Cleanup
#         # os.unlink(temp_file_path)
#         # if os.path.exists(converted_path):  # Only needed if using Option 2
#         #     os.unlink(converted_path)
        
#         return jsonify({"text": text})
    
#     except Exception as e:
#         # Cleanup in case of error
#         if os.path.exists(temp_file_path):
#             os.unlink(temp_file_path)
#         if os.path.exists(temp_file_path + ".wav"):  # Only needed if using Option 2
#             os.unlink(temp_file_path + ".wav")
        
#         print(f"Transcription error: {str(e)}")
#         import traceback
#         traceback.print_exc()  # This will print the full error stack
#         return jsonify({"error": str(e)}), 500

# @app.route('/clear_session', methods=['POST'])
# def clear_session():
#     session.pop("history", None)
#     return jsonify({"message": "Session cleared successfully"})

# if __name__ == '__main__':
#     app.run(debug=True, host="0.0.0.0")


# ==========================================================================================================
# WORKING CODE
# ==========================================================================================================
# from flask import Flask, request, jsonify, session
# from flask_cors import CORS
# import requests
# #from flask_session import Session

# app = Flask(__name__)
# app.config["SESSION_TYPE"] = "filesystem"  # Stores sessions in a temporary file
# #Session(app)

# # Allow only React frontend (if running on http://localhost:8081, change if needed)
# CORS(app)#, origins=["http://localhost:5000"])

# OLLAMA_SERVER_URL_GEN = "http://10.150.200.25:5000/api/generate"
# OLLAMA_SERVER_URL_CHAT = "http://10.150.200.25:5000/api/chat"

# chat_history = []  


# @app.route('/generate', methods=['POST'])
# def generate():
#     data = request.json
#     response = requests.post(OLLAMA_SERVER_URL_GEN, json={
#         "model": "llama3:latest",  # Change to the model you are using
#         "prompt": data.get("prompt"),
#         "stream": False
#     })

#     response_json = response.json()
#     print("Ollama Response:", response_json)  # Log response in Flask console
#     return jsonify(response_json)

# #======================================================================
# # NOT SAVED CHAT HISTORY
# #======================================================================
# @app.route('/chat', methods=['POST'])
# def chat():
#     data = request.json
#     user_message = data.get("message", "")

#     if not user_message:
#         return jsonify({"error": "No message provided"}), 400

#     ollama_request = {
#         "model": "llama3:latest",  
#         "messages": [
#         {"role": "system", "content": "You are a personal trainer who helps users improve their fitness through customized workout routines, \
#             exercise tips, and motivation. Only respond to fitness related questions, do not what so ever answer any other qustions the user \
#             may as. (DO NOT PROVIDE ALTERNATIVE RESPONSES, IF IT IS NOT IN THE FITNESS SCOPE THEN DECLINE TO ANSWER PERIOD Keep responses concise and focused on fitness."},
#         {"role": "user", "content": user_message}
#     ],
#         "stream": False
#     }
    
#     # Send request to Ollama server
#     print("Ollama Request:", ollama_request)
#     print("Ollama URL:", OLLAMA_SERVER_URL_CHAT)
    

#     try:
#         ollama_response = requests.post(OLLAMA_SERVER_URL_CHAT, json=ollama_request)
#         ollama_data = ollama_response.json()

#         return jsonify({
#             "response": ollama_data.get("message", {}).get("content", "Error: No response received")
#         })
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
    


# @app.route('/clear_session', methods=['POST'])
# def clear_session():
#     """Clears the chat history for the current session."""
#     session.pop("history", None)
#     return jsonify({"message": "Session cleared successfully"})



# if __name__ == '__main__':
#     app.run(debug=True, host="0.0.0.0")


# ==========================================================================================================
# TRASH
# =======================================================================================================
# # Helper function to get chat history from the session
# def get_chat_history():
#     if "history" not in session:
#         session["history"] = []  # Initialize history if it doesn't exist
#     return session["history"]

# @app.route('/chat', methods=['POST'])
# def chat():
#     # Get message from request
#     data = request.json
#     user_message = data.get("message", "")

#     if not user_message:
#         return jsonify({"error": "No message provided"}), 400

#     # Get chat history from session
#     chat_history = get_chat_history()

#     # Append the user's new message to history
#     chat_history.append({"role": "user", "content": user_message})

#     # Send request to Ollama server with the full chat history
#     ollama_request = {
#         "model": "llama3:latest",  # Use the appropriate model
#         "messages": chat_history,  # Include chat history here
#         "stream": False
#     }
    
#     print("Ollama Request:", ollama_request)
#     print("Ollama URL:", OLLAMA_SERVER_URL_CHAT)
#     print("Session History:", chat_history)

#     try:
#         ollama_response = requests.post(OLLAMA_SERVER_URL_CHAT, json=ollama_request)
#         ollama_data = ollama_response.json()

#         bot_message = ollama_data.get("response", "Error: No response received")

#         # Append the bot's response to the session history
#         chat_history.append({"role": "user", "content": bot_message})

#         # Save the updated history back to the session
#         session["history"] = chat_history

#         return jsonify({
#             "response": bot_message
#         })
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


#======================================================================
# MESSAGES SAVE IN FLASK SESSIONS
# GOING TO HAVE ADD USERS INFO 
#======================================================================
# @app.route('/chat', methods=['POST'])
# def chat():
#     if "history" not in session:
#         session["history"] = []  # Initialize session-based chat history

#     data = request.json
#     user_message = data.get("message", "")

#     if not user_message:
#         return jsonify({"error": "No message provided"}), 400

#     # Append user message to session history
#     session["history"].append({"role": "user", "content": user_message})

#     ollama_request = {
#         "model": "llama3:latest",  # Change model as needed
#         "messages": session["history"],
#         "stream": False
#     }
    
#     print("Ollama Request:", ollama_request)
#     print("Ollama URL:", OLLAMA_SERVER_URL_CHAT)
#     print("Session History:", session["history"])

#     try:
#         ollama_response = requests.post(OLLAMA_SERVER_URL_CHAT, json=ollama_request)
#         ollama_data = ollama_response.json()

#         assistant_response = ollama_data.get("message", {}).get("content", "Error: No response received")

#         # Append assistant response to session history
#         session["history"].append({"role": "personal-trainer", "content": assistant_response})

#         return jsonify({"response": assistant_response})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

#======================================================================
#EMULATES CHAT BUT USES api/generate endpoint
#======================================================================
# @app.route('/chat', methods=['POST'])
# def chat():
#     data = request.json
#     user_message = data.get("message", "")

#     if not user_message:
#         return jsonify({"error": "No message provided"}), 400

#     # Send request to Ollama server
#     ollama_request = {
#         "prompt": user_message,
#         "model": "llama3:latest",  # Change based on your model
#         "stream": False
#     }

#     try:
#         ollama_response = requests.post(OLLAMA_SERVER_URL_CHAT, json=ollama_request)
#         ollama_data = ollama_response.json()

#         return jsonify({
#             "response": ollama_data.get("response", "Error: No response received")
#         })
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

#======================================================================
#SAVED CHAT HISTORY in global var (VERY BAD)
#======================================================================
# @app.route('/chat', methods=['POST'])
# def chat():
#     global chat_history  # Use the global chat history

#     data = request.json
#     user_message = data.get("message", "")

#     if not user_message:
#         return jsonify({"error": "No message provided"}), 400

#     # Append user message to history
#     chat_history.append({"role": "user", "content": user_message})

#     ollama_request = {
#         "model": "llama3:latest",
#         "messages": chat_history,  # Send entire conversation history
#         "stream": False
#     }

#     try:
#         ollama_response = requests.post(OLLAMA_SERVER_URL_CHAT, json=ollama_request)
#         ollama_data = ollama_response.json()

#         assistant_response = ollama_data.get("message", {}).get("content", "Error: No response received")

#         # Append assistant response to history
#         chat_history.append({"role": "assistant", "content": assistant_response})

#         return jsonify({"response": assistant_response})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

