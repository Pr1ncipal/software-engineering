import psycopg2
from psycopg2 import sql
import psycopg2.errors
import global_func
import random
import string
import logging
import traceback
import threading
import queue
import datetime
import datetime
# Import your existing error classes
from userErrors import *

# Get logger
logger = logging.getLogger("UserClass")
logger = logging.getLogger("UserClass")

class User():
    """
    A object about the user and their information. Allows for input and output of user information
    
    :param id: The id of the user
    :param email: The email of the user
    :param fname: The first name of the user
    :param lname: The last name of the user
    :param pass_hash: The hashed password of the user
    :param dob: The date of birth of the user
    :param sex: Male or Female sex of the user
    :param BFL: The base fitness level of the user
    :param key: The key of the user
    
    :type id: int
    :type email: str
    :type fname: str
    :type lname: str
    :type pass_hash: str
    :type dob datetime
    :type sex: char
    :type BFL: float
    :type key str
    
    """
    
    def __init__(self, id = None, email = None, username = None, fname = None, lname = None, pass_hash = None, dob = None, sex = None, BFL = None, key = None):
        logger.debug(f"Creating User object: username={username}, email={email}, key={key[:5] if key else None}...")
        self.key = key
        if not key:
            self.email = email
            self.username = username
            self.fname = fname
            self.lname = lname
            self.pass_hash = pass_hash
            self.dob = dob
            self.sex = sex
            self.BFL = BFL
            self.id = id
        else:
            logger.debug(f"Key provided, fetching user data for key {key[:5]}...")
            self.email = None
            self.username = None
            self.fname = None
            self.lname = None
            self.pass_hash = None
            self.dob = None
            self.sex = None
            self.BFL = None
            self.id = None
            
            self.getUser()
            
    def updateUserActivity(self, workout = False, conn = None):
        """
        Updates the user activity in the database
        
        :param conn: The connection to the database
        :type conn: psycopg2.connection
        
        :return: None
        :raises UserNotFoundException: When user ID is not found
        :raises ConnectionError: When database connection fails
        :raises QueryError: When there's an error executing the query
        """
        logger.info(f"Updating user activity for ID {self.id}")
        
        if self.id is None or self.id == -1:
            logger.warning("Cannot update user activity - Invalid user ID")
            raise UserNotFoundException()
        
        query = sql.SQL("""SELECT TO_CHAR(last_login:: DATE, 'YYYY-MM-DD'), day_streak, TO_CHAR(last_workout:: DATE, 'YYYY-MM-DD') 
                        FROM user_engagement 
                        WHERE user_id = %s""")
        
        closeConn = False

        try:
            try:
                logger.debug("Establishing database connection")
                if not conn:
                    conn = global_func.getConnection()
                    closeConn = True
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            logger.debug(f"Executing query to fetch user activity for ID {self.id}")
            cur.execute(query, (self.id,))
            result = cur.fetchone()
            
            if result:
                last_login = datetime.strptime(result[0], "%Y-%m-%d").date() if result[0] else None
                day_streak = result[1]
                last_workout = datetime.strptime(result[2], "%Y-%m-%d").date() if result[2] else None
                logger.info(f"Successfully fetched user activity for ID {self.id}")
            else:
                logger.warning(f"No user found with ID {self.id}")
                last_login = None
                
            updateQuery = None
            updateQuery1 = None
            
            # Update last login and day streak
            if last_login is None:
                updateQuery = sql.SQL("""INSERT INTO user_engagement (user_id, last_login, day_streak, last_workout) VALUES (%s, CURRENT_TIMESTAMP, %s, NULL)""")
                day_streak = 1
            
            elif last_login and last_login == datetime.now().date():
                # Already logged in today, no need to update streak
                updateQuery1 = sql.SQL("""UPDATE user_engagement SET last_login = CURRENT_TIMESTAMP WHERE user_id = %s""")
                # Note: We'll execute this later with just date and user_id
            elif last_login and (datetime.now().date() - last_login).days == 1:
                # Consecutive day, increment streak
                day_streak += 1
                updateQuery = sql.SQL("""UPDATE user_engagement SET last_login = CURRENT_TIMESTAMP, day_streak = %s WHERE user_id = %s""")
            elif last_login and (datetime.now().date() - last_login).days >= 2:
                # Not consecutive, reset streak
                day_streak = 1
                updateQuery = sql.SQL("""UPDATE user_engagement SET last_login = CURRENT_TIMESTAMP, day_streak = %s WHERE user_id = %s""")
            else:
                # First login or other cases
                day_streak = 1
                updateQuery = sql.SQL("""UPDATE user_engagement SET last_login = CURRENT_TIMESTAMP, day_streak = %s WHERE user_id = %s""")
                
            if workout:
                updateQueryWorkout = sql.SQL("""UPDATE user_engagement SET last_workout = CURRENT_TIMESTAMP WHERE user_id = %s""")
            
            # Execute the update query
            if updateQuery1:
                cur.execute(updateQuery1, (self.id,))
            if updateQuery:
                cur.execute(updateQuery, (day_streak, self.id))
            
            if workout:
                cur.execute(updateQueryWorkout, (self.id,))
            conn.commit()
            logger.info(f"Successfully updated user activity for ID {self.id}") 
            
            
        except (UserNotFoundException, ConnectionError):
            # Re-raise these specific exceptions
            logger.debug("Re-raising specific exception")
            raise
        except Exception as e:
            logger.error(f"Error updating user activity: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error updating user activity: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if conn and closeConn:
                conn.close()
            logger.debug("Database connection closed")        
            
    def getUser(self, conn = None):
        """
        gets the user information from the database
        
        :param conn: The connection to the database
        :type conn: psycopg2.connection
        
        :return: None
        :raises ConnectionError: If unable to connect to the database
        :raises UserNotFoundException: If the user with the given key is not found
        """
        if self.key == None:
            logger.debug("getUser called but no key provided, skipping")
            return
        
        logger.debug(f"Fetching user data for key {self.key[:5]}...")
        getUserQuery = sql.SQL("""SELECT id, email, fname, lname, password_hash, dob, sex, BFL, username, key FROM users WHERE key = %s""")
        try:
            try:
                logger.debug("Establishing database connection")
                conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            logger.debug(f"Executing query to fetch user with key {self.key[:5]}...")
            cur.execute(getUserQuery, (self.key,))
            result = cur.fetchone()
            if result:
                logger.debug(f"User found with ID {result[0]}")
                if self.id == None: #Allows for id to be updated
                    self.id = result[0]
                
                if self.email == None: #Allows for email to be updated
                    self.email = result[1]
                
                if self.fname == None: #Allows for first name to be updated    
                    self.fname = result[2]
                    
                if self.lname == None: #Allows for last name to be updated
                    self.lname = result[3]
                
                if self.pass_hash == None: #Allows for password to be updated
                    self.pass_hash = result[4]
                
                if self.dob == None:
                    self.dob = result[5]
                    
                if self.sex == None:
                    self.sex = result[6]
                    
                if self.BFL == None:
                    self.BFL = result[7]
                    
                if self.username == None:
                    self.username = result[8]
                
                if self.key == None:
                    self.key = result[9]
                    
                logger.info(f"Successfully fetched user data for ID {self.id}, username {self.username}")
            else:
                logger.warning(f"No user found with key {self.key[:5]}...")
                self.id = -1
                raise UserNotFoundException()
        except (ConnectionError, UserNotFoundException):
            # Re-raise these specific exceptions
            logger.debug("Re-raising specific exception")
            raise
        except Exception as e:
            # For any other exceptions, convert to QueryError
            logger.error(f"Unexpected error in getUser: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error retrieving user: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if conn:
                conn.close()
            logger.debug("Database connection closed")
            
    def validateUser(self, conn = None):
        """
        Validates the user information
        
        :param conn: The connection to the database
        :type conn: psycopg2.connection
        
        :return: None
        :raises MissingRequiredFieldError: When required user fields are missing
        :raises UserNotFoundException: When user ID is not found
        :raises ConnectionError: When database connection fails
        :raises QueryError: When there's an error executing the query
        """
        logger.info(f"Validating user with key {self.key[:5]}...")
        
        if self.key is None:
            logger.warning("Cannot validate user - No key provided")
            raise UserNotFoundException()
            
        # Check required fields
        
        checkKeyQuery = sql.SQL("""SELECT id FROM users WHERE key = %s""")
        
        try:
            try:
                logger.debug("Establishing database connection")
                if not conn:
                    conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            logger.debug(f"Checking if user exists with key {self.key[:5]}...")
            result = global_func.verify_key(self.key)
            
            if result:
                logger.info(f"User with key {self.key[:5]} exists")
                self.updateUserActivity()
                return True
            else:
                logger.warning(f"No user found with key {self.key[:5]}")
                return False
        
        except (ConnectionError, UserNotFoundException):
            # Re-raise these specific exceptions
            logger.debug("Re-raising specific exception")
            raise
        except Exception as e:
            logger.error(f"Error validating user: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error validating user: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if conn:
                conn.close()
            logger.debug("Database connection closed")
        
    def createUser(self, conn = None):
        """
        Inserts the user into the database
        
        :param conn: The connection to the database
        :type conn: psycopg2.connection
        
        :return: None
        :raises MissingRequiredFieldError: When required user fields are missing
        :raises UserAlreadyExistsError: When email or username already exists
        :raises ConnectionError: When database connection fails
        :raises QueryError: When there's an error executing the query
        """
        logger.info(f"Creating new user: username={self.username}, email={self.email}")
        
        # Check required fields
        missing_fields = []
        if self.email is None:
            missing_fields.append("email")
        if self.fname is None:
            missing_fields.append("first_name")
        if self.lname is None:
            missing_fields.append("last_name")
        if self.pass_hash is None:
            missing_fields.append("password")
        if self.dob is None:
            missing_fields.append("dob")
        if self.sex is None:
            missing_fields.append("sex")
        if self.username is None:
            missing_fields.append("username")
            
        if missing_fields:
            logger.warning(f"Cannot create user - missing required fields: {', '.join(missing_fields)}")
            raise MissingRequiredFieldError(", ".join(missing_fields))
        
        createUserQuery = sql.SQL("""INSERT INTO users (email, fname, lname, password_hash, dob, sex, key, username)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s) 
        RETURNING id""")
        
        try:
            try:
                logger.debug("Establishing database connection")
                if not conn:
                    conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            logger.debug("Generating unique key for user")
            key = self.__generateKey__(conn=conn)
            self.key = key
            
            logger.debug(f"Inserting new user with username={self.username}, email={self.email}")
            cur.execute(createUserQuery, (self.email, self.fname, self.lname, self.pass_hash, self.dob, self.sex, key, self.username))
            id = cur.fetchone()[0]
            if id:
                self.id = id
                conn.commit()
                logger.info(f"User created successfully with ID {id}")
                
                # Insert into user_engagement table
                self.updateUserActivity(conn=conn)
            else:
                conn.rollback()
                logger.error("User creation failed - no ID returned")
                raise QueryError("User creation failed - no ID returned")
            
        except psycopg2.errors.UniqueViolation as e:
            conn.rollback()
            # Identify if it's the email or username that's duplicated
            if "email" in str(e).lower():
                logger.warning(f"Cannot create user - email {self.email} already exists")
                raise UserAlreadyExistsError("A user with this email already exists")
            elif "username" in str(e).lower():
                logger.warning(f"Cannot create user - username {self.username} already exists")
                raise UserAlreadyExistsError("A user with this username already exists")
            else:
                logger.warning(f"Cannot create user - unique violation: {str(e)}")
                raise UserAlreadyExistsError()
        except (ConnectionError, MissingRequiredFieldError, QueryError, UserAlreadyExistsError):
            # Re-raise these specific exceptions
            logger.debug("Re-raising specific exception")
            raise
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Unexpected error in createUser: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"User creation failed: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if conn:
                conn.close()
            logger.debug("Database connection closed")
            
    def __generateKey__(self, conn = None):
        """
        Generates a key for the user
        
        :return: A unique key string
        :rtype: str
        :raises ConnectionError: When database connection fails
        :raises QueryError: When there's an error executing the query
        """
        logger.debug("Generating new user key")
        KEYSET = string.ascii_letters + string.digits + "!#$%&()*+,-./:;<=>?@[\\]^_`{|}~"
        key = ''.join(random.choices(KEYSET, k=64))
        
        try:
            if not conn:
                try:
                    logger.debug("Establishing database connection")
                    conn = global_func.getConnection()
                except Exception as e:
                    logger.error(f"Failed to connect to database: {str(e)}")
                    raise ConnectionError(str(e))
                    
            cur = conn.cursor()
            checkKeyQuery = sql.SQL("""SELECT key FROM users WHERE key = %s""")
            
            # Check if key already exists
            logger.debug(f"Checking if generated key already exists")
            cur.execute(checkKeyQuery, (key,))
            result = cur.fetchone()
            
            # Generate new keys until we find one that doesn't exist
            collision_count = 0
            while result:
                collision_count += 1
                logger.debug(f"Key collision detected ({collision_count}), generating new key")
                key = ''.join(random.choices(KEYSET, k=64))
                cur.execute(checkKeyQuery, (key,))
                result = cur.fetchone()
            
            logger.debug(f"Generated unique key: {key[:5]}...")
            return key
        except ConnectionError:
            logger.debug("Re-raising ConnectionError")
            raise
        except Exception as e:
            logger.error(f"Error generating key: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error generating key: {str(e)}")
    
    def updateUser(self, conn = None):
        """
        Updates the user information in the database
        
        :param conn: The connection to the database
        :type conn: psycopg2.connection
        
        :return: None
        :raises UserNotFoundException: When user ID is not found
        :raises ConnectionError: When database connection fails
        :raises QueryError: When there's an error executing the query
        """
        logger.info(f"Updating user with ID {self.id}")
        
        if self.id is None or self.id == -1:
            logger.warning("Cannot update user - Invalid user ID")
            raise UserNotFoundException()
            
        if self.email is None and self.pass_hash is None:
            logger.warning("Cannot update user - No data provided")
            raise InvalidUserDataError("No data provided to update")
        
        # Determine what fields to update
        fields_to_update = []
        params = []
        
        if self.email is not None:
            fields_to_update.append("email = %s")
            params.append(self.email)
            logger.debug(f"Will update email to {self.email}")
            
        if self.pass_hash is not None:
            fields_to_update.append("password_hash = %s")
            params.append(self.pass_hash)
            logger.debug("Will update password hash")
            
        if not fields_to_update:
            logger.debug("No fields to update, returning")
            return
            
        # Add ID as the last parameter
        params.append(self.id)
        
        # Build the query dynamically based on fields to update
        update_clause = ", ".join(fields_to_update)
        updateUserQuery = sql.SQL(f"UPDATE users SET {update_clause} WHERE id = %s")
        
        try:
            try:
                logger.debug("Establishing database connection")
                conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            logger.debug(f"Executing update query for user ID {self.id}")
            cur.execute(updateUserQuery, params)
            
            # Check if any row was affected
            if cur.rowcount == 0:
                logger.warning(f"No user found with ID {self.id}")
                raise UserNotFoundException()
                
            conn.commit()
            logger.info(f"Successfully updated user with ID {self.id}")
            
        except (UserNotFoundException, ConnectionError):
            logger.debug("Re-raising specific exception")
            raise
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Error updating user: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error updating user: {str(e)}")
        
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if conn:
                conn.close()
            logger.debug("Database connection closed")
    
    def deleteUser(self, conn = None):
        """
        Deletes the user from the database
        
        :param conn: The connection to the database
        
        :type conn: psycopg2.connection
        
        :return: None
        :raises UserNotFoundException: When user ID is not found
        :raises ConnectionError: When database connection fails
        :raises QueryError: When there's an error executing the query
        """
        logger.info(f"Deleting user with ID {self.id}")
        
        if self.id is None or self.id == -1:
            logger.warning("Cannot delete user - Invalid user ID")
            raise UserNotFoundException()
            
        deleteUserQuery = sql.SQL("""DELETE FROM users WHERE id = %s""")
        try:
            try:
                logger.debug("Establishing database connection")
                conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            logger.debug(f"Executing delete query for user ID {self.id}")
            cur.execute(deleteUserQuery, (self.id,))
            
            # Check if any row was deleted
            if cur.rowcount == 0:
                logger.warning(f"No user found with ID {self.id}")
                raise UserNotFoundException()
                
            conn.commit()
            logger.info(f"Successfully deleted user with ID {self.id}")
            
        except (UserNotFoundException, ConnectionError):
            logger.debug("Re-raising specific exception")
            raise
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Error deleting user: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error deleting user: {str(e)}")
        finally:    
            if 'cur' in locals() and cur:
                cur.close()
            if conn:
                conn.close()
            logger.debug("Database connection closed")
    
    def login(self, conn = None):
        """
        Gets the user login information from the database
        
        :param conn: The connection to the database
        
        :type conn: psycopg2.connection
        
        :return: The key of the user
        :rtype: str
        :raises IncorrectCredentialsError: When username or password is incorrect
        :raises ConnectionError: When database connection fails
        :raises QueryError: When there's an error executing the query
        """
        logger.info(f"Processing login for username {self.username}")
        
        if not self.username or not self.pass_hash:
            logger.warning("Login attempt with missing credentials")
            raise MissingRequiredFieldError("username and password")
            
        loginUserQuery = sql.SQL("""SELECT key, id FROM users WHERE username = %s AND password_hash = %s""")
        try:
            try:
                logger.debug("Establishing database connection")
                if not conn:
                    conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            logger.debug(f"Executing login verification for username {self.username}")
            cur.execute(loginUserQuery, (self.username, self.pass_hash))
            result = cur.fetchone()
            
            if result:
                logger.info(f"Login successful for username {self.username}")
                
                self.id = result[1]
                
                self.updateUserActivity()
                return result[0]
            else:
                logger.warning(f"Login failed for username {self.username} - incorrect credentials")
                raise IncorrectCredentialsError()
                
        except (IncorrectCredentialsError, ConnectionError, MissingRequiredFieldError):
            logger.debug("Re-raising specific exception")
            raise
        except Exception as e:
            logger.error(f"Error during login: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error during login: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if conn:
                conn.close()
            logger.debug("Database connection closed")
    

class UserStats(User):
    """
    A object about the user and their information. Allows for input and output of user stats such as height and weight
    
    :param id: The id of the user
    :param email: The email of the user
    :param fname: The first name of the user
    :param lname: The last name of the user
    :param pass_hash: The hashed password of the user
    :param dob: The date of birth of the user
    :param sex: male or female specific to the user
    :param BFL: The base fitness level of the user
    :param key: The key of the user
    :param height: The height of the user
    :param weight: The weight of the user
    
    :type id: int
    :type email: str
    :type fname: str
    :type lname: str
    :type pass_hash: str
    :type dob: datetime
    :type sex: char
    :type BFL: float
    :type key: str
    :type height: int
    :type weight: float
    """
    def __init__(self, id = None, email = None, fname=None, lname=None, pass_hash=None, dob=None, sex=None, BFL=None, key=None, height = None, weight = None, username = None):
        logger.debug(f"Creating UserStats object: username={username}, email={email}, height={height}, weight={weight}")
        super().__init__(id = id, fname=fname, lname=lname, pass_hash=pass_hash, dob=dob, sex=sex, BFL=BFL, key=key, email=email, username=username)
        self.weight = weight
        self.height = height
        if self.height is not None:
            self.height = int(height)
        if self.weight is not None:
            self.weight = float(weight)
        
        if self.height is None or self.weight is None:
            self.__findStats__()
            
    def __findStats__(self, conn = None):
        logger.debug(f"Finding stats for user ID {self.id}")
        
        if self.id is None or self.id == -1:
            logger.warning("Cannot find stats - Invalid user ID")
            raise UserNotFoundException()
        
        findStatsQuery = sql.SQL("""SELECT height, weight FROM user_stats WHERE user_id = %s ORDER BY created_at DESC LIMIT 1""")
        try:
            try:
                logger.debug("Establishing database connection")
                if not conn:
                    conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            logger.debug(f"Executing query to find stats for user ID {self.id}")
            cur.execute(findStatsQuery, (self.id,))
            result = cur.fetchone()
            
            logger.debug(f"Query result: {result}")
            
            if result:
                if self.height is None:
                    self.height = result[0]
                if self.weight is None:
                    self.weight = result[1]
                logger.debug(f"Found stats for user ID {self.id}: height={self.height}, weight={self.weight}")
            else:
                logger.warning(f"No stats found for user ID {self.id}")
                raise StatsNotFoundException()
        except (UserNotFoundException, StatsNotFoundException, ConnectionError):
            logger.debug("Re-raising specific exception")
            raise
        except Exception as e:
            logger.error(f"Error finding stats: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error finding stats: {str(e)}")
        
        
    def insertStats(self, conn = None):
        """
        Inserts the user stats into the database
        
        :return: None
        :raises UserNotFoundException: When user ID is not found
        :raises InvalidStatsDataError: When stats data is invalid
        :raises ConnectionError: When database connection fails
        :raises QueryError: When there's an error executing the query
        """
        logger.info(f"Inserting stats for user ID {self.id}: height={self.height}, weight={self.weight}")
        
        if self.id is None or self.id == -1:
            logger.warning("Cannot insert stats - Invalid user ID")
            raise UserNotFoundException()
            
        if self.height is None and self.weight is None:
            logger.warning("Cannot insert stats - No stats data provided")
            raise InvalidStatsDataError("No stats provided")
            
        insertStatsQuery = sql.SQL("""INSERT INTO user_stats (user_id, height, weight) VALUES (%s, %s, %s)""")
        try:
            try:
                logger.debug("Establishing database connection")
                if not conn:
                    conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            logger.debug(f"Executing query to insert stats for user ID {self.id}")
            cur.execute(insertStatsQuery, (self.id, self.height, self.weight))
            conn.commit()
            logger.info(f"Successfully inserted stats for user ID {self.id}")
            
        except (UserNotFoundException, InvalidStatsDataError, ConnectionError):
            logger.debug("Re-raising specific exception")
            raise
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Error inserting stats: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error inserting stats: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if conn:
                conn.close()
            logger.debug("Database connection closed")
    
    def getUserStats(self, days = 30, conn = None):
        """
        Gets the user stats from the database
        
        :param days: Number of days to look back
        :type days: int
        :param conn: Database connection
        :type conn: psycopg2.connection
        
        :return: height and weight of the user
        :rtype: dict
        :raises UserNotFoundException: When user ID is not found
        :raises StatsNotFoundException: When no stats are found for the user
        :raises ConnectionError: When database connection fails
        :raises QueryError: When there's an error executing the query
        """
        logger.info(f"Fetching stats for user ID {self.id} for last {days} days")
        
        if self.id is None or self.id == -1:
            logger.warning("Cannot get stats - Invalid user ID")
            raise UserNotFoundException()
            
        getUserStatsQuery = sql.SQL("""SELECT height, weight, created_at FROM user_stats WHERE user_id = %s and created_at >= CURRENT_DATE - interval '%s day'""")
        try:
            try:
                logger.debug("Establishing database connection")
                if not conn:
                    conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            logger.debug(f"Executing query to fetch stats for user ID {self.id} from last {days} days")
            cur.execute(getUserStatsQuery, (self.id, days))
            result = cur.fetchall()
            
            if result:
                stats = self.__jsonifyTuple__(result, ("height", "weight", "date"))
                logger.info(f"Found {len(stats)} stats records for user ID {self.id}")
                return stats
            else:
                logger.warning(f"No stats found for user ID {self.id} in the last {days} days")
                raise StatsNotFoundException()
                
        except (UserNotFoundException, StatsNotFoundException, ConnectionError):
            logger.debug("Re-raising specific exception")
            raise
        except Exception as e:
            logger.error(f"Error retrieving stats: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error retrieving stats: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if conn:
                conn.close()
            logger.debug("Database connection closed")
            
    def getUserStatsSingle(self, starting = False, height = None,conn = None):
        if self.id is None or self.id == -1:
            logger.warning("Cannot get stats - Invalid user ID")
            raise UserNotFoundException()
        if starting:
            logger.debug("Fetching starting stats")
            getUserStatsQuery = sql.SQL("""SELECT height, weight, created_at FROM user_stats WHERE user_id = %s and height = %s ORDER BY created_at ASC LIMIT 1""")
        else:
            logger.debug("Fetching latest stats")
            getUserStatsQuery = sql.SQL("""SELECT height, weight, created_at FROM user_stats WHERE user_id = %s ORDER BY created_at DESC LIMIT 1""")
        try:
            try:
                logger.debug("Establishing database connection")
                if not conn:
                    conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            logger.debug(f"Executing query to fetch stats for user ID {self.id}")
            if starting:
                cur.execute(getUserStatsQuery, (self.id, height))
            else:
                cur.execute(getUserStatsQuery, (self.id,))
            result = cur.fetchall()
            
            if result:
                stats = self.__jsonifyTuple__(result, ("height", "weight", "date"))
                logger.info(f"Found stats record for user ID {self.id}")
                return stats
            else:
                logger.warning(f"No stats found for user ID {self.id}")
                raise StatsNotFoundException()
        except (UserNotFoundException, StatsNotFoundException, ConnectionError):
            logger.debug("Re-raising specific exception")
            raise
        except Exception as e:
            logger.error(f"Error retrieving stats: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error retrieving stats: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if conn:
                conn.close()
            logger.debug("Database connection closed")
            
    def getGoal(self, goalType, number, exercise = None, conn = None):
        
        if self.id is None or self.id == -1:
            logger.warning("Cannot get goal - Invalid user ID")
            raise UserNotFoundException()
        
        if goalType not in ['weight', 'cardio', 'strength']:
            logger.warning("Cannot get goal - Invalid goal type")
            raise InvalidGoalTypeError()
        elif(goalType == 'weight'):
            getGoalQuery = sql.SQL("""SELECT target_weight FROM weight_goals WHERE user_id = %s AND goal_type = %s ORDER BY created_at DESC LIMIT %s""")
            getGoalQuery = sql.SQL("""SELECT target_weight FROM weight_goals WHERE user_id = %s AND goal_type = %s ORDER BY created_at DESC LIMIT %s""")
        elif(goalType == 'cardio'):
            getGoalQuery = sql.SQL("""SELECT target_distance, target_time FROM cardio_goals WHERE user_id = %s AND goal_type = %s ORDER BY created_at DESC LIMIT %s""")
            getGoalQuery = sql.SQL("""SELECT target_distance, target_time FROM cardio_goals WHERE user_id = %s AND goal_type = %s ORDER BY created_at DESC LIMIT %s""")
        elif(goalType == 'strength'):
            getGoalQuery = sql.SQL("""SELECT target_weight, target_reps FROM strength_goals WHERE user_id = %s AND goal_type = %s and target_exercise = %s ORDER BY created_at DESC LIMIT %s""")
            getGoalQuery = sql.SQL("""SELECT target_weight, target_reps FROM strength_goals WHERE user_id = %s AND goal_type = %s and target_exercise = %s ORDER BY created_at DESC LIMIT %s""")
            
        try:
            try:
                logger.debug("Establishing database connection")
                if not conn:
                    conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            logger.debug(f"Executing query to fetch goal for user ID {self.id}")
            if goalType == 'strength':
                if exercise == None:
                    logger.warning("Cannot get goal - Invalid exercise")
                    raise InvalidGoalTypeError
                cur.execute(getGoalQuery, (self.id, goalType, exercise, number))
            else:
                cur.execute(getGoalQuery, (self.id, goalType, number))
            result = cur.fetchone()
            
            if result:
                logger.info(f"Found goal record for user ID {self.id}")
                return result[0]
            else:
                logger.warning(f"No goal found for user ID {self.id}")
                return None
        except (UserNotFoundException, ConnectionError):
            logger.debug("Re-raising specific exception")
            raise
        except Exception as e:
            logger.error(f"Error retrieving goal: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error retrieving goal: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if conn:
                conn.close()
            logger.debug("Database connection closed")
    
    def getUserActivities(self, verbose = False, days = 7, number = 50, conn = None):
        """
        Gets the user activities from the database
        
        :param verbose: If the user wants the details of the workout
        :param days: The number of days to get the activities from
        :param conn: The connection to the database
        
        :type verbose: bool
        :type days: int
        :type conn: psycopg2.connection
        
        :return: Dictionary of workouts
        :rtype: dict
        :raises UserNotFoundException: When user ID is not found
        :raises ConnectionError: When database connection fails
        :raises QueryError: When there's an error executing the query
        """
        logger.info(f"Fetching activities for user ID {self.id} for last {days} days (verbose={verbose})")
        
        if self.id is None or self.id == -1:
            logger.warning("Cannot get activities - Invalid user ID")
            raise UserNotFoundException()
        if days >= 1:
            logger.debug(f"Fetching activities for the last {days} days")
            getUserActivitiesQuery = sql.SQL("""SELECT id, name, workout_type, TO_CHAR(workout_date, 'YYYY-MM-DD') FROM workouts WHERE user_id = %s AND workout_date >= CURRENT_DATE - interval '%s day' ORDER BY workout_date DESC LIMIT %s""")
        else:
            logger.debug("Fetching all activities")
            getUserActivitiesQuery = sql.SQL("""SELECT id, name, workout_type, TO_CHAR(workout_date, 'YYYY-MM-DD') FROM workouts WHERE user_id = %s ORDER BY workout_date DESC LIMIT %s""")
        if days >= 1:
            logger.debug(f"Fetching activities for the last {days} days")
            getUserActivitiesQuery = sql.SQL("""SELECT id, name, workout_type, TO_CHAR(workout_date, 'YYYY-MM-DD') FROM workouts WHERE user_id = %s AND workout_date >= CURRENT_DATE - interval '%s day' ORDER BY workout_date DESC LIMIT %s""")
        else:
            logger.debug("Fetching all activities")
            getUserActivitiesQuery = sql.SQL("""SELECT id, name, workout_type, TO_CHAR(workout_date, 'YYYY-MM-DD') FROM workouts WHERE user_id = %s ORDER BY workout_date DESC LIMIT %s""")

        if verbose:
            logger.debug("Preparing detailed workout queries")
            getWorkoutDetailsQueryStrength = sql.SQL("""SELECT e.id, e.name, e.single_sided, (we.sets).reps, (we.sets).percieved_difficulty, (we.sets).weight, (we.sets).type_set 
                                                     FROM workout_exercises we
                                                     JOIN exercises e ON e.id = we.exercise_id 
                                                     WHERE we.workout_id = %s
                                                     ORDER BY e.name""")

            getWorkoutDetailsQueryCardio = sql.SQL("""SELECT duration, distance, percieved_difficulty 
                                                   FROM workout_cardio 
                                                   WHERE workout_id = %s""")
            
        try:
            try:
                logger.debug("Establishing database connection")
                if not conn:
                    conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            logger.debug(f"Executing query to fetch activities for user ID {self.id} from last {days} days")
            if days >= 1:
                cur.execute(getUserActivitiesQuery, (self.id, days, number))
            else:
                cur.execute(getUserActivitiesQuery, (self.id, number))
                
            logger.debug(f"Fetching results from query")
            if days >= 1:
                cur.execute(getUserActivitiesQuery, (self.id, days, number))
            else:
                cur.execute(getUserActivitiesQuery, (self.id, number))
                
            logger.debug(f"Fetching results from query")
            result = cur.fetchall()
            
            logger.debug(f"Fetched {len(result)} activities for user ID {self.id}")
            logger.debug(f'raw result: {result}')
            
            logger.debug(f"Fetched {len(result)} activities for user ID {self.id}")
            logger.debug(f'raw result: {result}')
            
            workouts = {}
            index = 1
            
            if not result:
                logger.info(f"No workouts found for user ID {self.id} in the last {days} days")
                return workouts  # Return empty dict if no workouts
                
            if verbose:
                logger.debug(f"Processing {len(result)} workouts with details")
                for row in result:
                    try:
                        workout_id = row[0]
                        workout_type = row[2]
                        
                        
                        
                        if workout_type == "strength":
                            logger.debug(f"Fetching strength workout details for workout ID {workout_id}")
                            cur.execute(getWorkoutDetailsQueryStrength, (workout_id,))
                            keys = ("exercise_id", "exercise_name", "single_sided", "reps", "percieved_difficulty", "weight", "type_set")
                            keys = ("exercise_id", "exercise_name", "single_sided", "reps", "percieved_difficulty", "weight", "type_set")
                            
                        elif workout_type == "cardio":
                            logger.debug(f"Fetching cardio workout details for workout ID {workout_id}")
                            cur.execute(getWorkoutDetailsQueryCardio, (workout_id,))
                            keys = ("duration", "distance", "percieved_difficulty")
                        else:
                            # Skip unknown workout types
                            logger.warning(f"Unknown workout type '{workout_type}' for workout ID {workout_id}, skipping")
                            continue
                            
                        details = cur.fetchall()
                        detailsList = self.__jsonifyTuple__(details, keys)
                        workouts[index] = {"name": row[1], "type": workout_type, "date": row[3], "details": detailsList}
                        index += 1
                    except Exception as e:
                        # Log this error but continue with other workouts
                        logger.error(f"Error processing workout {row[0]}: {str(e)}")
                        logger.debug(traceback.format_exc())
                
                logger.info(f"Retrieved {len(workouts)} workouts with details for user ID {self.id}")
                return workouts
            else:
                logger.debug(f"Processing {len(result)} workouts without details")
                for row in result:
                    workouts[index] = {"name": row[1], "type": row[2], "date": row[3]}
                    index += 1
                logger.info(f"Retrieved {len(workouts)} workouts for user ID {self.id}")
                return workouts
                
        except (UserNotFoundException, ConnectionError):
            logger.debug("Re-raising specific exception")
            raise
        except Exception as e:
            logger.error(f"Error retrieving activities: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error retrieving activities: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if conn:
                conn.close()
            logger.debug("Database connection closed")
            
    def __calculate_calories__(self, activity_type, speed, weight_kg, duration_seconds):
    
        MET_VALUES = {
        "walking": {
            2.0: 2.3, 2.5: 2.9, 3.0: 3.3, 3.5: 4.3, 4.0: 5.0, 4.5: 7.0, 5.0: 8.3
        },
        "running": {
            4.0: 6.0, 5.0: 8.3, 5.2: 9.0, 6.0: 9.8, 6.7: 10.5, 7.0: 11.0, 7.5: 11.5,
            8.0: 11.8, 9.0: 12.8, 10.0: 14.5, 12.0: 19.0
        }
        }
        duration_minutes = duration_seconds / 60 
        duration_hours = duration_minutes / 60
        met = MET_VALUES.get(activity_type, {}).get(speed)

        if not met:
            # Find the closest MET values above and below the given speed
            speeds = sorted(MET_VALUES.get(activity_type, {}).keys())
            lower_met, upper_met = None, None
            for s in speeds:
                if s <= speed:
                    lower_met = MET_VALUES[activity_type][s]
                if s > speed and upper_met is None:
                    upper_met = MET_VALUES[activity_type][s]
                    break

            if lower_met is None or upper_met is None:
                logger.warning(f"Cannot calculate MET for speed {speed} in activity type {activity_type}")
                raise InvalidStatsDataError(f"Invalid speed {speed} for activity type {activity_type}")

            # Calculate the average MET
            met = (lower_met + upper_met) / 2

        calories_burned = met * weight_kg * duration_hours
        return {"calories_burned": round(calories_burned, 2)}
    
    def formatUserPage(self, activities, conn=None):
        """
        Format workout activities data for user dashboard display.
        
        Args:
            activities (dict): Dictionary containing workout activity data
            conn (psycopg2.connection, optional): Database connection to reuse
            
        Returns:
            dict: Formatted workout data with calculated metrics
            
        Raises:
            InvalidStatsDataError: When activity data is invalid or malformed
            ConnectionError: When database connection fails
            QueryError: When there's an error executing database queries
        """
        logger.info(f"Formatting dashboard data for user ID {self.id} with {len(activities) if activities else 0} activities")
        
        if not activities:
            logger.debug("No activities provided to format")
            return {}
            
        final1 = {}
        should_close_conn = False
        
        try:
            # Establish database connection if not provided
            if not conn:
                try:
                    logger.debug("Opening new database connection for muscle group queries")
                    conn = global_func.getConnection()
                    should_close_conn = True
                except Exception as e:
                    logger.error(f"Failed to connect to database: {str(e)}")
                    raise ConnectionError(str(e))
            
            # Process each activity
            for activity_key, activity in activities.items():
                try:
                    if 'type' not in activity:
                        logger.warning(f"Activity missing 'type' field: {activity_key}")
                        continue
                        
                    if 'details' not in activity:
                        logger.warning(f"Activity missing 'details' field: {activity_key}")
                        continue
                        
                    activity_type = activity['type']
                    logger.debug(f"Processing {activity_type} activity: {activity['name']}")
                    
                    if activity_type == 'strength':
                        # Process strength workout
                        final = {
                            "Total Weight Lifted": 0, 
                            "Total Sets": 0, 
                            "Muscle Groups": [], 
                            "Date Performed": activity['date'] if 'date' in activity else 'Unknown date'
                        }
                        
                        for exercise in activity['details']:
                            if not isinstance(exercise, dict):
                                logger.warning(f"Invalid exercise data format: {exercise}")
                                continue
                                
                            # Validate required exercise fields
                            required_fields = ['exercise_name', 'type_set', 'weight', 'reps']
                            missing_fields = [field for field in required_fields if field not in exercise]
                            
                            if missing_fields:
                                logger.warning(f"Exercise missing required fields: {missing_fields}")
                                continue
                                
                            # Calculate total weight lifted and sets
                            totalWeightLifted = 0
                            totalSets = 0
                            
                            # Find muscle groups in a separate thread
                            q = queue.Queue()
                            muscle_thread = threading.Thread(
                                target=self.__findMuscles__, 
                                args=(exercise['exercise_id'], q, conn)
                            )
                            muscle_thread.start()
                            
                            # Process each set in the exercise
                            try:
                                for i in range(len(exercise['type_set'])):
                                    if i >= len(exercise['reps']) or i >= len(exercise['weight']):
                                        logger.warning(f"Index mismatch in exercise set data for {exercise['exercise_name']}")
                                        continue
                                        
                                    # Calculate weight based on whether it's single sided or not
                                    if exercise.get("single_sided", False):
                                        totalWeightLifted += exercise['weight'][i] * 2 * exercise['reps'][i]
                                    else:
                                        totalWeightLifted += exercise['weight'][i] * exercise['reps'][i]
                                    totalSets += 1
                            except (TypeError, ValueError) as e:
                                logger.error(f"Error calculating weight for {exercise['exercise_name']}: {str(e)}")
                            
                            # Wait for muscle thread to complete
                            muscle_thread.join()
                            final["Total Weight Lifted"] += totalWeightLifted
                            final["Total Sets"] += totalSets
                            
                            # Get muscle groups from the thread
                            try:
                                muscle = q.get(block=False)
                                if muscle:
                                    for m in muscle:
                                        if m not in final["Muscle Groups"]:
                                            final["Muscle Groups"].append(m)
                            except queue.Empty:
                                logger.warning(f"No muscle data returned for {exercise['exercise_name']}")
                        
                        # Add formatted activity to results
                        final1[activity['name']] = final
                        logger.debug(f"Processed strength workout: {activity['name']} - {final['Total Sets']} sets, {final['Total Weight Lifted']} total weight")
                        
                    elif activity_type == 'cardio':
                        # Process cardio workout
                        final = {
                            "Total Distance": 0, 
                            "Total Time": 0, 
                            "Calories Burned": 0, 
                            "Date Performed": activity.get('date', 'Unknown date')
                        }
                        
                        # Validate cardio activity has details
                        if not activity['details'] or len(activity['details']) == 0:
                            logger.warning(f"Cardio activity has no details: {activity['name']}")
                            continue
                        
                        details = activity['details'][0]
                        
                        # Validate required fields
                        if 'distance' not in details or 'duration' not in details:
                            logger.warning(f"Cardio activity missing distance or duration: {activity['name']}")
                            continue
                            
                        try:
                            # Set activity metrics
                            final["Total Distance"] = details['distance']
                            final["Total Time"] = details['duration']
                            
                            # Calculate calories burned
                            if self.weight is None:
                                logger.warning(f"Cannot calculate calories - user weight not available")
                                final["Calories Burned"] = 0
                            else:
                                try:
                                    avg_pace = float(details['distance'] / details['duration'])
                                    calories = self.__calculate_calories__(
                                        "running", round(avg_pace, 1), self.weight, details['duration']
                                    )
                                    final["Calories Burned"] = calories['calories_burned']
                                except (ZeroDivisionError, ValueError) as e:
                                    logger.error(f"Error calculating calories: {str(e)}")
                                    final["Calories Burned"] = 0
                        except Exception as e:
                            logger.error(f"Error processing cardio data: {str(e)}")
                            logger.debug(traceback.format_exc())
                        
                        # Add formatted activity to results
                        final1[activity['name']] = final
                        logger.debug(f"Processed cardio workout: {activity['name']} - {final['Calories Burned']} calories burned")
                    else:
                        logger.warning(f"Unknown activity type: {activity_type}")
                        
                except Exception as e:
                    logger.error(f"Error processing activity {activity_key}: {str(e)}")
                    logger.debug(traceback.format_exc())
                    # Continue processing other activities
                    
            logger.info(f"Successfully formatted {len(final1)} activities for user dashboard")
            return final1
            
        except (ConnectionError, QueryError):
            # Re-raise these specific exceptions
            logger.debug("Re-raising specific exception")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in formatUserPage: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error formatting user page: {str(e)}")
        finally:
            # Close connection only if we opened it
            if should_close_conn and conn:
                conn.close()
                logger.debug("Closed database connection")
                
    
    def __findMuscles__(self, exercise, q, conn=None):
        findMusclesQuery = sql.SQL("""SELECT name, primary_muscle, secondary_muscles FROM exercises WHERE id = %s""")
        
        try:
            try:
                logger.debug(f"Finding muscles for exercise {exercise}")
                logger.debug(f"Finding muscles for exercise {exercise}")
                if not conn:
                    conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            logger.debug(f"Executing query to find muscles for exercise: {exercise}")
            logger.debug(f"Executing query to find muscles for exercise: {exercise}")
            cur.execute(findMusclesQuery, (exercise,))
            result = cur.fetchone()
            
            final = []
            final = []
            if result:
                logger.debug(f"Raw muscle data for {exercise}: {result}")
                logger.debug(f"Raw muscle data for {exercise}: {result}")
                
                # Process primary muscle (first element)
                if result[1]:
                    if isinstance(result[1], str):
                        # If it's a PostgreSQL array string like "{muscle1,muscle2}"
                        if result[1].startswith('{') and result[1].endswith('}'):
                            # Parse PostgreSQL array format
                            muscles = result[1][1:-1].split(',')
                            for muscle in muscles:
                                muscle = muscle.strip().strip('"')
                                if muscle and muscle not in final:
                                    final.append(muscle)
                        else:
                            # Single string value
                            final.append(result[1])
                    elif isinstance(result[1], list):
                        # If it's already a Python list
                        for muscle in result[1]:
                            if muscle and muscle not in final:
                                final.append(muscle)
                
                # Process secondary muscles (second element)
                if result[2]:
                    if isinstance(result[2], str):
                        # If it's a PostgreSQL array string like "{muscle1,muscle2}"
                        if result[2].startswith('{') and result[2].endswith('}'):
                            # Parse PostgreSQL array format
                            muscles = result[2][1:-1].split(',')
                            for muscle in muscles:
                                muscle = muscle.strip().strip('"')
                                if muscle and muscle not in final:
                                    final.append(muscle)
                        else:
                            # Single string value
                            if result[2] not in final:
                                final.append(result[2])
                    elif isinstance(result[2], list):
                        # If it's already a Python list
                        for muscle in result[2]:
                            if muscle and muscle not in final:
                                final.append(muscle)
                
                logger.debug(f"Processed muscles for {result[0]}: {final}")
                q.put(final)
                # Process primary muscle (first element)
                if result[1]:
                    if isinstance(result[1], str):
                        # If it's a PostgreSQL array string like "{muscle1,muscle2}"
                        if result[1].startswith('{') and result[1].endswith('}'):
                            # Parse PostgreSQL array format
                            muscles = result[1][1:-1].split(',')
                            for muscle in muscles:
                                muscle = muscle.strip().strip('"')
                                if muscle and muscle not in final:
                                    final.append(muscle)
                        else:
                            # Single string value
                            final.append(result[1])
                    elif isinstance(result[1], list):
                        # If it's already a Python list
                        for muscle in result[1]:
                            if muscle and muscle not in final:
                                final.append(muscle)
                
                # Process secondary muscles (second element)
                if result[2]:
                    if isinstance(result[2], str):
                        # If it's a PostgreSQL array string like "{muscle1,muscle2}"
                        if result[2].startswith('{') and result[2].endswith('}'):
                            # Parse PostgreSQL array format
                            muscles = result[2][1:-1].split(',')
                            for muscle in muscles:
                                muscle = muscle.strip().strip('"')
                                if muscle and muscle not in final:
                                    final.append(muscle)
                        else:
                            # Single string value
                            if result[2] not in final:
                                final.append(result[2])
                    elif isinstance(result[2], list):
                        # If it's already a Python list
                        for muscle in result[2]:
                            if muscle and muscle not in final:
                                final.append(muscle)
                
                logger.debug(f"Processed muscles for {result[0]}: {final}")
                q.put(final)
                return final
            else:
                logger.warning(f"No muscles found for exercise {result[0]}")
                q.put([])
                return []
                
                logger.warning(f"No muscles found for exercise {result[0]}")
                q.put([])
                return []
                
        except Exception as e:
            logger.error(f"Error finding muscles for {exercise}: {str(e)}")
            logger.error(f"Error finding muscles for {exercise}: {str(e)}")
            logger.debug(traceback.format_exc())
            # Make sure we don't block the thread waiting for a result
            q.put([])
            return []
            # Make sure we don't block the thread waiting for a result
            q.put([])
            return []
        finally:
            if 'cur' in locals() and cur:
                cur.close()
                logger.debug("Cursor closed")
                logger.debug("Cursor closed")
        
            
    def insertSteps(self, steps, date, conn = None):
        """
        Inserts the user steps into the database
        
        :param steps: The number of steps the user has taken
        :param date: The date the steps were taken
        :param conn: The connection to the database
        
        :type steps: int
        :type date: datetime or str
        :type conn: psycopg2.connection
        
        :raises UserNotFoundException: When user ID is not found
        :raises InvalidStatsDataError: When steps data is invalid
        :raises ConnectionError: When database connection fails
        :raises QueryError: When there's an error executing the query
        """
        logger.info(f"Inserting steps for user ID {self.id}: steps={steps}, date={date}")
        
        # Validate user ID
        if self.id is None or self.id == -1:
            logger.warning("Cannot insert steps - Invalid user ID")
            raise UserNotFoundException()
        
        # Validate steps data
        if steps is None:
            logger.warning("Cannot insert steps - No steps data provided")
            raise InvalidStatsDataError("Steps value is required")
        
        try:
            # Validate steps is a positive number
            steps_value = int(steps)
            if steps_value < 0:
                logger.warning(f"Invalid steps value: {steps} (negative)")
                raise InvalidStatsDataError("Steps value must be a positive number")
        except (ValueError, TypeError):
            logger.warning(f"Invalid steps value: {steps} (not a number)")
            raise InvalidStatsDataError("Steps value must be a number")
        
        # Prepare SQL statements
        insertStepsQuery = sql.SQL("""INSERT INTO user_steps (user_id, steps, date_performed) VALUES (%s, %s, %s)""")
        checkStepsQuery = sql.SQL("""SELECT steps FROM user_steps WHERE user_id = %s AND date_performed = %s""")
        updateStepsQuery = sql.SQL("""UPDATE user_steps SET steps = %s WHERE user_id = %s AND date_performed = %s""")
        
        try:
            should_close_conn = False
            logger.debug("Establishing database connection")
            
            if not conn:
                should_close_conn = True
                try:
                    conn = global_func.getConnection()
                except Exception as e:
                    logger.error(f"Failed to connect to database: {str(e)}")
                    raise ConnectionError(str(e))
            
            cur = conn.cursor()
            try:
                # Check if steps already exist for this date
                logger.debug(f"Checking if steps already exist for user ID {self.id} on {date}")
                cur.execute(checkStepsQuery, (self.id, date))
                result = cur.fetchone()
                
                if result:
                    # Update existing steps
                    logger.debug(f"Steps already exist for user ID {self.id} on {date}, updating from {result[0]} to {steps_value}")
                    cur.execute(updateStepsQuery, (steps_value, self.id, date))
                else:
                    # Insert new steps
                    logger.debug(f"Inserting {steps_value} steps for user ID {self.id} on {date}")
                    cur.execute(insertStepsQuery, (self.id, steps_value, date))
                
                # Commit the transaction
                conn.commit()
                logger.info(f"Successfully {'updated' if result else 'inserted'} steps for user ID {self.id} on {date}")
                
            except psycopg2.Error as e:
                conn.rollback()
                logger.error(f"Database error while processing steps: {str(e)}")
                raise QueryError(f"Error processing steps: {str(e)}")
                
        except (UserNotFoundException, InvalidStatsDataError, ConnectionError, QueryError):
            # Re-raise specific exceptions
            logger.debug("Re-raising specific exception")
            raise
        except Exception as e:
            # For any other exceptions, convert to QueryError
            logger.error(f"Unexpected error in insertSteps: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error inserting steps: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if should_close_conn and 'conn' in locals() and conn:
                conn.close()
                logger.debug("Database connection closed")
                
    def getHomePageData(self, leaderboardType = None, conn = None):
        # Personal: Most recent workout
        # Leaderboard I have
        # Family: Most recent family workouts
        
        
        """
        Gets the user data for the home page

        Args:
            conn (_type_, optional): _description_. Defaults to None.
        """
        # most recent activity
        activities = self.getUserActivities(verbose = True, days = -1, number = 1, conn = conn)
        
        activity = {}
        
        if not activities:
            logger.warning("No activities found for user ID")
            activity = {}
        elif(activities[1]['type'] == 'strength'):
            sets = 0
            reps = 0
            weight = 0
            for exercise in activities[1]['details']:
                sets += len(exercise['weight'])
                reps += sum(exercise['reps'])
                weight += sum(exercise['weight'])
            activity = {
                "name": activities[1]['name'],
                "type": activities[1]['type'],
                "date": activities[1]['date'],
                "sets": sets,
                "reps": reps,
                "weight": weight
            }
        logger.info(f"Home page data for user ID {self.id}: {activity}")
        
        # weight data
        
        # weightStats = self.getUserStats(365)
        
        # if not weightStats:
        #     logger.warning("No weight stats found for user ID")
        #     weightStats = {}
        # else:
        #     weights = []
        #     for i in range(len(weightStats)):
        #         weights[i] = {
        #             "weight": weightStats[i]['weight'],
        #             "date": weightStats[i]['date']
        #         }
            
        if leaderboardType is None:
            leaderboardType = 'steps'
        else:
            leaderboardType = leaderboardType.lower()
        
        if leaderboardType not in ['steps', 'weight', 'deadlift', 'squat', 'bench']:
            logger.warning(f"Invalid leaderboard type: {leaderboardType}")
            raise InvalidLeaderboardTypeError()
        
        match leaderboardType:
            case 'deadlift':
                leaderboard = self.getLeaderboardRank('deadlift', conn)
            case 'squat':
                leaderboard = self.getLeaderboardRank('squat', conn)
            case 'bench':
                leaderboard = self.getLeaderboardRank('bench', conn)
            case 'steps':
                leaderboard = self.getLeaderboardRank('steps', conn)
                
        logger.info(f"Leaderboard data for user ID {self.id}: {leaderboard}")
        
        # get user goal progress
        
        familyWkouts = self.getFamilyWorkouts(conn)
        
        if not familyWkouts:
            logger.warning("No family workouts found for user ID")
            familyWkouts = []

        return activity, leaderboard, familyWkouts
            
        

    def getLeaderboardRank(self, exercise = None, conn = None):
        """
        Gets the leaderboard rank for the user
        
        :param exercise: The exercise to get the rank for
        :param conn: The connection to the database
        
        :type exercise: str
        :type conn: psycopg2.connection
        
        :return: The leaderboard rank
        :rtype: dict
        """
        logger.info(f"Getting leaderboard rank for user ID {self.id} for exercise {exercise}")
        
        if not conn:
            try:
                logger.debug("Establishing database connection")
                conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
            
        cur = conn.cursor()
                
        ex = {'deadlift': 523, 'squat': 716, 'bench': 273}
        
        
        query = sql.SQL("""
                        WITH latest_1rm AS (
                            SELECT DISTINCT ON (uem.user_id)
                                uem.user_id,
                                uem.exercise_id,
                                uem.calculated_1rm,
                                uem.date_performed,
                                u.username
                            FROM user_exercise_max uem
                            JOIN users u ON u.id = uem.user_id
                            WHERE uem.exercise_id = %s
                            ORDER BY uem.user_id, uem.date_performed DESC
                        ),
                        ranked AS (
                            SELECT *,
                                RANK() OVER (ORDER BY calculated_1rm DESC) AS rank
                            FROM latest_1rm
                        ),
                        target_user AS (
                            SELECT rank FROM ranked WHERE user_id = %s
                        )
                        SELECT r.*
                        FROM ranked r
                        JOIN target_user t ON r.rank BETWEEN t.rank - 2 AND t.rank + 2
                        ORDER BY r.rank;
                        """)
        
        stepsQuery = sql.SQL("""WITH ranked_users AS (
                                    SELECT 
                                        us.user_id,
                                        u.username,
                                        ROUND(AVG(us.steps)::numeric, 2) AS avg_steps,
                                        ROW_NUMBER() OVER (ORDER BY AVG(us.steps) DESC) AS rank
                                    FROM user_steps us
                                    JOIN users u ON u.id = us.user_id
                                    GROUP BY us.user_id, u.username
                                ),
                                target_user AS (
                                    SELECT rank FROM ranked_users WHERE user_id = %s
                                ),
                                bounds AS (
                                    SELECT 
                                        CASE 
                                    WHEN rank <= 3 THEN 1
                                    WHEN rank >= (SELECT MAX(rank) FROM ranked_users) - 2 THEN GREATEST((SELECT MAX(rank) FROM ranked_users) - 4, 1)
                                    ELSE rank - 2
                                    END AS start_rank
                                FROM target_user
                                )
                                SELECT 
                                    ru.username,
                                    ru.avg_steps,
                                    ru.rank
                                FROM ranked_users ru, bounds
                                WHERE ru.rank BETWEEN bounds.start_rank AND bounds.start_rank + 4
                                ORDER BY ru.rank;

                            """)
        
        if self.id is None or self.id == -1:
            logger.warning("Cannot get leaderboard rank - Invalid user ID")
            raise UserNotFoundException()
        
        if exercise is None:
            logger.warning("Cannot get leaderboard rank - Invalid exercise")
            raise InvalidLeaderboardTypeError()
        
        logger.debug("I get here!!!!!!")
        
        try:
            
            logger.debug(f"Executing query to get leaderboard rank for user ID {self.id} and exercise {exercise}")
            
            match exercise:
                case 'deadlift':
                    cur.execute(query, (ex['deadlift'], self.id))
                case 'squat':
                    cur.execute(query, (ex['squat'], self.id))
                case 'bench':
                    cur.execute(query, (ex['bench'], self.id))
                case 'steps':
                    cur.execute(stepsQuery, (self.id,))
                case _:
                    logger.warning(f"Invalid exercise type: {exercise}")
                    raise InvalidLeaderboardTypeError()
                
            result = cur.fetchall()
            logger.debug(f"Fetched leaderboard rank for user ID {self.id}: {result}")
            final = []
            if not result:
                logger.info(f"No leaderboard data found for user ID {self.id}")
                return []
            else:
                # Process the result into a more readable format
                if exercise != 'steps':
                    keys = ("user_id", "exercise_id", "calculated_1rm", "date_performed", "username", "rank")
                    final = self.__jsonifyTuple__(result, keys)
                else:
                    keys = ("username", "avg_steps", "rank")
                    final = self.__jsonifyTuple__(result, keys)
                logger.info(f"Leaderboard rank data for user ID {self.id}: {final}")
                return final
        except Exception as e:
            logger.error(f"Error fetching leaderboard rank: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error fetching leaderboard rank: {str(e)}")
    
    def getFamilyWorkouts(self, conn = None):
        """
        Gets the family workouts for the user across all families they belong to
        
        :param conn: The connection to the database
        :type conn: psycopg2.connection
        
        :return: The family workouts
        :rtype: dict
        """
        logger.info(f"Getting family workouts for user ID {self.id}")
        
        if not conn:
            try:
                logger.debug("Establishing database connection")
                conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
        
        cur = conn.cursor()
        
        # Modified query to include family name
        query = sql.SQL("""WITH user_families AS (
                            SELECT fm.family_id, f.family_name AS family_name
                            FROM family_members fm
                            JOIN family f ON fm.family_id = f.id
                            WHERE fm.user_id = %s
                        ),
                        family_members_in_user_families AS (
                            SELECT fm.user_id, uf.family_name
                            FROM family_members fm
                            JOIN user_families uf ON fm.family_id = uf.family_id
                            WHERE fm.user_id != %s  -- Exclude the current user
                        ),
                        latest_workouts AS (
                            SELECT DISTINCT ON (w.user_id)
                                w.id AS workout_id,
                                w.user_id,
                                w.workout_date,
                                fmu.family_name
                            FROM workouts w
                            JOIN family_members_in_user_families fmu ON fmu.user_id = w.user_id
                            ORDER BY w.user_id, w.workout_date DESC
                        )

                        SELECT 
                            u.username AS family_member,
                            lw.workout_date,
                            array_agg(DISTINCT e.primary_muscle) AS primary_muscles_hit,
                            array_agg(DISTINCT sm.muscle) AS secondary_muscles_hit,
                            lw.family_name
                        FROM latest_workouts lw
                        JOIN users u ON u.id = lw.user_id
                        JOIN workout_exercises we ON we.workout_id = lw.workout_id
                        JOIN exercises e ON e.id = we.exercise_id
                        LEFT JOIN LATERAL unnest(e.secondary_muscles) AS sm(muscle) ON TRUE
                        GROUP BY u.username, lw.workout_date, lw.family_name
                        ORDER BY lw.workout_date DESC;
                    """)
        
        try:
            # Pass the user ID twice - once to find all families and once to exclude self
            cur.execute(query, (self.id, self.id))
            result = cur.fetchall()
            logger.debug(f"Fetched family workouts for user ID {self.id}: {result}")
            
            if not result:
                logger.info(f"No family workouts found for user ID {self.id}")
                return []
            else:
                # Process the result into a more readable format
                keys = ("family_member", "workout_date", "primary_muscles_hit", "secondary_muscles_hit", "family_name")
                raw_data = self.__jsonifyTuple__(result, keys)
                
                # Clean up the array strings and convert to proper lists
                clean_data = []
                for workout in raw_data:
                    clean_workout = workout.copy()
                    
                    # Clean primary muscles format - convert PostgreSQL array string to list
                    if isinstance(workout.get('primary_muscles_hit'), str):
                        muscles_str = workout['primary_muscles_hit']
                        # Remove the curly braces and split by commas
                        if muscles_str.startswith('{') and muscles_str.endswith('}'):
                            muscles_str = muscles_str[1:-1]
                            # Split by comma but handle quoted strings properly
                            muscles_list = []
                            for muscle in muscles_str.split(','):
                                muscle = muscle.strip().strip('"')
                                if muscle:  # Only add if not empty
                                    # Additional cleaning - remove any remaining curly braces
                                    if muscle.startswith('{'):
                                        muscle = muscle[1:]
                                    if muscle.endswith('}'):
                                        muscle = muscle[:-1]
                                    muscles_list.append(muscle)
                            clean_workout['primary_muscles_hit'] = muscles_list
                    
                    # Clean secondary muscles format
                    if isinstance(workout.get('secondary_muscles_hit'), str):
                        muscles_str = workout['secondary_muscles_hit']
                        if muscles_str.startswith('{') and muscles_str.endswith('}'):
                            muscles_str = muscles_str[1:-1]
                            # Split by comma but handle quoted strings properly
                            muscles_list = []
                            for muscle in muscles_str.split(','):
                                muscle = muscle.strip().strip('"')
                                if muscle:  # Only add if not empty
                                    muscles_list.append(muscle)
                            clean_workout['secondary_muscles_hit'] = muscles_list
                    
                    clean_data.append(clean_workout)
                
                logger.info(f"Family workouts data for user ID {self.id}: {clean_data}")
                return clean_data
                
        except Exception as e:
            logger.error(f"Error fetching family workouts: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error fetching family workouts: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if conn:
                conn.close()
            logger.debug("Database connection closed")
        
        
    def getUserGoal(self, goalType, exercise = None, conn = None):
        """
        Gets the user goal for the given type
        
        :param type: The type of goal to get
        :param conn: The connection to the database
        
        :type type: str
        :type conn: psycopg2.connection
        
        :return: The user goal
        :rtype: dict
        """
        logger.info(f"Getting user goal for user ID {self.id} of type {type}")
        
        if not conn:
            try:
                logger.debug("Establishing database connection")
                conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
        
        cur = conn.cursor()
        try:
            match goalType:
                case 'weight':
                    query = sql.SQL("""SELECT created_at, target_weight FROM weight_goals WHERE user_id = %s AND achieved = false ORDER BY created_at DESC LIMIT 1""")
                    cur.execute(query, (self.id,))
                case 'strength':
                    query = sql.SQL("""SELECT created_at, target_1rm FROM strength_goals WHERE user_id = %s AND achieved = false AND target_exercise = %s ORDER BY created_at DESC LIMIT 1""")
                    if exercise is None:
                        logger.warning("Cannot get strength goal - Invalid exercise")
                        raise InvalidStatsDataError("Exercise is required for strength goal")
                    cur.execute(query, (self.id,exercise))
                case _:
                    logger.warning(f"Invalid goal type: {goalType}")
                    raise InvalidGoalTypeError()
                
        except:
            pass
        
    def createGoal(self, goalType, conn = None, **kwargs):
        """
        Creates a user goal for the given type
        
        :param goalType: The type of goal to create
        :param conn: The connection to the database
        
        :type goalType: str
        :type conn: psycopg2.connection
        :param kwargs: Additional parameters for the goal
        :type kwargs: dict
        
        :raises InvalidGoalTypeError: When the goal type is invalid
        :raises InvalidStatsDataError: When the stats data is invalid
        :raises ConnectionError: When database connection fails
        :raises QueryError: When there's an error executing the query
        """
        logger.info(f"Creating user goal for user ID {self.id} of type {goalType}")
        
        if not conn:
            try:
                logger.debug("Establishing database connection")
                conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
        
        cur = conn.cursor()
        try:
            match goalType:
                case 'weight':
                    if 'goal_weight' not in kwargs:
                        logger.warning("Cannot create weight goal - target_weight is required")
                        raise InvalidStatsDataError("target_weight is required for weight goal")
                    query = sql.SQL("""INSERT INTO weight_goals (user_id, goal_type, target_weight, achieve_by) VALUES (%s, 'weight'::goal_type_enum, %s, %s)""")
                    cur.execute(query, (self.id, kwargs['goal_weight'], kwargs['achieve_by']))
                    
                case 'strength':
                    if 'target_reps' not in kwargs or 'target_exercise' not in kwargs or 'target_weight' not in kwargs:
                        logger.warning("Cannot create strength goal - target_1rm and exercise_id are required")
                        raise InvalidStatsDataError("target_weight and target_exercise are required for strength goal")
                    query = sql.SQL("""INSERT INTO strength_goals (user_id, goal_type, target_reps, target_exercise, target_weight, achieve_by) VALUES (%s, 'strength'::goal_type_enum ,%s, %s, %s, %s)""")
                    cur.execute(query, (self.id, kwargs['target_reps'], kwargs['target_exercise'], kwargs['target_weight'], kwargs['achieve_by']))
                    
                case 'cardio':
                    if 'target_distance' not in kwargs or 'target_time' not in kwargs:
                        logger.warning("Cannot create cardio goal - target_distance and target_time are required")
                        raise InvalidStatsDataError("target_distance and target_time are required for cardio goal")
                    query = sql.SQL("""INSERT INTO cardio_goals (user_id, goal_type, target_distance, target_time, achieve_by) VALUES (%s, 'cardio'::goal_type_enum, %s, %s, %s)""")
                    cur.execute(query, (self.id, kwargs['target_distance'], kwargs['target_time'], kwargs['achieve_by']))
                    
                case 'steps':
                    if 'target_steps' not in kwargs:
                        logger.warning("Cannot create steps goal - target_steps is required")
                        raise InvalidStatsDataError("target_steps is required for steps goal")
                    query = sql.SQL("""INSERT INTO step_goals (user_id, goal_type, target_steps, achieve_by) VALUES (%s, 'steps'::goal_type_enum, %s, %s)""")
                    cur.execute(query, (self.id, kwargs['target_steps'], kwargs['achieve_by']))
                    
                case _:
                    logger.warning(f"Invalid goal type: {goalType}")
                    raise InvalidGoalTypeError()
                
            conn.commit()
            logger.info(f"Successfully created {goalType} goal for user ID {self.id}")
            
        except Exception as e:
            conn.rollback()
            logger.error(f"Error creating goal: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error creating goal: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if conn:
                conn.close()
                
    def getStepData(self, month = None, year = None, conn = None):
        """
        Gets the step data for the given month and year
        
        :param month: The month to get the data for
        :param year: The year to get the data for
        :param conn: The connection to the database
        
        :type month: int
        :type year: int
        :type conn: psycopg2.connection
        
        :return: The step data
        :rtype: dict
        """
        logger.info(f"Getting step data for user ID {self.id} for month {month} and year {year}")
        
        if not conn:
            try:
                logger.debug("Establishing database connection")
                conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
        
        cur = conn.cursor()
        
        if not month:
            month = datetime.now().month
        if not year:
            year = datetime.now().year
        
        # Define SQL query to fetch step data
        query = sql.SQL("""SELECT date_performed, steps FROM user_steps WHERE user_id = %s AND EXTRACT(MONTH FROM date_performed) = %s AND EXTRACT(YEAR FROM date_performed) = %s""")
        
        weeklyQuery = sql.SQL("""SELECT SUM(steps) AS total_steps
                                        FROM user_steps
                                        WHERE date_performed >= CURRENT_DATE - ((EXTRACT(DOW FROM CURRENT_DATE)::INT + 1) % 7)
                                            AND date_performed <= CURRENT_DATE
                                            AND user_id = %s;
                                """)
        
        monthlyStepsQuery = sql.SQL("""SELECT SUM(steps) AS total_steps
                                            FROM user_steps
                                            WHERE date_performed >= date_trunc('month', CURRENT_DATE)
                                                AND date_performed <= CURRENT_DATE
                                                AND user_id = %s;
                                        """)
        
        currentStreakQuery = sql.SQL("""WITH consecutive_dates AS (
                                                SELECT
                                                    date_performed,
                                                    ROW_NUMBER() OVER (ORDER BY date_performed DESC) AS rn
                                                FROM user_steps
                                                WHERE steps > 0
                                                    AND date_performed <= CURRENT_DATE
                                                    AND user_id = %s
                                            ),
                                            grouped_dates AS (
                                                SELECT
                                                    date_performed,
                                                    date_performed + rn * INTERVAL '1 day' AS group_id
                                                FROM consecutive_dates
                                            ),
                                            streak_groups AS (
                                                SELECT
                                                    MIN(date_performed) AS start_date,
                                                    MAX(date_performed) AS end_date,
                                                    COUNT(*) AS streak_length
                                                FROM grouped_dates
                                                GROUP BY group_id
                                            )
                                            SELECT streak_length
                                            FROM streak_groups
                                            WHERE end_date = CURRENT_DATE;
                                            """)
        
        averageStepsQuery = sql.SQL("""SELECT AVG(steps) AS average_steps
                                            FROM user_steps
                                            WHERE user_id = %s;"""
                                        )
        
        stepGoalQuery = sql.SQL("""SELECT target_steps
                                    FROM step_goals
                                    WHERE user_id = %s
                                    ORDER BY created_at DESC
                                    LIMIT 1;""")
        
        try:
            cur.execute(query, (self.id, month, year))
            steps = cur.fetchall()
            
            if not steps:
                logger.info(f"No step data found for user ID {self.id} for month {month} and year {year}")
                steps = {}
                
            
            cur.execute(query, (self.id, month, year))
            steps = cur.fetchall()
        
            if not steps:
                logger.info(f"No step data found for user ID {self.id} for month {month} and year {year}")
                steps = {}
        
        # Execute each query with proper error handling
            try:
                cur.execute(weeklyQuery, (self.id,))
                weeklySteps = cur.fetchone()
            except Exception as e:
                logger.error(f"Error executing weekly steps query: {str(e)}")
                weeklySteps = None
        
            try:
                cur.execute(monthlyStepsQuery, (self.id,))
                monthlySteps = cur.fetchone()
            except Exception as e:
                logger.error(f"Error executing monthly steps query: {str(e)}")
                monthlySteps = None
        
            try:
                cur.execute(currentStreakQuery, (self.id,))
                currentStreak = cur.fetchone()
            except Exception as e:
                logger.error(f"Error executing current streak query: {str(e)}")
                currentStreak = None
        
            try:
                cur.execute(averageStepsQuery, (self.id,))
                averageSteps = cur.fetchone()
            except Exception as e:
                logger.error(f"Error executing average steps query: {str(e)}")
                averageSteps = None
        
            try:
                cur.execute(stepGoalQuery, (self.id,))
                stepGoal = cur.fetchone()
            except Exception as e:
                logger.error(f"Error executing step goal query: {str(e)}")
                stepGoal = None
            
            
            
            statistics = {
                "weekly_steps": weeklySteps[0] if weeklySteps else 0,
                "monthly_steps": monthlySteps[0] if monthlySteps else 0,
                "current_streak": currentStreak[0] if currentStreak else 0,
                "average_steps": round(float(averageSteps[0]), 2) if averageSteps[0] is not None else 0
            }
            
            userInfo = {'username': self.username, "step_goal": stepGoal[0] if stepGoal else 0}
            
            
            
            # Process result into a more readable format
            step_data = []
            for day in steps:
                temp = {}
                datePerformed = day[0].strftime("%Y-%m-%d")
                stepsValue = day[1]
                goal_percentage = round((stepsValue / userInfo['step_goal']) * 100, 2) if userInfo['step_goal'] > 0 else 0
                
                temp['date'] = datePerformed
                temp['steps'] = stepsValue
                temp['goal_percentage'] = goal_percentage
                step_data.append(temp)

            logger.info(f"Step data for user ID {self.id}: {step_data}")
            return userInfo, statistics, step_data
            
        except Exception as e:
            logger.error(f"Error fetching step data: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error fetching step data: {str(e)}")
        
        
        
    def __getSingleSided__(self, exercise):
        pass

    def __jsonifyTuple__(self, data, keys):
        """
        Converts a tuple into a json object
        
        :param data: The data to be converted
        :param keys: The keys to be used in the json object
        
        :type data: tuple
        :type keys: tuple
        
        :return: The json object
        :rtype: dict
        """
        logger.debug(f"Converting {len(data)} tuples to JSON with keys {keys}")
        final = []
        for row in data:
            temp = {}
            for i in range(len(keys)):
                if i < len(row):  # Ensure we don't go out of bounds
                    temp[keys[i]] = row[i]
                else:
                    temp[keys[i]] = None  # Handle missing data gracefully
            final.append(temp)
        return final


