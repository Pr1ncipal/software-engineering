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
import logging
import time
import uuid
import base64
import datetime

# Configure logging
logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.FileHandler("user_api.log"),
                        logging.StreamHandler()
                    ])
logger = logging.getLogger("User")
logger = logging.getLogger("User")

app = Flask(__name__)

# Request logger middleware
@app.before_request
def before_request():
    # Generate unique request ID and store it in request
    request.request_id = str(uuid.uuid4())
    request.start_time = time.time()
    logger.info(f"Request {request.request_id}: {request.method} {request.path} - Started")
    logger.debug(f"Request {request.request_id}: Headers: {dict(request.headers)}")
    
    if request.is_json:
        # Log JSON payloads without sensitive data
        safe_data = request.get_json(silent=True)
        if isinstance(safe_data, dict):
            # Redact sensitive fields
            safe_copy = safe_data.copy()
            for field in ['password_hash', 'password']:
                if field in safe_copy:
                    safe_copy[field] = "***REDACTED***"
            logger.debug(f"Request {request.request_id}: JSON payload: {safe_copy}")
        else:
            # If safe_data is not a dict, just log it as is
            logger.debug(f"Request {request.request_id}: JSON payload: {safe_data}")
    elif request.args:
        # Log query parameters without sensitive data
        safe_args = request.args.copy()
        if "key" in safe_args:
            safe_args["key"] = "***REDACTED***"
        logger.debug(f"Request {request.request_id}: Query parameters: {safe_args}")

@app.after_request
def after_request(response):
    # Log request completion with timing and status
    duration = time.time() - request.start_time
    logger.info(f"Request {getattr(request, 'request_id', 'unknown')}: {request.method} {request.path} - Completed with status {response.status_code} in {duration:.3f}s")
    return response

# Error handler for custom exceptions
@app.errorhandler(UserServiceError)
def handle_user_service_error(error):
    request_id = getattr(request, 'request_id', 'unknown')
    logger.error(f"Request {request_id}: Handled exception: {error.error_code} - {error.message}")
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response



def get_data_jwt(request):
    """
    Extract and validate JWT token from the request.
    
    Args:
        request (flask.Request): The Flask request object
        
    Returns:
        tuple: (decoded data, user key)
        
    Raises:
        MissingTokenError: If token is missing
        InvalidTokenError: If token is invalid
        ExpiredTokenError: If token is expired
    """
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.debug(f"Request {request_id}: Extracting JWT token")
        token = get_data_json(request).get('token')
        
        if not token:
            logger.warning(f"Request {request_id}: Missing authentication token")
            raise MissingTokenError()
        
        try:
            key = request.headers.get('Authorization')
            if not key or not key.startswith('ApiKey '):
                logger.warning(f"Request {request_id}: Missing or invalid Authorization header")
                raise MissingTokenError("Authorization header is required and must start with 'ApiKey '")
                
            key = key.split(' ')[1]
            
            logger.debug(f"Request {request_id}: Verifying key in database")
            user_key = global_func.verify_key(base64.b64decode(key).decode()) #Might make class method
            
            if not key:
                logger.warning(f"Request {request_id}: Invalid key in token")
                raise InvalidTokenError("The provided key is invalid or does not exist")
            
            logger.debug(f"Request {request_id}: Decoding token with verification")
            
            decoded = jwt.decode(token, base64.b64decode(key).decode('utf-8'), algorithms=['HS256'])
            
            logger.info(f"Request {request_id}: Successfully authenticated user ID: {user_key}")
            return decoded, user_key
        
        except jwt.ExpiredSignatureError:
            logger.warning(f"Request {request_id}: Expired JWT token")
            raise ExpiredTokenError()
        
        except jwt.InvalidTokenError as e:
            logger.warning(f"Request {request_id}: Invalid JWT token: {str(e)}")
            raise InvalidTokenError(str(e))
        
    except (MissingTokenError, InvalidTokenError, ExpiredTokenError):
        # Re-raise these authentication exceptions
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error processing JWT: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise UserServiceError(f"Error processing JWT: {str(e)}")

def get_data_json(request):
    """
    Extract JSON data from the request.
    
    Args:
        request (flask.Request): The Flask request object
        
    Returns:
        dict: The JSON data
        
    Raises:
        InvalidUserDataError: If request doesn't contain valid JSON
    """
    request_id = getattr(request, 'request_id', 'unknown')
    if request.is_json:
        logger.debug(f"Request {request_id}: Extracting JSON data")
        return request.get_json()
    else:
        logger.warning(f"Request {request_id}: Request does not contain valid JSON data")
        raise InvalidUserDataError("Request must contain JSON data")
    
@app.route('/create_goal', methods=['POST'])
def create_goal():
    """
    Create a new goal for the authenticated user.
    """
    request_id = getattr(request, 'request_id', 'unknown')
    
    try:
        goalTypes = ["weight", "cardio", "strength", "steps"]
        logger.info(f"Request {request_id}: Processing create_goal request")
        data, id = get_data_jwt(request)
        
        if not data:
            logger.warning(f"Request {request_id}: No goal data provided")
            raise InvalidUserDataError("No goal data provided")
        if 'goal_type' not in data:
            logger.warning(f"Request {request_id}: Missing required goal_type field")
            raise MissingRequiredFieldError('goal_type')
        if 'achieve_by' not in data:
            logger.warning(f"Request {request_id}: Missing required achieve_by field")
            raise MissingRequiredFieldError('achieve_by')
        
        goal_type = data['goal_type']
        if goal_type not in goalTypes:
            logger.warning(f"Request {request_id}: Invalid goal type: {goal_type}")
            raise InvalidUserDataError("Invalid goal type")
        
        match goal_type:
            case "weight": # Working
                if 'target_weight' not in data:
                    logger.warning(f"Request {request_id}: Missing required goal_weight field")
                    raise MissingRequiredFieldError('target_weight')
                goal_weight = data['target_weight']
                
                if goal_weight is None:
                    logger.warning(f"Request {request_id}: Goal weight value cannot be null")
                    raise InvalidUserDataError("Goal weight value cannot be null")
                
                if goal_weight < 0:
                    logger.warning(f"Request {request_id}: Invalid goal weight value: {goal_weight} (negative)")
                    raise InvalidUserDataError("Goal weight value must be a positive number")
                
                if goal_weight > 1000:
                    logger.warning(f"Request {request_id}: Invalid goal weight value: {goal_weight} (Too big)")
                    raise InvalidUserDataError("Goal weight value is too big")
                logger.debug(f"Request {request_id}: Creating goal object for weight goal: {goal_weight}")
                
                user = userClass.UserStats(id=id)
                user.createGoal(goal_type, achieve_by = data['achieve_by'], goal_weight = goal_weight)
                
                logger.info(f"Request {request_id}: Successfully created weight goal: {goal_weight}")
                return jsonify({}), 201
            
            case "cardio":
                target_distance = None
                target_time = None
                if 'target_distance' not in data or 'target_time' not in data:
                    logger.warning(f"Request {request_id}: Missing required target_distance or target_time field")
                    raise MissingRequiredFieldError('target_distance or target_time')
                target_distance = data['target_distance']
                target_time = data['target_time']
                
                if target_distance is None and target_time is None:
                    logger.warning(f"Request {request_id}: Goal distance and time values cannot be null")
                    raise InvalidUserDataError("Goal distance and time values cannot be null")
                if target_distance < 0:
                    logger.warning(f"Request {request_id}: Invalid goal distance value: {target_distance} (negative)")
                    raise InvalidUserDataError("Goal distance value must be a positive number")
                if target_distance > 500:
                    logger.warning(f"Request {request_id}: Invalid goal distance value: {target_distance} (Too big)")
                    raise InvalidUserDataError("Goal distance value is too big")
                if target_time < 0:
                    logger.warning(f"Request {request_id}: Invalid goal time value: {target_time} (negative)")
                    raise InvalidUserDataError("Goal time value must be a positive number")
                if target_time > 5000:
                    logger.warning(f"Request {request_id}: Invalid goal time value: {target_time} (Too big)")
                    raise InvalidUserDataError("Goal time value is too big")
                logger.debug(f"Request {request_id}: Creating goal object for cardio goal: {target_distance} km in {target_time} min")
                
                # Fixed by creating user object correctly and passing parameters properly
                user = userClass.UserStats(id=id)
                user.createGoal(goal_type, achieve_by=data['achieve_by'], target_distance=target_distance, 
                               target_time=target_time)
                
                logger.info(f"Request {request_id}: Successfully created cardio goal: {target_distance} km in {target_time} min")
                return jsonify({}), 201
            
            case "strength": #working
                target_weight = None
                target_reps = None
                target_exercise = None
                if 'target_weight' not in data:
                    logger.warning(f"Request {request_id}: Missing required target_weight field")
                    raise MissingRequiredFieldError('target_weight')
                if 'target_reps' not in data:
                    logger.warning(f"Request {request_id}: Missing required target_reps field")
                    raise MissingRequiredFieldError('target_reps')
                if 'target_exercise' not in data:
                    logger.warning(f"Request {request_id}: Missing required target_exercise field")
                    raise MissingRequiredFieldError('target_exercise')
                target_weight = data['target_weight']
                target_reps = data['target_reps']
                target_exercise = data['target_exercise']
                if target_weight is None:
                    logger.warning(f"Request {request_id}: Goal weight value cannot be null")
                    raise InvalidUserDataError("Goal weight value cannot be null")
                if target_weight < 0:
                    logger.warning(f"Request {request_id}: Invalid goal weight value: {target_weight} (negative)")
                    raise InvalidUserDataError("Goal weight value must be a positive number")
                if target_weight > 1000:
                    logger.warning(f"Request {request_id}: Invalid goal weight value: {target_weight} (Too big)")
                    raise InvalidUserDataError("Goal weight value is too big")
                if target_reps is None:
                    logger.warning(f"Request {request_id}: Goal reps value cannot be null")
                    raise InvalidUserDataError("Goal reps value cannot be null")
                if target_reps < 0:
                    logger.warning(f"Request {request_id}: Invalid goal reps value: {target_reps} (negative)")
                    raise InvalidUserDataError("Goal reps value must be a positive number")
                if target_reps > 100:
                    logger.warning(f"Request {request_id}: Invalid goal reps value: {target_reps} (Too big)")
                    raise InvalidUserDataError("Goal reps value is too big")
                if target_exercise is None:
                    logger.warning(f"Request {request_id}: Goal exercise value cannot be null")
                    raise InvalidUserDataError("Goal exercise value cannot be null")
                # Fixed type checking with isinstance instead of incorrect syntax
                if not isinstance(target_exercise, int):
                    logger.warning(f"Request {request_id}: Invalid goal exercise value: {target_exercise} (not an int)")
                    raise InvalidUserDataError("Goal exercise value must be an int")
                if target_exercise < 0:
                    logger.warning(f"Request {request_id}: Invalid goal exercise value: {target_exercise} (negative)")
                    raise InvalidUserDataError("Goal exercise value must be a positive number")
                
                user = userClass.UserStats(id=id)
                # Fixed parameter passing to use named parameters
                user.createGoal(goal_type, achieve_by=data['achieve_by'], target_weight=target_weight, 
                               target_reps=target_reps, target_exercise=target_exercise)
                logger.info(f"Request {request_id}: Successfully created strength goal: {target_weight} kg for {target_reps} reps of exercise {target_exercise}")
                return jsonify({}), 201
            
            case 'steps':
                target_steps = None
                if 'target_steps' not in data:
                    logger.warning(f"Request {request_id}: Missing required target_steps field")
                    raise MissingRequiredFieldError('target_steps')
                target_steps = data['target_steps']
                
                if target_steps is None:
                    logger.warning(f"Request {request_id}: Goal steps value cannot be null")
                    raise InvalidUserDataError("Goal steps value cannot be null")
                if target_steps < 0:
                    logger.warning(f"Request {request_id}: Invalid goal steps value: {target_steps} (negative)")
                    raise InvalidUserDataError("Goal steps value must be a positive number")
                if target_steps > 100000:
                    logger.warning(f"Request {request_id}: Invalid goal steps value: {target_steps} (Too big)")
                    raise InvalidUserDataError("Goal steps value is too big")
                
                user = userClass.UserStats(id=id)
                user.createGoal(goal_type, achieve_by=data['achieve_by'], target_steps=target_steps)
                
                logger.info(f"Request {request_id}: Successfully created steps goal: {target_steps} steps")
                return jsonify({}), 201
            case _:
                logger.warning(f"Request {request_id}: Invalid goal type: {goal_type}")
                raise InvalidUserDataError("Invalid goal type")
    except UserServiceError:
        # Let the global error handler handle these
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error in create_goal: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise UserServiceError(f"An unexpected error occurred while creating goal: {str(e)}")
                    
@app.route('/create_user', methods=['POST'])
def create_user():
    """
    Create a new user with the provided information.
    
    Returns:
        flask.Response: JSON response
    """
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.info(f"Request {request_id}: Processing create_user request")
        data = get_data_json(request)
        
        required_fields = ['password_hash', 'email', 'username', 'first_name', 'last_name', 'dob', 'sex', 'height', 'weight']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            logger.warning(f"Request {request_id}: Missing required fields: {missing_fields}")
            raise MissingRequiredFieldError(", ".join(missing_fields))
        
        try:
            logger.debug(f"Request {request_id}: Creating user object for {data['username']}")
            user = userClass.UserStats(email=data['email'], username=data['username'], 
                                fname=data['first_name'], lname=data['last_name'], 
                                pass_hash=data['password_hash'], dob=data['dob'],sex=data["sex"],
                                height=data['height'], weight=data['weight'])
            
            logger.debug(f"Request {request_id}: Creating user in database")
            user.createUser()
            
            logger.debug(f"Request {request_id}: Inserting initial user stats")
            user.insertStats()
            
            logger.info(f"Request {request_id}: Successfully created user with key: {user.key[:5]}...")
            return jsonify({"message": "User created successfully", "token": user.key}), 201
        except psycopg2.errors.UniqueViolation as e:
            logger.warning(f"Request {request_id}: User already exists error: {str(e)}")
            raise UserAlreadyExistsError()
        except Exception as e:
            logger.error(f"Request {request_id}: Error creating user: {str(e)}")
            logger.error(f"Request {request_id}: {traceback.format_exc()}")
            raise DatabaseError(f"Failed to create user: {str(e)}")
            
    except UserServiceError:
        # Let the global error handler handle these
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise UserServiceError(f"An unexpected error occurred: {str(e)}")

@app.route('/login', methods=['POST'])
def login():
    """
    Authenticate a user with username and password.
    
    Returns:
        flask.Response: JSON response with authentication key
    """
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.info(f"Request {request_id}: Processing login request")
        data = get_data_json(request)
        
        required_fields = ['username', 'pass_hash']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            logger.warning(f"Request {request_id}: Missing required login fields: {missing_fields}")
            raise MissingRequiredFieldError(", ".join(missing_fields))
        
        logger.debug(f"Request {request_id}: Attempting login for username: {data['username']}")
        user = userClass.User(username=data['username'], pass_hash=data['pass_hash'])
        key = user.login()
        
        if key:
            logger.info(f"Request {request_id}: Successful login for user: {data['username']}")
            return jsonify({"message": "Login successful", "token": key}), 200
        else:
            logger.warning(f"Request {request_id}: Failed login attempt for username: {data['username']}")
            raise IncorrectCredentialsError()
            
    except UserServiceError:
        # Let the global error handler handle these
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error in login: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise UserServiceError(f"An unexpected error occurred during login")
    
@app.route('/validate_token', methods=['GET'])
def validate_token():
    """
    Validate an authentication token.
    
    Returns:
        flask.Response: JSON response with token validation status
    """
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.info(f"Request {request_id}: Processing validate_token request")
        key = request.headers.get('Authorization')
        logger.info(f"request.headers: {request.headers}")
        logger.info(f"Request {request_id}: Key: {key}")
        
        if not key or not key.startswith('ApiKey '):
            logger.warning(f"Request {request_id}: Missing or invalid Authorization header")
            raise MissingTokenError("Authorization header is required and must start with 'ApiKey '")
        
        key = key.split(' ')[1]
        
        key = base64.b64decode(key).decode()
        
        logger.info(f"Request {request_id}: Decoded key: {key}")
        
        logger.debug(f"Request {request_id}: Verifying key in database")
        try:
            user = userClass.User(key=key)
        except UserNotFoundException:
            logger.warning(f"Request {request_id}: User not found for token validation")
            return jsonify({"message": "Invalid token"}), 401
        except Exception as e:
            logger.warning(f"Request {request_id}: Invalid key in token: {str(e)}")
            raise InvalidTokenError("The provided key is invalid or does not exist")
        
        logger.info(f"Request {request_id}: Token validation successful for user ID: {user.id}")
        logger.info(f"Request {request_id}: Token validation successful for user ID: {user.id}")
        return jsonify({"username": user.username, "key": user.key}), 200
        
    except UserServiceError:
        # Let the global error handler handle these
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error in validate_token: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise UserServiceError(f"An unexpected error occurred while validating token")

@app.route('/update_user', methods=['POST'])
def update_user():
    """
    Update user information for the authenticated user.
    
    Returns:
        flask.Response: JSON response with update status
    """
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.info(f"Request {request_id}: Processing update_user request")
        data, key = get_data_jwt(request)
        
        if not data:
            logger.warning(f"Request {request_id}: No update data provided")
            raise InvalidUserDataError("No update data provided")
        
        if 'email' in data or 'pass_hash' in data:
            logger.debug(f"Request {request_id}: Creating user object for update with key: {key[:5]}...")
            user = userClass.UserStats(
                email=data.get('email'),
                pass_hash=data.get('pass_hash'),
                key=key
            )
            
            try:
                logger.debug(f"Request {request_id}: Updating user information")
                user.updateUser()
                
                # Specify what was updated in the message
                updated_fields = []
                if 'email' in data:
                    updated_fields.append("email")
                if 'pass_hash' in data:
                    updated_fields.append("password")
                
                fields_str = " and ".join(updated_fields)
                logger.info(f"Request {request_id}: Successfully updated user {fields_str}")
                return jsonify({"message": f"User {fields_str} updated successfully"}), 200
                
            except Exception as e:
                logger.error(f"Request {request_id}: Error updating user: {str(e)}")
                logger.error(f"Request {request_id}: {traceback.format_exc()}")
                raise DatabaseError("Failed to update user information")
        else:
            logger.warning(f"Request {request_id}: No valid update fields provided")
            raise InvalidUserDataError("No valid update fields provided (need email or pass_hash)")
            
    except UserServiceError:
        # Let the global error handler handle these
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error in update_user: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise UserServiceError(f"An unexpected error occurred while updating user")

@app.route('/delete_user', methods=['DELETE'])
def delete_user():
    """
    Delete a user account.
    
    Returns:
        flask.Response: JSON response with deletion status
    """
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.info(f"Request {request_id}: Processing delete_user request")
        key = request.headers.get('Authorization')
        
        if not key or not key.startswith('ApiKey '):
            logger.warning(f"Request {request_id}: Missing or invalid Authorization header")
            raise MissingTokenError("Authorization header is required and must start with 'ApiKey '")
                
        key = key.split(' ')[1]
        
        key = base64.b64decode(key).decode()
        
        logger.debug(f"Request {request_id}: Creating user object with key: {key[:5]}...")
        user = userClass.User(key=key)
        
        if user.id is None or user.id == -1:
            logger.warning(f"Request {request_id}: User not found for deletion")
            raise UserNotFoundException()
            
        logger.debug(f"Request {request_id}: Deleting user with ID: {user.id}")
        user.deleteUser()
        logger.info(f"Request {request_id}: Successfully deleted user with ID: {user.id}")
        return jsonify({"message": "User deleted successfully"}), 200
        
    except UserServiceError:
        # Let the global error handler handle these
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error in delete_user: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise UserServiceError(f"An unexpected error occurred while deleting user")

@app.route('/add_user_stats', methods=['POST'])
def add_user_stats():
    """
    Add new stats for the authenticated user.
    
    Returns:
        flask.Response: JSON response with stats addition status
    """
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.info(f"Request {request_id}: Processing add_user_stats request")
        data, key = get_data_jwt(request)
        
        if not data:
            logger.warning(f"Request {request_id}: No stats data provided")
            raise InvalidStatsDataError("No stats data provided")
        
        if 'weight' not in data:
            logger.warning(f"Request {request_id}: Missing required weight field")
            raise MissingRequiredFieldError('weight')
        if 'height' in data:
            height = data.get('height')
        weight = data.get('weight')
        
        if weight is None:
            logger.warning(f"Request {request_id}: Weight value cannot be null")
            raise InvalidStatsDataError("Weight value cannot be null")
        
        logger.debug(f"Request {request_id}: Creating user stats object with id: {key}...")
        if 'height' in data and 'weight' in data:
            user = userClass.UserStats(id=key, height=height, weight=weight)
        elif 'weight' in data and 'height' not in data:
            user = userClass.UserStats(id=key, weight=weight)
            height = user.height
        elif 'height' in data and 'weight' not in data:
            user = userClass.UserStats(id=key, height=height)
            weight = user.weight
        
        if user.id is None or user.id == -1:
            logger.warning(f"Request {request_id}: User not found for stats addition")
            raise UserNotFoundException()
            
        logger.debug(f"Request {request_id}: Inserting user stats: height={height}, weight={weight}")
        user.insertStats()
        logger.info(f"Request {request_id}: Successfully added stats for user ID: {user.id}")
        return jsonify({"message": "User stats added successfully"}), 201
        
    except UserServiceError:
        # Let the global error handler handle these
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error in add_user_stats: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise UserServiceError(f"An unexpected error occurred while adding user stats")

@app.route('/get_user_stats', methods=['GET'])
def get_user_stats():
    """
    Get stats for the authenticated user.
    
    Returns:
        flask.Response: JSON response with user stats
    """
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.info(f"Request {request_id}: Processing get_user_stats request")
        key = request.headers.get('Authorization')
        
        if not key or not key.startswith('ApiKey '):
            logger.warning(f"Request {request_id}: Missing or invalid Authorization header")
            raise MissingTokenError("Authorization header is required and must start with 'ApiKey '")
                
        key = key.split(' ')[1]
        
        key = base64.b64decode(key).decode()
        
        try:
            days = int(request.args.get('days', 0))
            logger.debug(f"Request {request_id}: Using timeframe of {days} days")
        except ValueError:
            logger.warning(f"Request {request_id}: Invalid days parameter")
            raise InvalidStatsDataError("Days parameter must be an integer")
        
        logger.debug(f"Request {request_id}: Creating user stats object with key: {key[:5]}...")
        user = userClass.UserStats(key=key)
        
        if user.id is None or user.id == -1:
            logger.warning(f"Request {request_id}: User not found for stats retrieval")
            raise UserNotFoundException()
            
        logger.debug(f"Request {request_id}: Retrieving user stats for user ID: {user.id}, days: {days}")
        stats = user.getUserStats(days=days)
        
        if not stats:
            logger.warning(f"Request {request_id}: No stats found for user ID: {user.id}")
            raise StatsNotFoundException()
            
        logger.info(f"Request {request_id}: Successfully retrieved {len(stats)} stats entries for user ID: {user.id}")
        return jsonify({"message": "User stats retrieved successfully", "stats": stats}), 200
        
    except UserServiceError:
        # Let the global error handler handle these
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error in get_user_stats: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise UserServiceError(f"An unexpected error occurred while retrieving user stats")
    
@app.route('/add_step_data', methods=['POST'])
def step_data():
    """
    Add step data for the authenticated user.
    
    Returns:
        flask.Response: JSON response with step data addition status
    """
    request_id = getattr(request, 'request_id', 'unknown')
    
    try:
        logger.info(f"Request {request_id}: Processing add_step_data request")
        data, key = get_data_jwt(request)
        
        # Validate request data
        if not data:
            logger.warning(f"Request {request_id}: No step data provided")
            raise InvalidStatsDataError("No step data provided")
        
        # Check required fields
        if 'steps' not in data:
            logger.warning(f"Request {request_id}: Missing required steps field")
            raise MissingRequiredFieldError('steps')
        
        # Get steps value
        steps = data['steps']
        
        # Validate steps value
        try:
            steps_value = steps
            if steps_value < 0:
                logger.warning(f"Request {request_id}: Invalid steps value: {steps} (negative)")
                raise InvalidStatsDataError("Steps value must be a positive number")
        except (ValueError, TypeError):
            logger.warning(f"Request {request_id}: Invalid steps value: {steps} (not a number)")
            raise InvalidStatsDataError("Steps value must be a number")
        
        # Process date
        if 'date' not in data:
            date = datetime.date.today()
            logger.debug(f"Request {request_id}: No date provided, using today's date: {date}")
        else:
            try:
                # Attempt to parse date string if it's not already a date object
                if isinstance(data['date'], str):
                    date = datetime.datetime.strptime(data['date'], "%Y-%m-%d").date()
                else:
                    date = data['date']
                
                # Validate date is not in the future
                if date > datetime.date.today():
                    logger.warning(f"Request {request_id}: Future date provided: {date}")
                    raise InvalidStatsDataError("Cannot add step data for future dates")
                
                logger.debug(f"Request {request_id}: Using provided date: {date}")
            except ValueError:
                logger.warning(f"Request {request_id}: Invalid date format: {data['date']}")
                raise InvalidStatsDataError("Date must be in YYYY-MM-DD format")
        
        # Create user object and validate
        logger.debug(f"Request {request_id}: Creating user stats object with id: {key}")
        try:
            user = userClass.UserStats(id=key)
            
            if user.id is None or user.id == -1:
                logger.warning(f"Request {request_id}: User not found for step data addition")
                raise UserNotFoundException()
                
            logger.debug(f"Request {request_id}: User found, inserting step data: steps={steps}, date={date}")
            
            # Insert steps data
            user.insertSteps(steps, date)
            
            logger.info(f"Request {request_id}: Successfully added {steps} steps for user ID: {user.id} on {date}")
            return jsonify({
                "message": "Step data added successfully",
                "steps": steps,
                "date": date.isoformat() if hasattr(date, 'isoformat') else date
            }), 201
            
        except ConnectionError as e:
            logger.error(f"Request {request_id}: Database connection error: {str(e)}")
            raise
        except QueryError as e:
            logger.error(f"Request {request_id}: Database query error: {str(e)}")
            raise
            
    except (UserNotFoundException, InvalidStatsDataError, MissingRequiredFieldError, 
           ConnectionError, QueryError, AuthenticationError) as e:
        # These are already logged by the exception class itself
        logger.debug(f"Request {request_id}: Re-raising specific exception: {e.__class__.__name__}")
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error in add_step_data: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise UserServiceError(f"An unexpected error occurred while adding step data")
    
@app.route('/get_step_data', methods=['GET'])
def get_step_data():
    """
    Get step data for the authenticated user.
    
    Returns:
        flask.Response: JSON response with step data
    """
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.info(f"Request {request_id}: Processing get_step_data request")
        key = request.headers.get('Authorization')
        
        if not key or not key.startswith('ApiKey '):
            logger.warning(f"Request {request_id}: Missing or invalid Authorization header")
            raise MissingTokenError("Authorization header is required and must start with 'ApiKey '")
                
        key = key.split(' ')[1]
        
        key = base64.b64decode(key).decode()
        
        logger.debug(f"Request {request_id}: Creating user stats object with key: {key[:5]}...")
        user = userClass.UserStats(key=key)
        
        if user.id is None or user.id == -1:
            logger.warning(f"Request {request_id}: User not found for step data retrieval")
            raise UserNotFoundException()
        
        year = request.args.get('year', None)
        month = request.args.get('month', None)
            
        logger.debug(f"Request {request_id}: Retrieving step data for user ID: {user.id}, year: {year}, month: {month}")
        user_info, statistics, steps = user.getStepData(month, year)
        if not user_info:
            logger.warning(f"Request {request_id}: No user info found for user ID: {user.id}")
            user_info = {}
        if not statistics:
            logger.warning(f"Request {request_id}: No statistics found for user ID: {user.id}")
            statistics = {}
        if not steps:
            logger.warning(f"Request {request_id}: No step data found for user ID: {user.id}")
            steps = []
            
        logger.info(f"Request {request_id}: Successfully retrieved step data for user ID: {user.id}")
        return jsonify({"message": "Step data retrieved successfully", "user_info": user_info, "statistics": statistics, "steps_data": steps}), 200
        
    except UserServiceError:
        # Let the global error handler handle these
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error in get_step_data: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise UserServiceError(f"An unexpected error occurred while retrieving step data")
    
    
@app.route('/get_user_page', methods=['GET'])
def get_user_page():
    """

    """
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.info(f"Request {request_id}: Processing user page request")
        key = request.headers.get('Authorization')
        
        if not key or not key.startswith('ApiKey '):
            logger.warning(f"Request {request_id}: Missing or invalid Authorization header")
            raise MissingTokenError("Authorization header is required and must start with 'ApiKey '")
                
        key = key.split(' ')[1]
        
        key = base64.b64decode(key).decode()

        user = userClass.UserStats(key=key)
        
        logger.debug(f"User height: {user.height}")
        logger.debug(f"User height: {user.height}")
        starting_weight = user.getUserStatsSingle(starting=True, height= user.height)
        current_weight = user.getUserStatsSingle()
        goal_weight = user.getGoal("weight", 1)
        user_info, stats, step_data = user.getStepData()
        
        if starting_weight is None:
            starting_weight = ''
        if current_weight is None:
            current_weight = ''
        if goal_weight is None:
            goal_weight = ''
        if step_data is None:
            steps = ''
            
        activities = user.getUserActivities(verbose=True, days= -1, number= 10)
        activities = user.getUserActivities(verbose=True, days= -1, number= 10)
        
        if activities is None:
            activities = ''
        else:
            formattedActivities = user.formatUserPage(activities)
            
        # Initialize steps variable
        steps = 0  # Default value

        for day in step_data:
            dayDate = day['date']
            
            # Convert string to date object if needed
            if isinstance(dayDate, str):
                try:
                    # Parse the string into a date object
                    dayDate = datetime.datetime.strptime(dayDate, "%Y-%m-%d").date()
                except ValueError:
                    logger.warning(f"Request {request_id}: Invalid date format: {dayDate}")
                    continue
            
            # Now compare with today's date
            today = datetime.date.today()
            if dayDate == today:
                steps = day['steps']
                logger.debug(f"Request {request_id}: Found steps for today: {steps}")
                break

        # Complete the final dictionary
        final = {
            "starting_weight": starting_weight,
            "current_weight": current_weight,
            "goal_weight": goal_weight,
            "activities": formattedActivities,
            "steps": steps,
            "step_goal": user_info["step_goal"] if user_info else 0
        }
        
        logger.info(f"Request {request_id}: Successfully retrieved user page data")
        return jsonify({"first_name": user.fname, "last_name": user.lname, "username": user.username, "data": final}), 200
    
    except UserServiceError:
        # Let the global error handler handle these
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error in get_user_page: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise UserServiceError(f"An unexpected error occurred while retrieving user page data")
    

@app.route('/homepage', methods=['GET'])
def homepage():
    """
    Home page route.
    
    Returns:
        flask.Response: JSON response with welcome message
    """
    
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.info(f"Request {request_id}: Processing user page request")
        key = request.headers.get('Authorization')
        
        if not key or not key.startswith('ApiKey '):
            logger.warning(f"Request {request_id}: Missing or invalid Authorization header")
            raise MissingTokenError("Authorization header is required and must start with 'ApiKey '")
                
        key = key.split(' ')[1]
        
        key = base64.b64decode(key).decode()
        
        user = userClass.UserStats(key=key)
        
        leaderboardType = request.args.get('leaderboardType', None)
        
        activity, leaderboard, family = user.getHomePageData(leaderboardType)
        
        return jsonify({"activity": activity, "leaderboard": leaderboard, "family": family}), 200
    except UserServiceError:
        # Let the global error handler handle these
        raise
    
    except Exception as e:
        pass

        
if __name__ == '__main__':
    logger.info("Starting user microservice on port 8080")
    app.run(host='0.0.0.0', port=8080, debug=True)