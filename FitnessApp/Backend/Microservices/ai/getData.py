import psycopg2
from psycopg2 import sql
import json
import ast  # Safe parser for string tuples
import logging
import time
from datetime import datetime

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



if __name__ == '__main__':
    user_id = 1
    data = get_data(user_id)
    if data:
        with open('data.json', 'w') as f:
            json.dump(data, f, indent=4)
        print("✅ Data written to data.json")
    else:
        print("❌ No data written due to errors.")