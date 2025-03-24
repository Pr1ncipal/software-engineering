# Leaderboard URL

## Required
- Auth Header: Key
- category: Can request the categories
- scope: Family or global (For future use)

## Optional
- workout: workout ID (Int), Required for 1rm category
- number: Number of people to have in leaderboard
- days: Defaults to the last 30 days. Currently cannot have special time periods, only x days from today

## Examples:
- http://localhost:8080/api/leaderboard/get_leaderboard?category=steps
- http://localhost:8080/api/leaderboard/get_leaderboard?category=1rm&workout=3&days=60
- http://localhost:8080/api/leaderboard/get_leaderboard?category=workouts
- http://localhost:8080/api/leaderboard/get_leaderboard?category=pace