import psycopg2
from psycopg2 import sql
import json
from flask_cors import CORS

import ast  # Safe parser for string tuples

def format_sets(set_data):
    try:
        # If it's a string from PostgreSQL, parse it
        if isinstance(set_data, str):
            set_data = ast.literal_eval(set_data)  # safely converts to tuple

        reps, weight, difficulty, super_set, types = set_data

        reps = reps.strip("{}").split(",")
        weight = weight.strip("{}").split(",")
        types = types.strip("{}").split(",")

        formatted = []
        for i in range(min(len(reps), len(weight))):
            r = reps[i].strip()
            w = weight[i].strip()
            t = types[i].strip() if i < len(types) else "unknown"
            formatted.append(f"Set {i+1}: {r} reps @ {w} lbs ({t})")

        return formatted

    except Exception as e:
        return [f"❌ Could not parse sets: {e}"]


def get_userName(user_id):
    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(
            dbname="sam_DB",
            user="postgres",
            password="password",
            host="localhost",
            port="5432"
        )
        cur = conn.cursor()

        # Query the user's first and last name
        user_info_query = sql.SQL("""
            SELECT fname, lname
            FROM users 
            WHERE id = %s
        """)
        cur.execute(user_info_query, (user_id,))
        user = cur.fetchone()

        cur.close()
        conn.close()

        if not user:
            print(f"❌ Error: No user found with ID {user_id}")
            return None
        
        fname, lname = user
        return {
            "first_name": fname,
            "last_name": lname
        }

    except psycopg2.Error as e:
        print("Database error:", e)
        return None
        

def get_data(user_id):
    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(
            dbname="sam_DB",
            user="postgres",
            password="password",
            host="localhost",
            port="5432"
        )
        cur = conn.cursor()


        # users info --> id, fname, lname, sex, age
        user_info_query = sql.SQL("""
            SELECT id, fname, lname, sex, (current_date - dob) as age 
            FROM users 
            WHERE id = %s
        """)
        cur.execute(user_info_query, (user_id,))
        user = cur.fetchone()

        if not user:
            print(f"Error: No user found with ID {user_id}")
            cur.close()
            conn.close()
            return None

        # Unpack user info
        user_id, fname, lname, sex, age = user

        # user_stats --> weight, height
        user_stats_query = sql.SQL("""
            SELECT weight, height 
            FROM user_stats 
            WHERE user_id = %s 
            ORDER BY created_at DESC 
            LIMIT 1
        """)
        cur.execute(user_stats_query, (user_id,))
        stats = cur.fetchone()

        if stats:
            weight, height = stats
        else:
            weight, height = None, None

        # users_goals --> weight_goal
        goal_query = sql.SQL("""
            SELECT weight_goal 
            FROM user_goals 
            WHERE user_id = %s 
            ORDER BY created_at DESC 
            LIMIT 1
        """)
        cur.execute(goal_query, (user_id,))
        goal_result = cur.fetchone()

        weight_goal = goal_result[0] if goal_result else None


        # --- Recent workout info ---
        # Step 1: Get recent workout metadata
        cur.execute("""
            SELECT id, name, workout_type, workout_start, workout_end
            FROM workouts
            WHERE user_id = %s
            ORDER BY workout_start DESC
            LIMIT 1
        """, (user_id,))
        workout_row = cur.fetchone()

        workout_data = None
        if workout_row:
            workout_id, name, w_type, w_start, w_end = workout_row
            workout_data = {
                "name": name,
                "type": w_type,
                "start": str(w_start),
                "end": str(w_end),
                "exercises": []
            }

            # Step 2: Get exercises and their sets
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

        else:
            workout_data = None


        # Build the output data
        # Build the output data
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
                "goal": float(weight_goal) if weight_goal else "None"
            }
        }

        # ✅ Step 3: Conditionally add the recent workout
        if workout_data:
            data["recent_workout"] = workout_data


        # Close connections
        cur.close()
        conn.close()

        return data

    except psycopg2.Error as e:
        print("Database error:", e)
        return None

if __name__ == '__main__':
    # Set the user ID to query
    user_id = 72  # Change this to a valid user ID
    data = get_data(user_id)
    if data:
        with open('data.json', 'w') as f:
            json.dump(data, f, indent=4)
        print("✅ Data written to data.json")
    else:
        print("❌ No data written due to errors.")

