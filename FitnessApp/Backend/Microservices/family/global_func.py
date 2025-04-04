"""
Global functions used across microservices.
This module provides common utilities and functions that are needed by multiple microservices.
"""

import os
import jwt
import json
import uuid
import datetime
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
import traceback

# Configure logging
logger = logging.getLogger("GlobalFunctions")
logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.FileHandler("global_functions.log"),
                        logging.StreamHandler()
                    ])

# Database configuration
DB_CONFIG = {
    "host": "postgres",
    "database": "gitfitbro",
    "user": 'postgres',
    "password": 'password',
    "port": '5432'
}

# JWT configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your_super_secret_key")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION = 24 * 60 * 60  # 24 hours in seconds

def getConnection():
    """
    Get a connection to the database.
    
    Returns:
        psycopg2.connection: Database connection
        
    Raises:
        ConnectionError: If connection to database fails
    """
    try:
        logger.debug("Connecting to database")
        conn = psycopg2.connect(
            host=DB_CONFIG["host"],
            database=DB_CONFIG["database"],
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            port=DB_CONFIG["port"]
        )
        logger.debug("Database connection successful")
        return conn
    except psycopg2.Error as e:
        logger.error(f"Database connection error: {str(e)}")
        raise ConnectionError(f"Could not connect to database: {str(e)}")

def verify_key(api_key):
    """
    Verify if an API key is valid and return associated user ID.
    
    Args:
        api_key (str): The API key to verify
        
    Returns:
        int: User ID associated with the key, or None if invalid
    """
    try:
        logger.debug("Verifying API key")
        conn = getConnection()
        cur = conn.cursor()
        
        # Query to check if the API key exists and get associated user ID
        cur.execute(
            "SELECT id FROM users WHERE key = %s",
            (api_key,)
        )
        
        result = cur.fetchone()
        
        if result:
            user_id = result[0]
            logger.debug(f"API key verified for user ID: {user_id}")
            return user_id
        else:
            logger.warning("Invalid or expired API key")
            return None
            
    except Exception as e:
        logger.error(f"Error verifying API key: {str(e)}")
        return None
    finally:
        if 'cur' in locals() and cur:
            cur.close()
        if 'conn' in locals() and conn:
            conn.close()

def encode_token(payload, expiration=JWT_EXPIRATION):
    """
    Encode a JWT token with the given payload.
    
    Args:
        payload (dict): Data to include in the token
        expiration (int, optional): Token expiration time in seconds
        
    Returns:
        str: Encoded JWT token
    """
    try:
        logger.debug("Creating JWT token")
        # Add standard claims
        token_data = payload.copy()
        token_data.update({
            "exp": datetime.datetime.utcnow() + datetime.timedelta(seconds=expiration),
            "iat": datetime.datetime.utcnow(),
            "jti": str(uuid.uuid4())
        })
        
        # Encode the token
        token = jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)
        logger.debug("JWT token created successfully")
        return token
        
    except Exception as e:
        logger.error(f"Error creating JWT token: {str(e)}")
        raise

def decode_token(token):
    """
    Decode and verify a JWT token.
    
    Args:
        token (str): JWT token to decode
        
    Returns:
        dict: Decoded payload
        
    Raises:
        jwt.InvalidTokenError: If token is invalid
        jwt.ExpiredSignatureError: If token has expired
    """
    try:
        logger.debug("Decoding JWT token")
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        logger.debug("JWT token decoded successfully")
        return payload
        
    except jwt.ExpiredSignatureError as e:
        logger.warning(f"JWT token expired: {str(e)}")
        raise
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid JWT token: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error decoding JWT token: {str(e)}")
        raise

def get_user_by_id(user_id):
    """
    Get user details by user ID.
    
    Args:
        user_id (int): User ID to look up
        
    Returns:
        dict: User details or None if not found
    """
    try:
        logger.debug(f"Looking up user with ID: {user_id}")
        conn = getConnection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute(
            """SELECT id, username, email, first_name, last_name, 
                     date_joined, last_login FROM users WHERE id = %s""",
            (user_id,)
        )
        
        user = cur.fetchone()
        
        if user:
            logger.debug(f"Found user with ID: {user_id}")
            return user
        else:
            logger.warning(f"No user found with ID: {user_id}")
            return None
            
    except Exception as e:
        logger.error(f"Error getting user by ID: {str(e)}")
        return None
    finally:
        if 'cur' in locals() and cur:
            cur.close()
        if 'conn' in locals() and conn:
            conn.close()

def get_user_by_username(username):
    """
    Get user details by username.
    
    Args:
        username (str): Username to look up
        
    Returns:
        dict: User details or None if not found
    """
    try:
        logger.debug(f"Looking up user with username: {username}")
        conn = getConnection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute(
            """SELECT id, username, email, first_name, last_name, 
                     date_joined, last_login FROM users WHERE username = %s""",
            (username,)
        )
        
        user = cur.fetchone()
        
        if user:
            logger.debug(f"Found user with username: {username}")
            return user
        else:
            logger.warning(f"No user found with username: {username}")
            return None
            
    except Exception as e:
        logger.error(f"Error getting user by username: {str(e)}")
        return None
    finally:
        if 'cur' in locals() and cur:
            cur.close()
        if 'conn' in locals() and conn:
            conn.close()

def create_api_key(user_id, expires_in_days=30):
    """
    Create a new API key for a user.
    
    Args:
        user_id (int): User ID to create key for
        expires_in_days (int, optional): Number of days until key expires
        
    Returns:
        str: The generated API key or None if failed
    """
    try:
        logger.debug(f"Creating new API key for user ID: {user_id}")
        conn = getConnection()
        cur = conn.cursor()
        
        # Generate a unique key
        api_key = str(uuid.uuid4())
        
        # Calculate expiration date
        expires_at = datetime.datetime.now() + datetime.timedelta(days=expires_in_days)
        
        # Insert the new key
        cur.execute(
            "INSERT INTO api_keys (user_id, key, created_at, expires_at) VALUES (%s, %s, %s, %s)",
            (user_id, api_key, datetime.datetime.now(), expires_at)
        )
        
        conn.commit()
        logger.debug(f"API key created for user ID: {user_id}")
        return api_key
        
    except Exception as e:
        logger.error(f"Error creating API key: {str(e)}")
        if 'conn' in locals() and conn:
            conn.rollback()
        return None
    finally:
        if 'cur' in locals() and cur:
            cur.close()
        if 'conn' in locals() and conn:
            conn.close()

def revoke_api_key(api_key):
    """
    Revoke an API key by setting its expiration to now.
    
    Args:
        api_key (str): The API key to revoke
        
    Returns:
        bool: True if key was found and revoked, False otherwise
    """
    try:
        logger.debug(f"Revoking API key")
        conn = getConnection()
        cur = conn.cursor()
        
        # Set expiration to now
        cur.execute(
            "UPDATE api_keys SET expires_at = NOW() WHERE key = %s",
            (api_key,)
        )
        
        revoked = cur.rowcount > 0
        conn.commit()
        
        if revoked:
            logger.debug("API key revoked successfully")
        else:
            logger.warning("API key not found for revocation")
            
        return revoked
        
    except Exception as e:
        logger.error(f"Error revoking API key: {str(e)}")
        if 'conn' in locals() and conn:
            conn.rollback()
        return False
    finally:
        if 'cur' in locals() and cur:
            cur.close()
        if 'conn' in locals() and conn:
            conn.close()

def log_api_call(user_id, service, endpoint, request_id=None, status_code=200):
    """
    Log an API call to the database for monitoring and analytics.
    
    Args:
        user_id (int): User ID making the call
        service (str): Service name (e.g., 'auth', 'user', 'workout')
        endpoint (str): Endpoint called (e.g., '/login', '/get_profile')
        request_id (str, optional): Unique request ID for tracking
        status_code (int, optional): HTTP status code of the response
        
    Returns:
        bool: True if log was created, False otherwise
    """
    try:
        logger.debug(f"Logging API call for user {user_id} to {service}/{endpoint}")
        conn = getConnection()
        cur = conn.cursor()
        
        cur.execute(
            """INSERT INTO api_logs 
               (user_id, service, endpoint, request_id, timestamp, status_code) 
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (user_id, service, endpoint, request_id, datetime.datetime.now(), status_code)
        )
        
        conn.commit()
        logger.debug("API call logged successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error logging API call: {str(e)}")
        if 'conn' in locals() and conn:
            conn.rollback()
        return False
    finally:
        if 'cur' in locals() and cur:
            cur.close()
        if 'conn' in locals() and conn:
            conn.close()

def sanitize_input(input_str):
    """
    Sanitize input strings to prevent SQL injection.
    
    Args:
        input_str (str): String to sanitize
        
    Returns:
        str: Sanitized string
    """
    if input_str is None:
        return None
        
    # Remove common SQL injection patterns
    sanitized = input_str.replace("'", "''")
    sanitized = sanitized.replace(";", "")
    sanitized = sanitized.replace("--", "")
    sanitized = sanitized.replace("/*", "")
    sanitized = sanitized.replace("*/", "")
    
    return sanitized