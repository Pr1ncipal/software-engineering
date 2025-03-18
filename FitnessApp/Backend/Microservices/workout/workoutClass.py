import psycopg2
from psycopg2 import sql
import global_func
from WorkoutExceptions import *
import logging

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
    A class representing a workout with exercises and related data.
    
    Attributes:
        id (int): The workout ID
        user_id (int): The user ID associated with this workout
        name (str): The name of the workout
        workout_type (str): Type of workout (e.g., "Strength", "Cardio")
        notes (str): Additional notes about the workout
        average_heart_rate (int): Average heart rate during the workout
        order (int): Order of the workout in a sequence
        exercises (list): List of exercise data dictionaries
    """
    
    def __init__(self, id = -1, user_id = -1, name = None, workout_type = None, notes = None, average_heart_rate = None, total_weight_lifted = None, order = None, exercises = None):
        self.id = id
        self.user_id = user_id
        self.name = name
        self.workout_type = workout_type
        self.notes = notes
        self.average_heart_rate = average_heart_rate
        self.order = order
        self.exercises = exercises

    def _validate_required_fields(self):
        """Validate required fields for workout insertion."""
        missing_fields = []
        
        if self.user_id is None or self.user_id == -1:
            missing_fields.append("user_id")
        if self.workout_type is None:
            missing_fields.append("workout_type")
        if self.exercises is None or not isinstance(self.exercises, list) or len(self.exercises) == 0:
            missing_fields.append("exercises")
            
        if missing_fields:
            raise MissingRequiredFieldError(", ".join(missing_fields))

    def insertWorkout(self):
        """
        Insert a new workout into the database with its exercises.
        
        Raises:
            MissingRequiredFieldError: If required fields are missing
            ConnectionError: If database connection fails
            QueryError: If there's an error executing the query
            InvalidWorkoutDataError: If workout data is invalid
        """
        self._validate_required_fields()
        
        conn = None
        cur = None
        try:
            try:
                conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            
            # Validate workout type
            if self.workout_type not in ["Strength", "Cardio", "Flexibility", "Other"]:
                raise InvalidWorkoutDataError("Invalid workout type. Must be one of: Strength, Cardio, Flexibility, Other")
            
            insert_query = """INSERT INTO workouts (user_id, name, workout_type, notes, average_heart_rate) 
                            VALUES (%s, %s, %s, %s, %s) RETURNING id"""
            cur.execute(insert_query, (self.user_id, self.name, self.workout_type, self.notes, self.average_heart_rate))
            wid = cur.fetchone()[0]
            
            if not wid:
                conn.rollback()
                raise QueryError("Failed to insert workout: No ID returned")
                
            conn.commit()
            self.id = wid
            
            # Insert the exercises for this workout
            self.insertExercises(wid, conn)
            return wid
            
        except (MissingRequiredFieldError, ConnectionError, QueryError, InvalidWorkoutDataError):
            # Re-raise these exceptions directly
            if conn:
                conn.rollback()
            raise
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Error inserting workout: {str(e)}")
            raise QueryError(f"Failed to insert workout: {str(e)}")
        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()
            
    def __prepareSets__(self, exercise):
        """
        Prepare the sets data for database insertion.
        
        Args:
            exercise (dict): The exercise data containing set information
            
        Returns:
            str: SQL formatted set data
            
        Raises:
            InvalidExerciseDataError: If set data is invalid
        """
        try:
            if 'reps' not in exercise or 'weight' not in exercise or 'percievedDifficulty' not in exercise:
                raise InvalidExerciseDataError("Missing required set data (reps, weight, or percievedDifficulty)")
                
            # Set default values for optional fields
            superset = exercise.get('superset', 'false')
            set_type = exercise.get('setType', 'NORMAL')
            
            # Validate percievedDifficulty (RPE scale typically 1-10)
            if not isinstance(exercise['percievedDifficulty'], (int, float)) or not (1 <= exercise['percievedDifficulty'] <= 10):
                raise InvalidExerciseDataError("percievedDifficulty must be a number between 1 and 10")
            
            sets = f"ROW({exercise['reps']}, {exercise['weight']}, {exercise['percievedDifficulty']}, {superset}, {set_type}::type_set_type[])"
            return sets
        except KeyError as e:
            raise InvalidExerciseDataError(f"Missing required field in exercise set data: {str(e)}")
        except Exception as e:
            raise InvalidExerciseDataError(f"Error preparing sets: {str(e)}")
        
    def insertExercises(self, wid, conn = None):
        """
        Insert exercises for a workout into the database.
        
        Args:
            wid (int): The workout ID
            conn (psycopg2.connection, optional): Database connection
            
        Raises:
            ConnectionError: If database connection fails
            QueryError: If there's an error executing the query
            InvalidExerciseDataError: If exercise data is invalid
        """
        cur = None
        try:
            close_conn = False
            if conn is None:
                try:
                    conn = global_func.getConnection()
                    close_conn = True
                except Exception as e:
                    logger.error(f"Failed to connect to database: {str(e)}")
                    raise ConnectionError(str(e))
            
            cur = conn.cursor()
            
            insert_query = sql.SQL("""INSERT INTO workout_exercises (workout_id, exercise_id, sets, "order", notes) 
                                     VALUES (%s, %s, %s, %s, %s)""")
            
            for i, exercise in enumerate(self.exercises):
                # Validate required exercise fields
                if 'exercise_id' not in exercise:
                    raise InvalidExerciseDataError(f"Missing exercise_id in exercise at index {i}")
                
                sets = self.__prepareSets__(exercise)
                order = exercise.get('order', i+1)  # Default to index+1 if not specified
                notes = exercise.get('notes', '')
                
                cur.execute(insert_query, (wid, exercise['exercise_id'], sets, order, notes))
            
            if close_conn:
                conn.commit()
                
        except (ConnectionError, QueryError, InvalidExerciseDataError):
            # Re-raise these exceptions directly
            if conn and close_conn:
                conn.rollback()
            raise
        except Exception as e:
            if conn and close_conn:
                conn.rollback()
            logger.error(f"Error inserting exercises: {str(e)}")
            raise QueryError(f"Failed to insert exercises: {str(e)}")
        finally:
            if cur:
                cur.close()
            if conn and close_conn:
                conn.close()
        
    def __getWorkoutId__(self, workoutName):
        """
        Get workout ID by name.
        
        Args:
            workoutName (str): The name of the workout
            
        Returns:
            int: The workout ID
            
        Raises:
            ConnectionError: If database connection fails
            WorkoutNotFoundException: If workout is not found
            QueryError: If there's an error executing the query
        """
        conn = None
        cur = None
        try:
            try:
                conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            
            get_query = """SELECT id FROM workouts WHERE name = %s"""
            cur.execute(get_query, (workoutName,))
            workout = cur.fetchone()
            
            if not workout:
                raise WorkoutNotFoundException(f"No workout found with name: {workoutName}")
                
            return workout[0]
            
        except (ConnectionError, WorkoutNotFoundException):
            # Re-raise these exceptions directly
            raise
        except Exception as e:
            logger.error(f"Error getting workout ID: {str(e)}")
            raise QueryError(f"Failed to get workout ID: {str(e)}")
        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()
        
    
    def getWorkouts(self, offset=0):
        """
        Get a list of workouts for the user.
        
        Args:
            offset (int): Pagination offset
            
        Returns:
            list: List of workout data dictionaries
            int: Next page offset or -1 if no more pages
            
        Raises:
            ConnectionError: If database connection fails
            UserNotFoundError: If user is not found
            QueryError: If there's an error executing the query
        """
        if self.user_id == -1:
            raise UserNotFoundError("User ID not provided")
            
        conn = None
        cur = None
        try:
            try:
                conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            
            # Verify user exists
            user_query = """SELECT id FROM users WHERE id = %s"""
            cur.execute(user_query, (self.user_id,))
            if cur.fetchone() is None:
                raise UserNotFoundError(f"No user found with ID: {self.user_id}")
                
            # Get workouts with pagination
            get_query = """
                SELECT id, name, workout_type, notes, average_heart_rate, workout_date 
                FROM workouts 
                WHERE user_id = %s 
                ORDER BY workout_date DESC
                LIMIT 10 OFFSET %s
            """
            cur.execute(get_query, (self.user_id, offset*10))
            workouts = cur.fetchall()
            
            workout_list = []
            for workout in workouts:
                # Get exercises for each workout
                get_exercises_query = """
                    SELECT exercise_id, sets, notes, "order"  
                    FROM workout_exercises 
                    WHERE workout_id = %s
                    ORDER BY "order"
                """
                cur.execute(get_exercises_query, (workout[0],))
                exercises = cur.fetchall()
                
                exercise_list = []
                for exercise in exercises:
                    # Get exercise name
                    get_name_query = """SELECT name FROM exercises WHERE id = %s"""
                    cur.execute(get_name_query, (exercise[0],))
                    exercise_name = cur.fetchone()
                    name = exercise_name[0] if exercise_name else "Unknown Exercise"
                    
                    exercise_list.append({
                        "exercise_id": exercise[0],
                        "exercise_name": name,
                        "sets": exercise[1],
                        "notes": exercise[2],
                        "order": exercise[3]
                    })
                
                workout_list.append({
                    "id": workout[0],
                    "name": workout[1],
                    "workout_type": workout[2],
                    "notes": workout[3],
                    "average_heart_rate": workout[4],
                    "workout_date": workout[5].strftime("%Y-%m-%d %H:%M:%S") if workout[5] else None,
                    "exercises": exercise_list
                })
            
            # Determine if there are more results
            next_page = offset + 1 if len(workouts) == 10 else -1
            return workout_list, next_page
            
        except (ConnectionError, UserNotFoundError):
            # Re-raise these exceptions directly
            raise
        except Exception as e:
            logger.error(f"Error getting workouts: {str(e)}")
            raise QueryError(f"Failed to retrieve workouts: {str(e)}")
        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()
    
    def getExercises(self, offset=0, amount=50):
        """
        Get a list of exercises available to the user.
        
        Args:
            offset (int): Pagination offset
            amount (int): Number of exercises to retrieve
            
        Returns:
            list: List of exercise data dictionaries
            int: Next page offset or -1 if no more pages
            
        Raises:
            ConnectionError: If database connection fails
            QueryError: If there's an error executing the query
        """
        conn = None
        cur = None
        try:
            try:
                conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            
            # Get exercises with pagination - corrected SQL statement
            get_query = """
                SELECT name, equipment, description, single_sided, primary_muscle, secondary_muscles, createdBy 
                FROM exercises 
                WHERE (createdBy = %s OR createdBy IS NULL) 
                LIMIT %s OFFSET %s
            """
            
            cur.execute(get_query, (self.user_id, amount, offset * amount))
            exercises = cur.fetchall()
            
            exercise_list = []
            for exercise in exercises:
                # Determine who created the exercise
                if exercise[6] is None:
                    createdBy = "GitFitBro"
                else:
                    createdBy = self.__getUsername__()
                    
                exercise_list.append({
                    "name": exercise[0],
                    "equipment": exercise[1],
                    "description": exercise[2],
                    "single_sided": exercise[3],
                    "primary_muscle": exercise[4],
                    "secondary_muscles": exercise[5],
                    "createdBy": createdBy
                })
                
            # Determine if there are more results
            next_page = offset + 1 if len(exercises) >= amount else -1
            return exercise_list, next_page
            
        except ConnectionError:
            # Re-raise ConnectionError directly
            raise
        except Exception as e:
            logger.error(f"Error getting exercises: {str(e)}")
            raise QueryError(f"Failed to retrieve exercises: {str(e)}")
        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()
    
    def __getUsername__(self):
        """
        Get username for the current user ID.
        
        Returns:
            str: Username
            
        Raises:
            ConnectionError: If database connection fails
            UserNotFoundError: If user is not found
            QueryError: If there's an error executing the query
        """
        conn = None
        cur = None
        try:
            try:
                conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            
            # Corrected SQL statement
            get_query = """SELECT username FROM users WHERE id = %s"""
            cur.execute(get_query, (self.user_id,))
            user = cur.fetchone()
            
            if not user:
                raise UserNotFoundError(f"No user found with ID: {self.user_id}")
                
            return user[0]
            
        except (ConnectionError, UserNotFoundError):
            # Re-raise these exceptions directly
            raise
        except Exception as e:
            logger.error(f"Error getting username: {str(e)}")
            raise QueryError(f"Failed to get username: {str(e)}")
        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()

    def getWorkoutStats(self, exercise_id, timeframe):
        """
        Get workout statistics for an exercise over a timeframe.
        
        Args:
            exercise_id (int): The exercise ID
            timeframe (int): Number of days to look back
            
        Returns:
            list: List of workout statistics
            
        Raises:
            ConnectionError: If database connection fails
            UserNotFoundError: If user is not found
            ExerciseNotFoundException: If exercise is not found
            QueryError: If there's an error executing the query
            InvalidWorkoutDataError: If workout data is invalid
        """
        if self.user_id == -1:
            raise UserNotFoundError("User ID not provided")
            
        if not exercise_id or not isinstance(exercise_id, int):
            raise InvalidWorkoutDataError("Valid exercise ID is required")
            
        if not timeframe or not isinstance(timeframe, int) or timeframe <= 0:
            raise InvalidWorkoutDataError("Valid timeframe (days) is required")
            
        conn = None
        cur = None
        try:
            try:
                conn = global_func.getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            
            # Verify exercise exists
            exercise_query = """SELECT id FROM exercises WHERE id = %s"""
            cur.execute(exercise_query, (exercise_id,))
            if cur.fetchone() is None:
                raise ExerciseNotFoundException(f"No exercise found with ID: {exercise_id}")
                
            # Get workout stats with corrected SQL query
            get_query = """
                SELECT we.exercise_id, (we.sets).reps, (we.sets).weight, (we.sets).percieved_difficulty, w.workout_date
                FROM workout_exercises we
                JOIN workouts w ON we.workout_id = w.id
                WHERE w.user_id = %s 
                  AND we.exercise_id = %s
                  AND w.workout_date > CURRENT_DATE - INTERVAL %s DAY
                ORDER BY w.workout_date
            """
            
            cur.execute(get_query, (self.user_id, exercise_id, timeframe))
            stats_data = cur.fetchall()
            
            if not stats_data:
                logger.info(f"No workout stats found for exercise {exercise_id} in the last {timeframe} days")
                return []
                
            # Transform data for the response
            stats = []
            for row in stats_data:
                stats.append({
                    "exercise_id": row[0],
                    "reps": row[1],
                    "weight": row[2],
                    "percieved_difficulty": row[3],
                    "date": row[4].strftime("%Y-%m-%d %H:%M:%S") if row[4] else None
                })
                
            return stats
            
        except (ConnectionError, UserNotFoundError, ExerciseNotFoundException, InvalidWorkoutDataError):
            # Re-raise these exceptions directly
            raise
        except Exception as e:
            logger.error(f"Error getting workout stats: {str(e)}")
            raise QueryError(f"Failed to retrieve workout stats: {str(e)}")
        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()
            
class WorkoutExceptions(Exception):
    pass