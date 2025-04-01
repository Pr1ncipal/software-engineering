import psycopg2
from psycopg2 import sql
import logging
import traceback
import time
from datetime import datetime
from userErrors import *

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

def closeConnection(conn, cur):
    """
    Close database connection and cursor safely.
    
    Parameters:
    -----------
    conn : psycopg2.connection
        Database connection to close
    cur : psycopg2.cursor
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
        get_id_query = sql.SQL("SELECT id FROM users WHERE key = %s")
        logger.debug(f"{log_prefix}Executing query to verify API key")
        cur.execute(get_id_query, (key,))
        logger.info(f'{log_prefix}{cur.query.decode("utf-8")}')

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

def log_transaction(action, object_type, object_id, user_id=None, details=None, request_id=None):
    """
    Log a transaction to the database for audit purposes.
    
    Parameters:
    -----------
    action : str
        The action performed (e.g., 'CREATE', 'READ', 'UPDATE', 'DELETE')
    object_type : str
        Type of object affected (e.g., 'USER', 'WORKOUT', 'STATS')
    object_id : int or str
        ID of the affected object
    user_id : int, optional
        ID of the user performing the action
    details : dict, optional
        Additional details about the transaction
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
        logger.debug(f"{log_prefix}Logging transaction: {action} {object_type} {object_id} by user {user_id}")
        
        # Convert details to string if provided
        details_str = str(details) if details else None
        
        conn = getConnection()
        cur = conn.cursor()
        
        # Insert transaction log
        insert_query = sql.SQL("""
            INSERT INTO audit_log 
            (action, object_type, object_id, user_id, details, request_id, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """)
        
        cur.execute(insert_query, (
            action,
            object_type,
            str(object_id),
            user_id,
            details_str,
            request_id,
            datetime.now()
        ))
        
        conn.commit()
        logger.debug(f"{log_prefix}Transaction logged successfully")
        return True
        
    except Exception as e:
        if conn:
            conn.rollback()
        # Just log the error but don't raise - transaction logging should not fail the main operation
        logger.warning(f"{log_prefix}Failed to log transaction: {str(e)}")
        return False
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()