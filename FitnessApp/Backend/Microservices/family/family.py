# Family microservice
# This microservice manages family connections, requests, and memberships in the fitness app
# The service allows creating families, sending join requests, accepting requests, and managing family members
# The microservice is running on port 5000.

from flask import Flask, request, jsonify
import psycopg2
from psycopg2 import sql
from psycopg2.extras import RealDictCursor
import jwt
import traceback
import logging
import time
import uuid
import base64
import datetime
import sys
import os
# importing custom modules
import global_func
from familyErrors import *
from familyClass import Family

# Configure logging
logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.FileHandler("family_api.log"),
                        logging.StreamHandler()
                    ])
logger = logging.getLogger("Family")

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
        # Log JSON payloads
        safe_data = request.get_json(silent=True)
        if isinstance(safe_data, dict):
            # Redact sensitive fields if needed
            safe_copy = safe_data.copy()
            logger.debug(f"Request {request.request_id}: JSON payload: {safe_copy}")
    elif request.args:
        # Log query parameters
        logger.debug(f"Request {request.request_id}: Query parameters: {request.args}")

@app.after_request
def after_request(response):
    # Log request completion with timing and status
    duration = time.time() - request.start_time
    logger.info(f"Request {getattr(request, 'request_id', 'unknown')}: {request.method} {request.path} - Completed with status {response.status_code} in {duration:.3f}s")
    return response

# Error handler for custom exceptions
@app.errorhandler(FamilyServiceError)
def handle_family_service_error(error):
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
        InvalidFamilyDataError: If request doesn't contain valid JSON
    """
    request_id = getattr(request, 'request_id', 'unknown')
    if request.is_json:
        logger.debug(f"Request {request_id}: Extracting JSON data")
        return request.get_json()
    else:
        logger.warning(f"Request {request_id}: Request does not contain valid JSON data")
        raise InvalidFamilyDataError("Request must contain JSON data")
    
def get_data_jwt(request):
    """
    Extract and validate JWT token from the request.
    
    Args:
        request (flask.Request): The Flask request object
        
    Returns:
        tuple: (decoded data, user_id)
        
    Raises:
        MissingTokenError: If token is missing
        InvalidTokenError: If token is invalid
        ExpiredTokenError: If token is expired
        FamilyServiceError: For unexpected errors
    """
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.debug(f"Request {request_id}: Extracting JWT token")
        data = get_data_json(request)
        token = data.get('token')
        
        if not token:
            logger.warning(f"Request {request_id}: Missing JWT token")
            raise MissingTokenError("JWT token is required")
        
        try:
            # Get API key from authorization header
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('ApiKey '):
                logger.warning(f"Request {request_id}: Missing or invalid Authorization header")
                raise MissingTokenError("Authorization header is required and must start with 'ApiKey '")
                
            encoded_key = auth_header.split(' ')[1]
            
            try:
                # Decode the base64 API key
                api_key = base64.b64decode(encoded_key).decode('utf-8')
            except Exception as e:
                logger.error(f"Request {request_id}: Failed to decode API key: {str(e)}")
                raise InvalidTokenError(f"Invalid API key format: {str(e)}")
            
            # Verify API key and get user ID
            logger.debug(f"Request {request_id}: Verifying API key in database")
            user_id = global_func.verify_key(api_key)
            
            if not user_id:
                logger.warning(f"Request {request_id}: Invalid API key")
                raise InvalidTokenError("The provided API key is invalid or does not exist")
            
            # Decode and verify the JWT token
            logger.debug(f"Request {request_id}: Decoding JWT token with verification")
            decoded = jwt.decode(token, api_key, algorithms=['HS256'])
            
            # Check if the token has an expiration
            if 'exp' in decoded and decoded['exp'] < time.time():
                logger.warning(f"Request {request_id}: JWT token has expired")
                raise ExpiredTokenError()
            
            logger.info(f"Request {request_id}: Successfully decoded JWT for user ID: {user_id}")
            return decoded, user_id
        
        except jwt.ExpiredSignatureError:
            logger.warning(f"Request {request_id}: JWT token has expired")
            raise ExpiredTokenError()
        
        except jwt.InvalidTokenError as e:
            logger.warning(f"Request {request_id}: Invalid JWT token: {str(e)}")
            raise InvalidTokenError(f"Invalid JWT token: {str(e)}")
        
    except (MissingTokenError, InvalidTokenError, ExpiredTokenError):
        # Re-raise these authentication exceptions
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error processing JWT: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise FamilyServiceError(f"Error processing JWT: {str(e)}")

def get_auth_key(request):
    """
    Extract and validate authentication key from request headers.
    
    Args:
        request (flask.Request): The Flask request object
        
    Returns:
        str: The user key
        
    Raises:
        AuthenticationError: If authentication fails
    """
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.debug(f"Request {request_id}: Extracting authentication key")
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('ApiKey '):
            logger.warning(f"Request {request_id}: Missing or invalid Authorization header")
            raise MissingTokenError("Authorization header is required and must start with 'ApiKey '")
            
        encoded_key = auth_header.split(' ')[1]
        
        try:
            key = base64.b64decode(encoded_key).decode('utf-8')
        except Exception as e:
            logger.error(f"Request {request_id}: Failed to decode API key: {str(e)}")
            raise InvalidTokenError(f"Invalid API key format: {str(e)}")
            
        # Verify key exists in database
        logger.debug(f"Request {request_id}: Verifying key in database")
        user_id = global_func.verify_key(key)
        
        if not user_id:
            logger.warning(f"Request {request_id}: Invalid authentication key")
            raise InvalidTokenError("The provided key is invalid or does not exist")
            
        logger.info(f"Request {request_id}: Successfully authenticated user ID: {user_id}")
        return user_id
        
    except (MissingTokenError, InvalidTokenError):
        # Re-raise these authentication exceptions
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error in authentication: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise AuthenticationError(f"Authentication error: {str(e)}")

@app.route('/create_family', methods=['POST'])
def create_family():
    """
    Create a new family with the authenticated user as admin.
    
    Returns:
        flask.Response: JSON response with family creation status
    """
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.info(f"Request {request_id}: Processing create_family request")
        data = get_data_jwt(request)
        user_id = get_auth_key(request)
        
        # Validate required fields
        if 'family_name' not in data:
            logger.warning(f"Request {request_id}: Missing required field: family_name")
            raise MissingRequiredFieldError("family_name")
            
        family_name = data['family_name']
        logger.debug(f"Request {request_id}: Creating family '{family_name}' with admin user ID: {user_id}")
        
        # Create family object
        family = Family(name=family_name, admin_id=user_id)
        
        # Create the family in database
        family_id = family.create_family()
        
        logger.info(f"Request {request_id}: Successfully created family with ID: {family_id}")
        return jsonify({
            "message": "Family created successfully",
            "family_id": family_id,
            "family_name": family_name
        }), 201
        
    except FamilyAlreadyExistsError:
        logger.warning(f"Request {request_id}: Family '{data.get('family_name')}' already exists")
        raise
    except (MissingRequiredFieldError, AuthenticationError, DatabaseError):
        # Re-raise these specific exceptions
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise FamilyServiceError(f"An unexpected error occurred: {str(e)}")

@app.route('/create_family_request', methods=['POST'])
def create_family_request():
    """
    Create a request to add a user to a family.
    
    Returns:
        flask.Response: JSON response with request creation status
    """
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.info(f"Request {request_id}: Processing create_family_request")
        data = get_data_json(request)
        sender_id = get_auth_key(request)
        
        # Validate required fields
        required_fields = ['family_name', 'receiver_username']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            logger.warning(f"Request {request_id}: Missing required fields: {missing_fields}")
            raise MissingRequiredFieldError(", ".join(missing_fields))
            
        family_name = data['family_name']
        receiver_username = data['receiver_username']
        
        logger.debug(f"Request {request_id}: Creating family request to add {receiver_username} to family '{family_name}'")
        
        # Create family object
        family = Family(name=family_name)
        
        # Check if sender is admin
        if not family.is_admin(sender_id):
            logger.warning(f"Request {request_id}: User {sender_id} is not admin of family '{family_name}'")
            raise NotFamilyAdminError()
        
        # Send the request
        request_id = family.send_request(receiver_username=receiver_username, sender_id=sender_id)
        
        logger.info(f"Request {request_id}: Successfully created family request ID: {request_id}")
        return jsonify({
            "message": "Family join request sent successfully", 
            "request_id": request_id
        }), 201
        
    except (FamilyNotFoundError, UserNotFoundError, RequestAlreadyExistsError):
        # These will be logged by their exception handlers
        raise
    except (MissingRequiredFieldError, AuthenticationError, NotFamilyAdminError):
        # Re-raise these specific exceptions
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise FamilyServiceError(f"An unexpected error occurred: {str(e)}")

@app.route('/accept_family_request', methods=['PUT'])
def accept_family_request():
    """
    Accept or reject a family join request.
    
    Returns:
        flask.Response: JSON response with request acceptance status
    """
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.info(f"Request {request_id}: Processing accept_family_request")
        data = get_data_json(request)
        user_id = get_auth_key(request)
        
        # Validate required fields
        required_fields = ['request_id', 'accept']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            logger.warning(f"Request {request_id}: Missing required fields: {missing_fields}")
            raise MissingRequiredFieldError(", ".join(missing_fields))
            
        family_request_id = data['request_id']
        accept = data['accept']
        
        logger.debug(f"Request {request_id}: User {user_id} {'accepting' if accept else 'rejecting'} family request {family_request_id}")
        
        # Process the request
        family = Family()
        family.process_request(request_id=family_request_id, user_id=user_id, accept=accept)
        
        logger.info(f"Request {request_id}: Successfully {'accepted' if accept else 'rejected'} family request {family_request_id}")
        return jsonify({
            "message": f"Family request {'accepted' if accept else 'rejected'} successfully"
        }), 200
        
    except (RequestNotFoundError, NotRequestRecipientError):
        # These will be logged by their exception handlers
        raise
    except (MissingRequiredFieldError, AuthenticationError):
        # Re-raise these specific exceptions
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise FamilyServiceError(f"An unexpected error occurred: {str(e)}")

@app.route('/delete_family', methods=['DELETE'])
def delete_family():
    """
    Delete a family and all its members.
    
    Returns:
        flask.Response: JSON response with family deletion status
    """
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.info(f"Request {request_id}: Processing delete_family request")
        data = get_data_json(request)
        user_id = get_auth_key(request)
        
        # Validate required fields
        if 'family_id' not in data and 'family_name' not in data:
            logger.warning(f"Request {request_id}: Missing required field: family_id or family_name")
            raise MissingRequiredFieldError("family_id or family_name")
            
        family_id = data.get('family_id')
        family_name = data.get('family_name')
        
        # Create family object
        family = Family(id=family_id, name=family_name)
        
        # Check if user is admin
        if not family.is_admin(user_id):
            logger.warning(f"Request {request_id}: User {user_id} is not admin of family {family_id or family_name}")
            raise NotFamilyAdminError()
            
        # Delete the family
        logger.debug(f"Request {request_id}: Deleting family {family_id or family_name}")
        family.delete()
        
        logger.info(f"Request {request_id}: Successfully deleted family {family_id or family_name}")
        return jsonify({"message": "Family deleted successfully"}), 200
        
    except FamilyNotFoundError:
        # This will be logged by its exception handler
        raise
    except (MissingRequiredFieldError, AuthenticationError, NotFamilyAdminError):
        # Re-raise these specific exceptions
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise FamilyServiceError(f"An unexpected error occurred: {str(e)}")

@app.route('/get_family_members', methods=['GET'])
def get_family_members():
    """
    Get the members of a family.
    
    Returns:
        flask.Response: JSON response with family members
    """
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.info(f"Request {request_id}: Processing get_family_members request")
        user_id = get_auth_key(request)
        
        # Get family identifier from query parameters
        family_id = request.args.get('family_id')
        family_name = request.args.get('family_name')
        
        if not family_id and not family_name:
            logger.warning(f"Request {request_id}: Missing required parameter: family_id or family_name")
            raise MissingRequiredFieldError("family_id or family_name in query parameters")
            
        # Create family object
        family = Family(id=family_id, name=family_name)
        
        # Get members
        logger.debug(f"Request {request_id}: Getting members of family {family_id or family_name}")
        members = family.get_members()
        
        logger.info(f"Request {request_id}: Successfully retrieved {len(members)} members of family {family_id or family_name}")
        return jsonify({
            "family_id": family.id,
            "family_name": family.name,
            "members": members
        }), 200
        
    except FamilyNotFoundError:
        # This will be logged by its exception handler
        raise
    except AuthenticationError:
        # Re-raise these specific exceptions
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise FamilyServiceError(f"An unexpected error occurred: {str(e)}")

@app.route('/remove_family_member', methods=['DELETE'])
def remove_family_member():
    """
    Remove a member from a family.
    
    Returns:
        flask.Response: JSON response with member removal status
    """
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.info(f"Request {request_id}: Processing remove_family_member request")
        data = get_data_json(request)
        admin_id = get_auth_key(request)
        
        # Validate required fields
        if ('family_id' not in data and 'family_name' not in data) or 'user_id' not in data:
            missing = []
            if 'family_id' not in data and 'family_name' not in data:
                missing.append('family_id or family_name')
            if 'user_id' not in data:
                missing.append('user_id')
            logger.warning(f"Request {request_id}: Missing required fields: {', '.join(missing)}")
            raise MissingRequiredFieldError(", ".join(missing))
            
        family_id = data.get('family_id')
        family_name = data.get('family_name')
        user_id = data.get('user_id')
        
        # Create family object
        family = Family(id=family_id, name=family_name)
        
        # Check if user is admin
        if not family.is_admin(admin_id):
            logger.warning(f"Request {request_id}: User {admin_id} is not admin of family {family_id or family_name}")
            raise NotFamilyAdminError()
            
        # Check if trying to remove admin
        if int(user_id) == int(family.admin_id):
            logger.warning(f"Request {request_id}: Cannot remove admin from family")
            raise CannotRemoveAdminError()
            
        # Remove member
        logger.debug(f"Request {request_id}: Removing user {user_id} from family {family_id or family_name}")
        family.remove_member(user_id)
        
        logger.info(f"Request {request_id}: Successfully removed user {user_id} from family {family_id or family_name}")
        return jsonify({"message": "User removed from family successfully"}), 200
        
    except (FamilyNotFoundError, UserNotInFamilyError):
        # These will be logged by their exception handlers
        raise
    except (MissingRequiredFieldError, AuthenticationError, NotFamilyAdminError, CannotRemoveAdminError):
        # Re-raise these specific exceptions
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise FamilyServiceError(f"An unexpected error occurred: {str(e)}")

@app.route('/edit_family_admin', methods=['PUT'])
def edit_family_admin():
    """
    Change the admin of a family.
    
    Returns:
        flask.Response: JSON response with admin change status
    """
    request_id = getattr(request, 'request_id', 'unknown')
    try:
        logger.info(f"Request {request_id}: Processing edit_family_admin request")
        data = get_data_json(request)
        current_admin_id = get_auth_key(request)
        
        # Validate required fields
        required_fields = ['family_name', 'new_admin_username']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            logger.warning(f"Request {request_id}: Missing required fields: {missing_fields}")
            raise MissingRequiredFieldError(", ".join(missing_fields))
            
        family_name = data['family_name']
        new_admin_username = data['new_admin_username']
        
        # Create family object
        family = Family(name=family_name)
        
        # Check if user is admin
        if not family.is_admin(current_admin_id):
            logger.warning(f"Request {request_id}: User {current_admin_id} is not admin of family '{family_name}'")
            raise NotFamilyAdminError()
            
        # Change admin
        logger.debug(f"Request {request_id}: Changing admin of family '{family_name}' to user '{new_admin_username}'")
        family.change_admin(new_admin_username)
        
        logger.info(f"Request {request_id}: Successfully changed admin of family '{family_name}' to '{new_admin_username}'")
        return jsonify({"message": "Family admin updated successfully"}), 200
        
    except (FamilyNotFoundError, UserNotFoundError, UserNotInFamilyError):
        # These will be logged by their exception handlers
        raise
    except (MissingRequiredFieldError, AuthenticationError, NotFamilyAdminError):
        # Re-raise these specific exceptions
        raise
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error: {str(e)}")
        logger.error(f"Request {request_id}: {traceback.format_exc()}")
        raise FamilyServiceError(f"An unexpected error occurred: {str(e)}")

if __name__ == '__main__':
    logger.info("Starting family microservice on port 5000")
    app.run(host='0.0.0.0', port=8080, debug=True)