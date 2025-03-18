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
    
    def __init__(self, id=None, user_id=None, name=None, workout_type=None, 
                 workout_date=None, key=None, exercise_id=None, reps=None, 
                 weight=None, sets=None, duration=None, distance=None):
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
        self.key = key
        self.exercise_id = exercise_id
        self.reps = reps
        self.weight = weight
        self.sets = sets
        self.duration = duration
        self.distance = distance
        
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
    
    def create_workout(self, conn=None):
        """
        Create a new workout in the database.
        
        Parameters:
        -----------
        conn : psycopg2.connection, optional
            Database connection
            
        Returns:
        --------
        int
            ID of the created workout
            
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
        if not self.workout_date:
            missing_fields.append("workout_date")
            
        if missing_fields:
            logger.error(f"Missing required fields: {', '.join(missing_fields)}")
            raise MissingRequiredFieldError(', '.join(missing_fields))
            
        # Validate workout type
        valid_types = ["Strength", "Cardio", "Flexibility", "Balance"]
        if self.workout_type not in valid_types:
            logger.error(f"Invalid workout type: {self.workout_type}")
            raise InvalidWorkoutDataError(f"Invalid workout type. Must be one of: {', '.join(valid_types)}")
        
        createWorkoutQuery = sql.SQL("""
            INSERT INTO workouts (user_id, name, workout_type, workout_date)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """)
        
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
                cur.execute(checkQuery, (self.user_id, self.name, self.workout_date))
                if cur.fetchone():
                    conn.rollback()
                    raise WorkoutAlreadyExistsError()
                    
                cur.execute(createWorkoutQuery, (self.user_id, self.name, self.workout_type, self.workout_date))
                result = cur.fetchone()
                
                if result:
                    self.id = result[0]
                    conn.commit()
                    logger.info(f"Created workout: ID={self.id}, Name={self.name}, Type={self.workout_type}")
                    return self.id
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
    
    def add_exercise(self, conn=None):
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
        if not self.exercise_id:
            missing_fields.append("exercise_id")
        if self.workout_type == "Strength" and (not self.sets or not self.reps or self.weight is None):
            missing_fields.append("sets, reps, or weight")
            
        if missing_fields:
            logger.error(f"Missing required fields: {', '.join(missing_fields)}")
            raise MissingRequiredFieldError(', '.join(missing_fields))
            
        # Get workout if not already loaded
        if not self.workout_type:
            self.get_workout()
        
        addExerciseQuery = sql.SQL("""
            INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, weight, percieved_difficulty)
            VALUES (%s, %s, %s, %s, %s, %s)
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
                
                # Check if exercise exists
                cur.execute("SELECT id FROM exercises WHERE id = %s", (self.exercise_id,))
                if not cur.fetchone():
                    raise ExerciseNotFoundException()
                
                # Add difficulty level if not provided
                percieved_difficulty = getattr(self, 'percieved_difficulty', 3)  # Default to moderate
                
                cur.execute(addExerciseQuery, (
                    self.id, 
                    self.exercise_id, 
                    self.sets, 
                    self.reps, 
                    self.weight, 
                    percieved_difficulty
                ))
                conn.commit()
                logger.info(f"Added exercise {self.exercise_id} to workout {self.id}")
                
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
    
    def add_cardio(self, conn=None):
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
        
        if missing_fields:
            logger.error(f"Missing required fields: {', '.join(missing_fields)}")
            raise MissingRequiredFieldError(', '.join(missing_fields))
        
        # Get workout if not already loaded
        if not self.workout_type:
            self.get_workout()
            
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
                percieved_difficulty = getattr(self, 'percieved_difficulty', 3)  # Default to moderate
                
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