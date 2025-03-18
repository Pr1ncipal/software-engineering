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
from userErrors import *
import psycopg2
import traceback

app = Flask(__name__)

# Error handler for custom exceptions
@app.errorhandler(UserServiceError)
def handle_user_service_error(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response

def get_data_jwt(request):
    token = request.get_data() #Assuming request cant be changed
    if not token:
        raise MissingTokenError()
    
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        key = global_func.verify_key(payload['key']) #Might make class method
        
        if not key:
            raise InvalidTokenError("The provided key is invalid or does not exist")
        
        decoded = jwt.decode(token, payload['key'], algorithms=['HS256'])
        return decoded, key
    except jwt.ExpiredSignatureError:
        raise ExpiredTokenError()
    except jwt.InvalidTokenError:
        raise InvalidTokenError()
    except Exception as e:
        raise UserServiceError(f"Error processing JWT: {str(e)}")

def get_data_json(request):
    if request.is_json:
        return request.get_json()
    else:
        raise InvalidUserDataError("Request must contain JSON data")

@app.route('/create_user', methods=['POST'])
def create_user():
    try:
        data = get_data_json(request)
        
        required_fields = ['password_hash', 'email', 'username', 'first_name', 'last_name', 'dob', 'sex', 'height', 'weight']
        for field in required_fields:
            if field not in data:
                raise MissingRequiredFieldError(field)
        
        try:
            user = userClass.UserStats(email=data['email'], username=data['username'], 
                                fname=data['first_name'], lname=data['last_name'], 
                                pass_hash=data['password_hash'], dob=data['dob'],sex=data["sex"],
                                height=data['height'], weight=data['weight'])
            user.createUser()
            user.insertStats()
            
            return jsonify({"message": "User created successfully", "key": user.key}), 201
        except psycopg2.errors.UniqueViolation:
            raise UserAlreadyExistsError()
        except Exception as e:
            app.logger.error(f"Error creating user: {str(e)}")
            app.logger.error(traceback.format_exc())
            raise DatabaseError(f"Failed to create user: {str(e)}")
            
    except UserServiceError:
        # Let the global error handler handle these
        raise
    except Exception as e:
        app.logger.error(f"Unexpected error: {str(e)}")
        app.logger.error(traceback.format_exc())
        raise UserServiceError(f"An unexpected error occurred: {str(e)}")

@app.route('/login', methods=['POST'])
def login():
    try:
        data = get_data_json(request)
        
        required_fields = ['username', 'password']
        for field in required_fields:
            if field not in data:
                raise MissingRequiredFieldError(field)
        
        user = userClass.User(username=data['username'], pass_hash=data['password'])
        key = user.login()
        
        if key:
            return jsonify({"message": "Login successful", "key": key}), 200
        else:
            raise IncorrectCredentialsError()
            
    except UserServiceError:
        # Let the global error handler handle these
        raise
    except Exception as e:
        app.logger.error(f"Unexpected error in login: {str(e)}")
        raise UserServiceError(f"An unexpected error occurred during login")

@app.route('/update_user', methods=['POST'])
def update_user():
    try:
        data, key = get_data_jwt(request)
        
        if not data:
            raise InvalidUserDataError("No update data provided")
        
        if 'email' in data or 'pass_hash' in data:
            user = userClass.UserStats(
                email=data.get('email'),
                pass_hash=data.get('pass_hash'),
                key=key
            )
            
            try:
                user.updateUser()
                
                # Specify what was updated in the message
                updated_fields = []
                if 'email' in data:
                    updated_fields.append("email")
                if 'pass_hash' in data:
                    updated_fields.append("password")
                
                fields_str = " and ".join(updated_fields)
                return jsonify({"message": f"User {fields_str} updated successfully"}), 200
                
            except Exception as e:
                app.logger.error(f"Error updating user: {str(e)}")
                raise DatabaseError("Failed to update user information")
        else:
            raise InvalidUserDataError("No valid update fields provided (need email or pass_hash)")
            
    except UserServiceError:
        # Let the global error handler handle these
        raise
    except Exception as e:
        app.logger.error(f"Unexpected error in update_user: {str(e)}")
        raise UserServiceError(f"An unexpected error occurred while updating user")

@app.route('/delete_user', methods=['DELETE'])
def delete_user():
    try:
        key = request.args.get('key')
        if not key:
            raise MissingTokenError("Authentication key is required for user deletion")
        
        user = userClass.User(key=key)
        
        if user.id is None or user.id == -1:
            raise UserNotFoundException()
            
        user.deleteUser()
        return jsonify({"message": "User deleted successfully"}), 200
        
    except UserServiceError:
        # Let the global error handler handle these
        raise
    except Exception as e:
        app.logger.error(f"Unexpected error in delete_user: {str(e)}")
        raise UserServiceError(f"An unexpected error occurred while deleting user")

@app.route('/add_user_stats', methods=['POST'])
def add_user_stats():
    try:
        data, key = get_data_jwt(request)
        
        if not data:
            raise InvalidStatsDataError("No stats data provided")
        
        if 'weight' not in data:
            raise MissingRequiredFieldError('weight')
        
        height = data.get('height')
        weight = data.get('weight')
        
        if weight is None:
            raise InvalidStatsDataError("Weight value cannot be null")
        
        user = userClass.UserStats(key=key, height=height, weight=weight)
        
        if user.id is None or user.id == -1:
            raise UserNotFoundException()
            
        user.insertStats()
        return jsonify({"message": "User stats added successfully"}), 201
        
    except UserServiceError:
        # Let the global error handler handle these
        raise
    except Exception as e:
        app.logger.error(f"Unexpected error in add_user_stats: {str(e)}")
        raise UserServiceError(f"An unexpected error occurred while adding user stats")

@app.route('/get_user_stats', methods=['GET'])
def get_user_stats():
    try:
        key = request.args.get('key')
        if not key:
            raise MissingTokenError("Authentication key is required to retrieve user stats")
        
        days = request.args.get('days', 0, type=int)
        
        user = userClass.UserStats(key=key)
        
        if user.id is None or user.id == -1:
            raise UserNotFoundException()
            
        stats = user.getUserStats(days=days)
        
        if not stats:
            raise StatsNotFoundException()
            
        return jsonify({"message": "User stats retrieved successfully", "stats": stats}), 200
        
    except UserServiceError:
        # Let the global error handler handle these
        raise
    except Exception as e:
        app.logger.error(f"Unexpected error in get_user_stats: {str(e)}")
        raise UserServiceError(f"An unexpected error occurred while retrieving user stats")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)