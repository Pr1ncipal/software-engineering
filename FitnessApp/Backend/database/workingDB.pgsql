-- Reminder for Docker command: must include -e POSTGRES_PASSWORD=password

CREATE TYPE set_type AS(
    reps INT[],
    type_set INT[]
    weight DECIMAL(4,2)[],
    percieved_difficulty INT[],  -- Stores percieved difficulty (optional)
    super_set INT 
);

CREATE TYPE muscle_group_enum AS ENUM (
    'abdominals', 'abductors', 'adductors', 'bicep', 'calves', 'chest', 'forearms', 'glutes', 'hamstrings', 'lats', 'lower back', 'middle back', 'quadriceps', 'shoulders', 'traps', 'triceps', 'neck'
);

CREATE TYPE strength_equipment AS ENUM (
    'barbell', 'dumbbell', 'kettlebells', 'medicine ball', 'machine', 'body only', 'other', 'cable', 'exercise ball', 'bands', 'e-z curl bar', 'none', 'foam roll'
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(320) UNIQUE NOT NULL,
    username VARCHAR(20) UNIQUE NOT NULL,
    fname VARCHAR(20) NOT NULL,
    lname VARCHAR(30) NOT NULL,
    password_hash CHAR() NOT NULL, -- Need to find length of hash
    dob DATE NOT NULL,
    sex CHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_stats (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    height INT,  -- Stores height in inches
    weight DECIMAL(5,2),  -- Stores weight in pounds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_goals (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    weight_goal DECIMAL(3,2), -- Possibly add weight lift goal or cardio goal
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    achieve_by DATE,
    achieved BOOLEAN DEFAULT FALSE,
    achieved_at TIMESTAMP,
    notes VARCHAR(250)
);

CREATE TABLE workouts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    workout_type VARCHAR(50) NOT NULL, -- Cardio, Strength, etc.
    workout_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes varchar(250),
    average_heart_rate INT
);

CREATE TABLE exercises (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    equipment strength_equipment,
    description TEXT,
    single_sided BOOLEAN DEFAULT FALSE,
    primary_muscle muscle_group_enum[] NOT NULL, --Think about with muscle groups. Might want with repetition
    secondary_muscles muscle_group_enum[]  -- Stores secondary muscles worked (optional)
    createdBy INT REFERENCES users(id) ON DELETE SET NULL DEFAULT NULL
);


CREATE TABLE workout_exercises (
    id SERIAL PRIMARY KEY,
    workout_id INT REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id INT REFERENCES exercises(id) ON DELETE SET NULL,
    sets set_type,
    notes VARCHAR(250),
    date_performed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE family(
    id SERIAL PRIMARY KEY,
    family_name VARCHAR(50) UNIQUE NOT NULL,
    family_admin INT REFERENCES users(id) ON DELETE CASCADE
    created_at
);

CREATE TABLE family_requests (
    id SERIAL PRIMARY KEY,
    family_id INT REFERENCES family(id) ON DELETE CASCADE,
    sender_id INT REFERENCES users(id) ON DELETE CASCADE,  -- Who sent the request
    receiver_id INT REFERENCES users(id) ON DELETE CASCADE,  -- Who received the request
    status BOOLEAN DEFAULT NULL,  -- 'pending', 'accepted', 'declined'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE family_members(
    family_id INT REFERENCES family(id) ON DELETE CASCADE PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
    --Add roles? Admin, User, etc.
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_user_workouts ON workouts(user_id);
CREATE INDEX idx_workout_exercises ON workout_exercises(workout_id);
CREATE INDEX idx_workout_exercise_order ON workout_exercise_order(workout_id);



-- Inserting data into tables


