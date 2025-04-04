import psycopg2
from psycopg2 import sql
import json
import ast  # Safe parser for string tuples

def build_motivation_prompt(user_id):
    try:
        conn = psycopg2.connect(
            dbname="gitfitbro",
            user="postgres",
            password="password",
            host="localhost",
            port="5432"
        )
        cur = conn.cursor()

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

        # Get user's first name
        cur.execute("SELECT fname FROM users WHERE id = %s", (user_id,))
        name_result = cur.fetchone()
        fname = name_result[0] if name_result else "Athlete"

        cur.close()
        conn.close()

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

        return prompt

    except Exception as e:
        print("❌ Error building motivation prompt:", e)
        return None


def get_user_streak(user_id):
    try:
        conn = psycopg2.connect(
            dbname="gitfitbro",
            user="postgres",
            password="password",
            host="localhost",
            port="5432"
        )
        cur = conn.cursor()

        cur.execute("""
            SELECT day_streak, last_login, last_workout
            FROM user_engagement
            WHERE user_id = %s
            ORDER BY last_login DESC
            LIMIT 1
        """, (user_id,))

        result = cur.fetchone()
        print(result)
        cur.close()
        conn.close()

        if result:
            day_streak, last_login, last_workout = result
            return {
                "day_streak": day_streak,
                "last_login": str(last_login),
                "last_workout": str(last_workout) if last_workout else None
            }
        else:
            return {
                "day_streak": 0,
                "last_login": None,
                "last_workout": None
            }

    except Exception as e:
        print("❌ Error fetching user streak from engagement table:", e)
        return {
            "day_streak": 0,
            "last_login": None,
            "last_workout": None
        }




def format_sets(set_data):
    try:
        if isinstance(set_data, str):
            set_data = ast.literal_eval(set_data)

        if not isinstance(set_data, tuple) or len(set_data) != 5:
            return [f"❌ Unexpected set format: {set_data}"]

        # Correct order based on the `set_type` definition in your DB
        reps, types, weight, difficulty, super_set = set_data

        reps = list(map(str, reps)) if isinstance(reps, (list, tuple)) else [str(reps)]
        weight = list(map(str, weight)) if isinstance(weight, (list, tuple)) else [str(weight)]
        types = list(map(str, types)) if isinstance(types, (list, tuple)) else ["unknown"]

        formatted = []
        for i in range(min(len(reps), len(weight))):
            r = reps[i]
            w = weight[i]
            t = types[i] if i < len(types) else "unknown"
            formatted.append(f"Set {i+1}: {r} reps @ {w} lbs ({t})")

        return formatted

    except Exception as e:
        return [f"❌ Could not parse sets: {e}"]


def get_data(user_id):
    try:
        conn = psycopg2.connect(
            dbname="gitfitbro",
            user="postgres",
            password="password",
            host="localhost",
            port="5432"
        )
        cur = conn.cursor()

        # Get user basic info
        cur.execute("""
            SELECT id, fname, lname, sex, (current_date - dob) AS age
            FROM users
            WHERE id = %s
        """, (user_id,))
        user = cur.fetchone()

        if not user:
            print(f"Error: No user found with ID {user_id}")
            cur.close()
            conn.close()
            return None

        user_id, fname, lname, sex, age = user

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
        return data

    except psycopg2.Error as e:
        print("Database error:", e)
        return None
    
    
def get_userName(user_id):
    try:
        conn = psycopg2.connect(
            dbname="gitfitbro",
            user="postgres",
            password="password",
            host="localhost",
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
        print("Database error:", e)
        return None


def get_user_id_by_username(username):
    try:
        conn = psycopg2.connect(
            dbname="gitfitbro", user="postgres", password="password", host="localhost", port="5432"
        )
        cur = conn.cursor()

        cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        result = cur.fetchone()

        cur.close()
        conn.close()

        if result:
            return result[0]
        else:
            return None

    except Exception as e:
        print("❌ Error fetching user ID by username:", e)
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
        
        



#=========================================

# import psycopg2
# from psycopg2 import sql
# import json
# import ast  # Safe parser for string tuples

# def format_sets(set_data):
#     try:
#         # If it's a string, try to parse
#         if isinstance(set_data, str):
#             set_data = ast.literal_eval(set_data)

#         # Make sure it's a tuple of 5 elements
#         if not isinstance(set_data, tuple) or len(set_data) != 5:
#             return [f"❌ Unexpected set format: {set_data}"]

#         reps, types, weight, difficulty, super_set = set_data

#         # Convert to string lists
#         reps = list(map(str, reps)) if isinstance(reps, (list, tuple)) else [str(reps)]
#         weight = list(map(str, weight)) if isinstance(weight, (list, tuple)) else [str(weight)]
#         types = list(map(str, types)) if isinstance(types, (list, tuple)) else ["unknown"]

#         formatted = []
#         for i in range(min(len(reps), len(weight))):
#             r = reps[i]
#             w = weight[i]
#             t = types[i] if i < len(types) else "unknown"
#             formatted.append(f"Set {i+1}: {r} reps @ {w} lbs ({t})")

#         return formatted

#     except Exception as e:
#         return [f"❌ Could not parse sets: {e}"]


# def get_userName(user_id):
#     try:
#         conn = psycopg2.connect(
#             dbname="sam_DB",
#             user="postgres",
#             password="password",
#             host="localhost",
#             port="5432"
#         )
#         cur = conn.cursor()

#         cur.execute("SELECT fname, lname FROM users WHERE id = %s", (user_id,))
#         user = cur.fetchone()

#         cur.close()
#         conn.close()

#         if not user:
#             return None

#         fname, lname = user
#         return {
#             "first_name": fname,
#             "last_name": lname
#         }

#     except psycopg2.Error as e:
#         print("Database error:", e)
#         return None


# def get_data(user_id):
#     try:
#         conn = psycopg2.connect(
#             dbname="sam_DB",
#             user="postgres",
#             password="password",
#             host="localhost",
#             port="5432"
#         )
#         cur = conn.cursor()

#         # Step 1: Get user info
#         cur.execute("""
#             SELECT id, fname, lname, sex, (current_date - dob) AS age
#             FROM users
#             WHERE id = %s
#         """, (user_id,))
#         user = cur.fetchone()

#         if not user:
#             print(f"Error: No user found with ID {user_id}")
#             cur.close()
#             conn.close()
#             return None

#         user_id, fname, lname, sex, age = user

#         # Step 2: Get latest user stats
#         cur.execute("""
#             SELECT weight, height
#             FROM user_stats
#             WHERE user_id = %s
#             ORDER BY created_at DESC
#             LIMIT 1
#         """, (user_id,))
#         stats = cur.fetchone()
#         weight, height = stats if stats else (None, None)

#         # Step 3: Get latest weight goal
#         cur.execute("""
#             SELECT notes, achieve_by
#             FROM user_goals
#             WHERE user_id = %s AND goal_type = 'weight'
#             ORDER BY created_at DESC
#             LIMIT 1
#         """, (user_id,))
#         goal_result = cur.fetchone()
#         weight_goal = {
#             "notes": goal_result[0],
#             "achieve_by": str(goal_result[1])
#         } if goal_result else None

#         # Step 4: Get most recent workout
#         cur.execute("""
#             SELECT id, name, workout_type, workout_date
#             FROM workouts
#             WHERE user_id = %s
#             ORDER BY workout_date DESC
#             LIMIT 1
#         """, (user_id,))
#         workout_row = cur.fetchone()

#         workout_data = None
#         if workout_row:
#             workout_id, name, w_type, w_date = workout_row
#             workout_data = {
#                 "name": name,
#                 "type": w_type,
#                 "date": str(w_date),
#                 "exercises": []
#             }

#             # Step 5: Get workout exercises
#             cur.execute("""
#                 SELECT e.name, we.sets
#                 FROM workout_exercises we
#                 JOIN exercises e ON we.exercise_id = e.id
#                 WHERE we.workout_id = %s
#             """, (workout_id,))
#             exercise_rows = cur.fetchall()

#             for ex_name, sets in exercise_rows:
#                 formatted = format_sets(sets)
#                 workout_data["exercises"].append({
#                     "name": ex_name,
#                     "sets": formatted
#                 })

#         # Build and return final structured data
#         data = {
#             "user": {
#                 "first_name": fname,
#                 "last_name": lname,
#                 "sex": "Male" if sex == 'M' else "Female",
#                 "age": age.days if hasattr(age, 'days') else age
#             },
#             "stats": {
#                 "weight": float(weight) if weight else None,
#                 "height": height,
#                 "goal": weight_goal if weight_goal else "None"
#             }
#         }

#         if workout_data:
#             data["recent_workout"] = workout_data

#         cur.close()
#         conn.close()
#         return data

#     except psycopg2.Error as e:
#         print("Database error:", e)
#         return None


# if __name__ == '__main__':
#     # Set the user ID to query
#     user_id = 1  # Change this to a valid user ID
#     data = get_data(user_id)
#     if data:
#         with open('data.json', 'w') as f:
#             json.dump(data, f, indent=4)
#         print("✅ Data written to data.json")
#     else:
#         print("❌ No data written due to errors.")

       



#========================================

# import psycopg2
# from psycopg2 import sql
# import json
# from flask_cors import CORS
# from flask import jsonify

# import ast  # Safe parser for string tuples

# def format_sets(set_data):
#     try:
#         # If it's a string from PostgreSQL, parse it
#         if isinstance(set_data, str):
#             set_data = ast.literal_eval(set_data)  # safely converts to tuple

#         reps, weight, difficulty, super_set, types = set_data

#         reps = reps.strip("{}").split(",")
#         weight = weight.strip("{}").split(",")
#         types = types.strip("{}").split(",")

#         formatted = []
#         for i in range(min(len(reps), len(weight))):
#             r = reps[i].strip()
#             w = weight[i].strip()
#             t = types[i].strip() if i < len(types) else "unknown"
#             formatted.append(f"Set {i+1}: {r} reps @ {w} lbs ({t})")

#         return formatted

#     except Exception as e:
#         return [f"❌ Could not parse sets: {e}"]


# def get_userName(user_id):
#     try:
#         # Connect to PostgreSQL
#         conn = psycopg2.connect(
#             dbname="sam_DB",
#             user="postgres",
#             password="password",
#             host="localhost",
#             port="5432"
#         )
#         cur = conn.cursor()

#         # Query the user's first and last name
#         user_info_query = sql.SQL("""
#             SELECT fname, lname
#             FROM users 
#             WHERE id = %s
#         """)
#         cur.execute(user_info_query, (user_id,))
#         user = cur.fetchone()

#         cur.close()
#         conn.close()

#         if not user:
#             print(f"❌ Error: No user found with ID {user_id}")
#             return None
        
#         fname, lname = user
#         return {
#             "first_name": fname,
#             "last_name": lname
#         }

#     except psycopg2.Error as e:
#         print("Database error:", e)
#         return None

# # CHALLENGE QUERY
# def get_family_challenge_data(user_id):
#     try:
#         conn = psycopg2.connect(
#             dbname="sam_DB",
#             user="postgres",
#             password="password",
#             host="localhost",
#             port="5432"
#         )
#         cur = conn.cursor()

#         # Get user's group_id
#         cur.execute("SELECT group_id FROM family_members WHERE user_id = %s", (user_id,))
#         group = cur.fetchone()
#         if not group:
#             return {"challenge": "You're not in a family group yet!"}

#         # Fetch current week's challenge
#         cur.execute("""
#             SELECT challenge_text, start_date, end_date FROM family_challenges
#             WHERE group_id = %s AND CURRENT_DATE BETWEEN start_date AND end_date
#             LIMIT 1
#         """, (group[0],))
#         challenge = cur.fetchone()

#         if challenge:
#             text, start, end = challenge
#             return {
#                 "challenge": text,
#                 "start_date": str(start),
#                 "end_date": str(end)
#             }
#         else:
#             return {"challenge": "No active challenge this week."}

#     except psycopg2.Error as e:
#         print("Database error:", e)
#         return {"challenge": "Error fetching challenge."}
#     finally:
#         cur.close()
#         conn.close()


# def get_data(user_id):
#     try:
#         # Connect to PostgreSQL
#         conn = psycopg2.connect(
#             dbname="sam_DB",
#             user="postgres",
#             password="password",
#             host="localhost",
#             port="5432"
#         )
#         cur = conn.cursor()


#         # users info --> id, fname, lname, sex, age
#         user_info_query = sql.SQL("""
#             SELECT id, fname, lname, sex, (current_date - dob) as age 
#             FROM users 
#             WHERE id = %s
#         """)
#         cur.execute(user_info_query, (user_id,))
#         user = cur.fetchone()

#         if not user:
#             print(f"Error: No user found with ID {user_id}")
#             cur.close()
#             conn.close()
#             return None

#         # Unpack user info
#         user_id, fname, lname, sex, age = user

#         # user_stats --> weight, height
#         user_stats_query = sql.SQL("""
#             SELECT weight, height 
#             FROM user_stats 
#             WHERE user_id = %s 
#             ORDER BY created_at DESC 
#             LIMIT 1
#         """)
#         cur.execute(user_stats_query, (user_id,))
#         stats = cur.fetchone()

#         if stats:
#             weight, height = stats
#         else:
#             weight, height = None, None

#         # users_goals --> weight_goal
#         goal_query = sql.SQL("""
#             SELECT weight_goal 
#             FROM user_goals 
#             WHERE user_id = %s 
#             ORDER BY created_at DESC 
#             LIMIT 1
#         """)
#         cur.execute(goal_query, (user_id,))
#         goal_result = cur.fetchone()

#         weight_goal = goal_result[0] if goal_result else None


#         # --- Recent workout info ---
#         # Step 1: Get recent workout metadata
#         cur.execute("""
#             SELECT id, name, workout_type, workout_start, workout_end
#             FROM workouts
#             WHERE user_id = %s
#             ORDER BY workout_start DESC
#             LIMIT 1
#         """, (user_id,))
#         workout_row = cur.fetchone()

#         workout_data = None
#         if workout_row:
#             workout_id, name, w_type, w_start, w_end = workout_row
#             workout_data = {
#                 "name": name,
#                 "type": w_type,
#                 "start": str(w_start),
#                 "end": str(w_end),
#                 "exercises": []
#             }

#             # Step 2: Get exercises and their sets
#             cur.execute("""
#                 SELECT e.name, we.sets
#                 FROM workout_exercises we
#                 JOIN exercises e ON we.exercise_id = e.id
#                 WHERE we.workout_id = %s
#             """, (workout_id,))
#             exercise_rows = cur.fetchall()

#             for ex_name, sets in exercise_rows:
#                 formatted = format_sets(sets)
#                 workout_data["exercises"].append({
#                     "name": ex_name,
#                     "sets": formatted
#                 })

#         else:
#             workout_data = None


#         # Build the output data
#         # Build the output data
#         data = {
#             "user": {
#                 "first_name": fname,
#                 "last_name": lname,
#                 "sex": "Male" if sex == 'M' else "Female",
#                 "age": age.days if hasattr(age, 'days') else age
#             },
#             "stats": {
#                 "weight": float(weight) if weight else None,
#                 "height": height,
#                 "goal": float(weight_goal) if weight_goal else "None"
#             }
#         }

#         # ✅ Step 3: Conditionally add the recent workout
#         if workout_data:
#             data["recent_workout"] = workout_data


#         # Close connections
#         cur.close()
#         conn.close()

#         return data

#     except psycopg2.Error as e:
#         print("Database error:", e)
#         return None

# if __name__ == '__main__':
#     # Set the user ID to query
#     user_id = 1  # Change this to a valid user ID
#     data = get_data(user_id)
#     if data:
#         with open('data.json', 'w') as f:
#             json.dump(data, f, indent=4)
#         print("✅ Data written to data.json")
#     else:
#         print("❌ No data written due to errors.")



#=======================================