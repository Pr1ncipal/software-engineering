from psycopg2 import sql
import psycopg2
import logging
import random
import string
import datetime
import global_func
from WorkoutExceptions import *

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.FileHandler("workout_service.log"),
                        logging.StreamHandler()
                    ])
logger = logging.getLogger(__name__)

class Workout():
    """
    A class representing workout management functionality.
    
    This class provides methods to create, retrieve, update, and delete workouts,
    as well as add and manage exercises within workouts.
    """
    
    def __init__(self, id=None, user_id=None, name=None, workout_type=None, notes = None, 
                 workout_date=None, key=None, exercises = None, duration=None, distance=None, averageHR = None, cardiopd = None):
        """
        Initialize a Workout object.
        
        Parameters:
        -----------
        id : int, optional
            The workout's database ID
        user_id : int, optional
            The user ID associated with the workout
        name : str, optional
            The name of the workout
        workout_type : str, optional
            The type of workout (e.g., 'Strength', 'Cardio')
        workout_date : datetime.date, optional
            The date of the workout
        key : str, optional
            The user's authentication key
        exercise_id : int, optional
            The ID of an exercise to add to the workout
        reps : list, optional
            The repetitions for each set of the exercise
        weight : list, optional
            The weight used for each set of the exercise
        sets : int, optional
            The number of sets for the exercise
        duration : int, optional
            Duration in minutes (for cardio workouts)
        distance : float, optional
            Distance in miles/kilometers (for cardio workouts)
        """
        self.id = id
        self.user_id = user_id
        self.name = name
        self.workout_type = workout_type
        self.workout_date = workout_date
        self.notes = notes
        self.averageHR = averageHR
        self.key = key
        self.exercises = exercises
        self.duration = duration
        self.distance = distance
        self.cardiopd = cardiopd
        
        if key and not user_id:
            self._get_user_id_from_key()
    
    def _get_user_id_from_key(self, conn=None):
        """
        Get user_id from authentication key.
        
        Parameters:
        -----------
        conn : psycopg2.connection, optional
            Database connection
            
        Raises:
        -------
        ConnectionError : If database connection fails
        InvalidTokenError : If key is invalid
        QueryError : If database query fails
        """
        try:
            should_close_conn = False
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
                
            cur = conn.cursor()
            getUserIdQuery = sql.SQL("SELECT id FROM users WHERE key = %s")
            
            try:
                cur.execute(getUserIdQuery, (self.key,))
                result = cur.fetchone()
                
                if not result:
                    raise InvalidTokenError("Invalid authentication key")
                    
                self.user_id = result[0]
                
            except psycopg2.Error as e:
                logger.error(f"Database error while getting user ID: {str(e)}")
                raise QueryError(f"Failed to get user ID: {str(e)}")
                
        except Exception as e:
            if not isinstance(e, (ConnectionError, InvalidTokenError, QueryError)):
                logger.error(f"Unexpected error in _get_user_id_from_key: {str(e)}")
                raise WorkoutException(f"Error retrieving user from key: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if should_close_conn and 'conn' in locals() and conn:
                conn.close()
                
    def updateUserActivity(self, workout = False, conn = None):
        """
        Updates the user activity in the database
        
        :param workout: Whether this is a workout update (True) or just login (False)
        :type workout: bool
        :param conn: The connection to the database
        :type conn: psycopg2.connection
        
        :return: None
        :raises UserNotFoundError: When user ID is not found
        :raises ConnectionError: When database connection fails
        :raises QueryError: When there's an error executing the query
        """
        logger.info(f"Updating user activity for ID {self.user_id}")
        
        if self.user_id is None or self.user_id == -1:
            logger.warning("Cannot update user activity - Invalid user ID")
            raise UserNotFoundError()
        
        query = sql.SQL("""SELECT TO_CHAR(last_login:: DATE, 'YYYY-MM-DD'), day_streak, TO_CHAR(last_workout:: DATE, 'YYYY-MM-DD') 
                        FROM user_engagement 
                        WHERE user_id = %s""")

        try:
            try:
                logger.debug("Establishing database connection")
                if not conn:
                    conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            logger.debug(f"Executing query to fetch user activity for ID {self.user_id}")
            cur.execute(query, (self.user_id,))
            result = cur.fetchone()
            
            if result:
                last_login = datetime.strptime(result[0], "%Y-%m-%d").date() if result[0] else None
                day_streak = result[1]
                last_workout = datetime.strptime(result[2], "%Y-%m-%d").date() if result[2] else None
                logger.info(f"Successfully fetched user activity for ID {self.user_id}")
            else:
                logger.warning(f"No user found with ID {self.user_id}")
            
            # Update last login and day streak
            if last_login is None:
                updateQuery = sql.SQL("""INSERT INTO user_engagement (user_id, last_login, day_streak, last_workout) VALUES (%s, %s, %s, NULL)""")
            
            if last_login and last_login == datetime.now().date():
                # Already logged in today, no need to update streak
                updateQuery = sql.SQL("""UPDATE user_engagement SET last_login = CURRENT_TIMESTAMP WHERE user_id = %s""")
                # Execute with just user_id
                cur.execute(updateQuery, (self.user_id,))
            elif last_login and (datetime.now().date() - last_login).days == 1:
                # Consecutive day, increment streak
                day_streak += 1
                updateQuery = sql.SQL("""UPDATE user_engagement SET last_login = CURRENT_TIMESTAMP, day_streak = %s WHERE user_id = %s""")
                cur.execute(updateQuery, (day_streak, self.user_id))
            elif last_login and (datetime.now().date() - last_login).days >= 2:
                # Not consecutive, reset streak
                day_streak = 1
                updateQuery = sql.SQL("""UPDATE user_engagement SET last_login = CURRENT_TIMESTAMP, day_streak = %s WHERE user_id = %s""")
                cur.execute(updateQuery, (day_streak, self.user_id))
            else:
                # First login or other cases
                day_streak = 1
                updateQuery = sql.SQL("""INSERT INTO user_engagement (user_id, last_login, day_streak) 
                                        VALUES (%s, CURRENT_TIMESTAMP, %s)""")
                cur.execute(updateQuery, (self.user_id, day_streak))
                
            if workout:
                updateQueryWorkout = sql.SQL("""UPDATE user_engagement SET last_workout = CURRENT_TIMESTAMP WHERE user_id = %s""")
                cur.execute(updateQueryWorkout, (self.user_id,))
                
            conn.commit()
            logger.info(f"Successfully updated user activity for ID {self.user_id}") 
            
        except (UserNotFoundError, ConnectionError):
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
            if conn and not conn.closed:
                conn.close()
            logger.debug("Database connection closed")       
    
    def create_workout(self, conn=None):
        """
        Create a new workout in the database.
        
        Parameters:
        -----------
        conn : psycopg2.connection, optional
            Database connection
            
        Raises:
        -------
        MissingRequiredFieldError : If required fields are missing
        ConnectionError : If database connection fails
        WorkoutAlreadyExistsError : If workout already exists
        QueryError : If database query fails
        """
        # Validate required fields
        missing_fields = []
        if not self.user_id:
            missing_fields.append("user_id")
        if not self.name:
            missing_fields.append("name")
        if not self.workout_type:
            missing_fields.append("workout_type")
            
        if missing_fields:
            logger.error(f"Missing required fields: {', '.join(missing_fields)}")
            raise MissingRequiredFieldError(', '.join(missing_fields))
            
        # Validate workout type
        valid_types = ["strength", "cardio"]
        if self.workout_type not in valid_types:
            logger.error(f"Invalid workout type: {self.workout_type}")
            raise InvalidWorkoutDataError(f"Invalid workout type. Must be one of: {', '.join(valid_types)}")
        
        try:
            should_close_conn = False
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
                
            cur = conn.cursor()
            
            # Check if workout already exists for this user on this date
            checkQuery = sql.SQL("""
                SELECT id FROM workouts 
                WHERE user_id = %s AND name = %s AND workout_date = %s
            """)
            
            try:
                # Set default workout date to current date if None
                workout_date_param = self.workout_date
                
                # Explicitly log what we're doing with the date
                if workout_date_param is None:
                    logger.debug("workout_date is None, will use database default")
                    
                    # Use a different query that excludes the workout_date column entirely
                    createWorkoutQuery = sql.SQL("""
                        INSERT INTO workouts (user_id, name, workout_type, notes, average_heart_rate)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING id
                    """)
                    
                    # Execute the query without the workout_date parameter
                    cur.execute(checkQuery, (self.user_id, self.name, None))  # Use None for date check
                    if cur.fetchone():
                        conn.rollback()
                        raise WorkoutAlreadyExistsError()
                    
                    # Execute the insert without the workout_date
                    cur.execute(createWorkoutQuery, (
                        self.user_id, 
                        self.name, 
                        self.workout_type, 
                        self.notes, 
                        self.averageHR
                    ))
                else:
                    logger.debug(f"Using workout_date: {workout_date_param}")
                    
                    # Use the original query that includes workout_date
                    createWorkoutQuery = sql.SQL("""
                        INSERT INTO workouts (user_id, name, workout_type, workout_date, notes, average_heart_rate)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        RETURNING id
                    """)
                    
                    # Check for duplicates with the explicit date
                    cur.execute(checkQuery, (self.user_id, self.name, workout_date_param))
                    if cur.fetchone():
                        conn.rollback()
                        raise WorkoutAlreadyExistsError()
                    
                    # Execute the insert with the workout_date
                    cur.execute(createWorkoutQuery, (
                        self.user_id, 
                        self.name, 
                        self.workout_type, 
                        workout_date_param,
                        self.notes, 
                        self.averageHR
                    ))
                
                result = cur.fetchone()
                
                if result:
                    self.id = result[0]
                    conn.commit()
                    if self.workout_type == "strength":
                        self.__add_exercise__(conn)
                    else:
                        self.__add_cardio__(conn)
                    
                    logger.info(f"Created workout: ID={self.id}, Name={self.name}, Type={self.workout_type}")
                    self.updateUserActivity(workout=True, conn=conn)
                else:
                    conn.rollback()
                    raise QueryError("Workout creation failed - no ID returned")
                    
            except psycopg2.errors.UniqueViolation:
                conn.rollback()
                raise WorkoutAlreadyExistsError()
                
            except (psycopg2.Error, QueryError, WorkoutAlreadyExistsError) as e:
                if isinstance(e, psycopg2.Error):
                    conn.rollback()
                    logger.error(f"Database error: {str(e)}")
                    raise QueryError(f"Error creating workout: {str(e)}")
                raise
                
        except Exception as e:
            if not isinstance(e, (MissingRequiredFieldError, ConnectionError, 
                                  WorkoutAlreadyExistsError, QueryError)):
                logger.error(f"Unexpected error in create_workout: {str(e)}")
                raise WorkoutException(f"Error creating workout: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if should_close_conn and 'conn' in locals() and conn:
                conn.close()
    
    def get_workout(self, conn=None):
        """
        Get workout details from database.
        
        Parameters:
        -----------
        conn : psycopg2.connection, optional
            Database connection
            
        Returns:
        --------
        dict
            Workout details
            
        Raises:
        -------
        WorkoutNotFoundException : If workout is not found
        ConnectionError : If database connection fails
        QueryError : If database query fails
        """
        if not self.id:
            logger.error("Workout ID not provided")
            raise MissingRequiredFieldError("workout_id")
            
        getWorkoutQuery = sql.SQL("""
            SELECT w.id, w.user_id, w.name, w.workout_type, w.workout_date, u.key
            FROM workouts w
            JOIN users u ON w.user_id = u.id
            WHERE w.id = %s
        """)
        
        try:
            should_close_conn = False
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
                
            cur = conn.cursor()
            
            try:
                cur.execute(getWorkoutQuery, (self.id,))
                result = cur.fetchone()
                
                if not result:
                    raise WorkoutNotFoundException()
                    
                workout_data = {
                    "id": result[0],
                    "user_id": result[1],
                    "name": result[2],
                    "workout_type": result[3],
                    "workout_date": result[4].isoformat() if result[4] else None,
                    "user_key": result[5]
                }
                
                # Update class attributes
                self.user_id = result[1]
                self.name = result[2]
                self.workout_type = result[3]
                self.workout_date = result[4]
                self.key = result[5]
                
                # Get exercises if this is a strength workout
                if self.workout_type == "Strength":
                    getExercisesQuery = sql.SQL("""
                        SELECT e.id, e.name, we.sets, we.reps, we.weight, we.percieved_difficulty
                        FROM workout_exercises we
                        JOIN exercises e ON we.exercise_id = e.id
                        WHERE we.workout_id = %s
                    """)
                    cur.execute(getExercisesQuery, (self.id,))
                    exercises = []
                    
                    for row in cur.fetchall():
                        exercises.append({
                            "exercise_id": row[0],
                            "exercise_name": row[1],
                            "sets": row[2],
                            "reps": row[3],
                            "weight": row[4],
                            "difficulty": row[5]
                        })
                    
                    workout_data["exercises"] = exercises
                    
                # Get cardio details if this is a cardio workout
                elif self.workout_type == "Cardio":
                    getCardioQuery = sql.SQL("""
                        SELECT duration, distance, percieved_difficulty
                        FROM workout_cardio
                        WHERE workout_id = %s
                    """)
                    cur.execute(getCardioQuery, (self.id,))
                    cardio_data = cur.fetchone()
                    
                    if cardio_data:
                        workout_data["cardio"] = {
                            "duration": cardio_data[0],
                            "distance": cardio_data[1],
                            "difficulty": cardio_data[2]
                        }
                        
                        self.duration = cardio_data[0]
                        self.distance = cardio_data[1]
                
                logger.info(f"Retrieved workout: ID={self.id}, Name={self.name}")
                return workout_data
                
            except psycopg2.Error as e:
                logger.error(f"Database error: {str(e)}")
                raise QueryError(f"Error retrieving workout: {str(e)}")
                
        except Exception as e:
            if not isinstance(e, (WorkoutNotFoundException, ConnectionError, QueryError, MissingRequiredFieldError)):
                logger.error(f"Unexpected error in get_workout: {str(e)}")
                raise WorkoutException(f"Error retrieving workout: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if should_close_conn and 'conn' in locals() and conn:
                conn.close()
    
    def __add_exercise__(self, conn=None):
        """
        Add an exercise to a workout.
        
        Parameters:
        -----------
        conn : psycopg2.connection, optional
            Database connection
            
        Raises:
        -------
        MissingRequiredFieldError : If required fields are missing
        WorkoutNotFoundException : If workout is not found
        ExerciseNotFoundException : If exercise is not found
        ConnectionError : If database connection fails
        QueryError : If database query fails
        """
        # Validate required fields
        missing_fields = []
        if not self.id:
            missing_fields.append("workout_id")
            
        if missing_fields:
            logger.error(f"Missing required fields: {', '.join(missing_fields)}")
            raise MissingRequiredFieldError(', '.join(missing_fields))
        
        addExerciseQuery = sql.SQL("""
            INSERT INTO workout_exercises (workout_id, exercise_id, sets, order_exercise, notes)
            VALUES (%s, %s, ROW(%s, %s::type_set_type[], %s, %s, %s), %s, %s)
        """) #Figure out which is type_set_type for casting
        
        try:
            should_close_conn = False
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
                
            cur = conn.cursor()
            
            try:
                # Check if workout exists
                cur.execute(sql.SQL("SELECT id FROM workouts WHERE id = %s"), (self.id,))
                if not cur.fetchone():
                    raise WorkoutNotFoundException()
                
                for exercise in self.exercises:
                    # Check if exercise exists
                    exID = exercise['exerciseID']
                    
                    cur.execute(sql.SQL("SELECT id FROM exercises WHERE id = %s"), (exID,))
                    if not cur.fetchone():
                        raise ExerciseNotFoundException()
                    
                    exercise_id = exID
                    weight = exercise['weight']
                    reps = exercise['reps']
                    type_set = exercise['setType']
                    order_exercise = exercise['order_exercise']
                    percieved_difficulty = exercise['percievedDifficulty']
                    super_set = exercise['superset']
                    notes = exercise['notes']
                
                    cur.execute(addExerciseQuery, (
                        self.id, 
                        exercise_id, 
                        reps,
                        type_set,
                        weight,
                        percieved_difficulty,
                        super_set,
                        order_exercise,
                        notes
                    ))#Fix query
                    conn.commit()
                    logger.info(f"Added exercise {exID} to workout {self.id}")
                    
                    self.__calculate_max__(exercise, conn)
                
            except psycopg2.Error as e:
                conn.rollback()
                logger.error(f"Database error: {str(e)}")
                raise QueryError(f"Error adding exercise: {str(e)}")
                
        except Exception as e:
            if not isinstance(e, (WorkoutNotFoundException, ExerciseNotFoundException,
                                  MissingRequiredFieldError, ConnectionError, QueryError)):
                logger.error(f"Unexpected error in add_exercise: {str(e)}")
                raise WorkoutException(f"Error adding exercise: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if should_close_conn and 'conn' in locals() and conn:
                conn.close()
    
    def __add_cardio__(self, conn=None):
        """
        Add cardio details to a workout.
        
        Parameters:
        -----------
        conn : psycopg2.connection, optional
            Database connection
            
        Raises:
        -------
        MissingRequiredFieldError : If required fields are missing
        WorkoutNotFoundException : If workout is not found
        InvalidWorkoutDataError : If workout type is not 'Cardio'
        ConnectionError : If database connection fails
        QueryError : If database query fails
        """
        # Validate required fields
        missing_fields = []
        if not self.id:
            missing_fields.append("workout_id")
        if self.duration is None:
            missing_fields.append("duration")
        if self.distance is None:
            missing_fields.append("distance")
        
        if missing_fields:
            logger.error(f"Missing required fields: {', '.join(missing_fields)}")
            raise MissingRequiredFieldError(', '.join(missing_fields))
            
        # Ensure this is a cardio workout
        if self.workout_type != "Cardio":
            logger.error(f"Cannot add cardio to non-cardio workout type: {self.workout_type}")
            raise InvalidWorkoutDataError("Can only add cardio details to workouts of type 'Cardio'")
        
        addCardioQuery = sql.SQL("""
            INSERT INTO workout_cardio (workout_id, duration, distance, percieved_difficulty)
            VALUES (%s, %s, %s, %s)
        """)
        
        try:
            should_close_conn = False
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
                
            cur = conn.cursor()
            
            try:
                # Check if workout exists
                cur.execute("SELECT id FROM workouts WHERE id = %s", (self.id,))
                if not cur.fetchone():
                    raise WorkoutNotFoundException()
                
                # Add difficulty level if not provided
                percieved_difficulty = getattr(self, 'cardiopd', 3)  # Default to moderate
                
                # Distance can be null (e.g., for stationary bike)
                distance = self.distance if self.distance is not None else 0
                
                cur.execute(addCardioQuery, (self.id, self.duration, distance, percieved_difficulty))
                conn.commit()
                logger.info(f"Added cardio details to workout {self.id}")
                
            except psycopg2.Error as e:
                conn.rollback()
                logger.error(f"Database error: {str(e)}")
                raise QueryError(f"Error adding cardio details: {str(e)}")
                
        except Exception as e:
            if not isinstance(e, (WorkoutNotFoundException, InvalidWorkoutDataError,
                                 MissingRequiredFieldError, ConnectionError, QueryError)):
                logger.error(f"Unexpected error in add_cardio: {str(e)}")
                raise WorkoutException(f"Error adding cardio details: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if should_close_conn and 'conn' in locals() and conn:
                conn.close()
    
    def delete_workout(self, conn=None):
        """
        Delete a workout from the database.
        
        Parameters:
        -----------
        conn : psycopg2.connection, optional
            Database connection
            
        Raises:
        -------
        MissingRequiredFieldError : If workout ID is missing
        WorkoutNotFoundException : If workout is not found
        UserAccessDeniedError : If user doesn't have permission to delete the workout
        ConnectionError : If database connection fails
        QueryError : If database query fails
        """
        if not self.id:
            logger.error("Workout ID not provided")
            raise MissingRequiredFieldError("workout_id")
        
        # If user_id is provided, verify ownership
        if self.user_id:
            # Get workout details to verify ownership
            workout = self.get_workout()
            if workout["user_id"] != self.user_id:
                logger.error(f"Access denied: User {self.user_id} doesn't own workout {self.id}")
                raise UserAccessDeniedError()
        
        deleteWorkoutQuery = sql.SQL("DELETE FROM workouts WHERE id = %s")
        
        try:
            should_close_conn = False
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
                
            cur = conn.cursor()
            
            try:
                # Delete associated exercises first (due to foreign key constraints)
                cur.execute("DELETE FROM workout_exercises WHERE workout_id = %s", (self.id,))
                cur.execute("DELETE FROM workout_cardio WHERE workout_id = %s", (self.id,))
                
                # Now delete the workout
                cur.execute(deleteWorkoutQuery, (self.id,))
                
                # Check if any row was deleted
                if cur.rowcount == 0:
                    conn.rollback()
                    raise WorkoutNotFoundException()
                
                conn.commit()
                logger.info(f"Deleted workout: ID={self.id}")
                
            except psycopg2.Error as e:
                conn.rollback()
                logger.error(f"Database error: {str(e)}")
                raise QueryError(f"Error deleting workout: {str(e)}")
                
        except Exception as e:
            if not isinstance(e, (WorkoutNotFoundException, UserAccessDeniedError,
                                 MissingRequiredFieldError, ConnectionError, QueryError)):
                logger.error(f"Unexpected error in delete_workout: {str(e)}")
                raise WorkoutException(f"Error deleting workout: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if should_close_conn and 'conn' in locals() and conn:
                conn.close()
    
    def get_user_workouts(self, days=30, conn=None):
        """
        Get all workouts for a user within a specified time period.
        
        Parameters:
        -----------
        days : int, optional
            Number of days to look back (default: 30)
        conn : psycopg2.connection, optional
            Database connection
            
        Returns:
        --------
        list
            List of workout dictionaries
            
        Raises:
        -------
        MissingRequiredFieldError : If user ID is missing
        ConnectionError : If database connection fails
        QueryError : If database query fails
        """
        if not self.user_id:
            logger.error("User ID not provided")
            raise MissingRequiredFieldError("user_id")
        
        getUserWorkoutsQuery = sql.SQL("""
            SELECT id, name, workout_type, workout_date
            FROM workouts
            WHERE user_id = %s
            AND workout_date >= CURRENT_DATE - INTERVAL '%s days'
            ORDER BY workout_date DESC
        """)
        
        try:
            should_close_conn = False
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
                
            cur = conn.cursor()
            
            try:
                cur.execute(getUserWorkoutsQuery, (self.user_id, days))
                workouts = []
                
                for row in cur.fetchall():
                    workouts.append({
                        "id": row[0],
                        "name": row[1],
                        "workout_type": row[2],
                        "workout_date": row[3].isoformat() if row[3] else None
                    })
                
                logger.info(f"Retrieved {len(workouts)} workouts for user {self.user_id}")
                return workouts
                
            except psycopg2.Error as e:
                logger.error(f"Database error: {str(e)}")
                raise QueryError(f"Error retrieving user workouts: {str(e)}")
                
        except Exception as e:
            if not isinstance(e, (MissingRequiredFieldError, ConnectionError, QueryError)):
                logger.error(f"Unexpected error in get_user_workouts: {str(e)}")
                raise WorkoutException(f"Error retrieving user workouts: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if should_close_conn and 'conn' in locals() and conn:
                conn.close()
                
    def __calculate_max__(self, exercise, conn=None):
        """
        Calculate and store the maximum weight lifted for an exercise.
        
        Parameters:
        -----------
        conn : psycopg2.connection, optional
            Database connection
            
        Raises:
        -------
        ConnectionError : If database connection fails
        QueryError : If database query fails
        """
        
        exercise_id = exercise['exerciseID']
        
        # Calculate the maximum weight lifted for an exercise
        getMaxQuery = sql.SQL("""
            SELECT calculated_1rm, weight_actual, reps_actual
            FROM user_exercise_max
            WHERE exercise_id = %s AND user_id = %s
            ORDER BY date_performed DESC
            LIMIT 1
        """)
        
        try:
            should_close_conn = False
            if not conn:
                conn = global_func.getConnection()
                should_close_conn = True
                
            cur = conn.cursor()
            
            try:
                cur.execute(getMaxQuery, (exercise_id, self.user_id))
                found = cur.fetchone()
                if found is None:
                    logger.info(f"No max weight found for exercise {exercise_id}")
                    max_weight = 0
                    weight_actual = 0
                    reps_actual = 0
                else:
                    logger.info(f"Max weight found for exercise {exercise_id} for user {self.user_id}")
                    max_weight = found[0]
                    weight_actual = found[1]
                    reps_actual = found[2]
                
                changed = False
                for i in range (0, len(exercise["reps"])):
                    
                    if exercise["reps"][i] == 1:
                        calculated_1rm = exercise["weight"][i]
                    else:
                        calculated_1rm = exercise["weight"][i] * (exercise["reps"][i] ** 0.1)
                        
                    if calculated_1rm > max_weight:
                        changed = True
                        max_weight = calculated_1rm
                        weight_actual = exercise["weight"][i]
                        reps_actual = exercise["reps"][i]
                
                if changed:
                    newMaxQuery = sql.SQL("""
                        INSERT INTO user_exercise_max (user_id, exercise_id, calculated_1rm, weight_actual, reps_actual)
                        VALUES (%s, %s, %s, %s, %s)
                    """)
                    cur.execute(newMaxQuery, (self.user_id, exercise_id, max_weight, weight_actual, reps_actual))
                    conn.commit()
                
                    logger.info(f"Calculated new max for {self.user_id} and stored max weight for exercise {exercise_id}")
                
            except psycopg2.Error as e:
                conn.rollback()
                logger.error(f"Database error: {str(e)}")
                raise QueryError(f"Error calculating max weight: {str(e)}")
                
        except Exception as e:
            if not isinstance(e, (ConnectionError, QueryError)):
                logger.error(f"Unexpected error in __calculate_max__: {str(e)}")
                raise WorkoutException(f"Error calculating max weight: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if should_close_conn and 'conn' in locals() and conn:
                conn.close()
    
    def get_exercises(self, number=50, muscle_group=None, page=0, search_query=None):
        """Get exercises from the database."""
        try:
            conn = global_func.getConnection()
            cur = conn.cursor()
            
            # Base query parts
            select_part = """
                SELECT id, name, primary_muscle, secondary_muscles, description
                FROM exercises
                WHERE is_deleted = FALSE
            """
            
            # Parameters for the query
            params = []
            
            # Add user filter
            user_filter = "AND (createdby IS NULL OR createdby = %s)"
            params.append(self.user_id)
            
            # Add search filter if provided
            search_filter = ""
            if search_query:
                search_query = search_query.strip().lower()  # Normalize search query
                search_pattern = f"%{search_query}%"
                search_filter = "AND (LOWER(name) LIKE %s OR LOWER(description) LIKE %s)"
                params.extend([search_pattern, search_pattern])
            
            # Add muscle group filter if provided
            muscle_filter = ""
            if muscle_group:
                # More flexible muscle group matching
                muscle_filter = "AND (LOWER(%s)::text = ANY(SELECT LOWER(m::text) FROM unnest(primary_muscle) m) OR LOWER(%s)::text = ANY(SELECT LOWER(m::text) FROM unnest(secondary_muscles) m))"
                params.extend([muscle_group.lower(), muscle_group.lower()])
            
            # Complete query
            query = f"""{select_part} {user_filter} {search_filter} {muscle_filter}
                       ORDER BY name
                       LIMIT %s OFFSET %s"""
            params.extend([number, page * number])
            
            # Execute query
            cur.execute(sql.SQL(query), params)
            
            # Process results
            exercises = []
            for row in cur.fetchall():
                # Convert primary_muscle to array format for frontend
                primary = row[2]
                if primary and isinstance(primary, str):
                    # Handle string format like '{muscle}' by extracting 'muscle'
                    if primary.startswith('{') and primary.endswith('}'):
                        primary = primary[1:-1].split(',')
                        primary = [p.strip().replace('"', '').replace("'", "") for p in primary]
                    else:
                        primary = [primary]
                elif primary is None:
                    primary = []
                    
                # Convert secondary_muscle to array format for frontend
                secondary = row[3]
                if secondary and isinstance(secondary, str):
                    if secondary.startswith('{') and secondary.endswith('}'):
                        secondary = secondary[1:-1].split(',')
                        secondary = [s.strip().replace('"', '').replace("'", "") for s in secondary]
                    else:
                        secondary = [secondary]
                elif secondary is None:
                    secondary = []
                    
                exercises.append({
                    "id": row[0],
                    "name": row[1],
                    "primary_muscle": primary,
                    "secondary_muscle": secondary,
                    "description": row[4]
                })
            
            logger.info(f"Retrieved {len(exercises)} exercises")
            return exercises, page+1
            
        except Exception as e:
            logger.error(f"Error in get_exercises: {str(e)}")
            raise
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if 'conn' in locals() and conn:
                conn.close()
    
    def get_muscles(self):
        """
        Get all muscle groups from the database.
        
        Returns:
        --------
        list
            List of muscle group names
            
        Raises:
        -------
        ConnectionError : If database connection fails
        QueryError : If database query fails
        """
        getMusclesQuery = sql.SQL("""
            SELECT DISTINCT unnest(primary_muscle) AS muscle
            FROM exercises
            WHERE is_deleted = FALSE
            AND (createdby IS NULL OR createdby = %s)
        """)
        
        try:
            conn = global_func.getConnection()
            cur = conn.cursor()
            
            cur.execute(getMusclesQuery, (self.user_id,))
            muscles = [row[0] for row in cur.fetchall()]
            
            logger.info(f"Retrieved {len(muscles)} unique muscle groups")
            return muscles
            
        except psycopg2.Error as e:
            logger.error(f"Database error: {str(e)}")
            raise QueryError(f"Error retrieving muscle groups: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in get_muscles: {str(e)}")
            raise WorkoutException(f"Error retrieving muscle groups: {str(e)}")
        finally:
            if 'cur' in locals() and cur:
                cur.close()
            if 'conn' in locals() and conn:
                conn.close()

