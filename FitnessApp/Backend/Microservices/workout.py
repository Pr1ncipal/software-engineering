#A.I. generated code
from flask import Flask, request, jsonify
import requests
import psycopg2
import json

app = Flask(__name__)

# Filler for the database URL
DATABASE_URL = "postgresql://username:password@hostname:port/dbname"

def insert_into_db(data):
    try:
        connection = psycopg2.connect(DATABASE_URL)
        cursor = connection.cursor()
        
        # Assuming the JSON data has 'exercise_name' and 'calories_burned' fields
        insert_query = """INSERT INTO exercises (exercise_name, calories_burned) VALUES (%s, %s)"""
        cursor.execute(insert_query, (data['exercise_name'], data['calories_burned']))
        
        connection.commit()
        cursor.close()
        connection.close()
    except Exception as error:
        print(f"Error inserting into database: {error}")

@app.route('/add_exercise', methods=['POST'])
def add_exercise():
    if request.is_json:
        data = request.get_json()
        insert_into_db(data)
        return jsonify({"message": "Exercise added successfully"}), 201
    else:
        return jsonify({"message": "Request must be JSON"}), 400

if __name__ == '__main__':
    app.run(port=8080)