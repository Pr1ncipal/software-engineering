from flask import Flask, request, jsonify
import psycopg2
from psycopg2 import sql
import workoutClass
import json
from heuristic import main
import jwt
import global_func
import logging
import base64
from WorkoutExceptions import *

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

# Error handler for custom exceptions
@app.errorhandler(WorkoutException)
def handle_workout_exception(error):
    """
    Global error handler for WorkoutException and its subclasses.
    
    Args:
        error (WorkoutException): The caught exception
        
    Returns:
        flask.Response: JSON response with error details
    """
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
    if request.is_json:
        return request.get_json()
    else:
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
    try:
        token_data = get_data_json(request)
        if not token_data or "token" not in token_data:
            raise MissingTokenError("Authentication token is required")
            
        token = token_data["token"]
        logger.debug(f"Processing JWT token: {token[:10]}...")
        
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
        
            if 'key' not in payload:
                raise InvalidTokenError("Token doesn't contain a key")
                
            # Decode the base64 key
            try:
                decoded_key = base64.b64decode(payload['key']).decode('utf-8')
            except Exception as e:
                logger.error(f"Failed to decode key: {str(e)}")
                raise InvalidTokenError("Invalid key format in token")
                
            # Verify key exists in database
            key = global_func.verify_key(decoded_key)
            
            if not key:
                logger.warning(f"Invalid key in token: {decoded_key[:10]}...")
                raise InvalidTokenError(f"Invalid authentication key")
        
            # Now decode with verification
            decoded = jwt.decode(token, decoded_key, algorithms=['HS256'])
            return decoded, key
            
        except jwt.ExpiredSignatureError:
            logger.warning("Expired JWT token")
            raise ExpiredTokenError()
        except jwt.InvalidTokenError as e: 
            logger.warning(f"Invalid JWT token: {str(e)}")
            raise InvalidTokenError(str(e))
            
    except (MissingTokenError, InvalidTokenError, ExpiredTokenError):
        # Re-raise these authentication exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing JWT: {str(e)}")
        raise AuthenticationError(f"Authentication error: {str(e)}")

@app.route('/add_workout', methods=['POST'])
def add_workout():
    """
    Add a new workout with exercises.
    
    Returns:
        flask.Response: JSON response
    """
    try:
        data, key = get_data_jwt(request)
        
        if not data:
            raise InvalidWorkoutDataError("No workout data provided")
            
        # Validate required fields
        required_fields = ['workoutType', 'exercises']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            raise MissingRequiredFieldError(", ".join(missing_fields))

        # Create workout object
        workout = workoutClass.Workout(
            user_id=key,
            name=data.get('name', f"{data['workoutType']} Workout"),
            workout_type=data['workoutType'],
            notes=data.get('notes', ''),
            average_heart_rate=data.get('averageHeartRate'),
            exercises=data['exercises']
        )
        
        # Insert workout
        workout_id = workout.insertWorkout()
        return jsonify({
            "message": "Workout added successfully",
            "workout_id": workout_id
        }), 201
    
    except (AuthenticationError, WorkoutError, DatabaseError) as e:
        # These will be handled by the global error handler
        raise
    except Exception as e:
        logger.error(f"Unexpected error in add_workout: {str(e)}")
        raise WorkoutException(f"Failed to add workout: {str(e)}")

@app.route('/get_workouts', methods=['GET'])
def get_workouts():
    """
    Get workouts for the authenticated user.
    
    Returns:
        flask.Response: JSON response with workouts
    """
    try:
        # Get key from query parameters
        key_param = request.args.get('key')
        if not key_param:
            raise MissingTokenError("Authentication key is required")
            
        try:
            decoded_key = base64.b64decode(key_param).decode('utf-8')
        except Exception as e:
            logger.error(f"Failed to decode key: {str(e)}")
            raise InvalidTokenError("Invalid key format")
            
        # Verify key exists in database
        user_id = global_func.verify_key(decoded_key)
        
        if not user_id:
            raise InvalidTokenError("Invalid authentication key")
            
        # Get page parameter
        try:
            page = int(request.args.get('page', 0))
            if page < 0:
                page = 0
        except ValueError:
            raise InvalidWorkoutDataError("Page parameter must be an integer")
        
        workouts = workoutClass.Workout(user_id=user_id)
        exercises, nextPage = workouts.getWorkouts(page)
        return jsonify({"exercises":exercises, "page": nextPage}), 200
    
    except (AuthenticationError, WorkoutError, DatabaseError) as e:
        # These will be handled by the global error handler
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_workouts: {str(e)}")
        raise WorkoutException(f"Failed to get workouts: {str(e)}")
    
@app.route('/get_workout_stats', methods=['GET'])
def get_workout_stats():
    """
    Get workout statistics for a specific exercise and timeframe.
    
    Returns:
        flask.Response: JSON response with workout statistics
    """
    try:
        # Get key from query parameters
        key_param = request.args.get('key')
        if not key_param:
            raise MissingTokenError("Authentication key is required")
            
        try:
            decoded_key = base64.b64decode(key_param).decode('utf-8')
        except Exception as e:
            logger.error(f"Failed to decode key: {str(e)}")
            raise InvalidTokenError("Invalid key format")
            
        # Verify key exists in database
        user_id = global_func.verify_key(decoded_key)
        
        if not user_id:
            raise InvalidTokenError("Invalid authentication key")
            
        # Get exercise and timeframe parameters
        exercise = request.args.get('workout')
        if not exercise:
            raise InvalidWorkoutDataError("Workout parameter is required")
        
        try:
            timeframe = int(request.args.get('timeframe', 30))
        except ValueError:
            raise InvalidWorkoutDataError("Timeframe parameter must be an integer")
        
        workout = workoutClass.Workout(user_id=user_id)
        stats = workout.getWorkoutStats(exercise, timeframe)
        return jsonify({"exercises":stats}), 200
    
    except (AuthenticationError, WorkoutError, DatabaseError) as e:
        # These will be handled by the global error handler
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_workout_stats: {str(e)}")
        raise WorkoutException(f"Failed to get workout stats: {str(e)}")
    

if __name__ == '__main__':
    app.run(port=8080, host='0.0.0.0')