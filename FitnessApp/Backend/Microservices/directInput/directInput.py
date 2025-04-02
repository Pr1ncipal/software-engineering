import flask
from flask import Flask, request, jsonify
import psycopg2
import psycopg2.sql

app = Flask(__name__)

@app.route('/create_users', methods=['GET'])
def generate_users():
    """
    Generate a specified number of users with random data.
    
    Query Parameters:
        num_users: Number of users to generate (default 10)
    """
    num_users = int(request.args.get('num_users', 10))
    
    # Generate random user data
    users = []
    for i in range(num_users):
        user_id = i + 1
        username = f"user_{user_id}"