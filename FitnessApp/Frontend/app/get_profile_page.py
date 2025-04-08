from decimal import Decimal
import psycopg2
from psycopg2 import sql
import json


def get_data():
    # Change DB name to what you want to use
    conn = psycopg2.connect(
        dbname="gitfitbro",
        user="postgres",
        password="password",
        host="localhost",
        port="5432"
    )
    goal = 150  # temporary, apparently database doesn't store weight goal yet?
    user_id = '1'  # change to whatever key you want to use
    cur = conn.cursor()
    user_info_query = sql.SQL(
        "SELECT id, username, fname, lname, sex, (SELECT current_date - dob) as age FROM users WHERE key = %s")
    # Change key to the one you want to use
    cur.execute(user_info_query, (user_id,))
    user = cur.fetchall()
    user_stats_query = sql.SQL(
        "SELECT weight, height FROM user_stats WHERE user_id = %s ORDER BY created_at DESC LIMIT 1")
    # Change key to the one you want to use
    cur.execute(user_stats_query, (user_id,))
    stats = cur.fetchall()
    # goal_query = sql.SQL(
    #     "SELECT weight_goal FROM user_stats WHERE user_id = %s ORDER BY created_at DESC LIMIT 1")
    # Change key to the one you want to use
    # cur.execute(goal_query, (user_id,))
    # goal = cur.fetchall()
    print(user)
    print(len(user))
    user = user[0]  # unpacking, seems like a wacky solution
    user = list(user)  # unpacking part 2
    print(user)
    print(len(user))
    print(stats)
    print(len(stats))
    stats = stats[0]  # unpacking, seems like a wacky solution
    stats = list(stats)  # unpacking part 2
    print(stats)
    print(len(stats))
    data = {}
    data['user'] = {"first_name": user[1], "last_name": user[2],
                    "sex": "Male" if user[3] == 'M' else 'Female', "age": user[4]}
    data['stats'] = {"weight": stats[0], "height": stats[1]}
    # "goal": goal[0] if goal else "None"} # goal isnt being stored rn apparently
    cur.close()
    conn.close()
    return data


def convert_decimal(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, list):
        return [convert_decimal(i) for i in obj]
    if isinstance(obj, dict):
        return {k: convert_decimal(v) for k, v in obj.items()}
    return obj


if __name__ == '__main__':
    data = get_data()
    with open('user_data.json', 'w') as f:
        json.dump(convert_decimal(data), f)
    print("Data written to data.json")
