-- Reminder for Docker command: must include -e POSTGRES_PASSWORD=password

CREATE TYPE set_type AS(
    reps INT[],
    type_set type_set_type[],
    weight DECIMAL(6,2)[],
    percieved_difficulty INT[],  -- Stores percieved difficulty (optional)
    super_set INT 
);

CREATE TYPE muscle_group_enum AS ENUM (
    'abdominals', 'abductors', 'adductors', 'bicep', 'calves', 'chest', 'forearms', 'glutes', 'hamstrings', 'lats', 'lower back', 'middle back', 'quadriceps', 'shoulders', 'traps', 'triceps', 'neck'
);

CREATE TYPE strength_equipment AS ENUM (
    'barbell', 'dumbbell', 'kettlebells', 'medicine ball', 'machine', 'body only', 'other', 'cable', 'exercise ball', 'bands', 'e-z curl bar', 'none', 'foam roll'
);

CREATE TYPE type_set_type AS ENUM (
    'warm-up', 'normal', 'drop', 'failiure'
);

CREATE TYPE workout_type_enum AS ENUM (
    'cardio', 'strength'
);

CREATE TYPE goal_type_enum AS ENUM (
    'weight', 'cardio', 'strength'
);


CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(320) UNIQUE NOT NULL,
    username VARCHAR(20) UNIQUE NOT NULL,
    fname VARCHAR(20) NOT NULL,
    lname VARCHAR(30) NOT NULL,
    password_hash CHAR(64) NOT NULL, -- Need to find length of hash
    dob DATE NOT NULL,
    sex CHAR NOT NULL,
    BFL DECIMAL(8,2),  -- Stores base fitness level Need to Add ### Change BFL ###
    KEY VARCHAR(64) UNIQUE NOT NULL,  -- Stores key for password reset
    -- Possibly: xp INT DEFAULT 0,  -- Stores experience points
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_stats (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- Add Not Null constraint
    height INT NOT NULL,  -- Stores height in inches
    weight DECIMAL(8,2) NOT NULL,  -- Stores weight in pounds ### Change weight ###
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL -- Change to NOT NULL
);

CREATE TABLE user_goals (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    goal_type goal_type_enum NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    achieve_by DATE NOT NULL,
    achieved BOOLEAN DEFAULT FALSE,
    achieved_at TIMESTAMP,
    notes VARCHAR(250)
);

CREATE TABLE weight_goals (
    target_weight DECIMAL(8,2)
) INHERITS (user_goals);

CREATE TABLE cardio_goals (
    target_distance DECIMAL(8,2),
    target_time INTERVAL
) INHERITS (user_goals);

CREATE TABLE strength_goals (
    target_exercise INT REFERENCES exercises(id) ON DELETE SET NULL, -- Implement
    target_weight DECIMAL(8,2),
    target_reps INT --Delete target sets
) INHERITS (user_goals);

CREATE TABLE step_goals (
    target_steps INT
) INHERITS (user_goals);


CREATE TABLE workouts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    workout_type workout_type_enum NOT NULL,
    workout_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes varchar(250),
    average_heart_rate INT
);

CREATE TABLE exercises (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    equipment strength_equipment NOT NULL,
    description TEXT,
    single_sided BOOLEAN DEFAULT FALSE,
    primary_muscle muscle_group_enum[] NOT NULL, --Think about with muscle groups. Might want with repetition
    secondary_muscles muscle_group_enum[],  -- Stores secondary muscles worked (optional)
    createdBy INT REFERENCES users(id) ON DELETE SET NULL DEFAULT NULL, -- Change to Set Null
    is_deleted BOOLEAN DEFAULT FALSE 
);


CREATE TABLE workout_exercises (
    id SERIAL PRIMARY KEY,
    workout_id INT REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id INT REFERENCES exercises(id) ON DELETE SET NULL,
    sets set_type,
    order_exercise SMALLINT NOT NULL, -- Implement order (Maybe) Initialized and used on back end side
    notes VARCHAR(250),
    date_performed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_exercise_max(
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    exercise_id INT REFERENCES exercises(id) ON DELETE SET NULL,
    calculated_1rm DECIMAL(8,2) NOT NULL, 
    weight_actual DECIMAL(8,2) NOT NULL,
    reps_actual INT NOT NULL,
    date_performed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)


CREATE TABLE user_steps (
    user_id INT REFERENCES users(id) ON DELETE CASCADE, -- Allows for unique user
    date_performed DATE DEFAULT CURRENT_DATE, -- On Unique date, even for multiple writes a day
    steps INT,
    PRIMARY KEY (user_id, date_performed)
);

CREATE TABLE workout_cardio (
    id SERIAL PRIMARY KEY, -- Yes
    workout_id INT REFERENCES workouts(id) ON DELETE CASCADE, -- Yes
    duration INTERVAL NOT NULL, -- Yes
    distance DECIMAL(8,2) NOT NULL, -- Yes (Miles)
    percieved_difficulty INT, -- Yes???
    notes VARCHAR(250) -- Yes?
);

-- Sam tables vv

CREATE TABLE motivational_messages (
    id SERIAL PRIMARY KEY,
    message VARCHAR(250) NOT NULL,
    category VARCHAR(50) NOT NULL
);

CREATE TABLE user_engagement (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    day_streak INT DEFAULT 1,
    last_workout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
);

CREATE TYPE typePredictiveType AS ENUM(
    'weight', 'lift'
);

CREATE TABLE predictiveAnalysis(
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    predictive typePredictiveType NOT NULL,
    predictive_value DECIMAL(8,2) NOT NULL,
    confidence DECIMAL(5,2) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE predictive_exercise(
    predictive_id INT REFERENCES predictiveAnalysis(id) ON DELETE CASCADE,
    exercise_id INT REFERENCES exercises(id) ON DELETE CASCADE,
    PRIMARY KEY (predictive_id, exercise_id)
);

CREATE TYPE challenge_metric AS ENUM (
    'workouts', 'steps', 'weight', 'distance', 'time'
);

-- Have to be implemented after family vvv
CREATE TABLE family_challenges(
    id SERIAL PRIMARY KEY,
    family_id INT REFERENCES family(id) ON DELETE CASCADE,
    challenge_name VARCHAR(50) NOT NULL,
    challenge_description VARCHAR(250),
    target_metric challenge_metric NOT NULL,
    challenge_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    challenge_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE int_challenge(
    target_value INT NOT NULL
) INHERITS (family_challenges);

CREATE TABLE dec_challenge(
    target_value DECIMAL(8,2) NOT NULL
) INHERITS (family_challenges);

CREATE TABLE time_challenge(
    target_value INTERVAL NOT NULL
) INHERITS (family_challenges);

CREATE TABLE family_challenge_progress(
    family_challenge_id INT REFERENCES family_challenges(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    PRIMARY KEY (family_challenge_id, user_id)
);

CREATE TABLE family_challenge_progress_int(
    progress INT NOT NULL
) INHERITS (family_challenge_progress);

CREATE TABLE family_challenge_progress_dec(
    progress DECIMAL(8,2) NOT NULL
) INHERITS (family_challenge_progress);

CREATE TABLE family_challenge_progress_time(
    progress INTERVAL NOT NULL
) INHERITS (family_challenge_progress);

-- Have to be implemented after family ^^^

-- Sam Tables ^^

--- Implement Below
 -- ______________________________________________________________________________________

CREATE TABLE family(
    id SERIAL PRIMARY KEY,
    family_name VARCHAR(50) UNIQUE NOT NULL,
    family_admin INT REFERENCES users(id) ON DELETE CASCADE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE family_requests ( --Implement Table
    id SERIAL PRIMARY KEY,
    family_id INT REFERENCES family(id) ON DELETE CASCADE,
    sender_id INT REFERENCES users(id) ON DELETE CASCADE,  -- Who sent the request
    receiver_id INT REFERENCES users(id) ON DELETE CASCADE,  -- Who received the request
    status BOOLEAN DEFAULT NULL,  -- 'pending', 'accepted', 'declined'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE family_members(
    family_id INT REFERENCES family(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (family_id, user_id)
);

CREATE TABLE fitness_score_entry (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    score INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_user_workouts ON workouts(user_id);
CREATE INDEX idx_workout_exercises ON workout_exercises(workout_id);
CREATE INDEX idx_workout_exercise_order ON workout_exercise_order(workout_id);



-- Inserting data into tables


