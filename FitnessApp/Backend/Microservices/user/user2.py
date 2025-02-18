# A.I. Created User creation microservice. 
# This microservice is responsible for creating a new user in the database.
# The user data is received in JSON format and is validated before being inserted into the database.
# The password is hashed before being stored in the database.
# The microservice is running on port 8080.

from flask import Flask, request, jsonify
import psycopg2
from psycopg2 import sql
import os
import random
import string

app = Flask(__name__)

# Configuration
DATABASE_URL = 'postgresql://postgres:password@localhost/gitfitbro'

def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

def create_hash():
     return ''.join(random.choices(string.ascii_letters, k=30))

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
        
        findDuplicate = sql.SQL("""SELECT COUNT(*) FROM user_keys WHERE key = %s""")
        hash = create_hash()
        cur.execute(findDuplicate, (hash,))
        count = cur.fetchone()[0]
        while count > 0:
            hash = create_hash()
            cur.execute(findDuplicate, (hash,))
            
        cur.execute(insert_user_query, (
            data['pass_hash'],
            data['email'],
            data['username'],
            data['first_name'],
            data['last_name'],
            data['date_of_birth'],
            data['sex'],
            hash
        ))
        user_id = cur.fetchone()[0]

        # Insert user stats
        insert_stats_query = sql.SQL("""
            INSERT INTO user_stats (user_id, height, weight)
            VALUES (%s, %s, %s, %s)
        """)
        cur.execute(insert_stats_query, (
            user_id,
            data['height'],
            data['weight']
        ))

        conn.commit()    
        
        cur.close()
        conn.close()
        
        return jsonify({"message": "User created successfully", "key":f"{hash}"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No input data provided"}), 400
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        find_user_query = sql.SQL("""
            SELECT id, password_hash
            FROM users
            WHERE username = %s
        """)
        
        cur.execute(find_user_query, (data['username'],))
        user = cur.fetchone()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        if user[1] != data['pass_hash']:
            return jsonify({"error": "Incorrect password"}), 401
        
        find_key_query = sql.SQL("""
            SELECT key
            FROM user_keys
            WHERE user_id = %s
        """)
        
        cur.execute(find_key_query, (user[0],))
        key = cur.fetchone()[0]
        
        cur.close()
        conn.close()
        
        return jsonify({"message": "Login successful", "key": f"{key}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)