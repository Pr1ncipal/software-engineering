import psycopg2
from psycopg2 import sql
import logging
import traceback
import time
from datetime import datetime
from WorkoutExceptions import ConnectionError, QueryError, InvalidTokenError

# Setup logger
logger = logging.getLogger(__name__)

DATABASE_URL = "postgresql://postgres:password@postgres:5432/gitfitbro"

def getConnection():
    """
    Establish a connection to the database.
    
    Returns:
        psycopg2.connection: Database connection object
        
    Raises:
        ConnectionError: If unable to connect to the database
    """
    start_time = time.time()
    logger.debug(f"Attempting to connect to database: {DATABASE_URL.split('@')[1]}")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        elapsed = time.time() - start_time
        logger.debug(f"Database connection established successfully in {elapsed:.3f}s")
        return conn
    except psycopg2.Error as e:
        elapsed = time.time() - start_time
        logger.error(f"Failed to connect to database after {elapsed:.3f}s: {str(e)}")
        logger.debug(traceback.format_exc())
        raise ConnectionError(f"Database connection failed: {str(e)}")

def closeConnection(conn, cur=None):
    """
    Close database connection and cursor safely.
    
    Parameters:
    -----------
    conn : psycopg2.connection
        Database connection to close
    cur : psycopg2.cursor, optional
        Database cursor to close
    """
    if cur:
        logger.debug("Closing database cursor")
        try:
            cur.close()
        except Exception as e:
            logger.warning(f"Error closing cursor: {str(e)}")
    
    if conn:
        logger.debug("Closing database connection")
        try:
            conn.close()
        except Exception as e:
            logger.warning(f"Error closing connection: {str(e)}")

def verify_key(key, conn=None, request_id=None):
    """
    Verify an API key by checking if it exists in the database.
    
    Parameters:
    -----------
    key : str
        The API key to verify
    conn : psycopg2.connection, optional
        Database connection (creates one if not provided)
    request_id : str, optional
        Request ID for logging context
        
    Returns:
    --------
    int or None:
        User ID if key is valid, None otherwise
        
    Raises:
    -------
    ConnectionError: If database connection fails
    QueryError: If database query fails
    """
    log_prefix = f"Request {request_id}: " if request_id else ""
    should_close_conn = False
    cur = None
    
    try:
        if not key:
            logger.warning(f"{log_prefix}Cannot verify empty key")
            return None
            
        # Mask most of the key for logging
        masked_key = key[:5] + "..." if len(key) > 8 else "***"
        logger.debug(f"{log_prefix}Verifying API key: {masked_key}")
        
        start_time = time.time()
        
        # Create connection if not provided
        if not conn:
            logger.debug(f"{log_prefix}No connection provided, establishing new database connection")
            conn = getConnection()
            should_close_conn = True
        
        cur = conn.cursor()
        
        # Query to find user by key
        get_id_query = "SELECT id FROM users WHERE key = %s"
        logger.debug(f"{log_prefix}Executing query to verify API key")
        cur.execute(get_id_query, (key,))
        
        result = cur.fetchone()
        
        elapsed = time.time() - start_time
        
        if result:
            user_id = result[0]
            logger.debug(f"{log_prefix}API key verified successfully for user ID {user_id} in {elapsed:.3f}s")
            return user_id
        else:
            logger.warning(f"{log_prefix}Invalid API key: {masked_key} (verification failed in {elapsed:.3f}s)")
            return None
            
    except psycopg2.Error as e:
        logger.error(f"{log_prefix}Database error while verifying API key: {str(e)}")
        logger.debug(traceback.format_exc())
        raise QueryError(f"Error verifying API key: {str(e)}")
    except Exception as e:
        logger.error(f"{log_prefix}Unexpected error verifying API key: {str(e)}")
        logger.debug(traceback.format_exc())
        raise
    finally:
        if cur:
            cur.close()
        if should_close_conn and conn:
            conn.close()
            logger.debug(f"{log_prefix}Closed database connection")

def log_workout_activity(action, workout_id, user_id=None, exercise_id=None, details=None, request_id=None):
    """
    Log a workout-related activity to the database for audit purposes.
    
    Parameters:
    -----------
    action : str
        The action performed (e.g., 'CREATE', 'READ', 'UPDATE', 'DELETE')
    workout_id : int
        ID of the affected workout
    user_id : int, optional
        ID of the user performing the action
    exercise_id : int, optional
        ID of the specific exercise if applicable
    details : dict, optional
        Additional details about the activity
    request_id : str, optional
        Request ID for correlation
        
    Returns:
    --------
    bool:
        True if logging was successful, False otherwise
    """
    log_prefix = f"Request {request_id}: " if request_id else ""
    conn = None
    cur = None
    
    try:
        logger.debug(f"{log_prefix}Logging workout activity: {action} workout {workout_id} by user {user_id}")
        
        # Convert details to string if provided
        details_str = str(details) if details else None
        
        conn = getConnection()
        cur = conn.cursor()
        
        # Insert activity log
        insert_query = """
            INSERT INTO workout_audit_log 
            (action, workout_id, user_id, exercise_id, details, request_id, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        
        cur.execute(insert_query, (
            action,
            workout_id,
            user_id,
            exercise_id,
            details_str,
            request_id,
            datetime.now()
        ))
        
        log_id = cur.fetchone()[0]
        conn.commit()
        
        logger.debug(f"{log_prefix}Workout activity logged successfully with ID {log_id}")
        return True
        
    except Exception as e:
        if conn:
            conn.rollback()
        # Just log the error but don't raise - activity logging should not fail the main operation
        logger.warning(f"{log_prefix}Failed to log workout activity: {str(e)}")
        return False
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

def validate_api_key_from_header(headers, conn=None, request_id=None):
    """
    Extract and validate API key from request headers.
    
    Parameters:
    -----------
    headers : dict
        Request headers containing the Authorization header
    conn : psycopg2.connection, optional
        Database connection (creates one if not provided)
    request_id : str, optional
        Request ID for logging
        
    Returns:
    --------
    int:
        User ID associated with the API key
        
    Raises:
    -------
    MissingTokenError: If Authorization header is missing
    InvalidTokenError: If API key is invalid
    """
    from WorkoutExceptions import MissingTokenError
    
    log_prefix = f"Request {request_id}: " if request_id else ""
    
    # Check for Authorization header
    auth_header = headers.get('Authorization')
    if not auth_header:
        logger.warning(f"{log_prefix}Missing Authorization header")
        raise MissingTokenError("Authorization header is required")
    
    # Extract API key
    try:
        # Expected format: "ApiKey {base64_encoded_key}"
        auth_parts = auth_header.split(' ')
        if len(auth_parts) != 2 or auth_parts[0] != 'ApiKey':
            logger.warning(f"{log_prefix}Invalid Authorization header format")
            raise InvalidTokenError("Invalid Authorization header format. Expected: 'ApiKey {token}'")
        
        # The key is base64 encoded, decode it
        import base64
        try:
            api_key = base64.b64decode(auth_parts[1]).decode('utf-8')
        except Exception as e:
            logger.warning(f"{log_prefix}Failed to decode API key: {str(e)}")
            raise InvalidTokenError("Failed to decode API key")
    
    except Exception as e:
        if not isinstance(e, InvalidTokenError) and not isinstance(e, MissingTokenError):
            logger.error(f"{log_prefix}Error processing Authorization header: {str(e)}")
            raise InvalidTokenError(f"Error processing Authorization header: {str(e)}")
        raise
    
    # Verify the API key
    user_id = verify_key(api_key, conn, request_id)
    if not user_id:
        logger.warning(f"{log_prefix}Invalid API key")
        raise InvalidTokenError("Invalid API key")
    
    logger.info(f"{log_prefix}API key validated successfully for user ID {user_id}")
    return user_id

def execute_query(query, params=None, fetch=True, conn=None, close_conn=True, request_id=None):
    """
    Execute a database query with proper error handling and connection management.
    
    Parameters:
    -----------
    query : str
        SQL query to execute
    params : tuple or dict, optional
        Parameters for the query
    fetch : bool or str, optional
        If True, fetches all results
        If 'one', fetches one result
        If False, doesn't fetch (for INSERT, UPDATE, DELETE)
    conn : psycopg2.connection, optional
        Database connection (creates one if not provided)
    close_conn : bool, optional
        Whether to close the connection after execution
    request_id : str, optional
        Request ID for logging
        
    Returns:
    --------
    list or dict or None:
        Query results if fetch is True or 'one'
        
    Raises:
    -------
    ConnectionError: If database connection fails
    QueryError: If database query fails
    """
    log_prefix = f"Request {request_id}: " if request_id else ""
    should_close_conn = close_conn and not conn
    cur = None
    start_time = time.time()
    
    try:
        # Create connection if not provided
        if not conn:
            conn = getConnection()
        
        cur = conn.cursor()
        
        # Log query (masked parameters for security)
        masked_params = "***" if params else None
        logger.debug(f"{log_prefix}Executing query: {query} with params: {masked_params}")
        
        # Execute query
        cur.execute(query, params)
        
        # Handle result based on fetch parameter
        result = None
        if fetch == 'one':
            result = cur.fetchone()
        elif fetch:
            result = cur.fetchall()
        else:
            conn.commit()
        
        elapsed = time.time() - start_time
        logger.debug(f"{log_prefix}Query executed successfully in {elapsed:.3f}s")
        
        return result
        
    except psycopg2.Error as e:
        if conn and not conn.closed:
            conn.rollback()
        logger.error(f"{log_prefix}Database query error: {str(e)}")
        logger.debug(f"{log_prefix}Failed query: {query}")
        logger.debug(traceback.format_exc())
        raise QueryError(f"Database query failed: {str(e)}")
    except Exception as e:
        if conn and not conn.closed:
            conn.rollback()
        logger.error(f"{log_prefix}Unexpected error during query execution: {str(e)}")
        logger.debug(traceback.format_exc())
        raise
    finally:
        if cur:
            cur.close()
        if should_close_conn and conn and not conn.closed:
            conn.close()
            logger.debug(f"{log_prefix}Closed database connection")