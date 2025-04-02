"""
Family class implementation for the Family microservice.
This module provides the core functionality for family operations.
"""

import psycopg2
from psycopg2 import sql
from psycopg2.extras import RealDictCursor
import logging
import traceback
import datetime
import sys
import os

# Add parent directory to path to import global functions
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import global_func
from familyErrors import *

# Set up logger
logger = logging.getLogger("Family")

class Family:
    """
    Class representing a family in the fitness application.
    
    Provides functionality for:
    - Creating and deleting families
    - Managing family members
    - Processing join requests
    - Changing family admin
    """
    
    def __init__(self, id=None, name=None, admin_id=None):
        """
        Initialize a family instance.
        
        Args:
            id (int, optional): Family ID
            name (str, optional): Family name
            admin_id (int, optional): ID of family admin
        """
        self.id = id
        self.name = name
        self.admin_id = admin_id
        
        # Load family data if id or name is provided
        if id or name:
            self.load()
    
    def load(self, conn=None):
        """
        Load family data from the database.
        
        Args:
            conn (psycopg2.connection, optional): Database connection
            
        Raises:
            FamilyNotFoundError: If family with given ID or name doesn't exist
            ConnectionError: If database connection fails
            QueryError: If database query fails
        """
        logger.debug(f"Loading family data for ID: {self.id}, Name: {self.name}")
        try:
            should_close_conn = False
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Build query based on available parameters
            if self.id:
                query = sql.SQL("SELECT * FROM families WHERE id = %s")
                params = (self.id,)
            elif self.name:
                query = sql.SQL("SELECT * FROM families WHERE name = %s")
                params = (self.name,)
            else:
                logger.warning("Cannot load family - both ID and name are None")
                raise FamilyNotFoundError("Family ID or name must be provided")
            
            cur.execute(query, params)
            result = cur.fetchone()
            
            if not result:
                logger.warning(f"Family not found with ID: {self.id}, Name: {self.name}")
                raise FamilyNotFoundError()
            
            # Update attributes with loaded data
            self.id = result['id']
            self.name = result['name']
            self.admin_id = result['admin_id']
            
            logger.debug(f"Successfully loaded family: {self.name} (ID: {self.id})")
            
        except (FamilyNotFoundError):
            # Re-raise these exceptions
            raise
        except psycopg2.Error as e:
            logger.error(f"Database error loading family: {str(e)}")
            raise QueryError(f"Failed to load family: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error loading family: {str(e)}")
            logger.debug(traceback.format_exc())
            raise FamilyServiceError(f"Error loading family: {str(e)}")
        finally:
            if cur:
                cur.close()
            if should_close_conn and conn:
                conn.close()
    
    def create_family(self, conn=None):
        """
        Create a new family in the database.
        
        Args:
            conn (psycopg2.connection, optional): Database connection
            
        Returns:
            int: The ID of the created family
            
        Raises:
            FamilyAlreadyExistsError: If a family with the same name already exists
            ConnectionError: If database connection fails
            QueryError: If database query fails
        """
        logger.info(f"Creating new family '{self.name}' with admin ID: {self.admin_id}")
        
        if not self.name:
            logger.error("Cannot create family without a name")
            raise MissingRequiredFieldError("family_name")
        
        if not self.admin_id:
            logger.error("Cannot create family without an admin ID")
            raise MissingRequiredFieldError("admin_id")
            
        try:
            should_close_conn = False
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
            
            cur = conn.cursor()
            
            # Check if family with same name already exists
            cur.execute("SELECT id FROM families WHERE name = %s", (self.name,))
            if cur.fetchone():
                logger.warning(f"Family with name '{self.name}' already exists")
                raise FamilyAlreadyExistsError()
            
            # Check if admin user exists
            cur.execute("SELECT id FROM users WHERE id = %s", (self.admin_id,))
            if not cur.fetchone():
                logger.warning(f"User with ID {self.admin_id} not found")
                raise UserNotFoundError(f"Admin user with ID {self.admin_id} not found")
            
            # Create family
            cur.execute(
                "INSERT INTO families (name, admin_id) VALUES (%s, %s) RETURNING id",
                (self.name, self.admin_id)
            )
            self.id = cur.fetchone()[0]
            
            # Add admin as first member
            cur.execute(
                "INSERT INTO family_members (family_id, user_id, join_date) VALUES (%s, %s, %s)",
                (self.id, self.admin_id, datetime.datetime.now())
            )
            
            conn.commit()
            logger.info(f"Successfully created family '{self.name}' with ID: {self.id}")
            return self.id
            
        except (FamilyAlreadyExistsError, UserNotFoundError):
            # Re-raise these exceptions
            if conn:
                conn.rollback()
            raise
        except psycopg2.Error as e:
            logger.error(f"Database error creating family: {str(e)}")
            if conn:
                conn.rollback()
            raise QueryError(f"Failed to create family: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error creating family: {str(e)}")
            logger.debug(traceback.format_exc())
            if conn:
                conn.rollback()
            raise FamilyServiceError(f"Error creating family: {str(e)}")
        finally:
            if cur:
                cur.close()
            if should_close_conn and conn:
                conn.close()
    
    def delete(self, conn=None):
        """
        Delete a family and all its members.
        
        Args:
            conn (psycopg2.connection, optional): Database connection
            
        Raises:
            FamilyNotFoundError: If family doesn't exist
            ConnectionError: If database connection fails
            QueryError: If database query fails
        """
        logger.info(f"Deleting family with ID: {self.id}, Name: {self.name}")
        
        try:
            # Load family data if not already loaded
            if not self.id:
                self.load()
                
            should_close_conn = False
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
            
            cur = conn.cursor()
            
            # Delete all pending requests for this family
            cur.execute("DELETE FROM family_requests WHERE family_id = %s", (self.id,))
            
            # Delete all family members
            cur.execute("DELETE FROM family_members WHERE family_id = %s", (self.id,))
            
            # Delete family
            cur.execute("DELETE FROM families WHERE id = %s", (self.id,))
            deleted_rows = cur.rowcount
            
            if deleted_rows == 0:
                logger.warning(f"Family with ID {self.id} not found")
                raise FamilyNotFoundError()
                
            conn.commit()
            logger.info(f"Successfully deleted family with ID: {self.id}")
            
        except FamilyNotFoundError:
            # Re-raise this exception
            if conn:
                conn.rollback()
            raise
        except psycopg2.Error as e:
            logger.error(f"Database error deleting family: {str(e)}")
            if conn:
                conn.rollback()
            raise QueryError(f"Failed to delete family: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error deleting family: {str(e)}")
            logger.debug(traceback.format_exc())
            if conn:
                conn.rollback()
            raise FamilyServiceError(f"Error deleting family: {str(e)}")
        finally:
            if cur:
                cur.close()
            if should_close_conn and conn:
                conn.close()
    
    def is_admin(self, user_id, conn=None):
        """
        Check if a user is the admin of this family.
        
        Args:
            user_id (int): User ID to check
            conn (psycopg2.connection, optional): Database connection
            
        Returns:
            bool: True if user is admin, False otherwise
            
        Raises:
            FamilyNotFoundError: If family doesn't exist
            ConnectionError: If database connection fails
            QueryError: If database query fails
        """
        logger.debug(f"Checking if user {user_id} is admin of family ID: {self.id}, Name: {self.name}")
        
        try:
            # Load family data if not already loaded
            if not self.id and not self.admin_id:
                self.load()
            
            # If admin_id is already loaded, just compare
            if self.admin_id:
                return int(user_id) == int(self.admin_id)
                
            should_close_conn = False
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
            
            cur = conn.cursor()
            
            # Query admin_id from database
            if self.id:
                cur.execute("SELECT admin_id FROM families WHERE id = %s", (self.id,))
            elif self.name:
                cur.execute("SELECT admin_id FROM families WHERE name = %s", (self.name,))
            else:
                logger.warning("Cannot check admin - both ID and name are None")
                raise FamilyNotFoundError("Family ID or name must be provided")
                
            result = cur.fetchone()
            
            if not result:
                logger.warning(f"Family not found with ID: {self.id}, Name: {self.name}")
                raise FamilyNotFoundError()
                
            admin_id = result[0]
            self.admin_id = admin_id  # Update instance attribute
            
            is_admin = int(user_id) == int(admin_id)
            logger.debug(f"User {user_id} is{' ' if is_admin else ' not '}admin of family ID: {self.id}")
            return is_admin
            
        except FamilyNotFoundError:
            # Re-raise this exception
            raise
        except psycopg2.Error as e:
            logger.error(f"Database error checking admin: {str(e)}")
            raise QueryError(f"Failed to check if user is admin: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error checking admin: {str(e)}")
            logger.debug(traceback.format_exc())
            raise FamilyServiceError(f"Error checking if user is admin: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if should_close_conn and conn:
                conn.close()
    
    def get_members(self, conn=None):
        """
        Get all members of a family.
        
        Args:
            conn (psycopg2.connection, optional): Database connection
            
        Returns:
            list: List of members with their details
            
        Raises:
            FamilyNotFoundError: If family doesn't exist
            ConnectionError: If database connection fails
            QueryError: If database query fails
        """
        logger.debug(f"Getting members for family ID: {self.id}, Name: {self.name}")
        
        try:
            # Load family data if not already loaded
            if not self.id:
                self.load()
                
            should_close_conn = False
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Query family members with user details
            query = """
                SELECT u.id, u.username, u.first_name, u.last_name, fm.join_date,
                       CASE WHEN f.admin_id = u.id THEN TRUE ELSE FALSE END as is_admin
                FROM family_members fm
                JOIN users u ON fm.user_id = u.id
                JOIN families f ON fm.family_id = f.id
                WHERE fm.family_id = %s
                ORDER BY is_admin DESC, u.username
            """
            
            cur.execute(query, (self.id,))
            members = cur.fetchall()
            
            logger.debug(f"Found {len(members)} members for family ID: {self.id}")
            return members
            
        except FamilyNotFoundError:
            # Re-raise this exception
            raise
        except psycopg2.Error as e:
            logger.error(f"Database error getting family members: {str(e)}")
            raise QueryError(f"Failed to retrieve family members: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error getting family members: {str(e)}")
            logger.debug(traceback.format_exc())
            raise FamilyServiceError(f"Error retrieving family members: {str(e)}")
        finally:
            if cur:
                cur.close()
            if should_close_conn and conn:
                conn.close()
    
    def remove_member(self, user_id, conn=None):
        """
        Remove a member from the family.
        
        Args:
            user_id (int): User ID to remove
            conn (psycopg2.connection, optional): Database connection
            
        Raises:
            FamilyNotFoundError: If family doesn't exist
            UserNotInFamilyError: If user is not in the family
            CannotRemoveAdminError: If attempting to remove admin
            ConnectionError: If database connection fails
            QueryError: If database query fails
        """
        logger.info(f"Removing user {user_id} from family ID: {self.id}, Name: {self.name}")
        
        try:
            # Load family data if not already loaded
            if not self.id:
                self.load()
            
            # Check if user is admin
            if self.admin_id and int(user_id) == int(self.admin_id):
                logger.warning(f"Cannot remove admin user {user_id} from family {self.id}")
                raise CannotRemoveAdminError()
                
            should_close_conn = False
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
            
            cur = conn.cursor()
            
            # Check if user is in the family
            cur.execute(
                "SELECT 1 FROM family_members WHERE family_id = %s AND user_id = %s",
                (self.id, user_id)
            )
            if not cur.fetchone():
                logger.warning(f"User {user_id} is not in family {self.id}")
                raise UserNotInFamilyError()
            
            # Remove user from family
            cur.execute(
                "DELETE FROM family_members WHERE family_id = %s AND user_id = %s",
                (self.id, user_id)
            )
            
            conn.commit()
            logger.info(f"Successfully removed user {user_id} from family {self.id}")
            
        except (FamilyNotFoundError, UserNotInFamilyError, CannotRemoveAdminError):
            # Re-raise these exceptions
            if conn:
                conn.rollback()
            raise
        except psycopg2.Error as e:
            logger.error(f"Database error removing family member: {str(e)}")
            if conn:
                conn.rollback()
            raise QueryError(f"Failed to remove family member: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error removing family member: {str(e)}")
            logger.debug(traceback.format_exc())
            if conn:
                conn.rollback()
            raise FamilyServiceError(f"Error removing family member: {str(e)}")
        finally:
            if cur:
                cur.close()
            if should_close_conn and conn:
                conn.close()
    
    def send_request(self, receiver_username, sender_id, conn=None):
        """
        Send a request to add a user to the family.
        
        Args:
            receiver_username (str): Username of user to invite
            sender_id (int): ID of user sending the request (must be admin)
            conn (psycopg2.connection, optional): Database connection
            
        Returns:
            int: ID of the created request
            
        Raises:
            FamilyNotFoundError: If family doesn't exist
            UserNotFoundError: If receiver doesn't exist
            NotFamilyAdminError: If sender is not admin
            RequestAlreadyExistsError: If request already exists
            ConnectionError: If database connection fails
            QueryError: If database query fails
        """
        logger.info(f"Sending family request from user {sender_id} to {receiver_username} for family: {self.id}")
        
        try:
            # Load family data if not already loaded
            if not self.id:
                self.load()
            
            # Check if sender is admin
            if not self.is_admin(sender_id):
                logger.warning(f"User {sender_id} is not admin of family {self.id}")
                raise NotFamilyAdminError()
                
            should_close_conn = False
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
            
            cur = conn.cursor()
            
            # Get receiver user ID
            cur.execute("SELECT id FROM users WHERE username = %s", (receiver_username,))
            user_result = cur.fetchone()
            if not user_result:
                logger.warning(f"User with username {receiver_username} not found")
                raise UserNotFoundError(f"User with username {receiver_username} not found")
                
            receiver_id = user_result[0]
            
            # Check if receiver is already in the family
            cur.execute(
                "SELECT 1 FROM family_members WHERE family_id = %s AND user_id = %s",
                (self.id, receiver_id)
            )
            if cur.fetchone():
                logger.warning(f"User {receiver_id} is already in family {self.id}")
                raise UserAlreadyInFamilyError()
            
            # Check if request already exists
            cur.execute(
                "SELECT id FROM family_requests WHERE family_id = %s AND receiver_id = %s AND status = 'pending'",
                (self.id, receiver_id)
            )
            if cur.fetchone():
                logger.warning(f"Request for user {receiver_id} to join family {self.id} already exists")
                raise RequestAlreadyExistsError()
            
            # Create request
            cur.execute(
                """INSERT INTO family_requests 
                   (family_id, sender_id, receiver_id, request_date, status)
                   VALUES (%s, %s, %s, %s, 'pending')
                   RETURNING id""",
                (self.id, sender_id, receiver_id, datetime.datetime.now())
            )
            request_id = cur.fetchone()[0]
            
            conn.commit()
            logger.info(f"Successfully created family request {request_id}")
            return request_id
            
        except (FamilyNotFoundError, UserNotFoundError, UserAlreadyInFamilyError, 
                NotFamilyAdminError, RequestAlreadyExistsError):
            # Re-raise these exceptions
            if conn:
                conn.rollback()
            raise
        except psycopg2.Error as e:
            logger.error(f"Database error sending family request: {str(e)}")
            if conn:
                conn.rollback()
            raise QueryError(f"Failed to send family request: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error sending family request: {str(e)}")
            logger.debug(traceback.format_exc())
            if conn:
                conn.rollback()
            raise FamilyServiceError(f"Error sending family request: {str(e)}")
        finally:
            if cur:
                cur.close()
            if should_close_conn and conn:
                conn.close()
    
    def process_request(self, request_id, user_id, accept, conn=None):
        """
        Process a family join request.
        
        Args:
            request_id (int): ID of the request to process
            user_id (int): ID of user processing the request (must be receiver)
            accept (bool): Whether to accept (True) or reject (False) the request
            conn (psycopg2.connection, optional): Database connection
            
        Raises:
            RequestNotFoundError: If request doesn't exist
            NotRequestRecipientError: If user is not the recipient
            RequestAlreadyProcessedError: If request already processed
            ConnectionError: If database connection fails
            QueryError: If database query fails
        """
        logger.info(f"Processing request {request_id} by user {user_id}, accept={accept}")
        
        try:
            should_close_conn = False
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Get request data
            cur.execute(
                """SELECT fr.*, f.name as family_name 
                   FROM family_requests fr
                   JOIN families f ON fr.family_id = f.id
                   WHERE fr.id = %s""",
                (request_id,)
            )
            request = cur.fetchone()
            
            if not request:
                logger.warning(f"Request {request_id} not found")
                raise RequestNotFoundError()
                
            # Check if user is the recipient
            if int(user_id) != int(request['receiver_id']):
                logger.warning(f"User {user_id} is not the recipient of request {request_id}")
                raise NotRequestRecipientError()
                
            # Check if request is still pending
            if request['status'] != 'pending':
                logger.warning(f"Request {request_id} has already been processed")
                raise RequestAlreadyProcessedError()
                
            # Update request status
            status = 'accepted' if accept else 'rejected'
            cur.execute(
                "UPDATE family_requests SET status = %s, response_date = %s WHERE id = %s",
                (status, datetime.datetime.now(), request_id)
            )
            
            # If accepted, add user to family
            if accept:
                logger.debug(f"Adding user {user_id} to family {request['family_id']}")
                cur.execute(
                    "INSERT INTO family_members (family_id, user_id, join_date) VALUES (%s, %s, %s)",
                    (request['family_id'], user_id, datetime.datetime.now())
                )
                
                # Update self data if it's the same family
                if self.id and int(self.id) == int(request['family_id']):
                    self.load()  # Reload family data
                    
            conn.commit()
            logger.info(f"Successfully {status} request {request_id}")
            
        except (RequestNotFoundError, NotRequestRecipientError, RequestAlreadyProcessedError):
            # Re-raise these exceptions
            if conn:
                conn.rollback()
            raise
        except psycopg2.Error as e:
            logger.error(f"Database error processing request: {str(e)}")
            if conn:
                conn.rollback()
            raise QueryError(f"Failed to process family request: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error processing request: {str(e)}")
            logger.debug(traceback.format_exc())
            if conn:
                conn.rollback()
            raise FamilyServiceError(f"Error processing family request: {str(e)}")
        finally:
            if cur:
                cur.close()
            if should_close_conn and conn:
                conn.close()
    
    def change_admin(self, new_admin_username, conn=None):
        """
        Change the admin of a family.
        
        Args:
            new_admin_username (str): Username of new admin
            conn (psycopg2.connection, optional): Database connection
            
        Raises:
            FamilyNotFoundError: If family doesn't exist
            UserNotFoundError: If new admin doesn't exist
            UserNotInFamilyError: If new admin is not in the family
            ConnectionError: If database connection fails
            QueryError: If database query fails
        """
        logger.info(f"Changing admin of family {self.id} to {new_admin_username}")
        
        try:
            # Load family data if not already loaded
            if not self.id:
                self.load()
                
            should_close_conn = False
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
            
            cur = conn.cursor()
            
            # Get new admin user ID
            cur.execute("SELECT id FROM users WHERE username = %s", (new_admin_username,))
            user_result = cur.fetchone()
            if not user_result:
                logger.warning(f"User with username {new_admin_username} not found")
                raise UserNotFoundError(f"User with username {new_admin_username} not found")
                
            new_admin_id = user_result[0]
            
            # Check if new admin is in the family
            cur.execute(
                "SELECT 1 FROM family_members WHERE family_id = %s AND user_id = %s",
                (self.id, new_admin_id)
            )
            if not cur.fetchone():
                logger.warning(f"User {new_admin_id} is not in family {self.id}")
                raise UserNotInFamilyError("New admin must be a member of the family")
            
            # Update admin
            cur.execute(
                "UPDATE families SET admin_id = %s WHERE id = %s",
                (new_admin_id, self.id)
            )
            
            conn.commit()
            
            # Update instance variable
            self.admin_id = new_admin_id
            logger.info(f"Successfully changed admin of family {self.id} to {new_admin_id}")
            
        except (FamilyNotFoundError, UserNotFoundError, UserNotInFamilyError):
            # Re-raise these exceptions
            if conn:
                conn.rollback()
            raise
        except psycopg2.Error as e:
            logger.error(f"Database error changing family admin: {str(e)}")
            if conn:
                conn.rollback()
            raise QueryError(f"Failed to change family admin: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error changing family admin: {str(e)}")
            logger.debug(traceback.format_exc())
            if conn:
                conn.rollback()
            raise FamilyServiceError(f"Error changing family admin: {str(e)}")
        finally:
            if cur:
                cur.close()
            if should_close_conn and conn:
                conn.close()
    
    def get_requests(self, user_id=None, status=None, conn=None):
        """
        Get family join requests.
        
        Args:
            user_id (int, optional): Filter requests by receiver ID
            status (str, optional): Filter requests by status ('pending', 'accepted', 'rejected')
            conn (psycopg2.connection, optional): Database connection
            
        Returns:
            list: List of requests with their details
            
        Raises:
            FamilyNotFoundError: If family doesn't exist
            ConnectionError: If database connection fails
            QueryError: If database query fails
        """
        logger.debug(f"Getting requests for family {self.id}, user={user_id}, status={status}")
        
        try:
            # Load family data if not already loaded
            if not self.id:
                self.load()
                
            should_close_conn = False
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Build query with optional filters
            query = """
                SELECT fr.*, 
                       f.name as family_name,
                       s.username as sender_username,
                       r.username as receiver_username
                FROM family_requests fr
                JOIN families f ON fr.family_id = f.id
                JOIN users s ON fr.sender_id = s.id
                JOIN users r ON fr.receiver_id = r.id
                WHERE fr.family_id = %s
            """
            params = [self.id]
            
            if user_id:
                query += " AND fr.receiver_id = %s"
                params.append(user_id)
                
            if status:
                query += " AND fr.status = %s"
                params.append(status)
                
            query += " ORDER BY fr.request_date DESC"
            
            cur.execute(query, params)
            requests = cur.fetchall()
            
            logger.debug(f"Found {len(requests)} requests for family {self.id}")
            return requests
            
        except FamilyNotFoundError:
            # Re-raise this exception
            raise
        except psycopg2.Error as e:
            logger.error(f"Database error getting family requests: {str(e)}")
            raise QueryError(f"Failed to retrieve family requests: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error getting family requests: {str(e)}")
            logger.debug(traceback.format_exc())
            raise FamilyServiceError(f"Error retrieving family requests: {str(e)}")
        finally:
            if cur:
                cur.close()
            if should_close_conn and conn:
                conn.close()