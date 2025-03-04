#A.I. generated code
from flask import Flask, request, jsonify
import requests
import psycopg2
import json
from heuristic import main
import jwt

app = Flask(__name__)

app.register_blueprint(main)

# Filler for the database URL (Saved passwords somewhere?)
DATABASE_URL = "postgresql://postgres:password@postgres:5432/gitfitbro"

def insert_into_db(data):
    try:
        connection = psycopg2.connect(DATABASE_URL)
        cursor = connection.cursor()
        
        # Assuming the JSON data has 'exercise_name' and 'calories_burned' fields
        insert_query = """INSERT INTO workouts (user_id, workout_type, notes, average_heart_rate, total_weight_lifted) VALUES (%d, %s, %s, %d, %d) returning id"""
        cursor.execute(insert_query, (data['user_id'], data['workoutType'], data['notes'], data['averageHeartRate'], data['totalWeightLifted']))
        
        wid = cursor.fetchone()[0]
        
        connection.commit()
        
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
                setType += exercise['setType'][i]
                weight += str(exercise['weight'][i])
                pd += str(exercise['percievedDifficulty'][i])
                
            reps += '}'
            setType += '}'
            weight += '}'
            pd += '}'
            
            insert_query = """INSERT INTO workout_exercises (workout_id, exercise_id, sets, notes) VALUES (%d, %d, (%s, %s, %s, %s, %d), %s)""" #Workout ID, exercise ID, (sets, reps, setType, weight, percieved Difficulty), notes
            cursor.execute(insert_query, (wid, exercise['exercise_id'], reps, setType, weight, pd, exercise['superset'], exercise['notes']))
            connection.commit()
        cursor.close()
        connection.close()
        return True
    except Exception as error:
        print(f"Error inserting into database: {error}")
        return False

def getConnection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

def closeConnection(conn):
    conn.close()

def verify_key(key, conn=None):
    if not conn:
        conn = getConnection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM user WHERE key = %s", (key,))
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
    token = request.get_data() #Assuming request cant be changed
    if token:
        try:
            payload = jwt.decode(token, options = {"verify_signature": False})
        
            key = verify_key(payload['key'])
        
            decoded = jwt.decode(token, payload['key'], algorithms=['HS256'])
            return decoded , key
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    else:
        return None

@app.route('/add_workout', methods=['POST'])
def add_exercise():
    if not request.is_json:
        data, key= get_data_jwt(request)
        if not data:
            return jsonify({"message": "Invalid Message"}), 400
        if not key:
            return jsonify({"message": "Invalid User"}), 400

        yes = insert_into_db(data)
        
        if yes:
            return jsonify({"message": "Workout Saved Successfully"}), 201
        else:
            return jsonify({"message": "Workout Save failed"}), 400
    else:
        return jsonify({"message": "Workout Save failed"}), 400
    
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

@app.route('/get_workout_stats', methods=['GET'])
def get_workout_stats():
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
    cur.execute("SELECT FROM workout_exercises WHERE workout_id = (SELECT id FROM workouts WHERE user_id = %s and workout_date > CURRENT_DATE - INTERVAL '%d days') AND exercise_id = %d", (key,timeframe, workout,))


if __name__ == '__main__':
    app.run(port=8080)