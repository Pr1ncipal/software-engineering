import sys
import os
from flask_cors import CORS
import psycopg2

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))

from flask import Flask, request, jsonify, session
import requests
from AI_resources.getData import get_data, get_userName, build_motivation_prompt

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
    user_id = data.get("user_id", 1)
    info = get_userName(user_id)
    print(info)
    if info:
        return jsonify(info)
    else:
        return jsonify({"error": "User not found"}), 404

def generate_llama_response(prompt):
    response = requests.post(OLLAMA_SERVER_URL_GEN, json={
        "model": "llama3:latest",
        "prompt": prompt,
        "stream": False
    })

    if response.status_code == 200:
        return response.json().get("response", "").strip()
    else:
        print("🛑 LLaMA generation error:", response.text)
        return "Couldn't generate a motivational message right now."
    
@app.route("/api/motivation", methods=["GET"])
def get_dynamic_motivation():
    user_id = request.args.get("user_id", type=int, default=1)

    prompt = build_motivation_prompt(user_id)
    if not prompt:
        return jsonify({"error": "Failed to generate prompt"}), 500

    try:
        message = generate_llama_response(prompt)
        return jsonify({
            "message": message
        })
    except Exception as e:
        print("❌ Error generating motivation:", e)
        return jsonify({"error": str(e)}), 500

  
@app.route("/api/streak-graph", methods=["GET"])
def streak_graph():
    user_id = request.args.get("user_id", type=int, default=1)
    conn = psycopg2.connect(
        dbname="sam_DB", user="postgres", password="password", host="localhost", port="5432"
    )
    cur = conn.cursor()

    # Get last 7 days of activity
    cur.execute("""
        SELECT date_performed::date, COUNT(*) 
        FROM workouts 
        WHERE user_id = %s AND date_performed >= CURRENT_DATE - interval '6 days'
        GROUP BY date_performed
    """, (user_id,))

    results = dict(cur.fetchall())
    cur.close()
    conn.close()

    from datetime import date, timedelta
    today = date.today()
    streaks = []

    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        streaks.append(results.get(d, 0))  # 0 if no workouts

    return jsonify({"streaks": streaks})

 

@app.route('/chat', methods=['POST'])
def chat():
    print("Chat endpoint called")
    data = request.json
    user_message = data.get("message", "")
    user_id = data.get("user_id", 1)  # fallback to 72, once login is working that gets user_id 
    
    user_info = get_data(user_id)    
    
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
    - Workout Date: {recent_workout.get('date', 'N/A')}
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

