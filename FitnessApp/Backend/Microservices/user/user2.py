# A.I. Created User creation microservice. 
# This microservice is responsible for creating a new user in the database.
# The user data is received in JSON format and is validated before being inserted into the database.
# The password is hashed before being stored in the database.
# The microservice is running on port 8080.

from flask import Flask, request, jsonify
import psycopg2
from psycopg2 import sql
import os

app = Flask(__name__)

# Configuration
DATABASE_URL = 'postgresql://postgres:password@localhost/gitfitbro'

def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

@app.route('/create_user', methods=['POST'])
def create_user():
    
    #Need data validation
    data = request.get_json()

    if not data:
        return jsonify({"error": "No input data provided"}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Insert user data
        insert_user_query = sql.SQL("""
            INSERT INTO users (password_hash, email, username, fname, lname, dob, sex)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """)
        cur.execute(insert_user_query, (
            data['pass_hash'],
            data['email'],
            data['username'],
            data['first_name'],
            data['last_name'],
            data['date_of_birth'],
            data['sex']
        ))
        user_id = cur.fetchone()[0]

        # Insert user stats
        insert_stats_query = sql.SQL("""
            INSERT INTO user_stats (user_id, height, weight, body_fat)
            VALUES (%s, %s, %s, %s)
        """)
        cur.execute(insert_stats_query, (
            user_id,
            data['height'],
            data['weight'],
            data['body_fat']
        ))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "User created successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)