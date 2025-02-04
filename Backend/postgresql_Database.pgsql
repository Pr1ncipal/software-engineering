CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    fname VARCHAR(100) NOT NULL,
    lname VARCHAR(100) NOT NULL,
    password_hash TEXT NOT NULL,
    height DECIMAL(5,2),  -- Stores height in inches
    dob DATE,
    sex VARCHAR(5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_stats (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    weight DECIMAL(5,2),  -- Stores weight in pounds
    body_fat DECIMAL(5,2),  -- Stores body fat percentage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_goals (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    weight_goal DECIMAL(3,2),
    body_fat_goal DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    achieve_by DATE,
    achieved BOOLEAN DEFAULT FALSE,
    achieved_at TIMESTAMP,
    notes TEXT
);

CREATE TABLE workouts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    workout_type VARCHAR(50) NOT NULL, -- Cardio, Strength, etc.
    workout_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    average_heart_rate INT,  -- Stores average heart rate (optional)
    total_weight_lifted DECIMAL(5,2)  -- Stores total weight lifted (Calculated from workout_exercises) (might come from front end calculations)
);

CREATE TABLE exercises (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    equipment VARCHAR(50),
    description TEXT,
    single_sided BOOLEAN DEFAULT FALSE
);

CREATE TABLE muscle_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE exercise_primary_muscle (
    exercise_id INT REFERENCES exercises(id) ON DELETE CASCADE,
    muscle_group_id INT REFERENCES muscle_groups(id) ON DELETE CASCADE
);

CREATE TABLE exercise_secondary_muscle (
    exercise_id INT REFERENCES exercises(id) ON DELETE CASCADE,
    muscle_group_id INT REFERENCES muscle_groups(id) ON DELETE CASCADE
);

CREATE TABLE workout_exercises (
    id SERIAL PRIMARY KEY,
    workout_id INT REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id INT REFERENCES exercises(id) ON DELETE SET NULL,
    exercise_type VARCHAR(50) DEFAULT "Regular",  -- regular, dropset, failiure, etc.
    sets INT NOT NULL,
    reps INT NOT NULL,
    weight DECIMAL(5,2),  -- Stores weight lifted (optional)
    notes TEXT,
    percieved_difficulty INT,  -- Stores percieved difficulty (optional)
    date_performed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workout_exercise_order (
    workout_id INT REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id INT REFERENCES exercises(id) ON DELETE CASCADE,
    exercise_order INT NOT NULL
);


CREATE INDEX idx_user_workouts ON workouts(user_id);
CREATE INDEX idx_workout_exercises ON workout_exercises(workout_id);
CREATE INDEX idx_workout_exercise_order ON workout_exercise_order(workout_id);
