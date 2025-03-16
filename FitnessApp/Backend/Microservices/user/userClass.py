import psycopg2
from psycopg2 import sql
import psycopg2.errors
import global_func
import random
import string

class User ():
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
        """
        if self.key == None:
            return
        
        getUserQuery = sql.SQL(""""SELECT id, email, fname, lname, password_hash, dob, sex, BFL, username, key FROM users WHERE key = %s""")
        try:
            conn = global_func.getConnection()
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
        except Exception as e:
            pass
        finally:
            cur.close()
            conn.close()
        
    def createUser(self, conn = None):
        """
        Inserts the user into the database
        
        :param conn: The connection to the database
        :type conn: psycopg2.connection
        
        :return: None
        """
        if self.email == None or self.fname == None or self.lname == None or self.pass_hash == None or self.dob == None or self.sex == None or self.username == None:
            raise UserExeceptions("Missing Information")
        
        createUserQuery = sql.SQL("""INSERT INTO users (email, fname, lname, password_hash, dob, sex, key, username)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s) 
        RETURNING id""")
        
        try:
            if not conn:
                conn = global_func.getConnection()
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
                raise Exception("User not created")
            
            
        except psycopg2.errors.UniqueViolation as e:
            pass
        
        finally:
            cur.close()
            conn.close()
            
    def __generateKey__(self, conn = None):
        """
        Generates a key for the user
        
        :return: None
        """
        KEYSET = string.ascii_letters + string.digits + "!#$%&()*+,-./:;<=>?@[\\]^_`{|}~"
        key = ''.join(random.choices(KEYSET, k=64))
        
        if not conn:
            conn = global_func.getConnection()
        cur = conn.cursor()
        checkKeyQuery = sql.SQL("""SELECT key FROM users WHERE key = %s""")
        cur.execute(checkKeyQuery, (key,))
        result = cur.fetchone()
        
        while result:
            key = ''.join(random.choices(KEYSET, k=64))
            cur.execute(checkKeyQuery, (key,))
            result = cur.fetchone()
        
        return key
    
    def updateUser(self, conn = None):
        """
        Updates the user information in the database
        
        :param conn: The connection to the database
        :type conn: psycopg2.connection
        
        :return: None
        """
        if self.email == None and self.pass_hash == None:
            return
        
        updateUserQuery = sql.SQL("""UPDATE users SET email = %s, password_hash = %s WHERE id = %s""")
        try:
            conn = global_func.getConnection()
            cur = conn.cursor()
            cur.execute(updateUserQuery, (self.email, self.pass_hash, self.id))
            conn.commit()
            
        except Exception as e:
            pass #Create exception
        
        finally:
            cur.close()
            conn.close()
    
    def deleteUser(self, conn = None):
        """
        Deletes the user from the database
        
        :param conn: The connection to the database
        
        :type conn: psycopg2.connection
        
        :return: None
        """
        if self.id == None:
            return
        deleteUserQuery = sql.SQL("""DELETE FROM users WHERE id = %s""")
        try:
            conn = global_func.getConnection()
            cur = conn.cursor()
            cur.execute(deleteUserQuery, (self.id,))
            conn.commit()
        except Exception as e:
            pass
        finally:    
            cur.close()
            conn.close()
    
    def login(self, conn = None):
        """
        Gets the user login information from the database
        
        :param conn: The connection to the database
        
        :type conn: psycopg2.connection
        
        :return: The key of the user
        :rtype: str
        """
        loginUserQuery = sql.SQL("""SELECT key FROM users WHERE username = %s AND password_hash = %s""")
        try:
            if not conn:
                conn = global_func.getConnection()
            cur = conn.cursor()
            cur.execute(loginUserQuery, (self.username, self.pass_hash))
            result = cur.fetchone()
            if result:
                return result[0]
            else:
                return None
        except Exception as e:
            pass
        finally:
            cur.close()
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
        """
        insertStatsQuery = sql.SQL("""INSERT INTO user_stats (user_id, height, weight) VALUES (%s, %s, %s)""")
        try:
            if not conn:
                conn = global_func.getConnection()
            cur = conn.cursor()
            cur.execute(insertStatsQuery, (self.id, self.height, self.weight))
            conn.commit()
        except Exception as e:
            pass
        finally:
            cur.close()
            conn.close()
    
    def getUserStats(self, days = 0, conn = None):
        """
        Gets the user stats from the database
        
        :return: height and weight of the user
        :rtype: dict
        """
        getUserStatsQuery = sql.SQL("""SELECT height, weight, created_at FROM user_stats WHERE user_id = %s and created_at >= CURRENT_DATE - interval '%d day'""")
        try:
            if not conn:
                conn = global_func.getConnection()
            cur = conn.cursor()
            cur.execute(getUserStatsQuery, (self.id, days))
            result = cur.fetchall()
            if result:
                return self.__jsonifyTuple__(result, ("height", "weight", "date"))
        except Exception as e:
            pass
        finally:
            cur.close()
            conn.close()
    
    def getUserActivities(self, verbose = False, days = 7, conn = None): #Need API call for this
        """
        Gets the user activities from the database
        
        :param verbose: If the user wants the details of the workout
        :param days: The number of days to get the activities from
        :param conn: The connection to the database
        
        :type verbose: bool
        :type days: int
        :type conn: psycopg2.connection
        
        :return: None
        """
        #Need verbose and non verbose. 
        #Verbose will return the activity as well as details with the workout weights/miles
        # Non-verbose will return that the activity happened as well as when it was as well as what type of activity it was
        
        getUserActivitiesQuery = sql.SQL("""SELECT id, name, workout_type, workout_date FROM workouts WHERE user_id = %s AND workout_date >= CURRENT_DATE - interval '%s day'""")

        if verbose:
            getWorkoutDetailsQueryStrength = sql.SQL("""SELECT (SELECT name FROM exercises WHERE id = %s), sets.reps, sets.percieved_difficulty, sets.weight, sets.type_set FROM workout_exercises WHERE workout_id = %s ORDER BY exercise_name""")
            getWorkoutDetailsQueryCardio = sql.SQL("""SELECT duration, distance, percieved_difficulty FROM workout_cardio WHERE workout_id = %s""")
            
        try:
            if not conn:
                conn = global_func.getConnection()
            cur = conn.cursor()
            cur.execute(getUserActivitiesQuery, (self.id, days))
            result = cur.fetchall()
            workouts = {}
            index = 1
            if verbose:
                for row in result:
                    if row[2] == "Strength":
                        cur.execute(getWorkoutDetailsQueryStrength, (row[0], row[0]))
                        keys = ("exercise_name", "reps", "percieved_difficulty", "weight", "type_set")
                        
                    elif row[2] == "Cardio":
                        cur.execute(getWorkoutDetailsQueryCardio, (row[0],))
                        keys = ("duration", "distance", "percieved_difficulty")
                        
                    details = cur.fetchall()
                    detailsList = self.__jsonifyTuple__(details, keys)
                    workouts[index] = {"name": row[1], "type": row[2], "date": row[3], "details": detailsList}
                
                return workouts
            else:
                for row in result:
                    workouts[index] = {"name": row[1], "type": row[2], "date": row[3]}
                    index += 1
                return workouts
            
        except Exception as e:
            pass
        finally:
            cur.close()
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
                temp[keys[i]] = row[i]
            final.append(temp)
        return final
        

class UserExeceptions(Exception): #Create Exceptions for user classes
    pass