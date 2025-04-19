from flask import Flask, request, jsonify, Blueprint
from psycopg2 import sql
import psycopg2
import traceback
import jwt
import logging
import global_func
from workoutClass import Workout
from heuristic import main
from WorkoutExceptions import *
import base64
import time
import uuid
import json

# Configure logging
logging.basicConfig(level=logging.DEBUG, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                   handlers=[
                       logging.FileHandler("workout_api.log"),
                       logging.StreamHandler()
                   ])
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.register_blueprint(main)

# Request logger middleware
@app.before_request
def before_request():
    # Generate unique request ID and store in g
    request.request_id = str(uuid.uuid4())
    request.start_time = time.time()
    logger.info(f"Request {request.request_id}: {request.method} {request.path} - Started")
    logger.debug(f"Request {request.request_id}: Headers: {dict(request.headers)}")
    #if request.is_json:
        # Log JSON payloads without sensitive data
    #    safe_data = request.get_json(silent=True)
    #    if isinstance(safe_data, dict) and "token" in safe_data:
    #        safe_data["token"] = "***REDACTED***"
    #    logger.debug(f"Request {request.request_id}: JSON payload: {safe_data}")
    if request.args:
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
@app.errorhandler(WorkoutException)
def handle_workout_exception(error):
    """Global exception handler for WorkoutException and subclasses."""
    request_id = getattr(request, 'request_id', 'unknown')
    logger.error(f"Request {request_id}: Handled exception: {error.error_code} - {error.message}")
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response

def get_data_json(request):
    """
    Extract JSON data from the request.
    
    Args:
        request (flask.Request): The Flask request object
        
    Returns:
        dict: The JSON data
        
    Raises:
        InvalidWorkoutDataError: If request doesn't contain valid JSON
    """
    request_id = getattr(request, 'request_id', 'unknown')
    # Add logging to debug the request content type and body
    logger.debug(f"Request {request_id}: Content-Type: {request.headers.get('Content-Type')}")
    logger.debug(f"Request {request_id}: Request body: {request.get_data(as_text=True)[:200]}")
    
    # Check content type more flexibly
    content_type = request.headers.get('Content-Type', '')
    if 'application/json' in content_type:
        try:
            # Try to parse JSON directly from the request data
            data = json.loads(request.get_data(as_text=True))
            logger.debug(f"Request {request_id}: Successfully parsed JSON data")
            return data
        except json.JSONDecodeError as e:
            logger.error(f"Request {request_id}: JSON decode error: {str(e)}")
            logger.error(f"Request {request_id}: Raw data: {request.get_data(as_text=True)[:100]}")
            raise InvalidWorkoutDataError(f"Invalid JSON format: {str(e)}")
    elif request.is_json:
        # This is Flask's built-in JSON checker
        logger.debug(f"Request {request_id}: Using Flask's built-in JSON parser")
        return request.get_json()
    else:
        # If we get here, try one more fallback approach
        try:
            data = request.get_json(force=True)
            if data is not None:
                logger.debug(f"Request {request_id}: Forced JSON parsing succeeded")
                return data
        except Exception as e:
            logger.error(f"Request {request_id}: Forced JSON parsing failed: {str(e)}")
        
        logger.warning(f"Request {request_id}: Request does not contain valid JSON data")
        raise InvalidWorkoutDataError("Request must contain JSON data with Content-Type: application/json")

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
        
        # Try to get JSON data
        try:
            token_data = get_data_json(request)
        except InvalidWorkoutDataError:
            # Log the raw request data for debugging
            raw_data = request.get_data(as_text=True)
            logger.error(f"Request {request_id}: Failed to parse JSON. Raw data: {raw_data[:200]}")
            raise InvalidTokenError("Unable to parse request as JSON")
        
        # Log token data keys to help debug
        logger.debug(f"Request {request_id}: Token data keys: {list(token_data.keys())}")
        
        if not token_data or "token" not in token_data:
            logger.warning(f"Request {request_id}: Missing authentication token")
            raise MissingTokenError("Authentication token is required")
            
        token = token_data["token"]
        logger.debug(f"Request {request_id}: Processing JWT token: {token[:10]}...")
        
        try:             
            # Decode the base64 key
            try:
                logger.debug(f"Request {request_id}: Extracting Authorization header")
                auth_header = request.headers.get('Authorization')
                
                logger.info(f"Request {request_id}: headers: {request.headers}")
                
                if not auth_header or not auth_header.startswith('ApiKey '):
                    logger.warning(f"Request {request_id}: Missing or invalid Authorization header: {auth_header}")
                    raise MissingTokenError("Authorization header is required and must start with 'ApiKey '")
                
                encoded_key = auth_header.split(' ')[1]
                logger.debug(f"Request {request_id}: Encoded API key: {encoded_key[:10]}...")
                
                # Ensure proper padding for base64
                padding_needed = len(encoded_key) % 4
                if padding_needed:
                    encoded_key += '=' * (4 - padding_needed)
                
                logger.debug(f"Request {request_id}: Decoding base64 API key from Authorization header")
                
                try:
                    decoded_key = base64.b64decode(encoded_key).decode('utf-8')
                except Exception as e:
                    logger.error(f"Request {request_id}: Base64 decode error: {str(e)}")
                    # Try URL-safe base64
                    decoded_key = base64.urlsafe_b64decode(encoded_key).decode('utf-8')
                    
            except Exception as e:
                logger.error(f"Request {request_id}: Failed to decode API key: {str(e)}")
                raise InvalidTokenError(f"Invalid API key format in Authorization header: {str(e)}")
                
            # Verify key exists in database
            logger.debug(f"Request {request_id}: Verifying key in database")
            key = global_func.verify_key(decoded_key)
            
            if not key:
                logger.warning(f"Request {request_id}: Invalid key in token: {decoded_key[:10]}...")
                raise InvalidTokenError(f"Invalid authentication key")
        
            # Now decode with verification
            logger.debug(f"Request {request_id}: Decoding token with verification")
            try:
                decoded = jwt.decode(token, decoded_key, algorithms=['HS256'])
                logger.info(f"Request {request_id}: Successfully authenticated user ID: {key}")
                return decoded, key
            except Exception as e:
                logger.error(f"Request {request_id}: JWT decode error: {str(e)}")
                # Try without verification as fallback
                decoded = jwt.decode(token, options={"verify_signature": False})
                logger.warning(f"Request {request_id}: JWT decoded without verification!")
                return decoded, key
            
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
        raise AuthenticationError(f"Authentication error: {str(e)}")

@app.route('/add_workout', methods=['POST'])
def add_workout():
    """
    Add a new workout with exercises.
    
    Returns:
        flask.Response: JSON response
    """
    #Going to have to changed for Cardio workouts
    
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.info(f"Request {request_id}: Processing add_workout request")
        data, key = get_data_jwt(request)
        
        if not data:
            logger.warning(f"Request {request_id}: No workout data provided")
            raise InvalidWorkoutDataError("No workout data provided")
            
        # Validate required fields
        required_fields = ['workoutType', 'exercises']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            logger.warning(f"Request {request_id}: Missing required fields: {missing_fields}")
            raise MissingRequiredFieldError(", ".join(missing_fields))

        # Create workout object
        logger.debug(f"Request {request_id}: Creating workout object with type: {data['workoutType']}")
        
        if data['workoutType'] == "strength":
            
            workout = Workout(
                user_id=key,
                name=data['name'],
                workout_type=data['workoutType'],
                notes=data['notes'],
                averageHR=data['averageHeartRate'],
                exercises=data['exercises']
            )
        else:
            workout = Workout(
                user_id=key,
                name=data['name'],
                workout_type=data['workoutType'],
                notes=data['notes'],
                averageHR=data['averageHeartRate'],
                distance=data['distance'],
                duration=data['duration']
            )
        
        # Insert workout
        logger.debug(f"Request {request_id}: Inserting workout into database")
        workout.create_workout()
        logger.info(f"Request {request_id}: Successfully added workout with ID: {workout.id}")
        return jsonify({
            "message": "Workout added successfully",
        }), 201
    
    except (AuthenticationError, WorkoutError, DatabaseError) as e:
        # These will be handled by the global error handler
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error in add_workout: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise WorkoutException(f"Failed to add workout: {str(e)}")

@app.route('/get_workouts', methods=['GET'])
def get_workouts():
    """
    Get workouts for the authenticated user.
    
    Returns:
        flask.Response: JSON response with workouts
    """
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.info(f"Request {request_id}: Processing get_workouts request")
        # Get key from query parameters
        key_param = request.headers.get('Authorization')
        if not key_param or not key_param.startswith('ApiKey '):
            logger.warning(f"Request {request_id}: Missing or invalid Authorization header")
            raise MissingTokenError("Authorization header is required and must start with 'ApiKey '")
                
        key_param = key_param.split(' ')[1]
            
        try:
            logger.debug(f"Request {request_id}: Decoding base64 key")
            decoded_key = base64.b64decode(key_param).decode('utf-8')
        except Exception as e:
            logger.error(f"Request {request_id}: Failed to decode key: {str(e)}")
            raise InvalidTokenError("Invalid key format")
            
        # Verify key exists in database
        logger.debug(f"Request {request_id}: Verifying key in database")
        user_id = global_func.verify_key(decoded_key)
        
        if not user_id:
            logger.warning(f"Request {request_id}: Invalid authentication key")
            raise InvalidTokenError("Invalid authentication key")
            
        # Get page parameter
        try:
            page = int(request.args.get('page', 0))
            if page < 0:
                logger.warning(f"Request {request_id}: Negative page value, defaulting to 0")
                page = 0
            logger.debug(f"Request {request_id}: Fetching page {page} of workouts")
        except ValueError:
            logger.warning(f"Request {request_id}: Invalid page parameter")
            raise InvalidWorkoutDataError("Page parameter must be an integer")
        
        workouts = Workout(user_id=user_id)
        logger.debug(f"Request {request_id}: Retrieving workouts for user {user_id}")
        exercises, nextPage = workouts.getWorkouts(page)
        logger.info(f"Request {request_id}: Successfully retrieved {len(exercises)} workouts, next page: {nextPage}")
        return jsonify({"exercises":exercises, "page": nextPage}), 200
    
    except (AuthenticationError, WorkoutError, DatabaseError) as e:
        # These will be handled by the global error handler
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error in get_workouts: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise WorkoutException(f"Failed to get workouts: {str(e)}")
    
@app.route('/get_workout_stats', methods=['GET'])
def get_workout_stats():
    """
    Get workout statistics for a specific exercise and timeframe.
    
    Returns:
        flask.Response: JSON response with workout statistics
    """
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.info(f"Request {request_id}: Processing get_workout_stats request")
        # Get key from query parameters
        key_param = request.headers.get('Authorization')
        
        if not key_param or not key_param.startswith('ApiKey '):
            logger.warning(f"Request {request_id}: Missing or invalid Authorization header")
            raise MissingTokenError("Authorization header is required and must start with 'ApiKey '")
                
        key_param = key_param.split(' ')[1]
            
        try:
            logger.debug(f"Request {request_id}: Decoding base64 key")
            decoded_key = base64.b64decode(key_param).decode('utf-8')
        except Exception as e:
            logger.error(f"Request {request_id}: Failed to decode key: {str(e)}")
            raise InvalidTokenError("Invalid key format")
            
        # Verify key exists in database
        logger.debug(f"Request {request_id}: Verifying key in database")
        user_id = global_func.verify_key(decoded_key)
        
        if not user_id:
            logger.warning(f"Request {request_id}: Invalid authentication key")
            raise InvalidTokenError("Invalid authentication key")
            
        # Get exercise and timeframe parameters
        exercise = request.args.get('workout')
        if not exercise:
            logger.warning(f"Request {request_id}: Missing workout parameter")
            raise InvalidWorkoutDataError("Workout parameter is required")
        
        try:
            timeframe = int(request.args.get('timeframe', 30))
            logger.debug(f"Request {request_id}: Using timeframe of {timeframe} days")
        except ValueError:
            logger.warning(f"Request {request_id}: Invalid timeframe parameter")
            raise InvalidWorkoutDataError("Timeframe parameter must be an integer")
        
        workout = Workout(user_id=user_id)
        logger.debug(f"Request {request_id}: Getting stats for workout '{exercise}' with timeframe {timeframe} days")
        stats = workout.getWorkoutStats(exercise, timeframe)
        logger.info(f"Request {request_id}: Successfully retrieved workout stats for '{exercise}'")
        return jsonify({"exercises":stats}), 200
    
    except (AuthenticationError, WorkoutError, DatabaseError) as e:
        # These will be handled by the global error handler
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error in get_workout_stats: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise WorkoutException(f"Failed to get workout stats: {str(e)}")
    
@app.route('/get_exercises', methods=['GET'])
def getExercises():
    """
    Get all exercises in the database.
    
    Returns:
        flask.Response: JSON response with exercises
    """
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.info(f"Request {request_id}: Processing get_exercises request")
        
        # Get authorization from header
        key_param = request.headers.get('Authorization')
        logger.debug(f"Request {request_id}: Authorization header: {'present' if key_param else 'missing'}")
        
        if not key_param or not key_param.startswith('ApiKey '):
            logger.warning(f"Request {request_id}: Missing or invalid Authorization header format")
            raise MissingTokenError("Authorization header is required and must start with 'ApiKey '")
                
        key_param = key_param.split(' ')[1]
        logger.info(f"Request {request_id}: API key extracted from header: {key_param}")
            
        # Decode the API key
        try:
            logger.debug(f"Request {request_id}: Decoding base64 key")
            decoded_key = base64.b64decode(key_param).decode('utf-8')
        except Exception as e:
            logger.error(f"Request {request_id}: Failed to decode key: {str(e)}")
            raise InvalidTokenError("Invalid key format - not valid base64")
            
        # Verify key exists in database
        logger.debug(f"Request {request_id}: Verifying key in database")
        user_id = global_func.verify_key(decoded_key)
        
        if not user_id:
            logger.warning(f"Request {request_id}: Invalid authentication key")
            raise InvalidTokenError("Invalid authentication key")
        
        logger.debug(f"Request {request_id}: Successfully authenticated user ID: {user_id}")
        
        # Process query parameters
        try:
            # Convert number parameter and validate
            number_param = request.args.get('number', '50')
            logger.debug(f"Request {request_id}: Raw number parameter: {number_param}")
            
            try:
                number = int(number_param)
                if number <= 0 or number > 1000:  # Set reasonable limits
                    logger.warning(f"Request {request_id}: Invalid number value {number}, using default 50")
                    number = 50
            except ValueError:
                logger.warning(f"Request {request_id}: Invalid number parameter format: {number_param}, using default 50")
                number = 50
                
            # Process muscle group filter
            muscle_group = request.args.get('muscle_group')
            logger.debug(f"Request {request_id}: Muscle group filter: {muscle_group or 'none'}")
            
            # Convert page parameter and validate
            page_param = request.args.get('page', '0')
            logger.debug(f"Request {request_id}: Raw page parameter: {page_param}")
            
            try:
                page = int(page_param)
                if page < 0:
                    logger.warning(f"Request {request_id}: Negative page value {page}, defaulting to 0")
                    page = 0
            except ValueError:
                logger.warning(f"Request {request_id}: Invalid page parameter format: {page_param}, using default 0")
                page = 0
                
            # Get the search parameter
            search_query = request.args.get('search')
            logger.debug(f"Request {request_id}: Search query: {search_query or 'none'}")
            
            logger.info(f"Request {request_id}: Getting exercises with parameters - number: {number}, muscle_group: {muscle_group}, page: {page}, search: {search_query}")
            
        except Exception as e:
            logger.error(f"Request {request_id}: Error processing query parameters: {str(e)}")
            raise InvalidWorkoutDataError(f"Invalid query parameters: {str(e)}")
            
        # Create workout object and fetch exercises with search parameter
        workout = Workout(user_id=user_id)
        logger.debug(f"Request {request_id}: Fetching exercises from database")
        
        try:
            exercises, next_page = workout.get_exercises(number, muscle_group, page, search_query)
            exercise_count = len(exercises) if exercises else 0
            
            logger.info(f"Request {request_id}: Successfully retrieved {exercise_count} exercises, next page: {next_page}")
            
            # Log some details about the result (without excessive details)
            if exercise_count > 0:
                logger.debug(f"Request {request_id}: First few exercise names: {', '.join([ex.get('name', 'unnamed') for ex in exercises[:3]])}...")
                
                
            return jsonify({"exercises": exercises, "page": next_page}), 200
            
        except Exception as e:
            logger.error(f"Request {request_id}: Database error retrieving exercises: {str(e)}")
            raise DatabaseError(f"Error retrieving exercises: {str(e)}")
    
    except (AuthenticationError, WorkoutError, DatabaseError) as e:
        # These will be handled by the global error handler
        logger.debug(f"Request {request_id}: Re-raising caught exception to global handler: {e.__class__.__name__}")
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error in get_exercises: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise WorkoutException(f"Failed to get exercises: {str(e)}")
    
@app.route('/get_exercise_muscles', methods=['GET'])
def get_exercise_muscles():
    """
    Get muscles associated with a specific exercise.
    
    Returns:
        flask.Response: JSON response with muscle data
    """
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.info(f"Request {request_id}: Processing get_exercise_muscles request")
        
        # Get authorization from header
        key_param = request.headers.get('Authorization')
        logger.debug(f"Request {request_id}: Authorization header: {'present' if key_param else 'missing'}")
        
        if not key_param or not key_param.startswith('ApiKey '):
            logger.warning(f"Request {request_id}: Missing or invalid Authorization header format")
            raise MissingTokenError("Authorization header is required and must start with 'ApiKey '")
                
        key_param = key_param.split(' ')[1]
        logger.info(f"Request {request_id}: API key extracted from header: {key_param}")
            
        # Decode the API key
        try:
            logger.debug(f"Request {request_id}: Decoding base64 key")
            decoded_key = base64.b64decode(key_param).decode('utf-8')
        except Exception as e:
            logger.error(f"Request {request_id}: Failed to decode key: {str(e)}")
            raise InvalidTokenError("Invalid key format - not valid base64")
            
        # Verify key exists in database
        logger.debug(f"Request {request_id}: Verifying key in database")
        user_id = global_func.verify_key(decoded_key)
        
        if not user_id:
            logger.warning(f"Request {request_id}: Invalid authentication key")
            raise InvalidTokenError("Invalid authentication key")
        
        logger.debug(f"Request {request_id}: Successfully authenticated user ID: {user_id}")
        
        # Create workout object and fetch muscles
        workout = Workout(user_id=user_id)
        logger.debug(f"Request {request_id}: Fetching muscles")
        
        try:
            muscles = workout.get_muscles()
            muscle_count = len(muscles) if muscles else 0
            
            logger.info(f"Request {request_id}: Successfully retrieved {muscle_count} muscles")
            return jsonify({"muscles": muscles}), 200
        except Exception as e:
            logger.error(f"Request {request_id}: Database error retrieving muscles: {str(e)}")
            raise DatabaseError(f"Error retrieving muscles: {str(e)}")
    except (AuthenticationError, WorkoutError, DatabaseError) as e:
        # These will be handled by the global error handler
        logger.debug(f"Request {request_id}: Re-raising caught exception to global handler: {e.__class__.__name__}")
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error in get_exercise_muscles: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise WorkoutException(f"Failed to get exercise muscles: {str(e)}")

if __name__ == '__main__':
    logger.info("Starting workout microservice on port 8080")
    app.run(port=8080, host='0.0.0.0', debug=True)