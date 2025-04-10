import psycopg2
from psycopg2 import sql
import json
import ast  # Safe parser for string tuples

import io
import base64
import matplotlib.pyplot as plt
from datetime import datetime, timedelta


# def format_weight_chart(actual_data, prediction_data):
#     labels = [d.strftime("%m-%d") for d, _ in actual_data + prediction_data]

#     # Convert weights
#     actual_weights = [w for _, w in actual_data] + [None] * len(prediction_data)
#     predicted_weights = [None] * (len(actual_data) - 1) + [actual_data[-1][1]] + [w for _, w in prediction_data]

#     # Filter out None for min/max
#     valid_actual = [w for w in actual_weights if w is not None]
#     valid_predicted = [w for w in predicted_weights if w is not None]

#     min_y = min(valid_actual + valid_predicted) - 5
#     max_y = max(valid_actual + valid_predicted) + 5

#     return {
#         "labels": labels,
#         "datasets": [
#             {"label": "Actual", "data": actual_weights},
#             {"label": "Predicted", "data": predicted_weights}
#         ],
#         "yAxisRange": [min_y, max_y]
#     }




# def get_actual_and_predicted_weights(user_id):
#     conn = psycopg2.connect(
#         dbname="gitfitbro",
#         user="postgres",
#         password="password",
#         host="localhost",
#         port="5432"
#     )
#     cur = conn.cursor()

#     cur.execute("""
#         SELECT created_at::date, weight
#         FROM user_stats
#         WHERE user_id = %s
#         ORDER BY created_at ASC
#         LIMIT 10
#     """, (user_id,))
#     actual_data = [(d, float(w)) for d, w in cur.fetchall()]

#     predicted_data = []
#     if actual_data:
#         last_date, last_weight = actual_data[-1]
#         for i in range(1, 5):  # Predict next 4 weeks only
#             future_date = last_date + timedelta(weeks=i)
#             future_weight = last_weight - i * 1.5
#             predicted_data.append((future_date, future_weight))

#     cur.close()
#     conn.close()

#     return actual_data, predicted_data

# Trim trailing Nones from actual data
def trim_trailing_none(values):
    while values and values[-1] is None:
        values.pop()
    return values

def trim_leading_nones(data, labels):
    # Trim the same number of items from both data and labels
    for i, val in enumerate(data):
        if val is not None:
            return data[i:], labels[i:]
    return [], []


def format_weight_chart(actual_data, prediction_data):
    labels_actual = [d.strftime("%m-%d") for d, _ in actual_data]
    labels_predicted = [d.strftime("%m-%d") for d, _ in prediction_data]

    actual_weights = [float(w) for _, w in actual_data]
    predicted_weights = [float(w) for _, w in prediction_data]

    # Combine labels if you want them in one chart or keep separate
    labels = list(dict.fromkeys(labels_actual + labels_predicted))

    # Determine Y-axis range based on both datasets
    visible_weights = actual_weights + predicted_weights
    min_y = min(visible_weights) - 5 if visible_weights else 100
    max_y = max(visible_weights) + 5 if visible_weights else 250

    return {
        "labels": labels,
        "datasets": [
            {"label": "Actual", "data": actual_weights},
            {"label": "Predicted", "data": predicted_weights}
        ],
        "yAxisRange": [min_y, max_y]
    }




import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import timedelta
import random

# def get_actual_and_predicted_weights(user_id):
#     conn = psycopg2.connect(
#         dbname="gitfitbro",
#         user="postgres",
#         password="password",
#         host="localhost",
#         port="5432"
#     )
#     cur = conn.cursor()

#     # Get actual weights
#     cur.execute("""
#         SELECT created_at::date, weight
#         FROM user_stats
#         WHERE user_id = %s
#         ORDER BY created_at ASC
#     """, (user_id,))
#     actual_data = [(d, float(w)) for d, w in cur.fetchall()]

#     # Get user's goal
#     cur.execute("""
#         SELECT target_weight, achieve_by
#         FROM weight_goals
#         WHERE user_id = %s
#         ORDER BY created_at DESC
#         LIMIT 1
#     """, (user_id,))
#     goal_result = cur.fetchone()
#     goal_weight, goal_date = float(goal_result[0]), goal_result[1] if goal_result else (None, None)

#     predicted_data = []

#     if actual_data and goal_weight and goal_date:
#         start_date, start_weight = actual_data[0]
#         days_to_goal = (goal_date - start_date).days
#         weeks_to_goal = max(1, days_to_goal // 7)

#         # Train linear regression model
#         x = np.array([(d - start_date).days for d, _ in actual_data]).reshape(-1, 1)
#         y = np.array([w for _, w in actual_data])
#         model = LinearRegression().fit(x, y)

#         predicted_data.append((start_date, start_weight))  # Start from first actual weight

#         for i in range(1, weeks_to_goal + 1):
#             date = start_date + timedelta(weeks=i)
#             if date > goal_date:
#                 break  # ❗️STOP at goal date

#             days_from_start = (date - start_date).days
#             pred_weight = model.predict(np.array([[days_from_start]]))[0]
#             pred_weight += random.uniform(-1.0, 1.0)
#             pred_weight = max(goal_weight, pred_weight)
#             predicted_data.append((date, pred_weight))



#         # # 👉 Start prediction from last actual weight
#         # predicted_data.insert(0, (last_date, last_weight))

#         # for i in range(1, weeks_to_goal + 1):
#         #     date = last_date + timedelta(weeks=i)
#         #     days_from_start = (date - actual_data[0][0]).days

#         #     # Predict with noise
#         #     pred_weight = model.predict(np.array([[days_from_start]]))[0]
#         #     pred_weight += random.uniform(-1.0, 1.0)
#         #     pred_weight = max(goal_weight, pred_weight)

#         #     predicted_data.append((date, pred_weight))

#     cur.close()
#     conn.close()
#     return actual_data, predicted_data


def get_actual_and_predicted_weights(user_id):
    conn = psycopg2.connect(
        dbname="gitfitbro",
        user="postgres",
        password="password",
        host="localhost",
        port="5432"
    )
    cur = conn.cursor()

    # 1. Get actual weights
    cur.execute("""
        SELECT created_at::date, weight
        FROM user_stats
        WHERE user_id = %s
        ORDER BY created_at ASC
    """, (user_id,))
    actual_data = [(d, float(w)) for d, w in cur.fetchall()]

    # 2. Get goal
    cur.execute("""
        SELECT target_weight, achieve_by
        FROM weight_goals
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT 1
    """, (user_id,))
    goal_result = cur.fetchone()
    goal_weight, goal_date = float(goal_result[0]), goal_result[1] if goal_result else (None, None)

    predicted_data = []

    if actual_data and goal_weight and goal_date:
        # Train model on actual data
        x = np.array([(d - actual_data[0][0]).days for d, _ in actual_data]).reshape(-1, 1)
        y = np.array([w for _, w in actual_data])
        model = LinearRegression().fit(x, y)

        # Start prediction from the last actual data point, continue until the goal date
        start_date = actual_data[0][0]
        last_actual_date = actual_data[-1][0]

        predicted_data.extend(actual_data)  # Include actual weights first

        i = 1
        while True:
            future_date = last_actual_date + timedelta(weeks=i)
            if future_date > goal_date:
                break

            days_from_start = (future_date - start_date).days
            pred_weight = model.predict(np.array([[days_from_start]]))[0]
            pred_weight += random.uniform(-1.0, 1.0)
            pred_weight = max(goal_weight, pred_weight)

            predicted_data.append((future_date, pred_weight))
            i += 1

    cur.close()
    conn.close()

    return actual_data, predicted_data



# WORKING 4/9/25
# def get_actual_and_predicted_weights(user_id):
#     conn = psycopg2.connect(
#         dbname="gitfitbro",
#         user="postgres",
#         password="password",
#         host="localhost",
#         port="5432"
#     )
#     cur = conn.cursor()

#     # 1. Get actual weight data
#     cur.execute("""
#         SELECT created_at::date, weight
#         FROM user_stats
#         WHERE user_id = %s
#         ORDER BY created_at ASC
#     """, (user_id,))
#     actual_data = [(d, float(w)) for d, w in cur.fetchall()]

#     # 2. Get user's goal weight and deadline
#     cur.execute("""
#         SELECT target_weight, achieve_by
#         FROM weight_goals
#         WHERE user_id = %s
#         ORDER BY created_at DESC
#         LIMIT 1
#     """, (user_id,))
#     goal_result = cur.fetchone()
#     goal_weight, goal_date = float(goal_result[0]), goal_result[1] if goal_result else (None, None)

#     predicted_data = []
#     if actual_data:
#         last_date, last_weight = actual_data[-1]

#         # 3. Estimate weekly loss rate
#         if len(actual_data) >= 2:
#             first_date, first_weight = actual_data[0]
#             weeks_elapsed = max(1, (last_date - first_date).days / 7)
#             weekly_loss_rate = (first_weight - last_weight) / weeks_elapsed
#         else:
#             weekly_loss_rate = 1.5  # fallback default

#         # 4. Predict based on goal date and weight
#         if goal_weight and goal_date:
#             weeks_to_goal = max(1, (goal_date - last_date).days // 7)
#             for i in range(weeks_to_goal + 1):
#                 future_date = last_date + timedelta(weeks=i)
#                 future_weight = max(goal_weight, last_weight - i * weekly_loss_rate)
#                 predicted_data.append((future_date, future_weight))
#         else:
#             # fallback: 4-week prediction
#             for i in range(4):
#                 future_date = last_date + timedelta(weeks=i + 1)
#                 future_weight = last_weight - (i + 1) * weekly_loss_rate
#                 predicted_data.append((future_date, future_weight))

#     cur.close()
#     conn.close()
#     return actual_data, predicted_data




def generate_weight_graph_with_prediction(actual_data, prediction_data):
    # Sample starting data
    start_weight = 400
    start_date = datetime.today() - timedelta(weeks=3)

    # Actual data (simulate 3 weekly weigh-ins)
    actual_data = [(start_date + timedelta(weeks=i), start_weight - i * 2) for i in range(3)]

    # Prediction data (12 weeks from last actual point)
    prediction_start_date = actual_data[-1][0]
    prediction_start_weight = actual_data[-1][1]
    prediction_data = [(prediction_start_date + timedelta(weeks=i), prediction_start_weight - i * 1.5) for i in range(1, 13)]

    # Unpack data
    actual_dates, actual_weights = zip(*actual_data)
    pred_dates, pred_weights = zip(*prediction_data)

    # Graph it
    plt.figure(figsize=(10, 5))
    plt.plot(actual_dates, actual_weights, "o-", color="royalblue", label="Actual Weight")
    plt.plot(
        [actual_dates[-1]] + list(pred_dates),
        [actual_weights[-1]] + list(pred_weights),
        "s--",
        color="orange",
        label="Predicted Weight"
    )

    # Confidence interval
    upper = [w + 2 for w in [actual_weights[-1]] + list(pred_weights)]
    lower = [w - 2 for w in [actual_weights[-1]] + list(pred_weights)]
    plt.fill_between([actual_dates[-1]] + list(pred_dates), lower, upper, color="orange", alpha=0.2)

    plt.title("Weight Progress Forecast")
    plt.xlabel("Date")
    plt.ylabel("Weight (lbs)")
    plt.xticks(rotation=45)
    plt.legend(loc="upper right")
    plt.grid(True)
    plt.tight_layout()

    # Encode to base64 to show
    buf = io.BytesIO()
    plt.savefig(buf, format="png")
    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode("utf-8")
    plt.close()

    encoded[:100]  # Return a snippet of the base64 string for confirmation

    # # actual_data & prediction_data = list of tuples (date, weight)
    # actual_dates, actual_weights = zip(*actual_data)
    # pred_dates, pred_weights = zip(*prediction_data)

    # plt.figure(figsize=(8, 4.5))
    # plt.plot(actual_dates, actual_weights, "o-", color="royalblue", label="Actual Weight")
    # plt.plot(pred_dates, pred_weights, "s--", color="orange", label="Predicted Weight")

    # # Optional shaded confidence region (±2 lbs for example)
    # upper = [w + 2 for w in pred_weights]
    # lower = [w - 2 for w in pred_weights]
    # plt.fill_between(pred_dates, lower, upper, color="orange", alpha=0.2)

    # plt.title("Weight Progress Forecast")
    # plt.xlabel("Date")
    # plt.ylabel("Weight (lbs)")
    # plt.xticks(rotation=45)
    # plt.legend(loc="upper left")
    # plt.tight_layout()

    # # Convert to base64
    # buf = io.BytesIO()
    # plt.savefig(buf, format="png")
    # buf.seek(0)
    # encoded = base64.b64encode(buf.read()).decode("utf-8")
    # plt.close()
    # return encoded


# def predict_progress(user_id):
#     try:
#         conn = psycopg2.connect(
#             dbname="gitfitbro",
#             user="postgres",
#             password="password",
#             host="localhost",
#             port="5432"
#         )
#         cur = conn.cursor()

#         # Get recent weights
#         cur.execute("""
#             SELECT weight, created_at
#             FROM user_stats
#             WHERE user_id = %s
#             ORDER BY created_at DESC
#             LIMIT 6
#         """, (user_id,))
#         weights = cur.fetchall()

#         # Calculate trend (e.g., weight loss per day)
#         if len(weights) < 2:
#             return "Not enough data to make a prediction."

#         weights = sorted(weights, key=lambda x: x[1])
#         start_weight, start_date = weights[0]
#         end_weight, end_date = weights[-1]

#         days = (end_date - start_date).days or 1
#         rate = (end_weight - start_weight) / days  # lbs/day

#         # Estimate when goal will be hit
#         cur.execute("""
#             SELECT target_weight
#             FROM weight_goals
#             WHERE user_id = %s
#             ORDER BY created_at DESC
#             LIMIT 1
#         """, (user_id,))
#         goal_result = cur.fetchone()
#         target_weight = goal_result[0] if goal_result else None

#         if target_weight is not None and rate != 0:
#             days_remaining = (target_weight - end_weight) / rate
#             days_remaining = round(abs(days_remaining))
#             message = f"At your current pace, you'll reach your goal in about {days_remaining} days."
#         else:
#             message = "You're making progress! Keep tracking for more accurate predictions."

#         cur.close()
#         conn.close()
#         return message

#     except Exception as e:
#         print("❌ Error in predictive progress analysis:", e)
#         return "Unable to generate prediction at this time."

def predict_progress(user_id):
    try:
        conn = psycopg2.connect(
            dbname="gitfitbro",
            user="postgres",
            password="password",
            host="localhost",
            port="5432"
        )
        cur = conn.cursor()

        # Get recent weights
        cur.execute("""
            SELECT weight, created_at
            FROM user_stats
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 6
        """, (user_id,))
        weights = cur.fetchall()

        if len(weights) < 2:
            return {
                "message": "Not enough data to make a prediction.",
                "start_date": None,
                "goal_date": None,
                "days_remaining": None
            }

        weights = sorted(weights, key=lambda x: x[1])
        start_weight, start_date = weights[0]
        end_weight, end_date = weights[-1]

        days = (end_date - start_date).days or 1
        rate = (end_weight - start_weight) / days

        cur.execute("""
            SELECT target_weight, achieve_by
            FROM weight_goals
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 1
        """, (user_id,))
        goal_result = cur.fetchone()
        target_weight, goal_date = goal_result if goal_result else (None, None)

        if target_weight is not None and rate != 0:
            days_remaining = (target_weight - end_weight) / rate
            est_goal_date = end_date + timedelta(days=int(days_remaining))
            days_remaining_int = abs(int(days_remaining))
            message = (
                f"Prediction starts from {end_date.strftime('%m-%d')} and "
                f"shows expected weight loss based on your current trend. "
                f"Estimated {days_remaining_int} days until goal is reached."
            )
        else:
            message = "You're making progress! Keep tracking for more accurate predictions."
            est_goal_date = None
            days_remaining_int = None

        cur.close()
        conn.close()

        return {
            "message": message,
            "start_date": end_date.strftime('%Y-%m-%d'),
            "goal_date": est_goal_date.strftime('%Y-%m-%d') if est_goal_date else None,
            "days_remaining": days_remaining_int
        }

    except Exception as e:
        print("❌ Error in predictive progress analysis:", e)
        return {
            "message": "Unable to generate prediction at this time.",
            "start_date": None,
            "goal_date": None,
            "days_remaining": None
        }



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