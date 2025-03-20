import flask
from flask import Flask, request, jsonify
import psycopg2
import psycopg2.sql
import datetime
from global_func import verify_key, getConnection
import json
import base64
import leaderboardClass as lbc

app = Flask(__name__)

# workouts by timeframe
# We can have specified timeframes for the workouts
# Steps/day Average [Null not counted] leader (Default) (In that day)
# Be able to toggle later between global and family
# leaderboard for specific workout
# Speed of change of 1rm
#localhost:8080/api/leaderboard?catagory=steps&days=30&scope=global&key=1234&workout=deadlift&number=10

@app.route('/api/leaderboard', methods=['GET'])
def leaderboard():
    lb = lbc.Leaderboard(request.args.get('catagory'), int(request.args.get('days')), request.args.get('scope'), request.args.get('key'), request.args.get('workout'), request.args.get('number'))

    lb.get_leaderboard()
    return jsonify({'leaderboard': lb.get_leaderboard()})


if "__name__" == "__main__":
    app.run(debug=True)