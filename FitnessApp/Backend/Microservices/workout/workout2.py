from flask import Flask, request, jsonify
import psycopg2
from psycopg2 import sql
import pscopg2.errors as pe
import workoutClass
import json
from heuristic import main
import jwt
import global_func
import logging
from workoutClass import Workout
import WorkoutExceptions
import base64
import logging


app = Flask(__name__)

app.register_blueprint(main)

def get_data_json(request):
    if request.is_json:
        return request.get_json()
    else:
        return None

def get_data_jwt(request):
    token = request.get_json() #Issue here Need logging so I can debug
    print(token)
    if token:
        try:
            payload = jwt.decode(token["token"], options = {"verify_signature": False})
        
            key = global_func.verify_key(base64.b64decode(payload['key']).decode('utf-8'))
            
            if not key:
                return "Invalid User, Key: " + base64.b64decode(payload['key']).decode(), None
        
            decoded = jwt.decode(token['token'], base64.b64decode(payload['key']).decode(), algorithms=['HS256'])
            return decoded , key
        except jwt.ExpiredSignatureError:
            return "Expired Signature", None
        except jwt.InvalidTokenError: #Need to throw errors if they occur
            #Need to add logging
            return "Invalid Token", None
    else:
        return None, None

@app.route('/add_workout', methods=['POST'])
def add_workout():
    try:
        data, key = get_data_jwt(request)
        
        if not data and not key:
            return jsonify({"message": "No input data provided"}), 400
        elif not key:
            return jsonify({"message": "User not authenticated"}), 401
        elif not data:
            return jsonify({"message": "No input data provided"}), 400
        
        required_fields = ['workoutType', 'averageHeartRate', 'exercises']
        for field in required_fields:
            if field not in data.keys():
                return jsonify({"error": f"Missing required field: {field}"}), 400

        workout = Workout(workout_type = data['workoutType'], notes = data['notes'], average_heart_rate = data['averageHeartRate'], exercises = data['exercises'])
        workout.insertWorkout()
        return jsonify({"message": "Workout added successfully"}), 201
    
    except Exception as e:
        return jsonify({"message": e}), 400

@app.route('/get_workouts', methods=['GET'])
def get_workouts():
    try:
        key = global_func.verify_key(base64.b64decode(request.args.get('key'))) #Assuming the key is passed as a query parameter, May need to edit
        page = request.args.get('page')
        
        if not page or page < 0:
            page = 0

        if not key:
            return jsonify({"message": "User not authenticated"}), 401
        
        workouts = workoutClass.Workout(user_id=key)
        exercises, nextPage = workouts.getWorkouts(page)
        return jsonify({"exercises":exercises, "page": nextPage}), 200
    
    except Exception as e:
        return jsonify({"ERROR": e}), 400
    
@app.route('/get_workout_stats', methods=['GET'])
def get_workout_stats():
    try:
        key = global_func.verify_key(base64.b64decode(request.args.get('key'))) #Assuming the key is passed as a query parameter, May need to edit
        exercise = request.args.get('workout') #Will be the exercise ID
        timeframe = request.args.get('timeframe')
        
        if not exercise:
            return jsonify({"message": "Invalid Workout"}), 400
        if not key:
            return jsonify({"message": "User not authenticated"}), 401
        if not timeframe:
            timeframe = 30
        
        workout = workoutClass.Workout(user_id=key)
        stats = workout.getWorkoutStats(exercise, timeframe)
        return jsonify({"exercises":stats}), 200
    
    except pe.DataError as e:
        return jsonify({"ERROR": e}), 400
    
    except Exception as e:
        return jsonify({"ERROR": e}), 400
    

if __name__ == '__main__':
    app.run(port=8080, host='0.0.0.0')