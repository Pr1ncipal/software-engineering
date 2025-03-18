from flask import Flask, jsonify
import psycopg2
import os
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS if accessing from frontend

# Database Connection
DATABASE_URL = os.getenv("DATABASE_URL")

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

# API Endpoint to Fetch Data
@app.route("/users", methods=["GET"])
def get_users():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM users;")  # Adjust table name
    users = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify(users)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
