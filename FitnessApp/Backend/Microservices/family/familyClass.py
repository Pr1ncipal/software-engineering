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
        try:
            if id or name:
                self.load()
            else:
                logger.warning("Family initialized without ID or name")
        except FamilyNotFoundError:
            logger.warning(f"Family with ID {id} or name {name} not found during initialization")
        except Exception as e:
            raise
        
    def isMember(self, user_id, conn=None):
        """
        Check if a user is a member of the family.
        
        Args:
            user_id (int): User ID to check
            conn (psycopg2.connection, optional): Database connection
            
        Returns:
            bool: True if user is a member, False otherwise
            
        Raises:
            FamilyNotFoundError: If family doesn't exist
            ConnectionError: If database connection fails
            QueryError: If database query fails
        """
        logger.debug(f"Checking if user {user_id} is a member of family ID: {self.id}, Name: {self.name}")
        
        try:
            # Load family data if not already loaded
            if not self.id:
                self.load()
                
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
            result = cur.fetchone()
            
            return bool(result)
            
        except FamilyNotFoundError:
            # Re-raise this exception
            raise
        except psycopg2.Error as e:
            logger.error(f"Database error checking membership: {str(e)}")
            raise QueryError(f"Failed to check membership: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error checking membership: {str(e)}")
            logger.debug(traceback.format_exc())
            raise FamilyServiceError(f"Error checking membership: {str(e)}")
        finally:
            if cur:
                cur.close()
            if should_close_conn and conn:
                conn.close()
    
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
        should_close_conn = False
        try:
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Build query based on available parameters
            if self.id:
                query = sql.SQL("SELECT id, family_name, family_admin FROM family WHERE id = %s")
                params = (self.id,)
            elif self.name:
                query = sql.SQL("SELECT id, family_name, family_admin FROM family WHERE family_name = %s")
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
            self.id = int(result['id'])
            self.name = result['family_name']
            self.admin_id = int(result['family_admin'])
            
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
            cur.execute("SELECT id FROM family WHERE family_name = %s", (self.name,))
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
                "INSERT INTO family (family_name, family_admin) VALUES (%s, %s) RETURNING id",
                (self.name, self.admin_id)
            )
            self.id = cur.fetchone()[0]
            
            # Add admin as first member
            cur.execute(
                "INSERT INTO family_members (family_id, user_id) VALUES (%s, %s)",
                (self.id, self.admin_id)
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
            cur.execute("DELETE FROM family WHERE id = %s", (self.id,))
                
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
                
    def leave(self, user_id, conn = None):
        """
        Leave the family.
        
        Args:
            user_id (int): User ID of the member leaving
            conn (psycopg2.connection, optional): Database connection
            
        Raises:
            FamilyNotFoundError: If family doesn't exist
            UserNotInFamilyError: If user is not in the family
            ConnectionError: If database connection fails
            QueryError: If database query fails
        """
        logger.info(f"User leaving family with ID: {self.id}, Name: {self.name}")
        
        try:
            # Load family data if not already loaded
            if not self.id:
                self.load()
                
            should_close_conn = False
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
            
            cur = conn.cursor()
            
            # Check if user is in the family
            cur.execute(
                "SELECT 1 FROM family_members WHERE family_id = %s AND user_id = %s",
                (self.id, self.admin_id)
            )
            if not cur.fetchone():
                logger.warning(f"User {self.admin_id} is not in family {self.id}")
                raise UserNotInFamilyError()
            
            # Check if user is admin
            
            
            if self.is_admin(user_id, conn):
                logger.warning(f"Admin {user_id} cannot leave the family")
                raise CannotRemoveAdminError()
            
            # Check if user is the only member
            cur.execute(
                "SELECT COUNT(*) FROM family_members WHERE family_id = %s",
                (self.id,)
            )
            count = cur.fetchone()[0]
            if count <= 1:
                logger.warning(f"Cannot leave family {self.id} - only one member left")
                raise CannotLeaveFamilyError("Cannot leave family - only one member left")
            
            # Remove user from family
            cur.execute(
                "DELETE FROM family_members WHERE family_id = %s AND user_id = %s",
                (self.id, user_id)
            )
            
            conn.commit()
            logger.info(f"Successfully removed user {self.admin_id} from family {self.id}")
            
        except FamilyNotFoundError:
            # Re-raise this exception
            if conn:
                conn.rollback()
            raise
        except CannotRemoveAdminError:
            # Re-raise this exception
            if conn:
                conn.rollback()
            raise
        except psycopg2.Error as e:
            logger.error(f"Database error leaving family: {str(e)}")
            if conn:
                conn.rollback()
            raise QueryError(f"Failed to leave family: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error leaving family: {str(e)}")
            logger.debug(traceback.format_exc())
            if conn:
                conn.rollback()
            raise FamilyServiceError(f"Error leaving family: {str(e)}")
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
        
        should_close_conn = False

        try:
            # Load family data if not already loaded
            if not self.id and not self.admin_id:
                self.load()
            
            # If admin_id is already loaded, just compare
            if self.admin_id:
                return int(user_id) == int(self.admin_id)
                
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
            
            cur = conn.cursor()
            
            # Query admin_id from database
            if self.id:
                cur.execute("SELECT admin_id FROM family WHERE id = %s", (self.id,))
            elif self.name:
                cur.execute("SELECT admin_id FROM family WHERE name = %s", (self.name,))
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
    
    def get_members(self, user_id, conn=None): 
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
            
            #Check if user is in the family
            if not user_id:
                logger.warning("User ID is required to check family membership")
                raise MissingRequiredFieldError("user_id")
            if not isinstance(user_id, int):
                logger.warning("User ID must be an integer")
                raise InvalidFamilyDataError("user_id must be an integer")
            if not self.id:
                logger.warning("Family ID is required to check family membership")
                raise MissingRequiredFieldError("family_id")
            if not isinstance(self.id, int):
                logger.warning("Family ID must be an integer")
                raise InvalidFamilyDataError("family_id must be an integer")
            
            # Check if user is in the family
            # Use parameterized query to prevent SQL injection
            # Use psycopg2.sql to safely construct the query
            checkInFamilyQuery = sql.SQL(
                "SELECT 1 FROM family_members WHERE family_id = %s AND user_id = %s")
            
            cur.execute(checkInFamilyQuery, (self.id, user_id))
            \
            if not cur.fetchone():
                logger.warning(f"User {user_id} is not in family {self.id}")
                raise UserNotInFamilyError()
            
            # Query family members with user details
            query = """
                SELECT u.username as username, u.fname as fname, u.lname as lname, fm.joined_at as joined_at,
                       CASE WHEN f.family_admin = u.id THEN TRUE ELSE FALSE END as is_admin
                FROM family_members fm
                JOIN users u ON fm.user_id = u.id
                JOIN family f ON fm.family_id = f.id
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
    
    def remove_member(self, username, conn=None):
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
        logger.info(f"Removing user {username} from family ID: {self.id}, Name: {self.name}")
        
        try:
            # Load family data if not already loaded
            if not self.id:
                self.load()
            
            should_close_conn = False
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
            
            cur = conn.cursor()
            
            # Get user ID from username
            cur.execute("SELECT id FROM users WHERE username = %s", (username,))
            user_result = cur.fetchone()
            if not user_result:
                logger.warning(f"User with username {username} not found")
                raise UserNotFoundError(f"User with username {username} not found")
            user_id = user_result[0]
            logger.debug(f"User ID for {username} is {user_id}")
            
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
                "SELECT id FROM family_requests WHERE family_id = %s AND receiver_id = %s AND status IS NULL",
                (self.id, receiver_id)
            )
            if cur.fetchone():
                logger.warning(f"Request for user {receiver_id} to join family {self.id} already exists")
                raise RequestAlreadyExistsError()
            
            # Create request
            cur.execute(
                """INSERT INTO family_requests 
                   (family_id, sender_id, receiver_id)
                   VALUES (%s, %s, %s)
                   RETURNING id""",
                (self.id, sender_id, receiver_id)
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
                """SELECT fr.*, f.family_name as family_name 
                   FROM family_requests fr
                   JOIN family f ON fr.family_id = f.id
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
            if request['status'] != None:
                logger.warning(f"Request {request_id} has already been processed")
                raise RequestAlreadyProcessedError()
                
            # Update request status
            status = True if accept else False
            cur.execute(
                "UPDATE family_requests SET status = %s WHERE id = %s",
                (status, request_id)
            )
            
            # If accepted, add user to family
            if accept:
                logger.debug(f"Adding user {user_id} to family {request['family_id']}")
                cur.execute(
                    "INSERT INTO family_members (family_id, user_id) VALUES (%s, %s)",
                    (request['family_id'], user_id)
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
    
    def change_admin(self, new_admin_username, conn=None): #Must test
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
            
            #Check if user is already Admin
            if self.admin_id == new_admin_id:
                logger.warning(f"User {new_admin_id} is already admin of family {self.id}")
                raise UserAlreadyInFamilyError("User is already admin of the family")
            
            # Update admin
            cur.execute(
                "UPDATE family SET family_admin = %s WHERE id = %s",
                (new_admin_id, self.id)
            )
            
            conn.commit()
            
            # Update instance variable
            self.admin_id = new_admin_id
            logger.info(f"Successfully changed admin of family {self.id} to {new_admin_id}")
            
        except (FamilyNotFoundError, UserNotFoundError, UserNotInFamilyError, UserAlreadyInFamilyError):
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
    
    def get_requests(self, user_id, conn=None):
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
        logger.debug(f"Getting requests for family user={user_id}, status= pending")
        
        try:
                
            should_close_conn = False
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Build query with optional filters
            query = sql.SQL("""
                SELECT fr.id as request_id, fr.family_id as family_id, fr.status as status, fr.created_at as created_at,
                       f.family_name as family_name,
                       s.username as sender_username
                FROM family_requests fr
                JOIN family f ON fr.family_id = f.id
                JOIN users s ON fr.sender_id = s.id
                JOIN users r ON fr.receiver_id = r.id
                WHERE fr.receiver_id = %s AND fr.status IS NULL
                ORDER BY fr.created_at DESC
            """)
            params = (user_id,)
            
            cur.execute(query, params)
            requests = cur.fetchall()
                        
            for f in requests:
                del f['family_id']
            
            logger.debug(f"Found {len(requests)} requests for user {user_id}")
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
    
    def getUserInFamily(self, username):
        """
        Check if a user is in a family.
        
        Args:
            username (str): Username to check
            familyName (str): Family name to check
            
        Returns:
            bool: True if user is in the family, False otherwise
            
        Raises:
            ConnectionError: If database connection fails
            QueryError: If database query fails
        """
        logger.debug(f"Checking if user {username} is in family {self.name}")
        
        should_close_conn = False
        try:
            conn = global_func.getConnection()
            should_close_conn = True
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Query to check if user is in the family
            query = """
                SELECT 1 FROM family_members fm
                JOIN users u ON fm.user_id = u.id
                JOIN family f ON fm.family_id = f.id
                WHERE u.username = %s AND f.family_name = %s
            """
            
            cur.execute(query, (username, self.name))
            result = cur.fetchone()
            
            return bool(result)
            
        except psycopg2.Error as e:
            logger.error(f"Database error checking user in family: {str(e)}")
            raise QueryError(f"Failed to check if user is in family: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error checking user in family: {str(e)}")
            logger.debug(traceback.format_exc())
            raise FamilyServiceError(f"Error checking if user is in family: {str(e)}")
        finally:
            if cur:
                cur.close()
            if should_close_conn and conn:
                conn.close()
                
    def getFamilies(self, user_id, conn=None):
        """
        Get all families a user belongs to.
        
        Args:
            user_id (int): User ID to check
            conn (psycopg2.connection, optional): Database connection
        Returns:
            list: List of families the user belongs to
        Raises:
            ConnectionError: If database connection fails
            QueryError: If database query fails
        """
        logger.debug(f"Getting families for user ID: {user_id}")
        
        should_close_conn = False
        try:
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Query to get all families the user belongs to
            query = """
                SELECT f.id as family_id, f.family_name as family_name, f.family_admin as admin_id
                FROM family_members fm
                JOIN family f ON fm.family_id = f.id
                WHERE fm.user_id = %s
            """
            
            cur.execute(query, (user_id,))
            families = cur.fetchall()
            
            logger.debug(f"Found {len(families)} families for user ID: {user_id}")
            
            # Convert tuples to dictionaries
            #self.__dict__ = {"family_id": None, "family_name": None, "admin_id": None}
            #final = self.__jsonify_tuple_list__(families)
            
            return families
            
        except psycopg2.Error as e:
            logger.error(f"Database error getting families for user: {str(e)}")
            raise QueryError(f"Failed to retrieve families for user: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error getting families for user: {str(e)}")
            logger.debug(traceback.format_exc())
            raise FamilyServiceError(f"Error retrieving families for user: {str(e)}")
        finally:
            if cur:
                cur.close()
            if should_close_conn and conn:
                conn.close()
                
    def __jsonify_tuple__(self, tuple_data):
        """
        Convert a tuple to a dictionary with keys from the class attributes.
        
        Args:
            tuple_data (tuple): Tuple data to convert
            
        Returns:
            dict: Dictionary representation of the tuple
        """
        return {key: value for key, value in zip(self.__dict__.keys(), tuple_data)}
    
    def __jsonify_tuple_list__(self, tuple_list):
        """
        Convert a list of tuples to a list of dictionaries with keys from the class attributes.
        
        Args:
            tuple_list (list): List of tuples to convert
            
        Returns:
            list: List of dictionary representations of the tuples
        """
        # Convert each tuple in the list to a dictionary
        # using the class attributes as keys
        # Return the list of dictionaries
        # return [dict(zip(self.__dict__.keys(), item)) for item in tuple_list]
        
        return [self.__jsonify_tuple__(item) for item in tuple_list]
        