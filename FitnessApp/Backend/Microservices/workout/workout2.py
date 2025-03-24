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

# Configure logging
logging.basicConfig(level=logging.INFO, 
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
    if request.is_json:
        logger.debug(f"Request {request_id}: Extracting JSON data")
        return request.get_json()
    else:
        logger.warning(f"Request {request_id}: Request does not contain valid JSON data")
        raise InvalidWorkoutDataError("Request must contain JSON data")

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
        token_data = get_data_json(request)
        logger.info(f"Request {request_id}: Extracted token data: {token_data["token"][:10]}")
        if not token_data or "token" not in token_data:
            logger.warning(f"Request {request_id}: Missing authentication token")
            raise MissingTokenError("Authentication token is required")
            
        token = token_data["token"]
        logger.debug(f"Request {request_id}: Processing JWT token: {token[:10]}...")
        
        try:
            logger.debug(f"Request {request_id}: Pre-decoding token to extract key")
            payload = jwt.decode(token, options={"verify_signature": False})
        
            if 'key' not in payload:
                logger.warning(f"Request {request_id}: Token doesn't contain a key")
                raise InvalidTokenError("Token doesn't contain a key")
                
            # Decode the base64 key
            try:
                logger.debug(f"Request {request_id}: Decoding base64 key")
                decoded_key = base64.b64decode(payload['key']).decode('utf-8')
            except Exception as e:
                logger.error(f"Request {request_id}: Failed to decode key: {str(e)}")
                raise InvalidTokenError("Invalid key format in token")
                
            # Verify key exists in database
            logger.debug(f"Request {request_id}: Verifying key in database")
            key = global_func.verify_key(decoded_key)
            
            if not key:
                logger.warning(f"Request {request_id}: Invalid key in token: {decoded_key[:10]}...")
                raise InvalidTokenError(f"Invalid authentication key")
        
            # Now decode with verification
            logger.debug(f"Request {request_id}: Decoding token with verification")
            decoded = jwt.decode(token, decoded_key, algorithms=['HS256'])
            logger.info(f"Request {request_id}: Successfully authenticated user ID: {key}")
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
        workout = Workout(
            user_id=key,
            name=data['name'],
            workout_type=data['workoutType'],
            notes=data['notes'],
            averageHR=data['averageHeartRate'],
            exercises=data['exercises']
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
        key_param = request.args.get('key')
        if not key_param:
            logger.warning(f"Request {request_id}: Missing authentication key")
            raise MissingTokenError("Authentication key is required")
            
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
        key_param = request.args.get('key')
        if not key_param:
            logger.warning(f"Request {request_id}: Missing authentication key")
            raise MissingTokenError("Authentication key is required")
            
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
    

if __name__ == '__main__':
    logger.info("Starting workout microservice on port 8080")
    app.run(port=8080, host='0.0.0.0', debug=True)