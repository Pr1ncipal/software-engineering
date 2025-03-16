# A.I. Created User creation microservice. 
# This microservice is responsible for creating a new user in the database.
# The user data is received in JSON format and is validated before being inserted into the database.
# The password is hashed before being stored in the database.
# The microservice is running on port 8080.


# DB set up: email, username, first_name, last_name, password_hash, dob, sex
# not required but should add: height, weight, body_fat%
# Goals: goal_weight, goal_body_fat%, achieve_by, achieved (Bool), achieved_at

from flask import Flask, request, jsonify
import userClass
import jwt
import global_func

app = Flask(__name__)

def get_data_jwt(request):
    token = request.get_data() #Assuming request cant be changed
    if token:
        try:
            payload = jwt.decode(token, options = {"verify_signature": False})
        
            key = global_func.verify_key(payload['key']) #Might make class method
        
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
    data = get_data_json(request)
    if not data:
        return jsonify({"message": "No input data provided"}), 400
    
    required_fields = ['password_hash', 'email', 'username', 'first_name', 'last_name', 'dob', 'sex', 'height', 'weight']
    for field in required_fields:
        if field not in data.keys():
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    user = userClass.UserStats(email=data['email'], username=data['username'], 
                          fname=data['first_name'], lname=data['last_name'], 
                          pass_hash=data['password_hash'], dob=data['dob'],sex=data["sex"],
                          height=data['height'], weight=data['weight'])
    user.createUser()
    user.insertStats()
    
    return jsonify({"message": "User created successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = get_data_json(request)
    if not data:
        return jsonify({"message": "No input data provided"}), 400
    
    required_fields = ['username', 'password']
    for field in required_fields:
        if field not in data.keys():
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    user = userClass.User(username=data['username'], password_hash=data['password'])
    if user.login():
        return jsonify({"message": "Login successful", "key": user.key}), 200
    else:
        return jsonify({"message": "Username or password incorrect"}), 401

@app.route('/update_user', methods=['POST'])
def update_user():
    data, key = get_data_jwt(request)
    
    if not data and not key:
        return jsonify({"message": "No input data provided"}), 400
    elif not key:
        return jsonify({"message": "User not authenticated"}), 401
    elif not data:
        return jsonify({"message": "No input data provided"}), 400
    
    try:
        if 'email' in data.keys() and 'pass_hash' in data.keys():
            user = userClass.UserStats(email=data['email'], password_hash=data['pass_hash'], key=key)
            user.updateUser()
            return jsonify({"message": "User updated successfully"}), 200
        elif 'email' in data.keys():
            user = userClass.UserStats(email=data['email'], key=key)
            user.updateUser()
            return jsonify({"message": "User updated successfully"}), 200
        elif 'pass_hash' in data.keys():
            user = userClass.UserStats(password_hash=data['pass_hash'], key=key)
            user.updateUser()
            return jsonify({"message": "User updated successfully"}), 200
        else:
            return jsonify({"message": "No input data provided"}), 400
    except:
        return jsonify({"message": "Error updating user"}), 400
    
@app.route('/delete_user', methods=['DELETE'])
def delete_user():
    key = request.args.get('key')
    

    if not key:
        return jsonify({"message": "Unable to delete user"}), 401
    
    try:
        user = userClass.User(key=key)
        user.deleteUser()
        return jsonify({"message": "User deleted successfully"}), 200
    
    except Exception:
        return jsonify({"message": "Error deleting user"}), 400
    

@app.route('/add_user_stats', methods=['POST'])
def add_user_stats():
    data, key = get_data_jwt(request)
    if not data and not key:
        return jsonify({"message": "No input data provided"}), 400
    elif not key:
        return jsonify({"message": "User not authenticated"}), 401
    elif not data:
        return jsonify({"message": "No input data provided"}), 400
    
    required_fields = ['weight']
    for field in required_fields:
        if field not in data.keys():
            return jsonify({"error": f"Missing required field: {field}"}), 400
    try:
        if data['height'] != None:
            height = data['height']
        else:
            height = None
            
        if data['weight'] != None:
            weight = data['weight']
        else:
            weight = None
        user = userClass.UserStats(key=key, height=height, weight=weight)
        user.insertStats()
        return jsonify({"message": "User stats added successfully"}), 201
    except:
        return jsonify({"message": "Error adding user stats"}), 400

@app.route('/get_user_stats', methods=['GET'])
def get_user_stats():
    key = request.args.get('key')
    days = request.args.get('days')
    if not key:
        return jsonify({"message": "No key provided"}), 400
    try:
        user = userClass.UserStats(key=key)
        stats = user.getUserStats(days = days)
        return jsonify({"message": "User stats retrieved successfully", "stats": stats}), 200
    except:
        return jsonify({"message": "Error retrieving user stats"}), 400
    
           

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)