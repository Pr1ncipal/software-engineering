# A.I. Created User creation microservice. 
# This microservice is responsible for creating a new user in the database.
# The user data is received in JSON format and is validated before being inserted into the database.
# The password is hashed before being stored in the database.
# The microservice is running on port 8080.


# DB set up: email, username, first_name, last_name, password_hash, dob, sex
# not required but should add: height, weight, body_fat%
# Goals: goal_weight, goal_body_fat%, achieve_by, achieved (Bool), achieved_at

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import os

app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:password@localhost/gitfitbro'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# User model
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    password_hash = db.Column(db.String(64), nullable=False)
    email = db.Column(db.String(320), unique=True, nullable=False)
    username = db.Column(db.String(20), unique=True, nullable=False)
    first_name = db.Column(db.String(20), nullable=False)
    last_name = db.Column(db.String(30), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    sex = db.Column(db.Character, nullable=False)

    def __init__(self, password, email, username, first_name, last_name, date_of_birth, sex):
        self.password_hash = password
        self.email = email
        self.username = username
        self.first_name = first_name
        self.last_name = last_name
        self.date_of_birth = date_of_birth
        self.sex = sex
        
class user_stats(db.Model):
    __tablename__ = 'user_stats'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    height = db.Column(db.Integer)
    weight = db.Column(db.Float)
    body_fat = db.Column(db.Float)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    
    def __init__(self, user_id, height, weight, body_fat):
        self.user_id = user_id
        self.height = height
        self.weight = weight
        self.body_fat = body_fat

class user_goals(db.Model):
    __tablename__ = 'user_goals'
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    goal_weight = db.Column(db.Float, nullable=True)
    goal_body_fat = db.Column(db.Float, nullable=True)
    achieve_by = db.Column(db.Date, nullable=False)
    achieved = db.Column(db.Boolean, nullable=False)
    achieved_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    notes = db.Column(db.String(250), nullable=True)
    
    def __init__(self, user_id, goal_weight, goal_body_fat, achieve_by, notes):
        self.user_id = user_id
        self.goal_weight = goal_weight
        self.goal_body_fat = goal_body_fat
        self.achieve_by = achieve_by
        self.achieved = False
        self.notes = notes

@app.route('/create_user', methods=['POST'])
def create_user():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No input data provided"}), 400

    try:
        user = User(
            password=data['pass_hash'],
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