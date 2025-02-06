# A.I. Created User creation microservice. 
# This microservice is responsible for creating a new user in the database.
# The user data is received in JSON format and is validated before being inserted into the database.
# The password is hashed before being stored in the database.
# The microservice is running on port 8080.

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
import os

app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://username:password@localhost/dbname'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    password_hash = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    sex = db.Column(db.String(10), nullable=False)
    height = db.Column(db.Float, nullable=True)

    def __init__(self, password, email, username, first_name, last_name, date_of_birth, sex, height=None):
        self.password_hash = generate_password_hash(password)
        self.email = email
        self.username = username
        self.first_name = first_name
        self.last_name = last_name
        self.date_of_birth = date_of_birth
        self.sex = sex
        self.height = height

@app.route('/create_user', methods=['POST'])
def create_user():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No input data provided"}), 400

    try:
        user = User(
            password=data['password'],
            email=data['email'],
            username=data['username'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            date_of_birth=data['date_of_birth'],
            sex=data['sex'],
            height=data.get('height')
        )
        db.session.add(user)
        db.session.commit()
        return jsonify({"message": "User created successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    db.create_all()
    app.run(host='0.0.0.0', port=8080)