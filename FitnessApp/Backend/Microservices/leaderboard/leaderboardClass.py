import psycopg2
from psycopg2 import sql
import datetime
from datetime import timedelta, datetime
import logging
import traceback
from global_func import verify_key, getConnection
from leaderboardErrors import *

# Set up logger
logger = logging.getLogger(__name__)

class Leaderboard():
    def __init__(self, catagory=None, days=30, scope=None, key=None, workout=None, number=50):
        logger.debug(f"Creating Leaderboard object: category={catagory}, days={days}, scope={scope}, workout={workout}, number={number}")
        self.catagories = ["steps", "workouts", "1rm", "pace"]
        
        # Validate category
        if catagory:
            if catagory not in self.catagories:
                logger.warning(f"Invalid category provided: {catagory}, defaulting to 'steps'")
                self.catagory = "steps"
            else:
                self.catagory = catagory
        else:
            self.catagory = "steps"
            
        # Validate days
        try:
            self.days = int(days)
            if self.days <= 0:
                logger.warning(f"Invalid days value: {days}, defaulting to 30")
                self.days = 30
        except (ValueError, TypeError):
            logger.warning(f"Invalid days value: {days}, defaulting to 30")
            self.days = 30
            
        if scope is None:
            logger.warning("Scope not specified, defaulting to 'global'")
            self.scope = "global"
        elif scope not in ["global", "family"]:
            logger.warning(f"Invalid scope provided: {scope}, defaulting to 'global'")
            self.scope = "global"
        else:
            self.scope = scope
        
        # Validate workout requirement for certain categories
        if self.catagory in ["weight", "1rm"] and not workout:
            logger.error("Workout ID is required for weight and 1rm leaderboards")
            raise MissingWorkoutError()
            
        self.workout = workout
        
        # Validate number
        try:
            self.number = int(number)
            if self.number <= 0:
                logger.warning(f"Invalid number value: {number}, defaulting to 50")
                self.number = 50
        except (ValueError, TypeError):
            logger.warning(f"Invalid number value: {number}, defaulting to 50")
            self.number = 50
            
        self.keys = ["username", "value"]
                
        # Validate key
        if key is None:
            logger.error("Authentication key is required")
            raise MissingKeyError()
        else:
            logger.debug(f"Verifying key")
            self.key = verify_key(key)
            if self.key is None:
                logger.error("Invalid authentication key")
                raise InvalidKeyError()
            
    def get_leaderboard(self):
        logger.info(f"Getting leaderboard for category: {self.catagory}")
        
        try:
            logger.info(f"Retrieving leaderboard data for category: {self.catagory}")
            match self.catagory:
                case "steps":
                    return self.get_steps_leaderboard()
                case "workouts":
                    return self.get_workout_number_leaderboard()
                case "weight":
                    return self.get_exercise_leaderboard()
                case "1rm":
                    return self.get_1rm_leaderboard()
                case "pace":
                    return self.get_fastest_avg_pace()
                case _:
                    logger.error(f"Invalid category: {self.catagory}")
                    raise InvalidCategoryError(f"Category '{self.catagory}' is not supported")
        except (ConnectionError, QueryError, DataError, ParameterError):
            # Re-raise specific exceptions
            raise
        except Exception as e:
            logger.error(f"Unexpected error in get_leaderboard: {str(e)}")
            logger.debug(traceback.format_exc())
            raise LeaderboardServiceError(f"Error retrieving leaderboard: {str(e)}")
        
    def get_steps_leaderboard(self):
        logger.debug(f"Getting steps leaderboard for the last {self.days} days")
        conn = None
        cur = None
        
        try:
            try:
                logger.debug("Establishing database connection")
                conn = getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            
            # First check if the target user has data
            check_user_query = sql.SQL("""
                SELECT COUNT(*) 
                FROM user_steps us 
                WHERE us.user_id = %s AND us.date_performed BETWEEN %s AND %s
            """)
            
            start_date = datetime.now() - timedelta(days=self.days)
            end_date = datetime.now()
            
            cur.execute(check_user_query, (self.key, start_date, end_date))
            user_has_data = cur.fetchone()[0] > 0
            
            if user_has_data:
                # Original query for when target user has data
                get_steps_query = sql.SQL("""WITH ranked_users AS (
                                            SELECT 
                                                us.user_id,
                                                u.username,
                                                ROUND(AVG(us.steps)::numeric, 2) AS avg_steps,
                                                RANK() OVER (ORDER BY AVG(us.steps) DESC) AS rank
                                            FROM user_steps us
                                            JOIN users u ON us.user_id = u.id
                                            WHERE us.date_performed BETWEEN %s AND %s
                                            GROUP BY us.user_id, u.username
                                        ),
                                        target_user AS (
                                            SELECT rank FROM ranked_users WHERE user_id = %s
                                        ),
                                        bounds AS (
                                            SELECT 
                                                GREATEST(target_user.rank - FLOOR(%s::int / 2), 1) AS start_rank,
                                                (GREATEST(target_user.rank - FLOOR(%s::int / 2), 1) + %s - 1) AS end_rank
                                            FROM target_user
                                        )
                                        SELECT 
                                            ru.username,
                                            ru.avg_steps,
                                            ru.rank
                                        FROM 
                                            ranked_users ru, bounds
                                        WHERE 
                                            ru.rank BETWEEN bounds.start_rank AND bounds.end_rank
                                        ORDER BY 
                                            ru.rank;
                                    """)
                cur.execute(get_steps_query, (start_date, end_date, self.key, self.number, self.number, self.number))
            else:
                # Fallback query for when target user has no data - show top users
                get_steps_query = sql.SQL("""
                    SELECT 
                        u.username,
                        ROUND(AVG(us.steps)::numeric, 2) AS avg_steps,
                        RANK() OVER (ORDER BY AVG(us.steps) DESC) AS rank
                    FROM user_steps us
                    JOIN users u ON us.user_id = u.id
                    WHERE us.date_performed BETWEEN %s AND %s
                    GROUP BY us.user_id, u.username
                    ORDER BY avg_steps DESC
                    LIMIT %s
                """)
                cur.execute(get_steps_query, (start_date, end_date, self.number))
            
            result = cur.fetchall()
            
            if result:
                logger.info(f"Found {len(result)} entries for steps leaderboard")
                return self.__jsonify_tuple_list__(result, self.keys + ["rank"])  # Add rank to keys
            else:
                logger.warning("No data found for steps leaderboard")
                raise NoLeaderboardDataError("No step data found for the specified time period")
                
        except (ConnectionError, NoLeaderboardDataError):
            # Re-raise specific exceptions
            raise
        except Exception as e:
            logger.error(f"Error retrieving steps leaderboard: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error retrieving steps leaderboard: {str(e)}")
        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()
            logger.debug("Database connection closed")
        
    def get_workout_number_leaderboard(self):
        logger.debug(f"Getting ALL TIME workout number leaderboard")
        conn = None
        cur = None

        try:
            logger.debug("Establishing database connection")
            try:
                conn = getConnection()
                cur = conn.cursor()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))

            # 🛠 NO WHERE CLAUSE on workout_date
            get_workout_number_query = sql.SQL("""
                SELECT use.username, COUNT(w.id)
                FROM workouts w
                JOIN users use ON w.user_id = use.id
                GROUP BY use.username
                ORDER BY COUNT(w.id) DESC
                LIMIT %s
            """)

            logger.debug(f"Executing query with limit={self.number}")
            cur.execute(get_workout_number_query, (self.number,))
            result = cur.fetchall()

            if result:
                logger.info(f"Found {len(result)} entries for workout number leaderboard")
                return self.__jsonify_tuple_list__(result, self.keys)
            else:
                logger.warning("No data found for workout number leaderboard")
                # ✅ Instead of raising an error, just return empty
                return []

        except (ConnectionError):
            raise
        except Exception as e:
            logger.error(f"Error retrieving workout number leaderboard: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error retrieving workout number leaderboard: {str(e)}")
        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()
            logger.debug("Database connection closed")

    def get_exercise_leaderboard(self):
        logger.debug(f"Getting exercise weight leaderboard for exercise ID {self.workout} over the last {self.days} days")
        conn = None
        cur = None
        
        if not self.workout:
            logger.error("No workout ID specified for exercise leaderboard")
            raise MissingWorkoutError()
        
        try:
            try:
                logger.debug("Establishing database connection")
                conn = getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            
            # First, check if exercise exists
            check_exercise_query = sql.SQL("SELECT id FROM exercises WHERE id = %s")
            cur.execute(check_exercise_query, (self.workout,))
            if not cur.fetchone():
                logger.error(f"Exercise with ID {self.workout} not found")
                raise ExerciseNotFoundError(f"Exercise with ID {self.workout} not found")
            
            get_exercise_query = sql.SQL("""WITH expanded_sets AS (
                                        SELECT 
                                            w.user_id,  -- Keep user_id for later join
                                            unnest((we.sets).weight) AS weight
                                        FROM workouts w
                                        JOIN workout_exercises we ON we.workout_id = w.id
                                        WHERE w.workout_date BETWEEN %s AND %s AND we.exercise_id = %s
                                        )
                                        SELECT 
                                            u.username, 
                                            MAX(es.weight) AS max_weight  -- Max weight in a single set
                                        FROM expanded_sets es
                                        JOIN users u ON es.user_id = u.id
                                        GROUP BY es.user_id, u.username
                                        ORDER BY max_weight DESC 
                                        LIMIT %s;
                                        """)
            start_date = datetime.now() - timedelta(days=self.days)
            end_date = datetime.now()
            
            logger.debug(f"Executing query with parameters: start_date={start_date}, end_date={end_date}, exercise_id={self.workout}, limit={self.number}")
            cur.execute(get_exercise_query, (start_date, end_date, self.workout, self.number))
            result = cur.fetchall()
            
            if result:
                logger.info(f"Found {len(result)} entries for exercise weight leaderboard")
                return self.__jsonify_tuple_list__(result, self.keys)
            else:
                logger.warning(f"No data found for exercise with ID {self.workout}")
                raise NoLeaderboardDataError(f"No exercise data found for exercise ID {self.workout} in the specified time period")
                
        except (ConnectionError, ExerciseNotFoundError, NoLeaderboardDataError, MissingWorkoutError):
            # Re-raise specific exceptions
            raise
        except Exception as e:
            logger.error(f"Error retrieving exercise weight leaderboard: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error retrieving exercise weight leaderboard: {str(e)}")
        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()
            logger.debug("Database connection closed")
    
    def get_1rm_leaderboard(self):
        logger.debug(f"Getting 1RM leaderboard for exercise ID {self.workout}")
        conn = None
        cur = None
        
        if not self.workout:
            logger.error("No workout ID specified for 1RM leaderboard")
            raise MissingWorkoutError()
        
        try:
            try:
                logger.debug("Establishing database connection")
                conn = getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            
            # First, check if exercise exists
            check_exercise_query = sql.SQL("SELECT id FROM exercises WHERE id = %s")
            cur.execute(check_exercise_query, (self.workout,))
            if not cur.fetchone():
                logger.error(f"Exercise with ID {self.workout} not found")
                raise ExerciseNotFoundError(f"Exercise with ID {self.workout} not found")
            
            get_1rm_query = sql.SQL("""
                                SELECT u.username, MAX(uem.calculated_1rm)
                                FROM user_exercise_max uem
                                JOIN users u ON uem.user_id = u.id
                                WHERE uem.exercise_id = %s
                                GROUP BY uem.user_id, u.username
                                ORDER BY MAX(uem.calculated_1rm) DESC
                                LIMIT %s
                                    """)
            
            logger.debug(f"Executing query with parameters: exercise_id={self.workout}, limit={self.number}")
            cur.execute(get_1rm_query, (self.workout, self.number))
            result = cur.fetchall()
            
            if result:
                logger.info(f"Found {len(result)} entries for 1RM leaderboard")
                return self.__jsonify_tuple_list__(result, self.keys)
            else:
                logger.warning(f"No 1RM data found for exercise with ID {self.workout}")
                raise NoLeaderboardDataError(f"No 1RM data found for exercise ID {self.workout}")
                
        except (ConnectionError, ExerciseNotFoundError, NoLeaderboardDataError, MissingWorkoutError):
            # Re-raise specific exceptions
            raise
        except Exception as e:
            logger.error(f"Error retrieving 1RM leaderboard: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error retrieving 1RM leaderboard: {str(e)}")
        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()
            logger.debug("Database connection closed")
        
    def get_fastest_avg_pace(self):
        logger.debug(f"Getting fastest average pace leaderboard for the last {self.days} days")
        conn = None
        cur = None
        
        try:
            try:
                logger.debug("Establishing database connection")
                conn = getConnection()
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                raise ConnectionError(str(e))
                
            cur = conn.cursor()
            
            get_fastest_mile_query = sql.SQL("""
                                        SELECT u.username, MIN(wc.duration/wc.distance)
                                        FROM workouts w
                                        JOIN users u ON w.user_id = u.id
                                        JOIN workout_cardio wc ON w.id = wc.workout_id
                                        WHERE w.workout_date BETWEEN %s AND %s AND wc.distance >= 1
                                        GROUP BY w.user_id, u.username
                                        ORDER BY MIN(wc.duration/wc.distance) ASC
                                        LIMIT %s
                                        """)
            start_date = datetime.now() - timedelta(days=self.days)
            end_date = datetime.now()
            
            logger.debug(f"Executing query with parameters: start_date={start_date}, end_date={end_date}, limit={self.number}")
            cur.execute(get_fastest_mile_query, (start_date, end_date, self.number))
            result = cur.fetchall()
            
            if result:
                logger.info(f"Found {len(result)} entries for fastest pace leaderboard")
                return self.__jsonify_tuple_list__(result, self.keys)
            else:
                logger.warning("No data found for fastest pace leaderboard")
                raise NoLeaderboardDataError("No cardio workout data found for the specified time period")
                
        except (ConnectionError, NoLeaderboardDataError):
            # Re-raise specific exceptions
            raise
        except Exception as e:
            logger.error(f"Error retrieving fastest pace leaderboard: {str(e)}")
            logger.debug(traceback.format_exc())
            raise QueryError(f"Error retrieving fastest pace leaderboard: {str(e)}")
        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()
            logger.debug("Database connection closed")
    
    def __jsonify_tuple_list__(self, tuple_list, keys):
        logger.debug(f"Converting {len(tuple_list)} tuples to JSON format")
        json_list = []
        for tup in tuple_list:
            json_dict = {}
            for i in range(len(keys)):
                json_dict[keys[i]] = tup[i]
            json_list.append(json_dict)
        return json_list

