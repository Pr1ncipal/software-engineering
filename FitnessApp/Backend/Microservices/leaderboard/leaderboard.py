import flask
from flask import Flask, request, jsonify
import logging
import traceback
import uuid
import time
import psycopg2
import psycopg2.sql
import datetime
from global_func import verify_key, getConnection
import json
import base64
import leaderboardClass as lbc
from leaderboardErrors import *

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.FileHandler("leaderboard_api.log"),
                        logging.StreamHandler()
                    ])
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Request logger middleware
@app.before_request
def before_request():
    # Generate unique request ID and store it in request
    request.request_id = str(uuid.uuid4())
    request.start_time = time.time()
    logger.info(f"Request {request.request_id}: {request.method} {request.path} - Started")
    logger.debug(f"Request {request.request_id}: Headers: {dict(request.headers)}")
    logger.debug(f"Request {request.request_id}: Query Parameters: {dict(request.args)}")

@app.after_request
def after_request(response):
    # Log request completion with timing and status
    request_id = getattr(request, 'request_id', 'unknown')
    duration = time.time() - getattr(request, 'start_time', time.time())
    logger.info(f"Request {request_id}: {request.method} {request.path} - Completed with status {response.status_code} in {duration:.3f}s")
    return response

# Error handler for custom exceptions
@app.errorhandler(LeaderboardServiceError)
def handle_leaderboard_service_error(error):
    request_id = getattr(request, 'request_id', 'unknown')
    logger.error(f"Request {request_id}: Handled exception: {error.error_code} - {error.message}")
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response

@app.route('/get_leaderboard', methods=['GET'])
def leaderboard():
    """
    Get leaderboard data based on specified parameters.
    
    Query Parameters:
        category: Type of leaderboard (steps, workouts, weight, 1rm, pace)
        days: Number of days to include in the leaderboard
        scope: Scope of the leaderboard (global, friends, etc.)
        key: Authentication key
        workout: Exercise ID for specific exercise leaderboards
        number: Maximum number of entries to return
        
    Returns:
        JSON response with leaderboard data
    """
    request_id = getattr(request, 'request_id', 'unknown')
    logger.info(f"Request {request_id}: Processing leaderboard request")
    
    try:
        # Extract API key from Authorization header
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('ApiKey '):
            logger.warning(f"Request {request_id}: Missing or invalid Authorization header")
            raise AuthenticationError("Authorization header is required and must start with 'ApiKey '")
                
        encoded_key = auth_header.split(' ')[1]
        
        # Decode base64 key
        try:
            logger.debug(f"Request {request_id}: Decoding base64 API key")
            key = base64.b64decode(encoded_key).decode('utf-8')
        except Exception as e:
            logger.warning(f"Request {request_id}: Invalid base64 encoding in API key: {str(e)}")
            raise InvalidKeyError("API key contains invalid base64 encoding")
        
        # Get and validate parameters
        category = request.args.get('category')
        
        # Validate days parameter
        try:
            days = int(request.args.get('days', 30))
            if days <= 0:
                logger.warning(f"Request {request_id}: Invalid days parameter: {days} (must be positive)")
                raise InvalidDateRangeError("Days parameter must be a positive integer")
        except ValueError:
            logger.warning(f"Request {request_id}: Invalid days parameter: {request.args.get('days')}")
            raise InvalidDateRangeError("Days parameter must be a number")
        
        scope = request.args.get('scope')
        workout = request.args.get('workout')
        
        # Validate number parameter
        try:
            number = int(request.args.get('number', 50))
            if number <= 0:
                logger.warning(f"Request {request_id}: Invalid number parameter: {number} (must be positive)")
                raise InvalidNumberError("Number parameter must be a positive integer")
        except ValueError:
            logger.warning(f"Request {request_id}: Invalid number parameter: {request.args.get('number')}")
            raise InvalidNumberError("Number parameter must be a number")
        
        # Validate key presence
        if not key:
            logger.warning(f"Request {request_id}: Empty API key after decoding")
            raise MissingKeyError()
        
        logger.info(f"Request {request_id}: Parameters - category={category}, days={days}, scope={scope}, workout={workout}, number={number}")
        
        # Create leaderboard object and get data
        try:
            logger.debug(f"Request {request_id}: Creating Leaderboard object")
            lb = lbc.Leaderboard(category, days, scope, key, workout, number)
            
            logger.debug(f"Request {request_id}: Fetching leaderboard data")
            leaderboard_data = lb.get_leaderboard()
            
            logger.info(f"Request {request_id}: Successfully retrieved leaderboard data with {len(leaderboard_data) if leaderboard_data else 0} entries")
            return jsonify({'leaderboard': leaderboard_data, 'category': lb.catagory}), 200
            
        except psycopg2.Error as e:
            logger.error(f"Request {request_id}: Database error: {str(e)}")
            if "connection" in str(e).lower():
                raise ConnectionError(str(e))
            else:
                raise QueryError(str(e))
    
    except LeaderboardServiceError:
        # These are already logged and will be handled by the error handler
        raise

    except AuthenticationError:
        raise
    
    except Exception as e:
        logger.error(f"Request {request_id}: Unhandled exception: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise LeaderboardServiceError(f"An unexpected error occurred: {str(e)}")

if __name__ == "__main__":
    logger.info("Starting leaderboard microservice on port 8080")
    app.run(host='0.0.0.0', port=8080, debug=False)