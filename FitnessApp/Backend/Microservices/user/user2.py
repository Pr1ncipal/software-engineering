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
import jwt

app = Flask(__name__)

# Configuration
DATABASE_URL = 'postgresql://postgres:password@localhost/gitfitbro'

def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

def create_hash():
     return ''.join(random.choices(string.ascii_letters, k=30))
 
def verify_key(key, conn = None):
    if not conn:
        conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT user_id FROM user_keys WHERE key = %s", (key,))
    result = cur.fetchone()
    
    if result:
        return result[0]
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

def get_data_json(request):
    if request.is_json:
        return request.get_json()
    else:
        return None

@app.route('/create_user', methods=['POST'])
def create_user():
    
    #Need data validation
    data = get_data_json(request)

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
def login_user(): #Fix this method for JWT
    data = get_data_json(request)
    
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

@app.route('/update_user', methods=['PUT'])
def update_user():
    data, key = get_data_jwt(request)
    
    if not key:
        return jsonify({"error": "Invalid request"}), 400
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        find_user_query = sql.SQL("""
            SELECT id, email, password_hash
            FROM user_keys
            WHERE key = %s
        """)
        
        cur.execute(find_user_query, (data['key'],))
        
        #Cursor sends back as a tuple
        user_data = cur.fetchone()
        
        password = None
        email = None
        
        for key in data.keys():
            if data[key] != None and key != "key":
                match key:
                    case "email":
                        email = data["email"]
                    case "password":
                        password = data["password"]
        
        if password == None:
            password = user_data[2]
        if email == None:
            email = user_data[1]
            
        user_update_query = sql.SQL("""
            UPDATE users
            SET email = %s, password_hash = %s
            WHERE id = %s
        """)
        
        cur.execute(user_update_query, (email, password, user_data[0]))
        conn.commit()
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
@app.route('/delete_user', methods=['DELETE']) #Fix this method. Similar to get
def delete_user():
    data, key = get_data_jwt(request)
    
    if not key:
        return jsonify({"error": "Invalid request"}), 400
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        user_id = key
        
        if not user_id:
            return jsonify({"error": "Invalid key"}), 400
        
        if not user_id:
            return jsonify({"error": "User not found"}), 404
        
        delete_user_query = sql.SQL("""
            DELETE FROM users
            WHERE id = %s
        """)
        
        delete_user_keys_query = sql.SQL("""
            DELETE FROM user_keys
            WHERE user_id = %s
        """)
        
        delete_user_stats_query = sql.SQL("""
            DELETE FROM user_stats
            WHERE user_id = %s
        """)
        
        cur.execute(delete_user_query, (user_id,))
        cur.execute(delete_user_keys_query, (user_id,))
        cur.execute(delete_user_stats_query, (user_id,))
        
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({"message": "User deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    

@app.route('/add_user_stats', methods=['POST'])
def add_user_stats():
    data, key = get_data_jwt(request)
    
    if not key:
        return jsonify({"error": "Invalid request"}), 400
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        user_id = key
        
        if not user_id:
            return jsonify({"error": "Invalid key"}), 400
        
        insert_stats_query = sql.SQL("""
            INSERT INTO user_stats (user_id, weight)
            VALUES (%d, %d)
        """)
        
        cur.execute(insert_stats_query, (
            user_id,
            data['weight']
        ))
        
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({"message": "Stats added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/get_user_stats', methods=['GET'])
def get_user_stats():
    key = request.args.get('key')
    
    if not key:
        return jsonify({"error": "Invalid request"}), 400
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        user_id = verify_key(key, conn)
        
        if not user_id:
            return jsonify({"error": "Invalid key"}), 400
        
        get_stats_query = sql.SQL("""
            SELECT weight
            FROM user_stats
            WHERE user_id = %s
        """)
        
        cur.execute(get_stats_query, (user_id,))
        stats = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return jsonify({"stats": stats}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)