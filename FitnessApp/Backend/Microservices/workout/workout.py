#A.I. generated code
from flask import Flask, request, jsonify
import requests
import psycopg2
from psycopg2 import sql
import json
from heuristic import main
import jwt
import global_func
import logging
from workoutClass import Workout
import WorkoutExceptions
import base64
import logging

logging.basicConfig(filename='workout.log', level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)

app.register_blueprint(main)

def insert_into_db(data, user_id, conn = None):
    try:
        if not conn:
            connection = global_func.getConnection()
        else:
            connection = conn
        cursor = connection.cursor()
        
        # Assuming the JSON data has 'exercise_name' and 'calories_burned' fields
        insert_query = sql.SQL("""INSERT INTO workouts (user_id, workout_type, notes, average_heart_rate) VALUES (%s, %s, %s, %s) returning id""")
        
        # Need to determine total_weight_lifted or delete it
        
        #logger.debug(f"Data: {insert_query}", user_id, data['workoutType'], data['notes'], data['averageHeartRate'])
        
        cursor.execute(insert_query, (str(user_id), data['workoutType'], data['notes'], str(data['averageHeartRate'])))
        
        wid = cursor.fetchone()[0]
        
        connection.commit() #Gets past here
        
        reps = '{'
        setType = '{'
        weight = '{'
        pd = '{'
        for exercise in data['exercises']:
            
            for i in range(len(exercise['reps'])): #Need to fix logic
                if i > 0:
                    reps += ', '
                    setType += ', '
                    weight += ', '
                    pd += ', '
                reps += str(exercise['reps'][i]) 
                setType += f"\'{exercise['setType'][i]}\'"
                weight += str(exercise['weight'][i])
                pd += str(exercise['percievedDifficulty'][i])
                
            reps += '}'
            setType += '}'
            weight += '}'
            pd += '}'
            
            insert_query = sql.SQL("""INSERT INTO workout_exercises (workout_id, exercise_id, sets, notes) VALUES (%s, %s, ROW(%s, %s, %s, %s, %s), %s)""") #Workout ID, exercise ID, (sets, reps, setType, weight, percieved Difficulty), notes
            
            #logger.debug(f"Data: {insert_query}", args = (str(wid), str(exercise['exerciseID']), reps, setType, weight, pd, exercise['notes']))
            
            cursor.execute(insert_query, (wid, exercise['exerciseID'], exercise['reps'], exercise['weight'], exercise['percievedDifficulty'], exercise['superset'], exercise['setType'], exercise['notes'])) #going to need to check for superset
            connection.commit()
        cursor.close()
        connection.close()
        return True
    except Exception as error:
        logger.critical(f"Error inserting into database: {error}")
        return False

def getConnection():
    conn = psycopg2.connect(global_func.DATABASE_URL)
    return conn

def closeConnection(conn):
    conn.close()

def verify_key(key, conn=None):
    if not conn:
        conn = getConnection()
    cur = conn.cursor()
    get_id_query = sql.SQL("SELECT id FROM users WHERE key = %s")
    cur.execute(get_id_query, (key,))
    result = cur.fetchone()
    
    if result:
        return result[0]
    else:
        return None

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
        
            key = verify_key(base64.b64decode(payload['key']).decode('utf-8'))
            
            if not key:
                return "Invalid User, Key: " + base64.b64decode(payload['key']).decode(), None
        
            decoded = jwt.decode(token['token'], base64.b64decode(payload['key']).decode(), algorithms=['HS256'])
            return decoded , key
        except jwt.ExpiredSignatureError:
            return "Expired Signiture", None
        except jwt.InvalidTokenError: #Need to throw errors if they occur
            #Need to add logging
            return "Invalid Token", None
    else:
        return None, None

@app.route('/add_workout', methods=['POST'])
def add_exercise():
    try:
        if request.is_json:
            data, key= get_data_jwt(request)
            if not key:
                return jsonify({"message": data}), 400
            elif not data and not key:
                return jsonify({"message": "No input data provided"}), 400
        
            #workout = Workout(workout_type=data['workoutType'], notes=data['notes'],
            #                           average_heart_rate=data['averageHeartRate'], total_weight_lifted=data['totalWeightLifted'], 
            #                           exercises=data['exercises'], user_id=key)
        
            #workout.insertWorkout() # need to figure out how to call this and assure insert

            yes = insert_into_db(data, key)
        
            if yes:
                return jsonify({"message": "Workout Saved Successfully"}), 201
            else:
                return jsonify({"message": "Workout Save failed 2"}), 400 #Attempted to insert into database but failed
        else:
            return jsonify({"message": "Workout Save failed 1"}), 400
    
    except Exception as error:
        print(f"Error inserting into database: {error}")
        return jsonify({"message": "Workout Save failed 3", "Error": {error}}), 400
    
@app.route('/get_workouts', methods=['GET'])
def get_workouts():
    key = verify_key(request.args.get('key')) #Assuming the key is passed as a query parameter, May need to edit
    if not key:
        return jsonify({"message": "Invalid User"}), 400

    conn = getConnection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM workouts WHERE (user_id = %s OR user_id = NULL)", (key,))
    result = cur.fetchall()
    conn.close()
    
    return jsonify(result)

@app.route('/get_exercises', methods=['GET']) #Will require multiple calls to get all exercises (Limit 50)
def get_exercises():
    key = verify_key(base64.b64decode(request.args.get('key'))) #Assuming the key is passed as a query parameter, May need to edit
    logger.debug(f"Key: {request.args.get('key')}")
    page = request.args.get('page')
    if not page or page < 0:
        page = 0
        
    exercises = [] #Will hold all exercises to be sent
    temp = {} #will hold the current exercise
    
    if not key:
        return jsonify({"message": "Invalid User"}), 400

    conn = getConnection()
    cur = conn.cursor()
    cur.execute("SELECT id, name, equipment, description FROM exercises WHERE (user_id = %s OR user_id = NULL) LIMIT 50 OFFSET %d", (key, page*50))
    for ex in cur.fetchall():
        temp['id'] = ex[0]
        temp['name'] = ex[1]
        temp['equipment'] = ex[2]
        temp['description'] = ex[3]
        exercises.append(temp)
    conn.close()
    cur.close()
    final = {"exercises": exercises, "page": page, "final": False}
    if len(exercises) < 50:
        final['final'] = True
    return jsonify(final)

@app.route('/get_workout_stats', methods=['GET'])
def get_workout_stats(): #Later implement in class
    stats = {}
    key = verify_key(request.args.get('key'))
    if not key:
        return jsonify({"message": "Invalid User"}), 400
    
    workout = request.args.get('workout')
    if not workout:
        return jsonify({"message": "Invalid Workout"}), 400
    
    timeframe = request.args.get('timeframe')
    if not timeframe:
        timeframe = 30
    
    conn = getConnection()
    cur = conn.cursor()
    
    #Fix this query
    cur.execute("SELECT FROM workout_exercises WHERE workout_id = (SELECT id FROM workouts WHERE user_id = %s and workout_date > CURRENT_DATE - INTERVAL '%d days') AND exercise_id = %d ORDER BY ", (key,timeframe, workout,))


if __name__ == '__main__':
    app.run(host = '0.0.0.0', port=8080, debug=True)