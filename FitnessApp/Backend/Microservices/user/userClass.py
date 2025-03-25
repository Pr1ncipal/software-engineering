import psycopg2
from psycopg2 import sql
import psycopg2.errors
import global_func
import random
import string
import logging
import traceback
# Import your existing error classes
from userErrors import *

# Get logger
logger = logging.getLogger(__name__)

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
            
        loginUserQuery = sql.SQL("""SELECT key FROM users WHERE username = %s AND password_hash = %s""")
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
    
    def getUserStats(self, days = 0, conn = None):
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
    
    def getUserActivities(self, verbose = False, days = 7, conn = None):
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
            
        getUserActivitiesQuery = sql.SQL("""SELECT id, name, workout_type, workout_date FROM workouts WHERE user_id = %s AND workout_date >= CURRENT_DATE - interval '%s day'""")

        if verbose:
            logger.debug("Preparing detailed workout queries")
            getWorkoutDetailsQueryStrength = sql.SQL("""SELECT (SELECT name FROM exercises WHERE id = %s), sets.reps, sets.percieved_difficulty, sets.weight, sets.type_set FROM workout_exercises WHERE workout_id = %s ORDER BY exercise_name""")
            getWorkoutDetailsQueryCardio = sql.SQL("""SELECT duration, distance, percieved_difficulty FROM workout_cardio WHERE workout_id = %s""")
            
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
            cur.execute(getUserActivitiesQuery, (self.id, days))
            result = cur.fetchall()
            
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
                        
                        if workout_type == "Strength":
                            logger.debug(f"Fetching strength workout details for workout ID {workout_id}")
                            cur.execute(getWorkoutDetailsQueryStrength, (workout_id, workout_id))
                            keys = ("exercise_name", "reps", "percieved_difficulty", "weight", "type_set")
                            
                        elif workout_type == "Cardio":
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


