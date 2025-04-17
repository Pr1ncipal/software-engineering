import sys
import os
from flask_cors import CORS
import psycopg2
import logging
import time
from datetime import datetime
import json
import base64
from global_func import verify_key
import traceback  # Add this import at the top

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("ai_server.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("ai_service")

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))

from flask import Flask, request, jsonify, session
import requests
from getData import get_data, get_userName, build_motivation_prompt, get_user_id_by_username, get_actual_and_predicted_weights, format_weight_chart, predict_progress

app = Flask(__name__)
app.config["SESSION_TYPE"] = "filesystem"
CORS(app, resources={r"/*": {"origins": "*"}})

OLLAMA_SERVER_URL_GEN = "http://10.150.200.25:5000/api/generate"
OLLAMA_SERVER_URL_CHAT = "http://10.150.200.25:5000/api/chat"

@app.route('/generate', methods=['POST'])
def generate():
    start_time = time.time()
    request_id = datetime.now().strftime("%Y%m%d%H%M%S")
    logger.info(f"Request [{request_id}]: Generate endpoint called")
    
    data = request.json
    try:
        response = requests.post(OLLAMA_SERVER_URL_GEN, json={
            "model": "llama3:latest",
            "prompt": data.get("prompt"),
            "stream": False
        })
        response_json = response.json()
        processing_time = time.time() - start_time
        logger.info(f"Request [{request_id}]: Generated response in {processing_time:.2f}s")
        return jsonify(response_json)
    except Exception as e:
        logger.error(f"Request [{request_id}]: Error in generate endpoint - {str(e)}")
        logger.error(f"Request [{request_id}]: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/get_user_id')
def get_user_id():
    start_time = time.time()
    request_id = datetime.now().strftime("%Y%m%d%H%M%S")
    
    username = request.args.get('username')
    logger.info(f"Request [{request_id}]: Get user ID for username: {username}")
    
    if not username:
        logger.warning(f"Request [{request_id}]: Missing username parameter")
        return jsonify({"error": "Missing username parameter"}), 400

    try:
        user_id = get_user_id_by_username(username)
        if user_id is not None:
            processing_time = time.time() - start_time
            logger.info(f"Request [{request_id}]: Found user ID {user_id} in {processing_time:.2f}s")
            return jsonify({"id": user_id})
        else:
            logger.warning(f"Request [{request_id}]: User not found for username: {username}")
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        logger.error(f"Request [{request_id}]: Error getting user ID - {str(e)}")
        logger.error(f"Request [{request_id}]: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500

@app.route('/user_name', methods=['POST'])
def get_username():
    start_time = time.time()
    request_id = datetime.now().strftime("%Y%m%d%H%M%S")
    logger.info(f"Request [{request_id}]: User name endpoint called")
    
    data = request.json
    user_id = data.get("user_id", 1)
    logger.info(f"Request [{request_id}]: Getting username for user_id: {user_id}")
    
    try:
        info = get_userName(user_id)
        logger.debug(f"Request [{request_id}]: User info retrieved: {info}")
        
        processing_time = time.time() - start_time
        if info:
            logger.info(f"Request [{request_id}]: Username retrieved in {processing_time:.2f}s")
            return jsonify(info)
        else:
            logger.warning(f"Request [{request_id}]: User not found for ID: {user_id}")
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        logger.error(f"Request [{request_id}]: Error retrieving username - {str(e)}")
        logger.error(f"Request [{request_id}]: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500

def generate_llama_response(prompt):
    start_time = time.time()
    request_id = datetime.now().strftime("%Y%m%d%H%M%S")
    logger.info(f"Request [{request_id}]: Generating Llama response")
    logger.debug(f"Request [{request_id}]: Prompt: {prompt[:100]}...")  # Log first 100 chars of prompt
    
    try:
        response = requests.post(OLLAMA_SERVER_URL_GEN, json={
            "model": "llama3:latest",
            "prompt": prompt,
            "stream": False
        })
        
        processing_time = time.time() - start_time
        if response.status_code == 200:
            result = response.json().get("response", "").strip()
            logger.info(f"Request [{request_id}]: Generated response in {processing_time:.2f}s")
            logger.debug(f"Request [{request_id}]: Response preview: {result[:100]}...")  # Log first 100 chars
            return result
        else:
            logger.error(f"Request [{request_id}]: LLaMA generation error - Status {response.status_code}, Response: {response.text}")
            return "Couldn't generate a motivational message right now."
    except Exception as e:
        logger.error(f"Request [{request_id}]: Exception during LLaMA generation - {str(e)}")
        logger.error(f"Request [{request_id}]: {traceback.format_exc()}")
        return "Couldn't generate a motivational message right now."
    
@app.route("/api/motivation", methods=["GET"])
def get_dynamic_motivation():
    start_time = time.time()
    request_id = datetime.now().strftime("%Y%m%d%H%M%S")
    user_id = request.args.get("user_id", type=int, default=1)
    
    logger.info(f"Request [{request_id}]: Motivation endpoint called for user_id: {user_id}")

    try:
        prompt = build_motivation_prompt(user_id)
        if not prompt:
            logger.warning(f"Request [{request_id}]: Failed to generate prompt for user_id: {user_id}")
            return jsonify({"error": "Failed to generate prompt"}), 500
        
        logger.debug(f"Request [{request_id}]: Generated motivation prompt: {prompt[:100]}...")
        message = generate_llama_response(prompt)
        
        processing_time = time.time() - start_time
        logger.info(f"Request [{request_id}]: Generated motivation in {processing_time:.2f}s")
        return jsonify({"message": message})
    except Exception as e:
        logger.error(f"Request [{request_id}]: Error generating motivation - {str(e)}")
        logger.error(f"Request [{request_id}]: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


from getData import get_user_streak

@app.route("/api/streak-graph", methods=["GET"])
def streak_graph():
    start_time = time.time()
    request_id = datetime.now().strftime("%Y%m%d%H%M%S")
    user_id = request.args.get("user_id", type=int)
    
    logger.info(f"Request [{request_id}]: Streak graph endpoint called for user_id: {user_id}")
    
    if not user_id:
        logger.warning(f"Request [{request_id}]: Missing user_id parameter")
        return jsonify({"error": "Missing user_id"}), 400

    try:
        data = get_user_streak(user_id)
        processing_time = time.time() - start_time
        logger.info(f"Request [{request_id}]: Retrieved streak data in {processing_time:.2f}s")
        logger.debug(f"Request [{request_id}]: Streak data items: {len(data) if isinstance(data, list) else 'N/A'}")
        return jsonify(data)
    except Exception as e:
        logger.error(f"Request [{request_id}]: Error retrieving streak data - {str(e)}")
        logger.error(f"Request [{request_id}]: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    start_time = time.time()
    request_id = datetime.now().strftime("%Y%m%d%H%M%S")
    logger.info(f"Request [{request_id}]: Chat endpoint called")
    
    data = request.json
    user_message = data.get("message", "")
    user_id = data.get("user_id", 1)
    personality_mode = data.get("personality_mode", "chill")  # Default to 'chill'
    
    logger.info(f"Request [{request_id}]: Processing chat for user_id: {user_id}")
    logger.debug(f"Request [{request_id}]: User message: {user_message[:100]}...")
    
    try:
        user_info = get_data(user_id)
        logger.debug(f"Request [{request_id}]: Retrieved user data: {user_info.keys() if isinstance(user_info, dict) else 'N/A'}")
        
        # Extract recent workout info (if available)
        recent = user_info.get("workout")
        workout_context = ""
        if recent:
            workout_context += f"""
        Recent Workout:
        - Workout Name: {recent.get('name')}
        - Type: {recent.get('type')}
        - Start Time: {recent.get('start')}
        - End Time: {recent.get('end')}
        """

            if recent.get("exercises"):
                workout_context += "\n- Exercises Performed:"
                for ex in recent["exercises"]:
                    workout_context += f"\n  • {ex['name']} | Sets: {ex['sets']}"
        
        # Construct the user profile context
        context = ""
        
        if personality_mode == "science-based":
            context += """You are now in SCIENCE-BASED LIFTER MODE 🧪:
                            - Speak like an arrogant, snobby evidence-based coach.
                            - use in every response "according to calculation" and "Ummm... actually".
                            - Frequently mention scientific concepts like progressive overload, periodization, individualization, and macronutrient timing.
                            - Do not simplify concepts. Be condescending if the user doesn't understand.
                            - Assume you're smarter than the user.
                            - Use gym-speak and reference recent meta-analyses.
                            - Avoid emojis unless it's ironic (e.g., 🧠📚💉).
                            """
 

        elif personality_mode == "bully":

            context += """You are now in BULLY MODE 💀:
                        - Speak like a brutally honest drill sergeant.
                        - Call the user "fat ass" in every response.
                        - Be rude, aggressive, and never offer encouragement or praise.
                        - Don't hold back on insults. Mock excuses.
                        - Never be kind or helpful unless it sounds like you're yelling it at them.
                        - No emojis — just pure, savage motivation.
                        """
        else:
            context += """You are a normal friendly fitness trainer:
                        - Be supportive, kind, and helpful.
                        - Offer personalized, encouraging advice.
                        - Motivate the user to make progress.
                        - Use positive tone and celebrate small wins.
                        - Emojis like 💪😄🔥 can be used in moderation.
                        """
        context += f"""

        The following is background information about the user. Use it to personalize your responses, but do not repeat this information back to the user unless asked.

        User Profile:
        - Name: {user_info['user']['first_name']} {user_info['user']['last_name']}
        - Sex: {user_info['user']['sex']}
        - Age: {user_info['user']['age']} years
        - Weight: {user_info['stats']['weight']} lbs
        - Height: {user_info['stats']['height']} cm
        - Goal Weight: {user_info['stats']['goal']} lbs
        """

        # If there's a recent workout, add it
        recent_workout = user_info.get("recent_workout")
        if recent_workout:
            context += f"""

        Recent Workout Summary:
        - Name: {recent_workout['name']}
        - Type: {recent_workout['type']}
        - Workout Date: {recent_workout.get('date', 'N/A')}
        - Exercises:
        """
            for exercise in recent_workout.get("exercises", []):
                context += f"  • {exercise['name']}\n"
                for s in exercise['sets']:
                    context += f"    - {s}\n"

        # Final system instruction
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

        logger.debug(f"Request [{request_id}]: Chat context generated successfully")

        ollama_request = {
            "model": "llama3:latest",
            "messages": [
                {"role": "system", "content": context},
                {"role": "user", "content": user_message}
            ],
            "stream": False
        }

        logger.debug(f"Request [{request_id}]: Sending request to Ollama chat endpoint")
        ollama_response = requests.post(OLLAMA_SERVER_URL_CHAT, json=ollama_request)
        response_data = ollama_response.json()
        
        logger.info(response_data)
        
        ai_response = response_data.get("message", {}).get("content", "No response from model.")
        processing_time = time.time() - start_time
        logger.info(f"Request [{request_id}]: Chat response generated in {processing_time:.2f}s")
        logger.debug(f"Request [{request_id}]: AI response preview: {ai_response[:100]}...")
        
        return jsonify({"response": ai_response})
    except Exception as e:
        logger.error(f"Request [{request_id}]: Error in chat endpoint - {str(e)}")
        logger.error(f"Request [{request_id}]: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500

@app.route('/clear_session', methods=['POST'])
def clear_session():
    request_id = datetime.now().strftime("%Y%m%d%H%M%S")
    logger.info(f"Request [{request_id}]: Clearing session")
    
    try:
        session.pop("history", None)
        logger.info(f"Request [{request_id}]: Session cleared successfully")
        return jsonify({"message": "Session cleared successfully"})
    except Exception as e:
        logger.error(f"Request [{request_id}]: Error clearing session - {str(e)}")
        logger.error(f"Request [{request_id}]: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/ai/weight-chart', methods=['GET'])
def get_weight_chart_data():
    request_id = datetime.now().strftime("%Y%m%d%H%M%S")
    logger.info(f"Request [{request_id}]: Weight chart endpoint called")
    
    try:
        logger.info(f"Request [{request_id}]: Processing weight chart request")
        key = request.headers.get('Authorization')
        
        if not key or not key.startswith('ApiKey '):
            logger.warning(f"Request [{request_id}]: Missing or invalid Authorization header")
            return jsonify({"error": "Invalid or missing authorization"}), 401
                
        key = key.split(' ')[1]
        
        try:
            key = base64.b64decode(key).decode()
        except Exception as e:
            logger.error(f"Request [{request_id}]: Error decoding API key - {str(e)}")
            logger.error(f"Request [{request_id}]: {traceback.format_exc()}")
            return jsonify({"error": "Invalid API key format"}), 401
        
        # This section needs implementation - verify should extract user_id from key
        # For now, using a placeholder
        try:
            # Implement your verification logic here
            user_id = verify_key(key)  # Placeholder - replace with actual verification
            logger.debug(f"Request [{request_id}]: Authorized for user_id: {user_id}")
        except Exception as e:
            logger.error(f"Request [{request_id}]: Error verifying API key - {str(e)}")
            logger.error(f"Request [{request_id}]: {traceback.format_exc()}")
            return jsonify({"error": "Error verifying authorization"}), 401
        
        actual, predicted = get_actual_and_predicted_weights(user_id)
        chart_data = format_weight_chart(actual, predicted)
        logger.debug(f"Request [{request_id}]: Chart data generated successfully")
        return jsonify(chart_data)
    except Exception as e:
        logger.error(f"Request [{request_id}]: Unexpected error in weight chart endpoint: {str(e)}")
        logger.error(f"Request [{request_id}]: {traceback.format_exc()}")
        return jsonify({"error": "Internal server error"}), 500
    
@app.route("/api/ai/progress-prediction", methods=["GET"])
def progress_prediction():
    request_id = datetime.now().strftime("%Y%m%d%H%M%S")
    logger.info(f"Request [{request_id}]: Progress prediction endpoint called")
    
    try:
        key = request.headers.get('Authorization')
        if not key or not key.startswith('ApiKey '):
            logger.warning(f"Request {request_id}: Missing or invalid Authorization header")
            return jsonify({"error": "Invalid or missing authorization"}), 401
                
        key = key.split(' ')[1]
        
        key = base64.b64decode(key).decode()
        
        user_id = verify_key(key)
        if not user_id:
            logger.warning(f"Request [{request_id}]: Missing user_id parameter")
            return jsonify({"error": "Missing user_id"}), 400

        message = predict_progress(user_id)
        logger.info(f"Request [{request_id}]: Successfully generated prediction for user_id {user_id}")
        return jsonify({"prediction": message})
    except Exception as e:
        logger.error(f"Request [{request_id}]: Error in progress prediction - {str(e)}")
        logger.error(f"Request [{request_id}]: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting Flask server on 0.0.0.0")
    app.run(debug=True, host="0.0.0.0")

