#A.I. generated code
from flask import Flask, request, jsonify
import requests
import psycopg2
import json

app = Flask(__name__)

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
    except Exception as error:
        print(f"Error inserting into database: {error}")

@app.route('/add_workout', methods=['POST'])
def add_exercise():
    if request.is_json:
        data = request.get_json()
        insert_into_db(data)
        return jsonify({"message": "Workout Saved Successfully"}), 201
    else:
        return jsonify({"message": "Workout Save failed"}), 400

if __name__ == '__main__':
    app.run(port=8080)