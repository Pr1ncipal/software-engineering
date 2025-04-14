import psycopg2
from psycopg2 import sql
import json
import ast  # Safe parser for string tuples
import logging
import time
from datetime import datetime
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import timedelta
import traceback

# Set up logger
logger = logging.getLogger("ai_service.data")

def build_motivation_prompt(user_id):
    start_time = time.time()
    request_id = datetime.now().strftime("%Y%m%d%H%M%S")
    logger.info(f"Request [{request_id}]: Building motivation prompt for user_id: {user_id}")
    
    try:
        conn = psycopg2.connect(
            dbname="gitfitbro",
            user="postgres",
            password="password",
            host="postgres",
            port="5432"
        )
        cur = conn.cursor()
        logger.debug(f"Request [{request_id}]: Database connection established")

        # Get day_streak and last_workout from user_engagement
        cur.execute("""
            SELECT day_streak, last_workout
            FROM user_engagement
            WHERE user_id = %s
            ORDER BY last_login DESC
            LIMIT 1
        """, (user_id,))
        engagement = cur.fetchone()
        streak = engagement[0] if engagement and engagement[0] is not None else 0
        last_workout = engagement[1] if engagement and engagement[1] else None
        logger.debug(f"Request [{request_id}]: Retrieved streak: {streak}, last_workout: {last_workout}")

        # Get latest current weight
        cur.execute("""
            SELECT weight
            FROM user_stats
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 1
        """, (user_id,))
        weight_result = cur.fetchone()
        current_weight = weight_result[0] if weight_result else None
        logger.debug(f"Request [{request_id}]: Retrieved current weight: {current_weight}")

        # Get goal weight
        cur.execute("""
            SELECT target_weight
            FROM weight_goals
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 1
        """, (user_id,))
        goal_result = cur.fetchone()
        goal_weight = goal_result[0] if goal_result else None
        logger.debug(f"Request [{request_id}]: Retrieved goal weight: {goal_weight}")

        # Get user's first name
        cur.execute("SELECT fname FROM users WHERE id = %s", (user_id,))
        name_result = cur.fetchone()
        fname = name_result[0] if name_result else "Athlete"
        logger.debug(f"Request [{request_id}]: Retrieved first name: {fname}")

        cur.close()
        conn.close()
        logger.debug(f"Request [{request_id}]: Database connection closed")

        # ✨ Build the motivational prompt
        prompt = f"""
You are a positive, motivational AI fitness coach.

User: {fname}
Streak: {streak} days
Last workout: {str(last_workout) if last_workout else "Unknown"}
Current weight: {current_weight} lbs
Target weight: {goal_weight} lbs

Write a short motivational message (under 200 characters). Make it personalized and energizing, like Duolingo style messages.
"""
        processing_time = time.time() - start_time
        logger.info(f"Request [{request_id}]: Built motivation prompt in {processing_time:.2f}s")
        return prompt

    except Exception as e:
        processing_time = time.time() - start_time
        logger.error(f"Request [{request_id}]: Error building motivation prompt in {processing_time:.2f}s: {str(e)}")
        return None


def get_user_streak(user_id):
    start_time = time.time()
    request_id = datetime.now().strftime("%Y%m%d%H%M%S")
    logger.info(f"Request [{request_id}]: Getting streak data for user_id: {user_id}")
    
    try:
        conn = psycopg2.connect(
            dbname="gitfitbro",
            user="postgres",
            password="password",
            host="postgres",
            port="5432"
        )
        cur = conn.cursor()
        logger.debug(f"Request [{request_id}]: Database connection established")

        cur.execute("""
            SELECT day_streak, last_login, last_workout
            FROM user_engagement
            WHERE user_id = %s
            ORDER BY last_login DESC
            LIMIT 1
        """, (user_id,))

        result = cur.fetchone()
        logger.debug(f"Request [{request_id}]: Retrieved streak data: {result}")
        
        cur.close()
        conn.close()
        logger.debug(f"Request [{request_id}]: Database connection closed")

        if result:
            day_streak, last_login, last_workout = result
            response_data = {
                "day_streak": day_streak,
                "last_login": str(last_login),
                "last_workout": str(last_workout) if last_workout else None
            }
            processing_time = time.time() - start_time
            logger.info(f"Request [{request_id}]: Retrieved streak data in {processing_time:.2f}s")
            return response_data
        else:
            processing_time = time.time() - start_time
            logger.warning(f"Request [{request_id}]: No streak data found for user in {processing_time:.2f}s")
            return {
                "day_streak": 0,
                "last_login": None,
                "last_workout": None
            }

    except Exception as e:
        processing_time = time.time() - start_time
        logger.error(f"Request [{request_id}]: Error fetching user streak in {processing_time:.2f}s: {str(e)}")
        return {
            "day_streak": 0,
            "last_login": None,
            "last_workout": None
        }


def format_sets(set_data):
    request_id = datetime.now().strftime("%Y%m%d%H%M%S")
    logger.debug(f"Request [{request_id}]: Formatting set data")
    
    try:
        if isinstance(set_data, str):
            set_data = ast.literal_eval(set_data)
            logger.debug(f"Request [{request_id}]: Parsed string set_data to {type(set_data)}")

        if not isinstance(set_data, tuple) or len(set_data) != 5:
            logger.warning(f"Request [{request_id}]: Unexpected set format: {set_data}")
            return [f"❌ Unexpected set format: {set_data}"]

        # Correct order based on the `set_type` definition in your DB
        reps, types, weight, difficulty, super_set = set_data

        reps = list(map(str, reps)) if isinstance(reps, (list, tuple)) else [str(reps)]
        weight = list(map(str, weight)) if isinstance(weight, (list, tuple)) else [str(weight)]
        types = list(map(str, types)) if isinstance(types, (list, tuple)) else ["unknown"]
        logger.debug(f"Request [{request_id}]: Processed set data items - reps: {len(reps)}, weights: {len(weight)}, types: {len(types)}")

        formatted = []
        for i in range(min(len(reps), len(weight))):
            r = reps[i]
            w = weight[i]
            t = types[i] if i < len(types) else "unknown"
            formatted.append(f"Set {i+1}: {r} reps @ {w} lbs ({t})")

        logger.debug(f"Request [{request_id}]: Formatted {len(formatted)} sets")
        return formatted

    except Exception as e:
        logger.error(f"Request [{request_id}]: Error formatting sets: {str(e)}")
        return [f"❌ Could not parse sets: {e}"]


def get_data(user_id):
    start_time = time.time()
    request_id = datetime.now().strftime("%Y%m%d%H%M%S")
    logger.info(f"Request [{request_id}]: Getting user data for user_id: {user_id}")
    
    try:
        conn = psycopg2.connect(
            dbname="gitfitbro",
            user="postgres",
            password="password",
            host="postgres",
            port="5432"
        )
        cur = conn.cursor()
        logger.debug(f"Request [{request_id}]: Database connection established")

        # Get user basic info
        cur.execute("""
            SELECT id, fname, lname, sex, (current_date - dob) AS age
            FROM users
            WHERE id = %s
        """, (user_id,))
        user = cur.fetchone()

        if not user:
            logger.warning(f"Request [{request_id}]: No user found with ID {user_id}")
            cur.close()
            conn.close()
            return None

        user_id, fname, lname, sex, age = user
        logger.debug(f"Request [{request_id}]: Retrieved user: {fname} {lname}")

        # Get latest user stats
        cur.execute("""
            SELECT weight, height
            FROM user_stats
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 1
        """, (user_id,))
        stats = cur.fetchone()
        weight, height = stats if stats else (None, None)
        logger.debug(f"Request [{request_id}]: Retrieved stats - weight: {weight}, height: {height}")

        # Get target weight from weight_goals
        cur.execute("""
            SELECT target_weight
            FROM weight_goals
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 1
        """, (user_id,))
        goal_result = cur.fetchone()
        target_weight = float(goal_result[0]) if goal_result else None
        logger.debug(f"Request [{request_id}]: Retrieved target weight: {target_weight}")

        # Get most recent workout
        cur.execute("""
            SELECT id, name, workout_type, workout_date
            FROM workouts
            WHERE user_id = %s
            ORDER BY workout_date DESC
            LIMIT 1
        """, (user_id,))
        workout_row = cur.fetchone()

        workout_data = None
        if workout_row:
            workout_id, name, w_type, w_date = workout_row
            workout_data = {
                "name": name,
                "type": w_type,
                "date": str(w_date),
                "exercises": []
            }

            cur.execute("""
                SELECT e.name, we.sets
                FROM workout_exercises we
                JOIN exercises e ON we.exercise_id = e.id
                WHERE we.workout_id = %s
            """, (workout_id,))
            exercise_rows = cur.fetchall()

            for ex_name, sets in exercise_rows:
                formatted = format_sets(sets)
                workout_data["exercises"].append({
                    "name": ex_name,
                    "sets": formatted
                })

        # Final structured data
        data = {
            "user": {
                "first_name": fname,
                "last_name": lname,
                "sex": "Male" if sex == 'M' else "Female",
                "age": age.days if hasattr(age, 'days') else age
            },
            "stats": {
                "weight": float(weight) if weight else None,
                "height": height,
                "goal": {
                    "target_weight": target_weight
                } if target_weight else "None"
            }
        }

        if workout_data:
            data["recent_workout"] = workout_data

        cur.close()
        conn.close()
        processing_time = time.time() - start_time
        logger.info(f"Request [{request_id}]: Retrieved user data in {processing_time:.2f}s")
        return data

    except psycopg2.Error as e:
        processing_time = time.time() - start_time
        logger.error(f"Request [{request_id}]: Database error in {processing_time:.2f}s: {str(e)}")
        return None


def get_userName(user_id):
    try:
        conn = psycopg2.connect(
            dbname="gitfitbro",
            user="postgres",
            password="password",
            host="postgres",
            port="5432"
        )
        cur = conn.cursor()

        cur.execute("SELECT fname, lname FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()

        cur.close()
        conn.close()

        if not user:
            return None

        fname, lname = user
        return {
            "first_name": fname,
            "last_name": lname
        }

    except psycopg2.Error as e:
        logger.error(f"Error fetching user name: {str(e)}")
        return None


def get_user_id_by_username(username):
    try:
        conn = psycopg2.connect(
            dbname="gitfitbro", user="postgres", password="password", host="postgres", port="5432"
        )
        cur = conn.cursor()
        query = sql.SQL("SELECT id FROM users WHERE username = %s")

        cur.execute(query, (username,))
        result = cur.fetchone()

        cur.close()
        conn.close()

        if result:
            return result[0]
        else:
            return None

    except Exception as e:
        logger.error(f"Error fetching user ID by username: {str(e)}")
        return None

 # Enhanced error handling for get_weight_chart function

def get_actual_and_predicted_weights(user_id):
    """
    Get actual and predicted weight data for a user
    
    Args:
        user_id (int): User ID to fetch data for
        
    Returns:
        tuple: (actual_data, predicted_data) or ([], []) on error
    """
    request_id = datetime.now().strftime("%Y%m%d%H%M%S")
    logger.info(f"Request [{request_id}]: Getting weight data for user_id: {user_id}")
    
    if not user_id:
        logger.error(f"Request [{request_id}]: Invalid user_id: {user_id}")
        return [], []
    
    try:
        conn = psycopg2.connect(
            dbname="gitfitbro",
            user="postgres",
            password="password",
            host="postgres",
            port="5432"
        )
        cur = conn.cursor()
        logger.debug(f"Request [{request_id}]: Database connection established")

        # 1. Get actual weights
        cur.execute("""
            SELECT created_at::date, weight
            FROM user_stats
            WHERE user_id = %s
            ORDER BY created_at ASC
        """, (user_id,))
        raw_data = cur.fetchall()
        
        if not raw_data:
            logger.warning(f"Request [{request_id}]: No weight data found for user {user_id}")
            cur.close()
            conn.close()
            return [], []
            
        # Validate weight values before converting
        actual_data = []
        for d, w in raw_data:
            try:
                weight = float(w)
                if weight <= 0 or weight > 1000:  # Basic sanity check
                    logger.warning(f"Request [{request_id}]: Invalid weight value: {w}")
                    continue
                actual_data.append((d, weight))
            except (ValueError, TypeError) as e:
                logger.warning(f"Request [{request_id}]: Error converting weight: {str(e)}")
                logger.debug(f"Request [{request_id}]: Traceback: {traceback.format_exc()}")
                continue
        
        logger.debug(f"Request [{request_id}]: Retrieved {len(actual_data)} weight entries")

        # 2. Get goal - with validation
        cur.execute("""
            SELECT target_weight, achieve_by
            FROM weight_goals
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 1
        """, (user_id,))
        goal_result = cur.fetchone()
        
        goal_weight, goal_date = None, None
        if goal_result:
            try:
                if goal_result[0] is not None:
                    goal_weight = float(goal_result[0])
                goal_date = goal_result[1]
            except (ValueError, TypeError) as e:
                logger.warning(f"Request [{request_id}]: Error parsing goal data: {str(e)}")
                logger.debug(f"Request [{request_id}]: Traceback: {traceback.format_exc()}")
        
        logger.debug(f"Request [{request_id}]: Retrieved goal - weight: {goal_weight}, date: {goal_date}")

        predicted_data = []

        if actual_data and len(actual_data) >= 2 and goal_weight and goal_date:
            try:
                # Train model on actual data
                x = np.array([(d - actual_data[0][0]).days for d, _ in actual_data]).reshape(-1, 1)
                y = np.array([w for _, w in actual_data])
                
                if len(x) != len(y):
                    logger.error(f"Request [{request_id}]: Data length mismatch: x={len(x)}, y={len(y)}")
                    return actual_data, []
                
                model = LinearRegression().fit(x, y)

                # Start prediction from the last actual data point, continue until the goal date
                start_date = actual_data[0][0]
                last_actual_date = actual_data[-1][0]

                predicted_data.extend(actual_data)  # Include actual weights first

                if goal_date <= last_actual_date:
                    logger.warning(f"Request [{request_id}]: Goal date {goal_date} is in the past")
                
                i = 1
                max_predictions = 52  # Safety limit for number of predictions (1 year)
                while i <= max_predictions:
                    future_date = last_actual_date + timedelta(weeks=i)
                    if future_date > goal_date:
                        break

                    days_from_start = (future_date - start_date).days
                    try:
                        pred_weight = model.predict(np.array([[days_from_start]]))[0]
                        # Apply constraints to predictions
                        pred_weight = max(goal_weight, min(pred_weight, actual_data[0][1] * 1.5))  # Don't allow unreasonable values
                        predicted_data.append((future_date, pred_weight))
                    except Exception as e:
                        logger.error(f"Request [{request_id}]: Prediction error: {str(e)}")
                        logger.debug(f"Request [{request_id}]: Traceback: {traceback.format_exc()}")
                        break
                        
                    i += 1
                    
                logger.debug(f"Request [{request_id}]: Generated {len(predicted_data) - len(actual_data)} predictions")
            except Exception as e:
                logger.error(f"Request [{request_id}]: Error in prediction model: {str(e)}")
                logger.debug(f"Request [{request_id}]: Traceback: {traceback.format_exc()}")
                # Return actual data but no predictions
                return actual_data, []

        cur.close()
        conn.close()
        logger.info(f"Request [{request_id}]: Successfully retrieved weight data")
        return actual_data, predicted_data

    except psycopg2.Error as e:
        logger.error(f"Request [{request_id}]: Database error in weight data: {str(e)}")
        logger.debug(f"Request [{request_id}]: Traceback: {traceback.format_exc()}")
        return [], []
    except Exception as e:
        logger.error(f"Request [{request_id}]: Unexpected error in weight data: {str(e)}")
        logger.debug(f"Request [{request_id}]: Traceback: {traceback.format_exc()}")
        return [], []


def format_weight_chart(actual_data, prediction_data):
    """
    Format weight data for chart display
    
    Args:
        actual_data (list): List of (date, weight) tuples for actual data
        prediction_data (list): List of (date, weight) tuples for predicted data
        
    Returns:
        dict: Formatted chart data or error message
    """
    request_id = datetime.now().strftime("%Y%m%d%H%M%S")
    logger.info(f"Request [{request_id}]: Formatting weight chart data")
    
    try:
        if not actual_data:
            logger.warning(f"Request [{request_id}]: No actual weight data provided")
            return {
                "error": "No weight data available", 
                "labels": [], 
                "datasets": [
                    {"label": "Actual", "data": []},
                    {"label": "Predicted", "data": []}
                ],
                "yAxisRange": [150, 200]  # Default range
            }

        # Safely format dates
        labels_actual = []
        for d, _ in actual_data:
            try:
                labels_actual.append(d.strftime("%m-%d"))
            except Exception as e:
                logger.warning(f"Request [{request_id}]: Invalid date format: {str(e)}")
                labels_actual.append("Invalid")
        
        labels_predicted = []
        for d, _ in prediction_data:
            try:
                labels_predicted.append(d.strftime("%m-%d"))
            except Exception as e:
                logger.warning(f"Request [{request_id}]: Invalid prediction date: {str(e)}")
                labels_predicted.append("Invalid")

        # Safely convert weights
        actual_weights = []
        for _, w in actual_data:
            try:
                weight = float(w)
                actual_weights.append(weight)
            except (ValueError, TypeError):
                logger.warning(f"Request [{request_id}]: Invalid weight value: {w}")
                actual_weights.append(None)

        predicted_weights = []
        for _, w in prediction_data:
            try:
                weight = float(w)
                predicted_weights.append(weight)
            except (ValueError, TypeError):
                logger.warning(f"Request [{request_id}]: Invalid predicted weight: {w}")
                predicted_weights.append(None)

        # Combine labels if you want them in one chart or keep separate
        unique_labels = []
        seen = set()
        for label in labels_actual + labels_predicted:
            if label not in seen:
                unique_labels.append(label)
                seen.add(label)

        # Determine Y-axis range based on both datasets with safety checks
        visible_weights = [w for w in actual_weights + predicted_weights if w is not None]
        
        if not visible_weights:
            logger.warning(f"Request [{request_id}]: No valid weight values found")
            min_y, max_y = 150, 200  # Default range
        else:
            min_weight = min(visible_weights)
            max_weight = max(visible_weights)
            weight_range = max_weight - min_weight
            
            # Set a minimum range to avoid flat lines
            if weight_range < 10:
                weight_range = 10
                
            # Add padding (10% of range)
            padding = 0.1 * weight_range
            min_y = max(0, min_weight - padding)  # Weight can't be negative
            max_y = max_weight + padding

        logger.debug(f"Request [{request_id}]: Chart data prepared with {len(unique_labels)} labels")
        
        # Create aligned data arrays for the chart
        # For actual data, fill with nulls for predicted points
        actual_chart_data = []
        for label in unique_labels:
            if label in labels_actual:
                idx = labels_actual.index(label)
                actual_chart_data.append(actual_weights[idx])
            else:
                actual_chart_data.append(None)
        
        # For predicted data, include actual points plus predictions
        predicted_chart_data = []
        for label in unique_labels:
            if label in labels_predicted:
                idx = labels_predicted.index(label)
                predicted_chart_data.append(predicted_weights[idx])
            else:
                predicted_chart_data.append(None)
        
        return {
            "labels": unique_labels,
            "datasets": [
                {"label": "Actual", "data": actual_chart_data},
                {"label": "Predicted", "data": predicted_chart_data}
            ],
            "yAxisRange": [min_y, max_y]
        }

    except Exception as e:
        logger.error(f"Request [{request_id}]: Error formatting weight chart: {str(e)}")
        return {
            "error": "Error preparing chart data",
            "labels": [],
            "datasets": [
                {"label": "Actual", "data": []},
                {"label": "Predicted", "data": []}
            ],
            "yAxisRange": [150, 200]
        }


def predict_progress(user_id):
    """
    Predict weight progress based on user's historical data
    
    Args:
        user_id (int): User ID to predict progress for
        
    Returns:
        dict: Progress prediction data or error message
    """
    request_id = datetime.now().strftime("%Y%m%d%H%M%S")
    logger.info(f"Request [{request_id}]: Predicting progress for user_id: {user_id}")
    
    if not user_id:
        logger.error(f"Request [{request_id}]: Invalid user_id: {user_id}")
        return {
            "message": "Invalid user ID provided.",
            "start_date": None,
            "goal_date": None,
            "days_remaining": None,
        }
    
    try:
        conn = psycopg2.connect(
            dbname="gitfitbro",
            user="postgres",
            password="password",
            host="postgres",
            port="5432",
        )
        cur = conn.cursor()
        logger.debug(f"Request [{request_id}]: Database connection established")

        # Get recent weights with error handling
        try:
            cur.execute(
                """
                SELECT weight, created_at
                FROM user_stats
                WHERE user_id = %s AND weight IS NOT NULL AND weight > 0
                ORDER BY created_at DESC
                LIMIT 15  -- Get more history for better trend analysis
                """,
                (user_id,),
            )
            weights = cur.fetchall()
        except psycopg2.Error as e:
            logger.error(f"Request [{request_id}]: Error fetching weight data: {str(e)}")
            return {
                "message": "Error retrieving weight history.",
                "start_date": None,
                "goal_date": None,
                "days_remaining": None,
            }

        # Validate we have enough data points
        if not weights or len(weights) < 2:
            logger.warning(f"Request [{request_id}]: Insufficient weight data for prediction, found {len(weights) if weights else 0} entries")
            return {
                "message": "Not enough weight data to make a prediction. Please record at least 2 weight measurements.",
                "start_date": None,
                "goal_date": None,
                "days_remaining": None,
            }

        # Validate and sort weight data
        try:
            # Sort by date (oldest first)
            valid_weights = []
            for weight, date in weights:
                try:
                    weight_float = float(weight)
                    if weight_float <= 0 or weight_float > 1000:  # Basic validation
                        continue
                    valid_weights.append((weight_float, date))
                except (ValueError, TypeError):
                    continue
                    
            if len(valid_weights) < 2:
                logger.warning(f"Request [{request_id}]: Insufficient valid weight data for prediction")
                return {
                    "message": "Not enough valid weight measurements for prediction.",
                    "start_date": None, 
                    "goal_date": None,
                    "days_remaining": None,
                }
                
            weights = sorted(valid_weights, key=lambda x: x[1])
            start_weight, start_date = weights[0]
            end_weight, end_date = weights[-1]
            
            # Validate dates
            if end_date <= start_date:
                logger.warning(f"Request [{request_id}]: Invalid date range: start={start_date}, end={end_date}")
                return {
                    "message": "Invalid date range in weight data.",
                    "start_date": None, 
                    "goal_date": None,
                    "days_remaining": None,
                }
                
        except Exception as e:
            logger.error(f"Request [{request_id}]: Error processing weight data: {str(e)}")
            return {
                "message": "Error processing weight history.",
                "start_date": None,
                "goal_date": None,
                "days_remaining": None,
            }

        # Calculate rate of weight change with sanity checks
        try:
            days = (end_date - start_date).days
            if days <= 0:
                days = 1  # Avoid division by zero
                
            rate = (end_weight - start_weight) / days
            
            # Sanity check - extremely rapid weight change may indicate bad data
            if abs(rate) > 1:  # More than 1 lb per day
                logger.warning(f"Request [{request_id}]: Unusually rapid weight change detected: {rate:.2f} lbs/day")
                # Continue but log the warning
        except Exception as e:
            logger.error(f"Request [{request_id}]: Error calculating weight change rate: {str(e)}")
            return {
                "message": "Error analyzing weight trend.",
                "start_date": None,
                "goal_date": None,
                "days_remaining": None,
            }

        # Get user's goal weight
        try:
            cur.execute(
                """
                SELECT target_weight, achieve_by
                FROM weight_goals
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT 1
                """,
                (user_id,),
            )
            goal_result = cur.fetchone()
            
            if not goal_result or goal_result[0] is None:
                logger.warning(f"Request [{request_id}]: No weight goal found for user {user_id}")
                return {
                    "message": "No weight goal has been set. Set a goal weight for prediction.",
                    "current_weight": end_weight,
                    "start_date": end_date.strftime("%Y-%m-%d") if end_date else None,
                    "goal_date": None,
                    "days_remaining": None,
                }
                
            target_weight = float(goal_result[0]) if goal_result[0] is not None else None
            goal_date = goal_result[1]
            
            if target_weight <= 0 or target_weight > 1000:
                logger.warning(f"Request [{request_id}]: Invalid target weight: {target_weight}")
                return {
                    "message": "Invalid goal weight value.",
                    "current_weight": end_weight,
                    "start_date": end_date.strftime("%Y-%m-%d") if end_date else None,
                    "goal_date": None,
                    "days_remaining": None,
                }
                
        except Exception as e:
            logger.error(f"Request [{request_id}]: Error retrieving goal data: {str(e)}")
            return {
                "message": "Error retrieving goal information.",
                "start_date": None,
                "goal_date": None,
                "days_remaining": None,
            }
        finally:
            # Clean up database resources
            try:
                cur.close()
                conn.close()
                logger.debug(f"Request [{request_id}]: Database connection closed")
            except:
                pass

        # Calculate prediction with intelligent messaging
        if target_weight is not None and abs(rate) > 0.0001:  # Avoid division by very small numbers
            try:
                weight_change_needed = target_weight - end_weight
                days_remaining = weight_change_needed / rate
                
                # Handle sign issues - if rate is in wrong direction relative to goal
                if (weight_change_needed < 0 and rate > 0) or (weight_change_needed > 0 and rate < 0):
                    message = (
                        f"Your current trend shows you're moving away from your goal weight. "
                        f"Consider adjusting your fitness and nutrition plan."
                    )
                    est_goal_date = None
                    days_remaining_int = None
                else:
                    # Calculate estimated completion
                    est_goal_date = end_date + timedelta(days=int(days_remaining))
                    days_remaining_int = abs(int(days_remaining))
                    
                    # Cap extremely long projections
                    if days_remaining_int > 365:
                        days_remaining_int = 365
                        message = (
                            f"Based on your current trend, your goal weight will take more than a year to reach. "
                            f"Consider setting interim goals for better progress tracking."
                        )
                    else:
                        # Estimate realistic timeframe
                        if days_remaining_int < 14:
                            timeframe = f"about {days_remaining_int} days"
                        elif days_remaining_int < 30:
                            weeks = days_remaining_int // 7
                            timeframe = f"about {weeks} weeks"
                        elif days_remaining_int < 365:
                            months = days_remaining_int // 30
                            timeframe = f"about {months} months"
                        else:
                            timeframe = "over a year"
                            
                        message = (
                            f"Based on your current trend, you'll reach your goal weight in {timeframe}. "
                            f"Keep up the good work!"
                        )
                        
                    # Add warning for very rapid weight change
                    if abs(rate) > 0.5:  # More than 0.5 lb per day
                        message += (
                            " Note: Your recent weight change has been unusually rapid. "
                            "For sustainable results, aim for 1-2 pounds per week."
                        )
            except Exception as e:
                logger.error(f"Request [{request_id}]: Error calculating prediction: {str(e)}")
                message = "An error occurred while calculating your progress prediction."
                est_goal_date = None
                days_remaining_int = None
        else:
            # No trend or goal information
            if target_weight is None:
                message = "Set a weight goal to see predictions."
            elif abs(rate) <= 0.0001:
                message = "Your weight has been stable. Adjust your routine to make progress toward your goal."
            else:
                message = "Insufficient data to make an accurate prediction."
            est_goal_date = None
            days_remaining_int = None

        logger.info(f"Request [{request_id}]: Successfully generated prediction")
        return {
            "message": message,
            "current_weight": float(end_weight),
            "target_weight": float(target_weight) if target_weight is not None else None,
            "start_date": end_date.strftime("%Y-%m-%d") if end_date else None,
            "goal_date": est_goal_date.strftime("%Y-%m-%d") if est_goal_date else None,
            "days_remaining": days_remaining_int,
        }

    except psycopg2.Error as e:
        logger.error(f"Request [{request_id}]: Database error in progress prediction: {str(e)}")
        return {
            "message": "Database error: Unable to access weight data.",
            "start_date": None,
            "goal_date": None,
            "days_remaining": None,
        }
    except Exception as e:
        logger.error(f"Request [{request_id}]: Unexpected error in progress prediction: {str(e)}")
        return {
            "message": f"Unable to generate prediction: {str(e)}",
            "start_date": None,
            "goal_date": None,
            "days_remaining": None,
        }


if __name__ == '__main__':
    user_id = 1
    data = get_data(user_id)
    if data:
        with open('data.json', 'w') as f:
            json.dump(data, f, indent=4)
        print("✅ Data written to data.json")
    else:
        print("❌ No data written due to errors.")
