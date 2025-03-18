import psycopg2
from psycopg2 import sql
import psycopg2.errors
import global_func
import random
import string
# Import your existing error classes
from userErrors import *

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
            return
        
        getUserQuery = sql.SQL("""SELECT id, email, fname, lname, password_hash, dob, sex, BFL, username, key FROM users WHERE key = %s""")
        try:
            try:
                conn = global_func.getConnection()
            except Exception as e:
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            cur.execute(getUserQuery, (self.key,))
            result = cur.fetchone()
            if result:
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
            else:
                self.id = -1
                raise UserNotFoundException()
        except (ConnectionError, UserNotFoundException):
            # Re-raise these specific exceptions
            raise
        except Exception as e:
            # For any other exceptions, convert to QueryError
            raise QueryError(f"Error retrieving user: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if conn:
                conn.close()
        
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
            raise MissingRequiredFieldError(", ".join(missing_fields))
        
        createUserQuery = sql.SQL("""INSERT INTO users (email, fname, lname, password_hash, dob, sex, key, username)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s) 
        RETURNING id""")
        
        try:
            try:
                if not conn:
                    conn = global_func.getConnection()
            except Exception as e:
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            key = self.__generateKey__(conn=conn)
            self.key = key
            cur.execute(createUserQuery, (self.email, self.fname, self.lname, self.pass_hash, self.dob, self.sex, key, self.username))
            id = cur.fetchone()[0]
            if id:
                self.id = id
                conn.commit()
            else:
                conn.rollback()
                raise QueryError("User creation failed - no ID returned")
            
        except psycopg2.errors.UniqueViolation as e:
            conn.rollback()
            # Identify if it's the email or username that's duplicated
            if "email" in str(e).lower():
                raise UserAlreadyExistsError("A user with this email already exists")
            elif "username" in str(e).lower():
                raise UserAlreadyExistsError("A user with this username already exists")
            else:
                raise UserAlreadyExistsError()
        except (ConnectionError, MissingRequiredFieldError, QueryError, UserAlreadyExistsError):
            # Re-raise these specific exceptions
            raise
        except Exception as e:
            if conn:
                conn.rollback()
            raise QueryError(f"User creation failed: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if conn:
                conn.close()
            
    def __generateKey__(self, conn = None):
        """
        Generates a key for the user
        
        :return: A unique key string
        :rtype: str
        :raises ConnectionError: When database connection fails
        :raises QueryError: When there's an error executing the query
        """
        KEYSET = string.ascii_letters + string.digits + "!#$%&()*+,-./:;<=>?@[\\]^_`{|}~"
        key = ''.join(random.choices(KEYSET, k=64))
        
        try:
            if not conn:
                try:
                    conn = global_func.getConnection()
                except Exception as e:
                    raise ConnectionError(str(e))
                    
            cur = conn.cursor()
            checkKeyQuery = sql.SQL("""SELECT key FROM users WHERE key = %s""")
            cur.execute(checkKeyQuery, (key,))
            result = cur.fetchone()
            
            while result:
                key = ''.join(random.choices(KEYSET, k=64))
                cur.execute(checkKeyQuery, (key,))
                result = cur.fetchone()
            
            return key
        except ConnectionError:
            raise
        except Exception as e:
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
        if self.id is None or self.id == -1:
            raise UserNotFoundException()
            
        if self.email is None and self.pass_hash is None:
            raise InvalidUserDataError("No data provided to update")
        
        # Determine what fields to update
        fields_to_update = []
        params = []
        
        if self.email is not None:
            fields_to_update.append("email = %s")
            params.append(self.email)
            
        if self.pass_hash is not None:
            fields_to_update.append("password_hash = %s")
            params.append(self.pass_hash)
            
        if not fields_to_update:
            return
            
        # Add ID as the last parameter
        params.append(self.id)
        
        # Build the query dynamically based on fields to update
        update_clause = ", ".join(fields_to_update)
        updateUserQuery = sql.SQL(f"UPDATE users SET {update_clause} WHERE id = %s")
        
        try:
            try:
                conn = global_func.getConnection()
            except Exception as e:
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            cur.execute(updateUserQuery, params)
            
            # Check if any row was affected
            if cur.rowcount == 0:
                raise UserNotFoundException()
                
            conn.commit()
            
        except (UserNotFoundException, ConnectionError):
            raise
        except Exception as e:
            if conn:
                conn.rollback()
            raise QueryError(f"Error updating user: {str(e)}")
        
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if conn:
                conn.close()
    
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
        if self.id is None or self.id == -1:
            raise UserNotFoundException()
            
        deleteUserQuery = sql.SQL("""DELETE FROM users WHERE id = %s""")
        try:
            try:
                conn = global_func.getConnection()
            except Exception as e:
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            cur.execute(deleteUserQuery, (self.id,))
            
            # Check if any row was deleted
            if cur.rowcount == 0:
                raise UserNotFoundException()
                
            conn.commit()
            
        except (UserNotFoundException, ConnectionError):
            raise
        except Exception as e:
            if conn:
                conn.rollback()
            raise QueryError(f"Error deleting user: {str(e)}")
        finally:    
            if 'cur' in locals() and cur:
                cur.close()
            if conn:
                conn.close()
    
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
        if not self.username or not self.pass_hash:
            raise MissingRequiredFieldError("username and password")
            
        loginUserQuery = sql.SQL("""SELECT key FROM users WHERE username = %s AND password_hash = %s""")
        try:
            try:
                if not conn:
                    conn = global_func.getConnection()
            except Exception as e:
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            cur.execute(loginUserQuery, (self.username, self.pass_hash))
            result = cur.fetchone()
            
            if result:
                return result[0]
            else:
                raise IncorrectCredentialsError()
                
        except (IncorrectCredentialsError, ConnectionError, MissingRequiredFieldError):
            raise
        except Exception as e:
            raise QueryError(f"Error during login: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if conn:
                conn.close()
    

        



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
    def __init__(self, email = None, fname=None, lname=None, pass_hash=None, dob=None, sex=None, BFL=None, key=None, height = None, weight = None, username = None):
        super().__init__(fname=fname, lname=lname, pass_hash=pass_hash, dob=dob, sex=sex, BFL=BFL, key=key,email=email,username=username)
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
        if self.id is None or self.id == -1:
            raise UserNotFoundException()
            
        if self.height is None and self.weight is None:
            raise InvalidStatsDataError("No stats provided")
            
        insertStatsQuery = sql.SQL("""INSERT INTO user_stats (user_id, height, weight) VALUES (%s, %s, %s)""")
        try:
            try:
                if not conn:
                    conn = global_func.getConnection()
            except Exception as e:
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            cur.execute(insertStatsQuery, (self.id, self.height, self.weight))
            conn.commit()
            
        except (UserNotFoundException, InvalidStatsDataError, ConnectionError):
            raise
        except Exception as e:
            if conn:
                conn.rollback()
            raise QueryError(f"Error inserting stats: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if conn:
                conn.close()
    
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
        if self.id is None or self.id == -1:
            raise UserNotFoundException()
            
        getUserStatsQuery = sql.SQL("""SELECT height, weight, created_at FROM user_stats WHERE user_id = %s and created_at >= CURRENT_DATE - interval '%s day'""")
        try:
            try:
                if not conn:
                    conn = global_func.getConnection()
            except Exception as e:
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            cur.execute(getUserStatsQuery, (self.id, days))
            result = cur.fetchall()
            
            if result:
                return self.__jsonifyTuple__(result, ("height", "weight", "date"))
            else:
                raise StatsNotFoundException()
                
        except (UserNotFoundException, StatsNotFoundException, ConnectionError):
            raise
        except Exception as e:
            raise QueryError(f"Error retrieving stats: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if conn:
                conn.close()
    
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
        if self.id is None or self.id == -1:
            raise UserNotFoundException()
            
        getUserActivitiesQuery = sql.SQL("""SELECT id, name, workout_type, workout_date FROM workouts WHERE user_id = %s AND workout_date >= CURRENT_DATE - interval '%s day'""")

        if verbose:
            getWorkoutDetailsQueryStrength = sql.SQL("""SELECT (SELECT name FROM exercises WHERE id = %s), sets.reps, sets.percieved_difficulty, sets.weight, sets.type_set FROM workout_exercises WHERE workout_id = %s ORDER BY exercise_name""")
            getWorkoutDetailsQueryCardio = sql.SQL("""SELECT duration, distance, percieved_difficulty FROM workout_cardio WHERE workout_id = %s""")
            
        try:
            try:
                if not conn:
                    conn = global_func.getConnection()
            except Exception as e:
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            cur.execute(getUserActivitiesQuery, (self.id, days))
            result = cur.fetchall()
            
            workouts = {}
            index = 1
            
            if not result:
                return workouts  # Return empty dict if no workouts
                
            if verbose:
                for row in result:
                    try:
                        if row[2] == "Strength":
                            cur.execute(getWorkoutDetailsQueryStrength, (row[0], row[0]))
                            keys = ("exercise_name", "reps", "percieved_difficulty", "weight", "type_set")
                            
                        elif row[2] == "Cardio":
                            cur.execute(getWorkoutDetailsQueryCardio, (row[0],))
                            keys = ("duration", "distance", "percieved_difficulty")
                        else:
                            # Skip unknown workout types
                            continue
                            
                        details = cur.fetchall()
                        detailsList = self.__jsonifyTuple__(details, keys)
                        workouts[index] = {"name": row[1], "type": row[2], "date": row[3], "details": detailsList}
                        index += 1
                    except Exception as e:
                        # Log this error but continue with other workouts
                        print(f"Error processing workout {row[0]}: {str(e)}")
                
                return workouts
            else:
                for row in result:
                    workouts[index] = {"name": row[1], "type": row[2], "date": row[3]}
                    index += 1
                return workouts
                
        except (UserNotFoundException, ConnectionError):
            raise
        except Exception as e:
            raise QueryError(f"Error retrieving activities: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if conn:
                conn.close()

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


