--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2 (Debian 17.2-1.pgdg120+1)
-- Dumped by pg_dump version 17.2 (Debian 17.2-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: challenge_metric; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.challenge_metric AS ENUM (
    'workouts',
    'steps',
    'weight',
    'distance',
    'time'
);


ALTER TYPE public.challenge_metric OWNER TO postgres;

--
-- Name: goal_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.goal_type_enum AS ENUM (
    'weight',
    'cardio',
    'strength',
    'steps'
);


ALTER TYPE public.goal_type_enum OWNER TO postgres;

--
-- Name: muscle_group_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.muscle_group_enum AS ENUM (
    'abdominals',
    'abductors',
    'adductors',
    'biceps',
    'calves',
    'chest',
    'forearms',
    'glutes',
    'hamstrings',
    'lats',
    'lower back',
    'middle back',
    'quadriceps',
    'shoulders',
    'traps',
    'triceps',
    'neck'
);


ALTER TYPE public.muscle_group_enum OWNER TO postgres;

--
-- Name: type_set_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.type_set_type AS ENUM (
    'warm-up',
    'normal',
    'drop',
    'failiure'
);


ALTER TYPE public.type_set_type OWNER TO postgres;

--
-- Name: set_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.set_type AS (
	reps integer[],
	type_set public.type_set_type[],
	weight numeric(8,2)[],
	percieved_difficulty integer[],
	super_set integer
);


ALTER TYPE public.set_type OWNER TO postgres;

--
-- Name: strength_equipment; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.strength_equipment AS ENUM (
    'barbell',
    'dumbbell',
    'kettlebells',
    'medicine ball',
    'machine',
    'body only',
    'other',
    'cable',
    'exercise ball',
    'bands',
    'e-z curl bar',
    'none',
    'foam roll'
);


ALTER TYPE public.strength_equipment OWNER TO postgres;

--
-- Name: typepredictivetype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.typepredictivetype AS ENUM (
    'weight',
    'lift'
);


ALTER TYPE public.typepredictivetype OWNER TO postgres;

--
-- Name: workout_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.workout_type_enum AS ENUM (
    'cardio',
    'strength'
);


ALTER TYPE public.workout_type_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: user_goals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_goals (
    id integer NOT NULL,
    user_id integer,
    goal_type public.goal_type_enum NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    achieve_by date NOT NULL,
    achieved boolean DEFAULT false,
    achieved_at timestamp without time zone,
    notes character varying(250)
);


ALTER TABLE public.user_goals OWNER TO postgres;

--
-- Name: cardio_goals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cardio_goals (
    target_distance numeric(8,2),
    target_time interval
)
INHERITS (public.user_goals);


ALTER TABLE public.cardio_goals OWNER TO postgres;

--
-- Name: exercises; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exercises (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    equipment public.strength_equipment NOT NULL,
    description text,
    single_sided boolean DEFAULT false,
    primary_muscle public.muscle_group_enum[] NOT NULL,
    secondary_muscles public.muscle_group_enum[],
    createdby integer,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.exercises OWNER TO postgres;

--
-- Name: exercises_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.exercises_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exercises_id_seq OWNER TO postgres;

--
-- Name: exercises_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.exercises_id_seq OWNED BY public.exercises.id;


--
-- Name: family; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.family (
    id integer NOT NULL,
    family_name character varying(50) NOT NULL,
    family_admin integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.family OWNER TO postgres;

--
-- Name: family_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.family_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.family_id_seq OWNER TO postgres;

--
-- Name: family_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.family_id_seq OWNED BY public.family.id;


--
-- Name: family_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.family_members (
    family_id integer NOT NULL,
    user_id integer NOT NULL,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.family_members OWNER TO postgres;

--
-- Name: family_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.family_requests (
    id integer NOT NULL,
    family_id integer,
    sender_id integer,
    receiver_id integer,
    status boolean,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.family_requests OWNER TO postgres;

--
-- Name: family_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.family_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.family_requests_id_seq OWNER TO postgres;

--
-- Name: family_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.family_requests_id_seq OWNED BY public.family_requests.id;


--
-- Name: motivational_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.motivational_messages (
    id integer NOT NULL,
    message character varying(250) NOT NULL,
    category character varying(50) NOT NULL
);


ALTER TABLE public.motivational_messages OWNER TO postgres;

--
-- Name: motivational_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.motivational_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.motivational_messages_id_seq OWNER TO postgres;

--
-- Name: motivational_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.motivational_messages_id_seq OWNED BY public.motivational_messages.id;


--
-- Name: predictive_exercise; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.predictive_exercise (
    predictive_id integer NOT NULL,
    exercise_id integer NOT NULL
);


ALTER TABLE public.predictive_exercise OWNER TO postgres;

--
-- Name: predictiveanalysis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.predictiveanalysis (
    id integer NOT NULL,
    user_id integer,
    predictive public.typepredictivetype NOT NULL,
    predictive_value numeric(8,2) NOT NULL,
    confidence numeric(5,2) NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.predictiveanalysis OWNER TO postgres;

--
-- Name: predictiveanalysis_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.predictiveanalysis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.predictiveanalysis_id_seq OWNER TO postgres;

--
-- Name: predictiveanalysis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.predictiveanalysis_id_seq OWNED BY public.predictiveanalysis.id;


--
-- Name: step_goals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.step_goals (
    target_steps integer
)
INHERITS (public.user_goals);


ALTER TABLE public.step_goals OWNER TO postgres;

--
-- Name: strength_goals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.strength_goals (
    target_weight numeric(8,2),
    target_reps integer,
    target_exercise integer
)
INHERITS (public.user_goals);


ALTER TABLE public.strength_goals OWNER TO postgres;

--
-- Name: user_engagement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_engagement (
    id integer NOT NULL,
    user_id integer,
    last_login timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    day_streak integer DEFAULT 1,
    last_workout timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_engagement OWNER TO postgres;

--
-- Name: user_engagement_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_engagement_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_engagement_id_seq OWNER TO postgres;

--
-- Name: user_engagement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_engagement_id_seq OWNED BY public.user_engagement.id;


--
-- Name: user_exercise_max; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_exercise_max (
    id integer NOT NULL,
    user_id integer NOT NULL,
    exercise_id integer,
    calculated_1rm numeric(8,2) NOT NULL,
    weight_actual numeric(8,2) NOT NULL,
    reps_actual integer NOT NULL,
    date_performed timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_exercise_max OWNER TO postgres;

--
-- Name: user_exercise_max_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_exercise_max_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_exercise_max_id_seq OWNER TO postgres;

--
-- Name: user_exercise_max_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_exercise_max_id_seq OWNED BY public.user_exercise_max.id;


--
-- Name: user_goals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_goals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_goals_id_seq OWNER TO postgres;

--
-- Name: user_goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_goals_id_seq OWNED BY public.user_goals.id;


--
-- Name: user_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_stats (
    id integer NOT NULL,
    user_id integer NOT NULL,
    height integer NOT NULL,
    weight numeric(8,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_stats OWNER TO postgres;

--
-- Name: user_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_stats_id_seq OWNER TO postgres;

--
-- Name: user_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_stats_id_seq OWNED BY public.user_stats.id;


--
-- Name: user_steps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_steps (
    user_id integer NOT NULL,
    date_performed date DEFAULT CURRENT_DATE NOT NULL,
    steps integer
);


ALTER TABLE public.user_steps OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(320) NOT NULL,
    username character varying(20) NOT NULL,
    fname character varying(20) NOT NULL,
    lname character varying(30) NOT NULL,
    password_hash character(64) NOT NULL,
    dob date NOT NULL,
    sex character(1) NOT NULL,
    bfl numeric(8,2),
    key character varying(64) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: weight_goals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.weight_goals (
    target_weight numeric(8,2)
)
INHERITS (public.user_goals);


ALTER TABLE public.weight_goals OWNER TO postgres;

--
-- Name: workout_cardio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workout_cardio (
    id integer NOT NULL,
    workout_id integer,
    duration interval NOT NULL,
    distance numeric(8,2) NOT NULL,
    percieved_difficulty integer,
    notes character varying(250)
);


ALTER TABLE public.workout_cardio OWNER TO postgres;

--
-- Name: workout_cardio_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.workout_cardio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workout_cardio_id_seq OWNER TO postgres;

--
-- Name: workout_cardio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.workout_cardio_id_seq OWNED BY public.workout_cardio.id;


--
-- Name: workout_exercises; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workout_exercises (
    id integer NOT NULL,
    workout_id integer,
    exercise_id integer,
    order_exercise smallint NOT NULL,
    notes character varying(250),
    date_performed timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    sets public.set_type
);


ALTER TABLE public.workout_exercises OWNER TO postgres;

--
-- Name: workout_exercises_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.workout_exercises_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workout_exercises_id_seq OWNER TO postgres;

--
-- Name: workout_exercises_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.workout_exercises_id_seq OWNED BY public.workout_exercises.id;


--
-- Name: workouts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workouts (
    id integer NOT NULL,
    name character varying(30) NOT NULL,
    user_id integer,
    workout_type public.workout_type_enum NOT NULL,
    workout_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    notes character varying(250),
    average_heart_rate integer
);


ALTER TABLE public.workouts OWNER TO postgres;

--
-- Name: workouts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.workouts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workouts_id_seq OWNER TO postgres;

--
-- Name: workouts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.workouts_id_seq OWNED BY public.workouts.id;


--
-- Name: cardio_goals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cardio_goals ALTER COLUMN id SET DEFAULT nextval('public.user_goals_id_seq'::regclass);


--
-- Name: cardio_goals created_at; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cardio_goals ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;


--
-- Name: cardio_goals achieved; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cardio_goals ALTER COLUMN achieved SET DEFAULT false;


--
-- Name: exercises id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercises ALTER COLUMN id SET DEFAULT nextval('public.exercises_id_seq'::regclass);


--
-- Name: family id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family ALTER COLUMN id SET DEFAULT nextval('public.family_id_seq'::regclass);


--
-- Name: family_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_requests ALTER COLUMN id SET DEFAULT nextval('public.family_requests_id_seq'::regclass);


--
-- Name: motivational_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.motivational_messages ALTER COLUMN id SET DEFAULT nextval('public.motivational_messages_id_seq'::regclass);


--
-- Name: predictiveanalysis id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictiveanalysis ALTER COLUMN id SET DEFAULT nextval('public.predictiveanalysis_id_seq'::regclass);


--
-- Name: step_goals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.step_goals ALTER COLUMN id SET DEFAULT nextval('public.user_goals_id_seq'::regclass);


--
-- Name: step_goals created_at; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.step_goals ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;


--
-- Name: step_goals achieved; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.step_goals ALTER COLUMN achieved SET DEFAULT false;


--
-- Name: strength_goals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.strength_goals ALTER COLUMN id SET DEFAULT nextval('public.user_goals_id_seq'::regclass);


--
-- Name: strength_goals created_at; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.strength_goals ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;


--
-- Name: strength_goals achieved; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.strength_goals ALTER COLUMN achieved SET DEFAULT false;


--
-- Name: user_engagement id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_engagement ALTER COLUMN id SET DEFAULT nextval('public.user_engagement_id_seq'::regclass);


--
-- Name: user_exercise_max id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_exercise_max ALTER COLUMN id SET DEFAULT nextval('public.user_exercise_max_id_seq'::regclass);


--
-- Name: user_goals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_goals ALTER COLUMN id SET DEFAULT nextval('public.user_goals_id_seq'::regclass);


--
-- Name: user_stats id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_stats ALTER COLUMN id SET DEFAULT nextval('public.user_stats_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: weight_goals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weight_goals ALTER COLUMN id SET DEFAULT nextval('public.user_goals_id_seq'::regclass);


--
-- Name: weight_goals created_at; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weight_goals ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;


--
-- Name: weight_goals achieved; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weight_goals ALTER COLUMN achieved SET DEFAULT false;


--
-- Name: workout_cardio id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workout_cardio ALTER COLUMN id SET DEFAULT nextval('public.workout_cardio_id_seq'::regclass);


--
-- Name: workout_exercises id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workout_exercises ALTER COLUMN id SET DEFAULT nextval('public.workout_exercises_id_seq'::regclass);


--
-- Name: workouts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workouts ALTER COLUMN id SET DEFAULT nextval('public.workouts_id_seq'::regclass);


--
-- Data for Name: cardio_goals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cardio_goals (id, user_id, goal_type, created_at, achieve_by, achieved, achieved_at, notes, target_distance, target_time) FROM stdin;
\.


--
-- Data for Name: exercises; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exercises (id, name, equipment, description, single_sided, primary_muscle, secondary_muscles, createdby, is_deleted) FROM stdin;
1	Decline Smith Press	machine	Place a decline bench underneath the Smith machine. Now place the barbell at a height that you can reach when lying down and your arms are almost fully extended. Using a pronated grip that is wider than shoulder width, unlock the bar from the rack and hold it straight over you with your arms extended. This will be your starting position. As you inhale, lower the bar under control by allowing the elbows to flex, lightly contacting the torso. After a brief pause, bring the bar back to the starting position by extending the elbows, exhaling as you do so. Repeat the movement for the prescribed amount of repetitions. When the set is complete, lock the bar back in the rack. 	f	{chest}	{shoulders,triceps}	\N	f
2	Sled Row	other	Attach dual handles to a sled connected by a rope or chain. Load the sled to an appropriate weight. Face the sled, backing up until there is some tension in the line. With a handle in each hand, bend the knees slightly, keep your head and chest up, and begin with your arms extended. To initiate the movement, flex the elbow as you retract your shoulder blades, pulling the sled towards you. Take a step or two back to get tension in the line and repeat. 	f	{"middle back"}	{biceps,lats}	\N	f
3	Dumbbell Bicep Curl	dumbbell	Stand up straight with a dumbbell in each hand at arm's length. Keep your elbows close to your torso and rotate the palms of your hands until they are facing forward. This will be your starting position. Now, keeping the upper arms stationary, exhale and curl the weights while contracting your biceps. Continue to raise the weights until your biceps are fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a brief pause as you squeeze your biceps. Then, inhale and slowly begin to lower the dumbbells back to the starting position. Repeat for the recommended amount of repetitions. 	t	{biceps}	{forearms}	\N	f
4	Cable Incline Triceps Extension	cable	Lie on incline an bench facing away from a high pulley machine that has a straight bar attachment on it. Grasp the straight bar attachment overhead with a pronated (overhand; palms down) narrow grip (less than shoulder width) and keep your elbows tucked in to your sides. Your upper arms should create around a 25 degree angle when measured from the floor. Keeping the upper arms stationary, extend the arms as you flex the triceps. Breathe out during this portion of the movement and hold the contraction for a second. Slowly go back to the starting position. Repeat for the recommended amount of repetitions. 	t	{triceps}	\N	\N	f
5	Standing Military Press	barbell	Start by placing a barbell that is about chest high on a squat rack. Once you have selected the weights, grab the barbell using a pronated (palms facing forward) grip. Make sure to grip the bar wider than shoulder width apart from each other. Slightly bend the knees and place the barbell on your collar bone. Lift the barbell up keeping it lying on your chest. Take a step back and position your feet shoulder width apart from each other. Once you pick up the barbell with the correct grip length, lift the bar up over your head by locking your arms. Hold at about shoulder level and slightly in front of your head. This is your starting position. Lower the bar down to the collarbone slowly as you inhale. Lift the bar back up to the starting position as you exhale. Repeat for the recommended amount of repetitions. 	f	{shoulders}	{triceps}	\N	f
6	Barbell Rear Delt Row	barbell	Stand up straight while holding a barbell using a wide (higher than shoulder width) and overhand (palms facing your body) grip. Bend knees slightly and bend over as you keep the natural arch of your back. Let the arms hang in front of you as they hold the bar. Once your torso is parallel to the floor, flare the elbows out and away from your body. Tip: Your torso and your arms should resemble the letter "T". Now you are ready to begin the exercise. While keeping the upper arms perpendicular to the torso, pull the barbell up towards your upper chest as you squeeze the rear delts and you breathe out. Tip: When performed correctly, this exercise should resemble a bench press in reverse. Also, refrain from using your biceps to do the work. Focus on targeting the rear delts; the arms should only act as hooks. Slowly go back to the initial position as you breathe in. Repeat for the recommended amount of repetitions. 	f	{shoulders}	{biceps,lats,"middle back"}	\N	f
7	Standing Dumbbell Triceps Extension	dumbbell	To begin, stand up with a dumbbell held by both hands. Your feet should be about shoulder width apart from each other. Slowly use both hands to grab the dumbbell and lift it over your head until both arms are fully extended. The resistance should be resting in the palms of your hands with your thumbs around it. The palm of the hands should be facing up towards the ceiling. This will be your starting position. Keeping your upper arms close to your head with elbows in and perpendicular to the floor, lower the resistance in a semicircular motion behind your head until your forearms touch your biceps. Tip: The upper arms should remain stationary and only the forearms should move. Breathe in as you perform this step. Go back to the starting position by using the triceps to raise the dumbbell. Breathe out as you perform this step. Repeat for the recommended amount of repetitions. 	t	{triceps}	\N	\N	f
8	Clean	barbell	With a barbell on the floor close to the shins, take an overhand (or hook) grip just outside the legs. Lower your hips with the weight focused on the heels, back straight, head facing forward, chest up, with your shoulders just in front of the bar. This will be your starting position.  Begin the first pull by driving through the heels, extending your knees. Your back angle should stay the same, and your arms should remain straight. Move the weight with control as you continue to above the knees. Next comes the second pull, the main source of acceleration for the clean. As the bar approaches the mid-thigh position, begin extending through the hips. In a jumping motion, accelerate by extending the hips, knees, and ankles, using speed to move the bar upward. There should be no need to actively pull through the arms to accelerate the weight; at the end of the second pull, the body should be fully extended, leaning slightly back, with the arms still extended. As full extension is achieved, transition into the third pull by aggressively shrugging and flexing the arms with the elbows up and out. At peak extension, aggressively pull yourself down, rotating your elbows under the bar as you do so. Receive the bar in a front squat position, the depth of which is dependent upon the height of the bar at the end of the third pull. The bar should be racked onto the protracted shoulders, lightly touching the throat with the hands relaxed. Continue to descend to the bottom squat position, which will help in the recovery. Immediately recover by driving through the heels, keeping the torso upright and elbows up. Continue until you have risen to a standing position. 	f	{hamstrings}	{calves,forearms,glutes,"lower back",quadriceps,shoulders,traps}	\N	f
20	Chair Lower Back Stretch	none	Sit upright on a chair. Bend to one side with your arm over your head. You can hold onto the chair with your free hand. Hold for 10 seconds, and repeat for your other side. 	t	{lats}	{"lower back"}	\N	f
9	Seated Bent-Over Two-Arm Dumbbell Triceps Extension	dumbbell	Sit down at the end of a flat bench with a dumbbell in both arms using a neutral grip (palms of the hand facing you). Bend your knees slightly and bring your torso forward, by bending at the waist, while keeping the back straight until it is almost parallel to the floor. Make sure that you keep the head up. The upper arms with the dumbbells should be close to the torso and aligned with it (lifted up until they are parallel to the floor while the forearms are pointing towards the floor as the hands hold the weights). Tip: There should be a 90-degree angle between the forearms and the upper arm. This is your starting position. Keeping the upper arms stationary, use the triceps to lift the weight as you exhale until the forearms are parallel to the floor and the whole arm is extended. Like many other arm exercises, only the forearm moves. After a second contraction at the top, slowly lower the dumbbells back to the starting position as you inhale. Repeat the movement for the prescribed amount of repetitions. 	t	{triceps}	\N	\N	f
10	Open Palm Kettlebell Clean	kettlebells	Place one kettlebell between your feet. Clean the kettlebell by extending through the legs and hips as you raise the kettlebell towards your shoulders. Release the kettlebell as it comes up, and let it flip so that the ball of the kettlebell lands in the palms of your hands. Release the kettlebell out in front of you and catch the handle with both hands. Lower the kettlebell to the starting position and repeat. 	f	{hamstrings}	{glutes,"lower back",quadriceps,shoulders}	\N	f
11	Otis-Up	other	Secure your feet and lay back on the floor. Your knees should be bent. Hold a weight with both hands to your chest. This will be your starting position. Initiate the movement by flexing the hips and spine to raise your torso up from the ground. As you move up, press the weight up so that it is above your head at the top of the movement. Return the weight to your chest as you reverse the sit-up motion, ensuring not to go all the way down to the floor. 	f	{abdominals}	{chest,shoulders,triceps}	\N	f
12	Barbell Side Bend	barbell	Stand up straight while holding a barbell placed on the back of your shoulders (slightly below the neck). Your feet should be shoulder width apart. This will be your starting position. While keeping your back straight and your head up, bend only at the waist to the right as far as possible. Breathe in as you bend to the side. Then hold for a second and come back up to the starting position as you exhale. Tip: Keep the rest of the body stationary. Now repeat the movement but bending to the left instead. Hold for a second and come back to the starting position. Repeat for the recommended amount of repetitions. 	t	{abdominals}	{"lower back"}	\N	f
13	Kettlebell Windmill	kettlebells	Place a kettlebell in front of your lead foot and clean and press it overhead with your opposite arm. Clean the kettlebell to your shoulder by extending through the legs and hips as you pull the kettlebell towards your shoulders. Rotate your wrist as you do so, so that the palm faces forward. Press it overhead by extending the elbow. Keeping the kettlebell locked out at all times, push your butt out in the direction of the locked out kettlebell. Turn your feet out at a forty-five degree angle from the arm with the locked out kettlebell. Bending at the hip to one side, sticking your butt out, slowly lean until you can touch the floor with your free hand. Keep your eyes on the kettlebell that you hold over your head at all times. Pause for a second after reaching the ground and reverse the motion back to the starting position. 	f	{abdominals}	{glutes,hamstrings,shoulders,triceps}	\N	f
14	Weighted Crunches	medicine ball	Lie flat on your back with your feet flat on the ground or resting on a bench with your knees bent at a 90 degree angle. Hold a weight to your chest, or you may hold it extended above your torso. This will be your starting position. Now, exhale and slowly begin to roll your shoulders off the floor. Your shoulders should come up off the floor about 4 inches while your lower back remains on the floor. At the top of the movement, flex your abdominals and hold for a brief pause. Then inhale and slowly lower yourself back down to the starting position. 	t	{abdominals}	\N	\N	f
15	Rope Jumping	other	Hold an end of the rope in each hand. Position the rope behind you on the ground. Raise your arms up and turn the rope over your head bringing it down in front of you. When it reaches the ground, jump over it. Find a good turning pace that can be maintained. Different speeds and techniques can be used to introduce variation. Rope jumping is exciting, challenges your coordination, and requires a lot of energy. A 150 lb person will burn about 350 calories jumping rope for 30 minutes, compared to over 450 calories running. 	f	{quadriceps}	{calves,hamstrings}	\N	f
16	Chair Squat	machine	To begin, first set the bar to a position that best matches your height. Once the bar is loaded, step under it and position it across the back of your shoulders. Take the bar with your hands facing forward, unlock it and lift it off the rack by extending your legs. Move your feet forward about 18 inches in front of the bar. Position your legs using a shoulder width stance with the toes slightly pointed out. Look forward at all times and maintain a neutral or slightly arched spine. This will be your starting position. Slowly lower the bar by bending the knees as you maintain a straight posture with the head up. Continue down until the angle between the upper and lower leg breaks 90 degrees. Begin to raise the bar as you exhale by pushing the floor with the heels of your feet, extending the knees and returning to the starting position. Repeat for the recommended amount of repetitions. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
17	Hip Circles (prone)	body only	Position yourself on your hands and knees on the ground. Maintaining good posture, raise one bent knee off of the ground. This will be your starting position. Keeping the knee in a bent position, rotate the femur in an arc, attempting to make a big circle with your knee. Perform this slowly for a number of repetitions, and repeat on the other side. 	t	{abductors}	{adductors}	\N	f
18	Standing Palm-In One-Arm Dumbbell Press	dumbbell	Start by having a dumbbell in one hand with your arm fully extended to the side using a neutral grip. Use your other arm to hold on to an incline bench to keep your balance. Your feet should be shoulder width apart from each other. Now slowly lift the dumbbell up until you create a 90 degree angle with your arm. Note: Your forearm should be perpendicular to the floor. Continue to maintain a neutral grip throughout the entire exercise. Slowly lift the dumbbell up until your arm is fully extended. This the starting position. While inhaling lower the weight down until your arm is at a 90 degree angle again. Feel the contraction for a second and then lift the weight back up towards the starting position while exhaling. Remember to hold on to the incline bench and keep your feet positioned to keep balance during the exercise. Repeat for the recommended amount of repetitions. Switch arms and repeat the exercise. 	f	{shoulders}	{triceps}	\N	f
19	Looking At Ceiling	none	Kneel on the floor, holding your heels with both hands. Lift your buttocks up and forward while bringing your head back to look up at the ceiling, to give an arch in your back. 	t	{quadriceps}	\N	\N	f
21	Hammer Grip Incline DB Bench Press	dumbbell	Lie back on an incline bench with a dumbbell on each hand on top of your thighs. The palms of your hand will be facing each other. By using your thighs to help you get the dumbbells up, clean the dumbbells one arm at a time so that you can hold them at shoulder width. Once at shoulder width, keep the palms of your hands with a neutral grip (palms facing each other). Keep your elbows flared out with the upper arms in line with the shoulders (perpendicular to the torso) and the elbows bent creating a 90-degree angle between the upper arm and the forearm. This will be your starting position. Now bring down the weights slowly to your side as you breathe in. Keep full control of the dumbbells at all times. As you breathe out, push the dumbbells up using your pectoral muscles. Lock your arms in the contracted position, hold for a second and then start coming down slowly. Tip: It should take at least twice as long to go down than to come up. Repeat the movement for the prescribed amount of repetitions. When you are done, place the dumbbells back in your thighs and then on the floor. This is the safest manner to dispose of the dumbbells. 	f	{chest}	{shoulders,triceps}	\N	f
22	Standing Bradford Press	barbell	Place a loaded bar at shoulder level in a rack. With a pronated grip at shoulder width, begin with the bar racked across the front of your shoulders. This is your starting position. Initiate the lift by extending the elbows to press the bar overhead. Avoid locking out the elbow as you move the weight behind your head. Lower the bar down to the back of the head until your elbow forms a right angle. Lift the bar back over your head by extending the elbows Lower the bar down to the starting position. Alternate in this manner until you complete the recommended amount of repetitions. 	f	{shoulders}	{triceps}	\N	f
23	Upper Back-Leg Grab	none	While seated, bend forward to hug your thighs from underneath with both arms. Keep your knees together and your legs extended out as you bring your chest down to your knees. You can also stretch your middle back by pulling your back away from your knees as your hugging them. 	f	{hamstrings}	{"lower back","middle back"}	\N	f
24	Squat with Chains	barbell	To set up the chains, begin by looping the leader chain over the sleeves of the bar. The heavy chain should be attached using a snap hook. Adjust the length of the lead chain so that a few links are still on the floor at the top of the movement. Begin by stepping under the bar and placing it across the back of the shoulders. Squeeze your shoulder blades together and rotate your elbows forward, attempting to bend the bar across your shoulders. Remove the bar from the rack, creating a tight arch in your lower back, and step back into position. Place your feet wide for more emphasis on the back, glutes, adductors, and hamstrings. Keep your head facing forward. With your back, shoulders, and core tight, push your knees and butt out and you begin your descent. Sit back with your hips as much as possible. Ideally, your shins should be perpendicular to the ground. Lower bar position necessitates a greater torso lean to keep the bar over the heels. Continue until you break parallel, which is defined as the crease of the hip being in line with the top of the knee. Keeping the weight on your heels and pushing your feet and knees out, drive upward as you lead the movement with your head. Continue upward, maintaining tightness head to toe, until you have returned to the starting position. 	f	{quadriceps}	{adductors,calves,glutes,hamstrings,"lower back"}	\N	f
25	Single-Arm Linear Jammer	barbell	Position a bar into a landmine or securely anchor it in a corner. Load the bar to an appropriate weight. Raise the bar from the floor, taking it to your shoulders with one or both hands. Adopt a wide stance. This will be your starting position. Perform the movement by extending the elbow, pressing the weight up. Move explosively, extending the hips and knees fully to produce maximal force. Return to the starting position. 	f	{shoulders}	{chest,triceps}	\N	f
26	Preacher Hammer Dumbbell Curl	dumbbell	Place the upper part of both arms on top of the preacher bench as you hold a dumbbell in each hand with the palms facing each other (neutral grip). As you breathe in, slowly lower the dumbbells until your upper arm is extended and the biceps is fully stretched. As you exhale, use the biceps to curl the weight up until your biceps is fully contracted and the dumbbells are at shoulder height. Squeeze the biceps hard for a second at the contracted position and repeat for the recommended amount of repetitions. 	t	{biceps}	{forearms}	\N	f
27	Barbell Shrug Behind The Back	barbell	Stand up straight with your feet at shoulder width as you hold a barbell with both hands behind your back using a pronated grip (palms facing back). Tip: Your hands should be a little wider than shoulder width apart. You can use wrist wraps for this exercise for better grip. This will be your starting position. Raise your shoulders up as far as you can go as you breathe out and hold the contraction for a second. Tip: Refrain from trying to lift the barbell by using your biceps. The arms should remain stretched out at all times. Slowly return to the starting position as you breathe in. Repeat for the recommended amount of repetitions. 	t	{traps}	{forearms,"middle back"}	\N	f
28	Adductor/Groin	none	Lie on your back with your feet raised towards the ceiling. Have your partner hold your feet or ankles. Abduct your legs as far as you can. This will be your starting position. Attempt to squeeze your legs together for 10 or more seconds, while your partner prevents you from doing so. Now, relax the muscles in your legs as your partner pushes your feet apart, stretching as far as is comfortable for you. Be sure to let your partner know when the stretch is adequate to prevent overstretching or injury. 	f	{adductors}	\N	\N	f
29	Hug A Ball	exercise ball	Seat yourself on the floor. Straddle an exercise ball between both legs and lower your hips down toward the floor. Hug your arms around the ball to support your body. Adjust your legs so that your feet are flat on the floor and your knees line up over your ankles. Keep a good grip on the ball so it doesn't roll away from you and send you back onto your buttocks. 	t	{"lower back"}	{calves,glutes}	\N	f
30	Dumbbell Seated One-Leg Calf Raise	dumbbell	Place a block on the floor about 12 inches from a flat bench. Sit on a flat bench and place a dumbbell on your upper left thigh about 3 inches above your knee. Now place the ball of your left foot on the block. This will be your starting position. Raise your toes up as high as possible as you exhale and you contract your calf muscle. Hold the contraction for a second. Slowly return to the starting position, stretching as far down as possible. Repeat for your prescribed number of repetitions and then repeat with the right leg. 	t	{calves}	\N	\N	f
380	Catch and Overhead Throw	medicine ball	Begin standing while facing a wall or a partner. Using both hands, position the ball behind your head, stretching as much as possible, and forcefully throw the ball forward. Ensure that you follow your throw through, being prepared to receive your rebound from your throw. If you are throwing against the wall, make sure that you stand close enough to the wall to receive the rebound, and aim a little higher than you would with a partner. 	f	{lats}	{abdominals,chest,shoulders}	\N	f
31	Jogging, Treadmill	machine	To begin, step onto the treadmill and select the desired option from the menu. Most treadmills have a manual setting, or you can select a program to run. Typically, you can enter your age and weight to estimate the amount of calories burned during exercise. Elevation can be adjusted to change the intensity of the workout. Treadmills offer convenience, cardiovascular benefits, and usually have less impact than jogging outside. A 150 lb person will burn almost 250 calories jogging for 30 minutes, compared to more than 450 calories running. Maintain proper posture as you jog, and only hold onto the handles when necessary, such as when dismounting or checking your heart rate. 	f	{quadriceps}	{glutes,hamstrings}	\N	f
32	Supine Chest Throw	medicine ball	This drill is great for chest passes when you lack a partner or a wall of sufficient strength. Lay on the ground on your back with your knees bent. Begin with the ball on your chest, held with both hands on the bottom. Explode up, extending through the elbow to throw the ball directly above you as high as possible. Catch the ball with both hands as it comes down. 	f	{triceps}	{chest,shoulders}	\N	f
33	Reverse Band Bench Press	barbell	Position a bench inside a power rack, with the bar set to the correct height. Begin by anchoring bands either to band pegs or to the top of the rack. Ensure that you will be position properly under the bands. Attach the other end to the barbell. Lie on the bench, tuck your feet underneath you and arch your back. Using the bar to help support your weight, lift your shoulder off the bench and retract them, squeezing the shoulder blades together. Use your feet to drive your traps into the bench. Maintain this tight body position throughout the movement. However wide your grip, it should cover the ring on the bar. Pull the bar out of the rack without protracting your shoulders. Focus on squeezing the bar and trying to pull it apart. Lower the bar to your lower chest or upper stomach. The bar, wrist, and elbow should stay in line at all times. Pause when the barbell touches your torso, and then drive the bar up with as much force as possible. The elbows should be tucked in until lockout. 	f	{triceps}	{chest,forearms,lats,"middle back",shoulders}	\N	f
34	Dumbbell Incline Row	dumbbell	Using a neutral grip, lean into an incline bench. Take a dumbbell in each hand with a neutral grip, beginning with the arms straight. This will be your starting position. Retract the shoulder blades and flex the elbows to row the dumbbells to your side. Pause at the top of the motion, and then return to the starting position. 	f	{"middle back"}	{biceps,forearms,lats,shoulders}	\N	f
35	One Arm Dumbbell Bench Press	dumbbell	Lie down on a flat bench with a dumbbell in one hand on top of your thigh. By using your thigh to help you get the dumbbell up, clean the dumbbell up so that you can hold it in front of you at shoulder width. Use the hand you are not lifting with to help position the dumbbell over you properly. Once at shoulder width, rotate your wrist forward so that the palm of your hand is facing away from you. This will be your starting position. Bring down the weights slowly to your side as you breathe in. Keep full control of the dumbbell at all times. Tip: Use the hand that you are not lifting with to help keep the dumbbell balance as you may struggle a bit at first. Only use your non-lifting hand if it is needed. Otherwise, keep it resting to the side. As you breathe out, push the dumbbells up using your pectoral muscles. Lock your arms in the contracted position, squeeze your chest, hold for a second and then start coming down slowly. Tip: It should take at least twice as long to go down than to come up. Repeat the movement for the prescribed amount of repetitions of your training program. Switch arms and repeat the movement. 	f	{chest}	{shoulders,triceps}	\N	f
36	Reverse Flyes	dumbbell	To begin, lie down on an incline bench with the chest and stomach pressing against the incline. Have the dumbbells in each hand with the palms facing each other (neutral grip). Extend the arms in front of you so that they are perpendicular to the angle of the bench. The legs should be stationary while applying pressure with the ball of your toes. This is the starting position. Maintaining the slight bend of the elbows, move the weights out and away from each other (to the side) in an arc motion while exhaling. Tip: Try to squeeze your shoulder blades together to get the best results from this exercise. The arms should be elevated until they are parallel to the floor. Feel the contraction and slowly lower the weights back down to the starting position while inhaling. Repeat for the recommended amount of repetitions. 	t	{shoulders}	\N	\N	f
37	Band Assisted Pull-Up	other	Choke the band around the center of the pullup bar. You can use different bands to provide varying levels of assistance. Pull the end of the band down, and place one bent knee into the loop, ensuring it won't slip out. Take a medium to wide grip on the bar. This will be your starting position. Pull yourself upward by contracting the lats as you flex the elbow. The elbow should be driven to your side. Pull to the front, attempting to get your chin over the bar. Avoid swinging or jerking movements. After a brief pause, return to the starting position. 	f	{lats}	{abdominals,forearms,"middle back"}	\N	f
38	Heaving Snatch Balance	barbell	This drill helps you learn the snatch. Begin by holding a light weight across the back of the shoulders. Your feet should be slightly wider than hip width apart with the feet turned out, the same position that you would perform a squat with. Begin by dipping with the knees slightly, and popping back up to briefly unload the bar. Drive yourself underneath the bar, elevating it overhead as you descend into a full squat. Return to a standing position. 	f	{quadriceps}	{abdominals,forearms,glutes,hamstrings,shoulders,triceps}	\N	f
39	Wrist Rotations with Straight Bar	barbell	Hold a barbell with both hands and your palms facing down; hands spaced about shoulder width. This will be your starting position. Alternating between each of your hands, perform the movement by extending the wrist as though you were rolling up a newspaper. Continue alternating back and forth until failure. Reverse the motion by flexing the wrist, rolling the opposite direction. Continue the alternating motion until failure. 	t	{forearms}	\N	\N	f
40	Tuck Crunch	body only	To begin, lie down on the floor or an exercise mat with your back pressed against the floor. Your arms should be lying across your sides with the palms facing down. Your legs should be crossed by wrapping one ankle around the other. Slowly elevate your legs up in the air until your thighs are perpendicular to the floor with a slight bend at the knees. Note: Your knees and toes should be parallel to the floor as opposed to the thighs. Move your arms from the floor and cross them so they are resting on your chest. This is the starting position. While keeping your lower back pressed against the floor, slowly lift your torso. Remember to exhale while perform this part of the exercise. Slowly begin to lower your torso back down to the starting position while inhaling. Repeat for the recommended amount of repetitions. 	t	{abdominals}	\N	\N	f
41	Cable Seated Lateral Raise	cable	Stand in the middle of two low pulleys that are opposite to each other and place a flat bench right behind you (in perpendicular fashion to you; the narrow edge of the bench should be the one behind you). Select the weight to be used on each pulley. Now sit at the edge of the flat bench behind you with your feet placed in front of your knees. Bend forward while keeping your back flat and rest your torso on the thighs. Have someone give you the single handles attached to the pulleys. Grasp the left pulley with the right hand and the right pulley with the left after you select your weight. The pulleys should run under your knees and your arms will be extended with palms facing each other and a slight bend at the elbows. This will be the starting position. While keeping the arms stationary, raise the upper arms to the sides until they are parallel to the floor and at shoulder height. Exhale during the execution of this movement and hold the contraction for a second. Slowly lower your arms to the starting position as you inhale. Repeat for the recommended amount of repetitions. Tip: Maintain upper arms perpendicular to torso and a fixed elbow position (10 degree to 30 degree angle) throughout exercise. 	t	{shoulders}	{"middle back",traps}	\N	f
42	Sit-Up	body only	Lie down on the floor placing your feet either under something that will not move or by having a partner hold them. Your legs should be bent at the knees. Place your hands behind your head and lock them together by clasping your fingers. This is the starting position. Elevate your upper body so that it creates an imaginary V-shape with your thighs. Breathe out when performing this part of the exercise. Once you feel the contraction for a second, lower your upper body back down to the starting position while inhaling. Repeat for the recommended amount of repetitions. 	t	{abdominals}	\N	\N	f
43	Seated Barbell Military Press	barbell	Sit on a Military Press Bench with a bar behind your head and either have a spotter give you the bar (better on the rotator cuff this way) or pick it up yourself carefully with a pronated grip (palms facing forward). Tip: Your grip should be wider than shoulder width and it should create a 90-degree angle between the forearm and the upper arm as the barbell goes down. Once you pick up the barbell with the correct grip length, lift the bar up over your head by locking your arms. Hold at about shoulder level and slightly in front of your head. This is your starting position. Lower the bar down to the collarbone slowly as you inhale. Lift the bar back up to the starting position as you exhale. Repeat for the recommended amount of repetitions. 	f	{shoulders}	{triceps}	\N	f
44	Machine Preacher Curls	machine	Sit down on the Preacher Curl Machine and select the weight. Place the back of your upper arms (your triceps) on the preacher pad provided and grab the handles using an underhand grip (palms facing up). Tip: Make sure that when you place the arms on the pad you keep the elbows in. This will be your starting position. Now lift the handles as you exhale and you contract the biceps. At the top of the position make sure that you hold the contraction for a second. Tip: Only the forearms should move. The upper arms should remain stationary and on the pad at all times. Lower the handles slowly back to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	t	{biceps}	\N	\N	f
45	Kettlebell Pass Between The Legs	kettlebells	Place one kettlebell between your legs and take a comfortable stance. Bend over by pushing your butt out and keeping your back flat. Pick up a kettlebell and pass it to your other hand between your legs, in the fashion of a "W". Go back and forth for several repetitions. 	f	{abdominals}	{glutes,hamstrings,shoulders}	\N	f
46	Thigh Adductor	machine	To begin, sit down on the adductor machine and select a weight you are comfortable with. When your legs are positioned properly on the leg pads of the machine, grip the handles on each side. Your entire upper body (from the waist up) should be stationary. This is the starting position. Slowly press against the machine with your legs to move them towards each other while exhaling. Feel the contraction for a second and begin to move your legs back to the starting position while breathing in. Note: Remember to keep your upper body stationary and avoid fast jerking motions in order to prevent any injuries from occurring. Repeat for the recommended amount of repetitions. 	t	{adductors}	{glutes,hamstrings}	\N	f
47	Front Box Jump	other	Begin with a box of an appropriate height 1-2 feet in front of you. Stand with your feet should width apart. This will be your starting position. Perform a short squat in preparation for jumping, swinging your arms behind you. Rebound out of this position, extending through the hips, knees, and ankles to jump as high as possible. Swing your arms forward and up. Land on the box with the knees bent, absorbing the impact through the legs. You can jump from the box back to the ground, or preferably step down one leg at a time. 	f	{hamstrings}	{abductors,adductors,calves,glutes,quadriceps}	\N	f
48	Stairmaster	machine	To begin, step onto the stairmaster and select the desired option from the menu. You can choose a manual setting, or you can select a program to run. Typically, you can enter your age and weight to estimate the amount of calories burned during exercise. Pump your legs up and down in an established rhythm, driving the pedals down but not all the way to the floor. It is recommended that you maintain your grip on the handles so that you don't fall. The handles can be used to monitor your heart rate to help you stay at an appropriate intensity. Stairmasters offer convenience, cardiovascular benefits, and usually have less impact than running outside. They are typically much harder than other cardio equipment. A 150 lb person will typically burn over 300 calories in 30 minutes, compared to about 175 calories walking. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
49	Seated One-Arm Dumbbell Palms-Down Wrist Curl	dumbbell	Sit on a flat bench with a dumbbell in your right hand. Place your feet flat on the floor, at a distance that is slightly wider than shoulder width apart. Lean forward and place your right forearm on top of your upper right thigh with your palm down. Tip: Make sure that the back of the wrist lies on top of your knees. This will be your starting position. Lower the dumbbell as far as possible as you keep a tight grip on the dumbbell. Inhale as you perform this movement. Now curl the dumbbell as high as possible as you contract the forearms and as you exhale. Keep the contraction for a second before you lower again. Tip: The only movement should happen at the wrist. Perform for the recommended amount of repetitions, switch arms and repeat the movement. 	t	{forearms}	\N	\N	f
60	Backward Medicine Ball Throw	medicine ball	This exercise is best done with a partner. If you lack a partner, the ball can be thrown and retrieved or thrown against a wall. Begin standing a few meters in front of your partner, both facing the same direction. Begin holding the ball between your legs. Squat down and then forcefully reverse direction, coming to full extension and you toss the ball over your head to your partner. Your partner can then roll the ball back to you. Repeat for the desired number of repetitions. 	f	{shoulders}	\N	\N	f
50	Dumbbell One-Arm Triceps Extension	dumbbell	Grab a dumbbell and either sit on a military press bench or a utility bench that has a back support on it as you place the dumbbells upright on top of your thighs or stand up straight. Clean the dumbbell up to bring it to shoulder height and then extend the arm over your head so that the whole arm is perpendicular to the floor and next to your head. The dumbbell should be on top of you. The other hand can be kept fully extended to the side, by the waist, supporting the upper arm that has the dumbbell or grabbing a fixed surface. Rotate the wrist so that the palm of your hand is facing forward and the pinkie is facing the ceiling. This will be your starting position. Slowly lower the dumbbell behind your head as you hold the upper arm stationary. Inhale as you perform this movement and pause when your triceps are fully stretched. Return to the starting position by flexing your triceps as you breathe out. Tip: It is imperative that only the forearm moves. The upper arm should remain at all times stationary next to your head. Repeat for the recommended amount of repetitions and switch arms. 	t	{triceps}	\N	\N	f
51	Cable Hammer Curls - Rope Attachment	cable	Attach a rope attachment to a low pulley and stand facing the machine about 12 inches away from it. Grasp the rope with a neutral (palms-in) grip and stand straight up keeping the natural arch of the back and your torso stationary. Put your elbows in by your side and keep them there stationary during the entire movement. Tip: Only the forearms should move; not your upper arms. This will be your starting position. Using your biceps, pull your arms up as you exhale until your biceps touch your forearms. Tip: Remember to keep the elbows in and your upper arms stationary. After a 1 second contraction where you squeeze your biceps, slowly start to bring the weight back to the original position. Repeat for the recommended amount of repetitions. 	t	{biceps}	\N	\N	f
52	Calf Press	machine	Adjust the seat so that your legs are only slightly bent in the start position. The balls of your feet should be firmly on the platform. Select an appropriate weight, and grasp the handles. This will be your starting position. Straighten the legs by extending the knees, just barely lifting the weight from the stack. Your ankle should be fully flexed, toes pointing up. Execute the movement by pressing downward through the balls of your feet as far as possible. After a brief pause, reverse the motion and repeat. 	t	{calves}	\N	\N	f
53	Flutter Kicks	body only	On a flat bench lie facedown with the hips on the edge of the bench, the legs straight with toes high off the floor and with the arms on top of the bench holding on to the front edge. Squeeze your glutes and hamstrings and straighten the legs until they are level with the hips. This will be your starting position. Start the movement by lifting the left leg higher than the right leg. Then lower the left leg as you lift the right leg. Continue alternating in this manner (as though you are doing a flutter kick in water) until you have done the recommended amount of repetitions for each leg. Make sure that you keep a controlled movement at all times. Tip: You will breathe normally as you perform this movement. 	f	{glutes}	{hamstrings}	\N	f
54	Cable Iron Cross	cable	Begin by moving the pulleys to the high position, select the resistance to be used, and take a handle in each hand. Stand directly between both pulleys with your arms extended out to your sides. Your head and chest should be up while your arms form a "T". This will be your starting position. Keeping the elbows extended, pull your arms straight to your sides. Return your arms back to the starting position after a pause at the peak contraction. Continue the movement for the prescribed number of repetitions. 	t	{chest}	\N	\N	f
55	Lying Cambered Barbell Row	barbell	Place a cambered bar underneath an exercise bench. Lie face down on the exercise bench and grab the bar using a palms down (pronated grip) that is wider than shoulder width. This will be your starting position. As you exhale row the bar up as you keep the elbows close to your body to either your chest, in order to target the upper mid back, or to your stomach if targeting the lats is your goal. After a second hold at the top, lower back down to the starting position slowly as you inhale. 	t	{"middle back"}	{biceps,lats,traps}	\N	f
56	Floor Press	barbell	Adjust the j-hooks so they are at the appropriate height to rack the bar. Begin lying on the floor with your head near the end of a power rack. Keeping your shoulder blades pulled together; pull the bar off of the hooks. Lower the bar towards the bottom of your chest or upper stomach, squeezing the bar and attempting to pull it apart as you do so. Ensure that you tuck your elbows throughout the movement. Lower the bar until your upper arm contacts the ground and pause, preventing any slamming or bouncing of the weight. Press the bar back up as fast as you can, keeping the bar, your wrists, and elbows in line as you do so. 	f	{triceps}	{chest,shoulders}	\N	f
57	Standing Leg Curl	machine	Adjust the machine lever to fit your height and lie with your torso bent at the waist facing forward around 30-45 degrees (since an angled position is more favorable for hamstrings recruitment) with the pad of the lever on the back of your right leg (just a few inches under the calves) and the front of the right leg on top of the machine pad. Keeping the torso bent forward, ensure your leg is fully stretched and grab the side handles of the machine. Position your toes straight. This will be your starting position. As you exhale, curl your right leg up as far as possible without lifting the upper leg from the pad. Once you hit the fully contracted position, hold it for a second. As you inhale, bring the legs back to the initial position. Repeat for the recommended amount of repetitions. Perform the same exercise now for the left leg. 	t	{hamstrings}	\N	\N	f
58	Cable Judo Flip	cable	Connect a rope attachment to a tower, and move the cable to the lowest pulley position. Stand with your side to the cable with a wide stance, and grab the rope with both hands. Twist your body away from the pulley as you bring the rope over your shoulder like you're performing a judo flip. Shift your weight between your feet as you twist and crunch forward, pulling the cable downward. Return to the starting position and repeat until failure. Then, reposition and repeat the same series of movements on the opposite side. 	f	{abdominals}	\N	\N	f
59	Standing Dumbbell Straight-Arm Front Delt Raise Above Head	dumbbell	Hold the dumbbells in front of your thighs, palms facing your thighs. Keep your arms straight with a slight bend at the elbows but keep them locked. This will be your starting position. Raise the dumbbells in a semicircular motion to arm's length overhead as you exhale. Slowly return to the starting position using the same path as you inhale. Repeat for the recommended amount of repetitions. 	t	{shoulders}	\N	\N	f
96	Windmills	none	Lie on your back with your arms extended out to the sides and your legs straight. This will be your starting position. Lift one leg and quickly cross it over your body, attempting to touch the ground near the opposite hand. Return to the starting position, and repeat with the opposite leg. Continue to alternate for 10-20 repetitions. 	f	{abductors}	{glutes,hamstrings,"lower back"}	\N	f
61	Zottman Curl	dumbbell	Stand up with your torso upright and a dumbbell in each hand being held at arms length. The elbows should be close to the torso. Make sure the palms of the hands are facing each other. This will be your starting position. While holding the upper arm stationary, curl the weights while contracting the biceps as you breathe out. Only the forearms should move. Your wrist should rotate so that you have a supinated (palms up) grip. Continue the movement until your biceps are fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a second as you squeeze the biceps. Now during the contracted position, rotate your wrist until you now have a pronated (palms facing down) grip with the thumb at a higher position than the pinky. Slowly begin to bring the dumbbells back down using the pronated grip. As the dumbbells close your thighs, start rotating the wrist so that you go back to a neutral (palms facing your body) grip. Repeat for the recommended amount of repetitions. 	t	{biceps}	{forearms}	\N	f
62	Leverage Chest Press	machine	Load an appropriate weight onto the pins and adjust the seat for your height. The handles should be near the bottom or middle of the pectorals at the beginning of the motion. Your chest and head should be up and your shoulder blades retracted. This will be your starting position. Press the handles forward by extending through the elbow. After a brief pause at the top, return the weight just above the start position, keeping tension on the muscles by not returning the weight to the stops until the set is complete. 	f	{chest}	{shoulders,triceps}	\N	f
63	Kneeling Squat	barbell	Set the bar to the proper height in a power rack. Kneel behind the bar; it may be beneficial to put a mat down to pad your knees. Slide under the bar, racking it across the back of your shoulders. Your shoulder blades should be retracted and the bar tight across your back. Unrack the weight. With your head looking forward, sit back with your butt until you touch your calves. Reverse the motion, returning the torso to an upright position. 	f	{glutes}	{abdominals,hamstrings,"lower back"}	\N	f
64	Decline Dumbbell Bench Press	dumbbell	Secure your legs at the end of the decline bench and lie down with a dumbbell on each hand on top of your thighs. The palms of your hand will be facing each other. Once you are laying down, move the dumbbells in front of you at shoulder width. Once at shoulder width, rotate your wrists forward so that the palms of your hands are facing away from you. This will be your starting position. Bring down the weights slowly to your side as you breathe out. Keep full control of the dumbbells at all times. Tip: Throughout the motion, the forearms should always be perpendicular to the floor. As you breathe out, push the dumbbells up using your pectoral muscles. Lock your arms in the contracted position, squeeze your chest, hold for a second and then start coming down slowly. Tip: It should take at least twice as long to go down than to come up.. Repeat the movement for the prescribed amount of repetitions of your training program. 	f	{chest}	{shoulders,triceps}	\N	f
65	Decline Dumbbell Flyes	dumbbell	Secure your legs at the end of the decline bench and lie down with a dumbbell on each hand on top of your thighs. The palms of your hand will be facing each other. Once you are laying down, move the dumbbells in front of you at shoulder width. The palms of the hands should be facing each other and the arms should be perpendicular to the floor and fully extended. This will be your starting position. With a slight bend on your elbows in order to prevent stress at the biceps tendon, lower your arms out at both sides in a wide arc until you feel a stretch on your chest. Breathe in as you perform this portion of the movement. Tip: Keep in mind that throughout the movement, the arms should remain stationary; the movement should only occur at the shoulder joint. Return your arms back to the starting position as you squeeze your chest muscles and breathe out. Tip: Make sure to use the same arc of motion used to lower the weights. Hold for a second at the contracted position and repeat the movement for the prescribed amount of repetitions. 	f	{chest}	\N	\N	f
66	Wide-Grip Pulldown Behind The Neck	cable	Sit down on a pull-down machine with a wide bar attached to the top pulley. Make sure that you adjust the knee pad of the machine to fit your height. These pads will prevent your body from being raised by the resistance attached to the bar. Grab the bar with the palms facing forward using the prescribed grip. Note on grips: For a wide grip, your hands need to be spaced out at a distance wider than your shoulder width. For a medium grip, your hands need to be spaced out at a distance equal to your shoulder width and for a close grip at a distance smaller than your shoulder width. As you have both arms extended in front of you holding the bar at the chosen grip width, bring your torso and head forward. Think of an imaginary line from the center of the bar down to the back of your neck. This is your starting position. As you breathe out, bring the bar down until it touches the back of your neck by drawing the shoulders and the upper arms down and back. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary and only the arms should move. The forearms should do no other work except for holding the bar; therefore do not try to pull down the bar using the forearms. After a second on the contracted position squeezing your shoulder blades together, slowly raise the bar back to the starting position when your arms are fully extended and the lats are fully stretched. Inhale during this portion of the movement. Repeat this motion for the prescribed amount of repetitions. 	f	{lats}	{biceps,"middle back",shoulders}	\N	f
67	Clean Deadlift	barbell	Begin standing with a barbell close to your shins. Your feet should be directly under your hips with your feet turned out slightly. Grip the bar with a double overhand grip or hook grip, about shoulder width apart. Squat down to the bar. Your spine should be in full extension, with a back angle that places your shoulders in front of the bar and your back as vertical as possible. Begin by driving through the floor through the front of your heels. As the bar travels upward, maintain a constant back angle. Flare your knees out to the side to help keep them out of the bar's path. After the bar crosses the knees, complete the lift by driving the hips into the bar until your hips and knees are extended. 	f	{hamstrings}	{forearms,glutes,"lower back","middle back",quadriceps,traps}	\N	f
68	Olympic Squat	barbell	Begin with a barbell supported on top of the traps. The chest should be up, and the head facing forward. Adopt a hip width stance with the feet turned out as needed. Descend by flexing the knees, refraining from moving the hips back as much as possible. This requires that the knees travel forward; ensure that they stay aligned with the feet. The goal is to keep the torso as upright as possible. Continue all the way down, keeping the weight on the front of the heel. At the moment the upper legs contact the lower, reverse the motion, driving the weight upward. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
69	Stiff-Legged Barbell Deadlift	barbell	Grasp a bar using an overhand grip (palms facing down). You may need some wrist wraps if using a significant amount of weight. Stand with your torso straight and your legs spaced using a shoulder width or narrower stance. The knees should be slightly bent. This is your starting position. Keeping the knees stationary, lower the barbell to over the top of your feet by bending at the hips while keeping your back straight. Keep moving forward as if you were going to pick something from the floor until you feel a stretch on the hamstrings. Inhale as you perform this movement. Start bringing your torso up straight again by extending your hips until you are back at the starting position. Exhale as you perform this movement. Repeat for the recommended amount of repetitions. 	f	{hamstrings}	{glutes,"lower back"}	\N	f
70	Lying High Bench Barbell Curl	barbell	Lie face forward on a tall flat bench while holding a barbell with a supinated grip (palms facing up). Tip: If you are holding a barbell grab it using a shoulder-width grip and if you are using an E-Z Bar grab it on the inner handles. Your upper body should be positioned in a way that the upper chest is over the end of the bench and the barbell is hanging in front of you with the arms extended and perpendicular to the floor. This will be your starting position. While keeping the elbows in and the upper arms stationary, curl the weight up in a semi-circular motion as you contract the biceps and exhale. Hold at the top of the movement for a second. As you inhale, slowly go back to the starting position. Tip: Maintain full control of the weight at all times and avoid any swinging. Remember, only the forearms should move throughout the movement. Repeat for the recommended amount of repetitions. 	t	{biceps}	\N	\N	f
71	Hammer Curls	dumbbell	Stand up with your torso upright and a dumbbell on each hand being held at arms length. The elbows should be close to the torso. The palms of the hands should be facing your torso. This will be your starting position. Now, while holding your upper arm stationary, exhale and curl the weight forward while contracting the biceps. Continue to raise the weight until the biceps are fully contracted and the dumbbell is at shoulder level. Hold the contracted position for a brief moment as you squeeze the biceps. Tip: Focus on keeping the elbow stationary and only moving your forearm. After the brief pause, inhale and slowly begin the lower the dumbbells back down to the starting position. Repeat for the recommended amount of repetitions. 	t	{biceps}	\N	\N	f
72	Press Sit-Up	barbell	To begin, lie down on a bench with a barbell resting on your chest. Position your legs so they are secure on the extension of the abdominal bench. This is the starting position. While inhaling, tighten your abdominals and glutes. Simultaneously curl your torso as you do when performing a sit-up and press the barbell to an overhead position while exhaling. Tip: Use your arms to push the barbell out as you perform this exercise while still focusing on the abdominal muscles. Lower your upper body back down to the starting position while bringing the barbell back down to your torso. Remember to breathe in while lowering the body. Repeat for the recommended amount of repetitions. 	f	{abdominals}	{chest,shoulders,triceps}	\N	f
73	One Leg Barbell Squat	barbell	Start by standing about 2 to 3 feet in front of a flat bench with your back facing the bench. Have a barbell in front of you on the floor. Tip: Your feet should be shoulder width apart from each other. Bend the knees and use a pronated grip with your hands being wider than shoulder width apart from each other to lift the barbell up until you can rest it on your chest. Then lift the barbell over your head and rest it on the base of your neck. Move one foot back so that your toe is resting on the flat bench. Your other foot should be stationary in front of you. Keep your head up at all times as looking down will get you off balance and also maintain a straight back. Tip: Make sure your back is straight and chest is out while performing this exercise. As you inhale, slowly lower your leg until your thigh is parallel to the floor. At this point, your knee should be over your toes. Your chest should be directly above the middle of your thigh. Leading with the chest and hips and contracting the quadriceps, elevate your leg back to the starting position as you exhale. Repeat for the recommended amount of repetitions. Switch legs and repeat the movement. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
74	Hug Knees To Chest	none	Lie down on your back and pull both knees up to your chest. Hold your arms under the knees, not over (that would put to much pressure on your knee joints). Slowly pull the knees toward your shoulders. This also stretches your buttocks muscles. 	f	{"lower back"}	{glutes}	\N	f
75	Ab Roller	other	Hold the Ab Roller with both hands and kneel on the floor. Now place the ab roller on the floor in front of you so that you are on all your hands and knees (as in a kneeling push up position). This will be your starting position. Slowly roll the ab roller straight forward, stretching your body into a straight position. Tip: Go down as far as you can without touching the floor with your body. Breathe in during this portion of the movement. After a pause at the stretched position, start pulling yourself back to the starting position as you breathe out. Tip: Go slowly and keep your abs tight at all times. 	f	{abdominals}	{shoulders}	\N	f
76	Cross Over - With Bands	bands	Secure an exercise band around a stationary post. While facing away from the post, grab the handles on both ends of the band and step forward enough to create tension on the band. Raise your arms to the sides, parallel to the floor, perpendicular to your torso (your torso and the arms should resemble the letter "T") and with the palms facing forward. Have them extended with a slight bend at the elbows. This will be your starting position. While keeping your arms straight, bring them across your chest in a semicircular motion to the front as you exhale and flex your pecs. Hold the contraction for a second. Slowly return to the starting position as you inhale. Perform for the recommended amount of repetitions. 	f	{chest}	{biceps,shoulders}	\N	f
77	Posterior Tibialis Stretch	other	In a seated position, loop a belt, rope, or band around one foot. This will be your starting position. With the leg extended and the heel off of the ground, pull on the belt so that the foot is everted, with the outside of the foot being pulled towards you. Hold for 10-20 seconds, and then switch sides. 	f	{calves}	\N	\N	f
78	V-Bar Pulldown	cable	Sit down on a pull-down machine with a V-Bar attached to the top pulley. Adjust the knee pad of the machine to fit your height. These pads will prevent your body from being raised by the resistance attached to the bar. Grab the V-bar with the palms facing each other (a neutral grip). Stick your chest out and lean yourself back slightly (around 30-degrees) in order to better engage the lats. This will be your starting position. Using your lats, pull the bar down as you squeeze your shoulder blades. Continue until your chest nearly touches the V-bar. Exhale as you execute this motion. Tip: Keep the torso stationary throughout the movement. After a second hold on the contracted position, slowly bring the bar back to the starting position as you breathe in. Repeat for the prescribed number of repetitions. 	f	{lats}	{biceps,"middle back",shoulders}	\N	f
79	Oblique Crunches	body only	Lie flat on the floor with your lower back pressed to the ground. For this exercise, you will need to put one hand beside your head and the other to the side against the floor. Make sure your feet are elevated and resting on a flat surface. Now lift the shoulder in which your hand is touching your head. Simply elevate your shoulder and body upward until you touch your knee. For example, if you have your right hand besides your head, then you want to elevate your body upwards until your right elbow touches your left knee. The same variation can be applied doing the inverse and using your left elbow to touch your right knee. After your knee touches your elbow, lower your body until you have reached the starting position. Remember to breathe in during the eccentric (lowering) part of the exercise and to breathe out during the concentric (upward) part of the exercise. Continue alternating in this manner until all of the recommended repetitions for each side have been completed. 	t	{abdominals}	\N	\N	f
80	Reverse Plate Curls	other	Start by standing straight with a weighted plate held by both hands and arms fully extended. Use a pronated grip (palms facing down) and make sure your fingers grab the rough side of the plate while your thumb grabs the smooth side. Note: For the best results, grab the weighted plate at an 11:00 and 1:00 o'clock position. Your feet should be shoulder width apart from each other and the weighted plate should be near the groin area. This is the starting position. Slowly lift the plate up while keeping the elbows in and the upper arms stationary until your biceps and forearms touch while exhaling. The plate should be evenly aligned with your torso at this point. Feel the contraction for a second and begin to lower the weight back down to the starting position while inhaling Repeat for the recommended amount of repetitions. 	t	{biceps}	{forearms}	\N	f
81	Kneeling Cable Crunch With Alternating Oblique Twists	cable	Connect a rope attachment to a high pulley cable and position a mat on the floor in front of it. Grab the rope with both hands and kneel approximately two feet back from the tower. Position the rope behind your head with your hands by your ears. Keep your hands in the same place, contract your abs and pull downward on the rope in a crunching movement until your elbows reach your knees. Pause briefly at the bottom and rise up in a slow and controlled manner until you reach the starting position. Repeat the same downward movement until you're halfway down, at which time you'll begin rotating one of your elbows to the opposite knee. Again, pause briefly at the bottom and rise up in a slow and controlled manner until you reach the starting position. Repeat the same movement as before, but alternate the other elbow to the opposite knee. Continue this series of movements to failure. 	t	{abdominals}	\N	\N	f
82	Air Bike	body only	Lie flat on the floor with your lower back pressed to the ground. For this exercise, you will need to put your hands beside your head. Be careful however to not strain with the neck as you perform it. Now lift your shoulders into the crunch position. Bring knees up to where they are perpendicular to the floor, with your lower legs parallel to the floor. This will be your starting position. Now simultaneously, slowly go through a cycle pedal motion kicking forward with the right leg and bringing in the knee of the left leg. Bring your right elbow close to your left knee by crunching to the side, as you breathe out. Go back to the initial position as you breathe in. Crunch to the opposite side as you cycle your legs and bring closer your left elbow to your right knee and exhale. Continue alternating in this manner until all of the recommended repetitions for each side have been completed. 	f	{abdominals}	\N	\N	f
83	Suspended Row	other	Suspend your straps at around chest height. Take a handle in each hand and lean back. Keep your body erect and your head and chest up. Your arms should be fully extended. This will be your starting position. Begin by flexing the elbow to initiate the movement. Protract your shoulder blades as you do so. At the completion of the motion pause, and then return to the starting position. 	f	{"middle back"}	{biceps,lats}	\N	f
84	Front Squat (Clean Grip)	barbell	To begin, first set the bar in a rack slightly below shoulder level. Rest the bar on top of the deltoids, pushing into the clavicles, and lightly touching the throat. Your hands should be in a clean grip, touching the bar only with your fingers to help keep it in position. Lift the bar off the rack by first pushing with your legs and at the same time straightening your torso. Step away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head and elbows up at all times. This will be your starting position. Bend at the knees, sitting down between your legs. Continue down until your hamstrings are on your calves. Keep your knees aligned with your feet by consciously using your abductors to push your knees out as you squat. Begin to raise the bar as you exhale by pushing the floor mainly with the heel or middle of your foot as you straighten the legs again and return to the starting position. 	f	{quadriceps}	{abdominals,glutes,hamstrings}	\N	f
85	Seated Palms-Down Barbell Wrist Curl	barbell	Hold a barbell with both hands and your palms facing down; hands spaced about shoulder width. Place your feet flat on the floor, at a distance that is slightly wider than shoulder width apart. Lean forward and place your forearms on top of your upper thighs with your palms down. Tip: Make sure that the back of the wrists lay on top of your knees. This will be your starting position. Lower the bar as far as possible while inhaling and keeping a tight grip. Now curl bar up as high as possible while flexing the forearms and exhaling. Hold the contraction at the top for a second and Tip: Only the wrist should move. 	t	{forearms}	\N	\N	f
86	Leg Extensions	machine	For this exercise you will need to use a leg extension machine. First choose your weight and sit on the machine with your legs under the pad (feet pointed forward) and the hands holding the side bars. This will be your starting position. Tip: You will need to adjust the pad so that it falls on top of your lower leg (just above your feet). Also, make sure that your legs form a 90-degree angle between the lower and upper leg. If the angle is less than 90-degrees then that means the knee is over the toes which in turn creates undue stress at the knee joint. If the machine is designed that way, either look for another machine or just make sure that when you start executing the exercise you stop going down once you hit the 90-degree angle. Using your quadriceps, extend your legs to the maximum as you exhale. Ensure that the rest of the body remains stationary on the seat. Pause a second on the contracted position. Slowly lower the weight back to the original position as you inhale, ensuring that you do not go past the 90-degree angle limit. Repeat for the recommended amount of times. 	t	{quadriceps}	\N	\N	f
391	Peroneals-SMR	foam roll	Lay on your side, supporting your weight on your forearm and on a foam roller placed on the outside of your lower leg. Your upper leg can either be on top of your lower leg, or you can cross it in front of you. This will be your starting position. Raise your hips off of the ground and begin to roll from below the knee to above the ankle on the side of your leg, pausing at points of tension for 10-30 seconds. Repeat on the other leg. 	f	{calves}	\N	\N	f
87	Front Barbell Squat	barbell	This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack that best matches your height. Once the correct height is chosen and the bar is loaded, bring your arms up under the bar while keeping the elbows high and the upper arm slightly above parallel to the floor. Rest the bar on top of the deltoids and cross your arms while grasping the bar for total control. Lift the bar off the rack by first pushing with your legs and at the same time straightening your torso. Step away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times as looking down will get you off balance and also maintain a straight back. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances described in the foot positioning section). Begin to slowly lower the bar by bending the knees as you maintain a straight posture with the head up. Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees (which is the point in which the upper legs are below parallel to the floor). Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly. Begin to raise the bar as you exhale by pushing the floor mainly with the middle of your foot as you straighten the legs again and go back to the starting position. Repeat for the recommended amount of repetitions. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
88	One-Arm Incline Lateral Raise	dumbbell	Lie down sideways on an incline bench press with a dumbbell in the hand. Make sure the shoulder is pressing against the incline bench and the arm is lying across your body with the palm around your navel. Hold a dumbbell in your uppermost arm while keeping it extended in front of you parallel to the floor. This is your starting position. While keeping the dumbbell parallel to the floor at all times, perform a lateral raise. Your arm should travel straight up until it is pointing at the ceiling. Tip: Exhale as you perform this movement. Hold the dumbbell in the position and feel the contraction in the shoulders for a second. While inhaling lower the weight across your body back into the starting position. Repeat the movement for the prescribed amount of repetitions. Switch arms and repeat the movement. 	t	{shoulders}	\N	\N	f
89	Hang Snatch	barbell	Begin with a wide grip on the bar, with an overhand or hook grip. The feet should be directly below the hips with the feet turned out. Your knees should be slightly bent, and the torso inclined forward. The spine should be fully extended and the head facing forward. The bar should be at the hips. This will be your starting position. Aggressively extend through the legs and hips. At peak extension, shrug the shoulders and allow the elbows to flex to the side. As you move your feet into the receiving position, forcefully pull yourself below the bar as you elevate the bar overhead. Receive the bar with your body as low as possible and the arms fully extended overhead. Return to a standing position with the weight overhead. Follow by returning the weight to the ground under control. 	f	{hamstrings}	{abdominals,calves,forearms,glutes,"lower back",quadriceps,shoulders,traps}	\N	f
90	Alternating Hang Clean	kettlebells	Place two kettlebells between your feet. To get in the starting position, push your butt back and look straight ahead. Clean one kettlebell to your shoulder and hold on to the other kettlebell in a hanging position. Clean the kettlebell to your shoulder by extending through the legs and hips as you pull the kettlebell towards your shoulders. Rotate your wrist as you do so. Lower the cleaned kettlebell to a hanging position and clean the alternate kettlebell. Repeat. 	f	{hamstrings}	{biceps,calves,forearms,glutes,"lower back",traps}	\N	f
91	Cable Lying Triceps Extension	cable	Lie on a flat bench and grasp the straight bar attachment of a low pulley with a narrow overhand grip. Tip: The easiest way to do this is to have someone hand you the bar as you lay down. With your arms extended, position the bar over your torso. Your arms and your torso should create a 90-degree angle. This will be your starting position. Lower the bar by bending at the elbow while keeping the upper arms stationary and elbows in. Go down until the bar lightly touches your forehead. Breathe in as you perform this portion of the movement. Flex the triceps as you lift the bar back to its starting position. Exhale as you perform this portion of the movement. Hold for a second at the contracted position and repeat for the recommended amount of repetitions. 	t	{triceps}	\N	\N	f
92	Quad Stretch	other	Lay on your side. Loop a belt, rope, or band around your top foot. Flex the knee and extend your hip, attempting to touch your glutes with your foot, and holding the belt with your hands. This will be your starting position. With the belt being held over the shoulder or overhead, gently pull to increase the stretch in the quadriceps. Hold for 10-20 seconds, and then switch sides. 	f	{quadriceps}	\N	\N	f
93	Glute Ham Raise	machine	Begin by adjusting the equipment to fit your body. Place your feet against the footplate in between the rollers as you lie facedown. Your knees should be just behind the pad. Start from the bottom of the movement. Keep your back arched as you begin the movement by flexing the knees. Drive your toes into the foot plate as you do so. Keep your upper body straight, and continue until your body is upright. Return to the starting position, keeping your descent under control. 	f	{hamstrings}	{calves,glutes}	\N	f
94	Axle Deadlift	other	Approach the bar so that it is centered over your feet. You feet should be about hip width apart. Bend at the hip to grip the bar at shoulder width, allowing your shoulder blades to protract. Typically, you would use an over/under grip. With your feet and your grip set, take a big breath and then lower your hips and flex the knees until your shins contact the bar. Look forward with your head, keep your chest up and your back arched, and begin driving through the heels to move the weight upward. After the bar passes the knees, aggressively pull the bar back, pulling your shoulder blades together as you drive your hips forward into the bar. Lower the bar by bending at the hips and guiding it to the floor. 	f	{"lower back"}	{forearms,glutes,hamstrings,"middle back",quadriceps,traps}	\N	f
95	Speed Band Overhead Triceps	bands	For this exercise anchor a band to the ground. We used an incline bench and anchored the band to the base, standing over the bench. Alternatively, this could be performed standing on the band. To begin, pull the band behind your head, holding it with a pronated grip and your elbows up. This will be your starting position. To perform the movement, extend through the elbow to to straighten your arms, ensuring that you keep your upper arm in place. Pause, and then return to the starting position. 	t	{triceps}	\N	\N	f
97	Hyperextensions With No Hyperextension Bench	body only	With someone holding down your legs, slide yourself down to the edge a flat bench until your hips hang off the end of the bench. Tip: Your entire upper body should be hanging down towards the floor. Also, you will be in the same position as if you were on a hyperextension bench but the range of motion will be shorter due to the height of the flat bench vs. that of the hyperextension bench. With your body straight, cross your arms in front of you (my preference) or behind your head. This will be your starting position. Tip: You can also hold a weight plate for extra resistance in front of you under your crossed arms. Start bending forward slowly at the waist as far as you can while keeping your back flat. Inhale as you perform this movement. Keep moving forward until you almost touch the floor or you feel a nice stretch on the hamstrings (whichever comes first). Tip: Never round the back as you perform this exercise. Slowly raise your torso back to the initial position as you exhale. Tip: Avoid the temptation to arch your back past a straight line. Also, do not swing the torso at any time in order to protect the back from injury. Repeat for the recommended amount of repetitions. 	f	{"lower back"}	{glutes,hamstrings}	\N	f
98	Dumbbell Squat To A Bench	dumbbell	Stand up straight with a flat bench behind you while holding a dumbbell on each hand (palms facing the side of your legs). Position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times as looking down will get you off balance and also maintain a straight back. This will be your starting position. Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances discussed in the foot stances section. Begin to slowly lower your torso by bending the knees as you maintain a straight posture with the head up. Continue down until you slightly touch the bench behind you. Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly. Begin to raise the bar as you exhale by pushing the floor with the heel of your foot mainly as you straighten the legs again and go back to the starting position. Repeat for the recommended amount of repetitions. 	f	{quadriceps}	{calves,glutes,hamstrings,"lower back"}	\N	f
99	Knee Across The Body	none	Lie down on the floor with your right leg straight. Bend your left leg and lower it across your body, holding the knee down toward the floor with your right hand. (The knee doesn't need to touch the floor if you're tight.) Place your left arm comfortably beside you and turn your head to the left. Imagine you have a weight tied to your tailbone. let your tailbone fall back toward the floor as your chest reaches in the opposite direction to stretch your lower back. Switch sides. 	f	{glutes}	{abductors,"lower back"}	\N	f
100	Suspended Reverse Crunch	other	Secure a set of suspension straps with the handles hanging about a foot off of the ground. Move yourself into a pushup plank position facing away from the rack. Place your feet into the handles. You should maintain a straight posture, not allowing the hips to sag. This will be your starting position. Begin the movement by flexing the knees and hips, drawing the knees to your torso. As you do so, anteriorly tilt your pelvis, allowing your spine to flex. At the top of the controlled motion, return to the starting position. 	t	{abdominals}	\N	\N	f
101	Crunch - Hands Overhead	body only	Lie on the floor with your back flat and knees bent with around a 60-degree angle between the hamstrings and the calves. Keep your feet flat on the floor and stretch your arms overhead with your palms crossed. This will be your starting position. Curl your upper body forward and bring your shoulder blades just off the floor. At all times, keep your arms aligned with your head, neck and shoulder. Don't move them forward from that position. Exhale as you perform this portion of the movement and hold the contraction for a second. Slowly lower down to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	t	{abdominals}	\N	\N	f
102	Bicycling, Stationary	machine	To begin, seat yourself on the bike and adjust the seat to your height. Select the desired option from the menu. You may have to start pedaling to turn it on. You can use the manual setting, or you can select a program to use. Typically, you can enter your age and weight to estimate the amount of calories burned during exercise. The level of resistance can be changed throughout the workout. The handles can be used to monitor your heart rate to help you stay at an appropriate intensity. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
103	Lying Triceps Press	e-z curl bar	Lie on a flat bench with either an e-z bar (my preference) or a straight bar placed on the floor behind your head and your feet on the floor. Grab the bar behind you, using a medium overhand (pronated) grip, and raise the bar in front of you at arms length. Tip: The arms should be perpendicular to the torso and the floor. The elbows should be tucked in. This is the starting position. As you breathe in, slowly lower the weight until the bar lightly touches your forehead while keeping the upper arms and elbows stationary. At that point, use the triceps to bring the weight back up to the starting position as you breathe out. Repeat for the recommended amount of repetitions. 	t	{triceps}	\N	\N	f
104	Split Squat with Dumbbells	dumbbell	Position yourself into a staggered stance with the rear foot elevated and front foot forward. Hold a dumbbell in each hand, letting them hang at the sides. This will be your starting position. Begin by descending, flexing your knee and hip to lower your body down. Maintain good posture througout the movement. Keep the front knee in line with the foot as you perform the exercise. At the bottom of the movement, drive through the heel to extend the knee and hip to return to the starting position. 	f	{quadriceps}	{glutes,hamstrings}	\N	f
105	Depth Jump Leap	other	For this drill you will need two boxes or benches, one 12 to 16 inches high and the other 22 to 26 inches high. Stand on one of the two boxes with arms at the sides; feet should be together and slightly off the edge as in the depth jump. Place the other box approximately two or three feet in front of and facing the performer. Begin by dropping off the initial box, landing and simultaneously taking off with both feet. Rebound by driving upward and outward as intensely as possible, using the arms and full extension of the body to jump onto the higher box. Again, allow the legs to absorb the impact. 	f	{quadriceps}	{abductors,adductors,calves,glutes,hamstrings}	\N	f
474	Goblet Squat	kettlebells	Stand holding a light kettlebell by the horns close to your chest. This will be your starting position. Squat down between your legs until your hamstrings are on your calves. Keep your chest and head up and your back straight. At the bottom position, pause and use your elbows to push your knees out. Return to the starting position, and repeat for 10-20 repetitions. 	f	{quadriceps}	{calves,glutes,hamstrings,shoulders}	\N	f
106	Weighted Ball Hyperextension	exercise ball	To begin, lie down on an exercise ball with your torso pressing against the ball and parallel to the floor. The ball of your feet should be pressed against the floor to help keep you balanced. Place a weighted plate under your chin or behind your neck. This is the starting position. Slowly raise your torso up by bending at the waist and lower back. Remember to exhale during this movement. Hold the contraction on your lower back for a second and lower your torso back down to the starting position while inhaling. Repeat for the recommended amount of repetitions prescribed in your program. 	f	{"lower back"}	{glutes,hamstrings,"middle back"}	\N	f
107	On-Your-Back Quad Stretch	other	Lie on a flat bench or step, and hang one leg and arm over the side. Bend the knee and hold the top of the foot. As you do this, be careful not to arch your lower back. Pull the belly button to the spine to stay in neutral. Press your foot down and into your hand. To add the hip stretch, lift the hip of the leg you're holding up toward the ceiling. Switch sides. 	t	{quadriceps}	\N	\N	f
108	Incline Dumbbell Bench With Palms Facing In	dumbbell	Lie back on an incline bench with a dumbbell on each hand on top of your thighs. The palms of your hand will be facing each other. By using your thighs to help you get the dumbbells up, clean the dumbbells one arm at a time so that you can hold them at shoulder width. Once at shoulder width, keep the palms of your hands with a neutral grip (palms facing each other). Keep your elbows flared out with the upper arms in line with the shoulders (perpendicular to the torso) and the elbows bent creating a 90-degree angle between the upper arm and the forearm. This will be your starting position. Now bring down the weights slowly to your side as you breathe in. Keep full control of the dumbbells at all times. As you breathe out, push the dumbbells up using your pectoral muscles. Lock your arms in the contracted position, hold for a second and then start coming down slowly. Tip: It should take at least twice as long to go down than to come up. Repeat the movement for the prescribed amount of repetitions. When you are done, place the dumbbells back in your thighs and then on the floor. This is the safest manner to dispose of the dumbbells. 	f	{chest}	{shoulders,triceps}	\N	f
109	Middle Back Shrug	dumbbell	Lie facedown on an incline bench while holding a dumbbell in each hand. Your arms should be fully extended hanging down and pointing towards the floor. The palms of your hands should be facing each other. This will be your starting position. As you exhale, squeeze your shoulder blades together and hold the contraction for a full second. Tip: This movement is just like the reverse action of a hug, or trying to perform rear laterals as if you had no arms. As you inhale go back to the starting position. Repeat for the recommended amount of repetitions. 	t	{"middle back"}	\N	\N	f
110	Muscle Up	other	Grip the rings using a false grip, with the base of your palms on top of the rings. Initiate a pull up by pulling the elbows down to your side, flexing the elbows. As you reach the top position of the pull-up, pull the rings to your armpits as you roll your shoulders forward, allowing your elbows to move straight back behind you. This puts you into the proper position to continue into the dip portion of the movement. Maintaining control and stability, extend through the elbow to complete the motion. Use care when lowering yourself to the ground. 	f	{lats}	{abdominals,biceps,forearms,"middle back",shoulders,traps,triceps}	\N	f
111	Recumbent Bike	machine	To begin, seat yourself on the bike and adjust the seat to your height. Select the desired option from the menu. You may have to start pedaling to turn it on. You can use the manual setting, or you can select a program to use. Typically, you can enter your age and weight to estimate the amount of calories burned during exercise. The level of resistance can be changed throughout the workout. The handles can be used to monitor your heart rate to help you stay at an appropriate intensity. Recumbent bikes offer convenience, cardiovascular benefits, and have less impact than other activities. A 150 lb person will burn about 230 calories cycling at a moderate rate for 30 minutes, compared to 450 calories or more running. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
112	Push Press	barbell	Start with your feet shoulder-width apart, holding the barbell at shoulder height with your elbows slightly forward and core engaged. Perform a slight dip by bending your knees, then explosively extend your legs while pressing the bar overhead in one smooth motion. Lock out your arms fully at the top, ensuring stability before lowering the bar back to your shoulders under control. Reset and repeat for the next rep.	f	{shoulders}	{quadriceps,triceps}	\N	f
113	Hip Flexion with Band	bands	Secure one end of the band to the lower portion of a post and attach the other to one ankle. Face away from the attachment point of the band. Keeping your head and your chest up, raise your knee up to 90 degrees and pause. Return the leg to the starting position. 	f	{quadriceps}	\N	\N	f
114	Rickshaw Deadlift	other	Load the frame with the desired weight. Center yourself between the handles. You feet should be about hip width apart. Bend at the hips to grip the handles, allowing your shoulder blades to protract. With your feet and your grip set, take a big breath and then lower your hips and flex the knees. Look forward with your head, keep your chest up and your back arched, and begin driving through the heels to move the weight upward. As the weight comes up, pull your shoulder blades together as you drive your hips forward. Lower the weight by bending at the hips and guiding it to the ground. 	f	{quadriceps}	{forearms,glutes,hamstrings,"lower back",traps}	\N	f
115	Triceps Stretch	none	Reach your hand behind your head, grasp your elbow and gently pull. Hold for 10 to 20 seconds, then switch sides. 	t	{triceps}	{lats}	\N	f
116	Split Squats	none	Being in a standing position. Jump into a split leg position, with one leg forward and one leg back, flexing the knees and lowering your hips slightly as you do so. As you descend, immediately reverse direction, standing back up and jumping, reversing the position of your legs. Repeat 5-10 times on each leg. 	f	{hamstrings}	{calves,glutes,quadriceps}	\N	f
117	Standing Lateral Stretch	none	Take a slightly wider than hip distance stance with your knees slightly bent. Place your right hand on your right hip to support the spine. Raise your left arm in a vertical line and place your left hand behind your head. Keep it there as you incline your torso to the right. Keep your weight evenly distributed between both legs (don't lean into your left hip). Switch sides. 	f	{abdominals}	\N	\N	f
118	Drop Push	other	Position low boxes or other platforms 2-3 feet apart. Move to a pushup position between them, supporting yourself by placing your hands on the boxes. With good posture, drop from the platforms by pressing up and moving your hands to shoulder width, cushioning your landing by absorbing the impact through the arm. 	f	{chest}	{shoulders,triceps}	\N	f
119	Power Clean from Blocks	barbell	With a barbell on boxes of the desired height, take a grip just outside the legs. Lower your hips with the weight focused on the heels, back straight, head facing forward, chest up, with your shoulders just in front of the bar. This will be your starting position. Begin the first pull by driving through the heels, extending your knees. Your back angle should stay the same, and your arms should remain straight. As the bar approaches the mid-thigh position, begin extending through the hips. In a jumping motion, accelerate by extending the hips, knees, and ankles, using speed to move the bar upward. There should be no need to actively pull through the arms to accelerate the weight. At the end of the second pull, the body should be fully extended, leaning slightly back, with the arms still extended. As full extension is achieved, transition into the third pull by aggressively shrugging and flexing the arms with the elbows up and out. At peak extension, pull yourself under the bar far enough that it can be racked onto the shoulders, rotating your elbows under the bar as you do so. The bar should be racked onto the protracted shoulders, lightly touching the throat with the hands relaxed. Immediately recover by driving through the heels, keeping the torso upright and elbows up. Continue until you have risen to a standing position, and complete the repetition by returning the weight to the boxes. 	f	{hamstrings}	{quadriceps}	\N	f
120	Barbell Glute Bridge	barbell	Begin seated on the ground with a loaded barbell over your legs. Using a fat bar or having a pad on the bar can greatly reduce the discomfort caused by this exercise. Roll the bar so that it is directly above your hips, and lay down flat on the floor. Begin the movement by driving through with your heels, extending your hips vertically through the bar. Your weight should be supported by your upper back and the heels of your feet. Extend as far as possible, then reverse the motion to return to the starting position. 	f	{glutes}	{calves,hamstrings}	\N	f
121	Seated Calf Stretch	none	Sit up straight on an exercise mat. Bend one knee and put that foot on the floor to stabilize the torso. Straighten your other leg and flex your ankle. Using a band, towel, or your hand if you can reach, pull the toes toward you. Hold for 10 to 20 seconds, then switch sides. 	f	{calves}	{hamstrings,"lower back"}	\N	f
122	Reverse Hyperextension	machine	Place your feet between the pads after loading an appropriate weight. Lay on the top pad, allowing your hips to hang off the back, while grasping the handles to hold your position. To begin the movement, flex the hips, pulling the legs forward. Reverse the motion by extending the hips, kicking the leg back. It is very important not to over-extend the hip on this movement, stopping short of your full range of motion. Return by again flexing the hip, pulling the carriage forward as far as you can. Repeat for the desired number of repetitions. 	f	{hamstrings}	{calves,glutes}	\N	f
123	Lying Cable Curl	cable	Grab a straight bar or E-Z bar attachment that is attached to the low pulley with both hands, using an underhand (palms facing up) shoulder-width grip. Lie flat on your back on top of an exercise mat in front of the weight stack with your feet flat against the frame of the pulley machine and your legs straight. With your arms extended and your elbows close to your body slightly bend your arms. This will be your starting position. While keeping your upper arms stationary and the elbows close to your body, curl the bar up slowly toward your chest as you breathe out and you squeeze the biceps. After a second squeeze at the top of the movement, slowly return to the starting position. Repeat for the recommended amount of repetitions. 	t	{biceps}	\N	\N	f
124	Skating	other	Roller skating is a fun activity which can be effective in improving cardiorespiratory fitness and muscular endurance. It requires relatively good balance and coordination. It is necessary to learn the basics of skating including turning and stopping and to wear protective gear to avoid possible injury. You can skate at a comfortable pace for 30 minutes straight. If you want a cardio challenge, do interval skating — speed skate two minutes of every five minutes, using the remaining three minutes to recover. A 150 lb person will typically burn about 175 calories in 30 minutes skating at a comfortable pace, similar to brisk walking. 	f	{quadriceps}	{abductors,adductors,calves,glutes,hamstrings}	\N	f
125	Mountain Climbers	none	Begin in a pushup position, with your weight supported by your hands and toes. Flexing the knee and hip, bring one leg until the knee is approximately under the hip. This will be your starting position. Explosively reverse the positions of your legs, extending the bent leg until the leg is straight and supported by the toe, and bringing the other foot up with the hip and knee flexed. Repeat in an alternating fashion for 20-30 seconds. 	f	{quadriceps}	{chest,hamstrings,shoulders}	\N	f
126	Seated Cable Rows	cable	For this exercise you will need access to a low pulley row machine with a V-bar. Note: The V-bar will enable you to have a neutral grip where the palms of your hands face each other. To get into the starting position, first sit down on the machine and place your feet on the front platform or crossbar provided making sure that your knees are slightly bent and not locked. Lean over as you keep the natural alignment of your back and grab the V-bar handles. With your arms extended pull back until your torso is at a 90-degree angle from your legs. Your back should be slightly arched and your chest should be sticking out. You should be feeling a nice stretch on your lats as you hold the bar in front of you. This is the starting position of the exercise. Keeping the torso stationary, pull the handles back towards your torso while keeping the arms close to it until you touch the abdominals. Breathe out as you perform that movement. At that point you should be squeezing your back muscles hard. Hold that contraction for a second and slowly go back to the original position while breathing in. Repeat for the recommended amount of repetitions. 	f	{"middle back"}	{biceps,lats,shoulders}	\N	f
127	Machine Shoulder (Military) Press	machine	Sit down on the Shoulder Press Machine and select the weight. Grab the handles to your sides as you keep the elbows bent and in line with your torso. This will be your starting position. Now lift the handles as you exhale and you extend the arms fully. At the top of the position make sure that you hold the contraction for a second. Lower the handles slowly back to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	f	{shoulders}	{triceps}	\N	f
128	Kneeling Hip Flexor	none	Kneel on a mat and bring your right knee up so the bottom of your foot is on the floor and extend your left leg out behind you so the top of your foot is on the floor. Shift your weight forward until you feel a stretch in your hip. Hold for 15 seconds, then repeat for your other side. 	t	{quadriceps}	{quadriceps}	\N	f
129	Battling Ropes	other	For this exercise you will need a heavy rope anchored at its center 15-20 feet away. Standing in front of the rope, take an end in each hand with your arms extended at your side. This will be your starting position. Initiate the movement by rapidly raising one arm to shoulder level as quickly as you can. As you let that arm drop to the starting position, raise the opposite side. Continue alternating your left and right arms, whipping the ropes up and down as fast as you can. 	f	{shoulders}	{chest,forearms}	\N	f
130	One Arm Supinated Dumbbell Triceps Extension	dumbbell	Lie flat on a bench while holding a dumbbell at arms length. Your arm should be perpendicular to your body. The palm of your hand should be facing towards your face as a supinated grip is required to perform this exercise. Place your non lifting hand on your bicep for support. Slowly begin to lower the dumbbell down as you breathe in. Then, begin lifting the dumbbell upward as you contract the triceps. Remember to breathe out during the concentric (lifting part of the exercise). Repeat until you have performed your set repetitions. Switch arms and repeat the movement. Switch arms again and repeat the movement. 	t	{triceps}	\N	\N	f
131	Hip Extension with Bands	bands	Secure one end of the band to the lower portion of a post and attach the other to one ankle. Facing the attachment point of the band, hold on to the column to stabilize yourself. Keeping your head and your chest up, move the resisted leg back as far as you can while keeping the knee straight. Return the leg to the starting position. 	f	{glutes}	{hamstrings}	\N	f
132	Box Jump (Multiple Response)	other	Assume a relaxed stance facing the box or platform approximately an arm's length away. Arms should be down at the sides and legs slightly bent. Using the arms to aid in the initial burst, jump upward and forward, landing with feet simultaneously on top of the box or platform. Immediately drop or jump back down to the original starting place; then repeat the sequence. 	f	{hamstrings}	{abductors,adductors,calves,glutes,quadriceps}	\N	f
133	Barbell Incline Shoulder Raise	barbell	Lie back on an Incline Bench. Using a medium width grip (a grip that is slightly wider than shoulder width), lift the bar from the rack and hold it straight over you with your arms straight. This will be your starting position. While keeping the arms straight, lift the bar by protracting your shoulder blades, raising the shoulders from the bench as you breathe out. Bring back the bar to the starting position as you breathe in. Repeat for the recommended amount of repetitions. 	f	{shoulders}	{chest}	\N	f
134	Supine Two-Arm Overhead Throw	medicine ball	Lay on the ground on your back with your knees bent. Hold the ball with both hands, extending the arms fully behind your head. This will be your starting position. Initiate the movement at the shoulder, throwing the ball directly forward of you as you sit up, attempting to go for maximum distance. The ball can be thrown to a partner or bounced off of a wall. 	f	{abdominals}	{chest,lats,shoulders}	\N	f
135	Upright Cable Row	cable	Grasp a straight bar cable attachment that is attached to a low pulley with a pronated (palms facing your thighs) grip that is slightly less than shoulder width. The bar should be resting on top of your thighs. Your arms should be extended with a slight bend at the elbows and your back should be straight. This will be your starting position. Use your side shoulders to lift the cable bar as you exhale. The bar should be close to the body as you move it up. Continue to lift it until it nearly touches your chin. Tip: Your elbows should drive the motion. As you lift the bar, your elbows should always be higher than your forearms. Also, keep your torso stationary and pause for a second at the top of the movement. Lower the bar back down slowly to the starting position. Inhale as you perform this portion of the movement. Repeat for the recommended amount of repetitions. 	f	{traps}	{shoulders}	\N	f
136	Knee Tuck Jump	body only	Begin in a comfortable standing position with your knees slightly bent. Hold your hands in front of you, palms down with your fingertips together at chest height. This will be your starting position. Rapidly dip down into a quarter squat and immediately explode upward. Drive the knees towards the chest, attempting to touch them to the palms of the hands. Jump as high as you can, raising your knees up, and then ensure a good land be re-extending your legs, absorbing impact through be allowing the knees to rebend. 	f	{hamstrings}	{abductors,adductors,calves,glutes,quadriceps}	\N	f
137	Isometric Neck Exercise - Sides	body only	With your head and neck in a neutral position (normal position with head erect facing forward), place your left hand on the left side of your head. Now gently push towards the left as you contract the left neck muscles but resisting any movement of your head. Start with slow tension and increase slowly. Keep breathing normally as you execute this contraction. Hold for the recommended number of seconds. Now release the tension slowly. Rest for the recommended amount of time and repeat with your right hand placed on the right side of your head. 	t	{neck}	\N	\N	f
138	Upward Stretch	none	Extend both hands straight above your head, palms touching. Slowly push your hands up and back, keeping your back straight. 	f	{shoulders}	{chest,lats}	\N	f
139	Narrow Stance Squats	barbell	This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack that best matches your height. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it. Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso. Step away from the rack and position your legs using a less-than-shoulder-width narrow stance with the toes slightly pointed out. Feet should be around 3-6 inches apart. Keep your head up at all times (looking down will get you off balance) and maintain a straight back. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances discussed in the foot stances section). Begin to slowly lower the bar by bending the knees as you maintain a straight posture with the head up. Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees (which is the point in which the upper legs are below parallel to the floor). Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly. Begin to raise the bar as you exhale by pushing the floor with the heel of your foot mainly as you straighten the legs again and go back to the starting position. Repeat for the recommended amount of repetitions. 	f	{quadriceps}	{calves,glutes,hamstrings,"lower back"}	\N	f
140	Incline Dumbbell Press	dumbbell	Lie back on an incline bench with a dumbbell in each hand atop your thighs. The palms of your hands will be facing each other. Then, using your thighs to help push the dumbbells up, lift the dumbbells one at a time so that you can hold them at shoulder width. Once you have the dumbbells raised to shoulder width, rotate your wrists forward so that the palms of your hands are facing away from you. This will be your starting position. Be sure to keep full control of the dumbbells at all times. Then breathe out and push the dumbbells up with your chest. Lock your arms at the top, hold for a second, and then start slowly lowering the weight. Tip Ideally, lowering the weights should take about twice as long as raising them. Repeat the movement for the prescribed amount of repetitions. When you are done, place the dumbbells back on your thighs and then on the floor. This is the safest manner to release the dumbbells. 	f	{chest}	{shoulders,triceps}	\N	f
141	Bent Over Two-Dumbbell Row With Palms In	dumbbell	With a dumbbell in each hand (palms facing each other), bend your knees slightly and bring your torso forward, by bending at the waist, while keeping the back straight until it is almost parallel to the floor. Tip: Make sure that you keep the head up. The weights should hang directly in front of you as your arms hang perpendicular to the floor and your torso. This is your starting position. While keeping the torso stationary, lift the dumbbells to your side as you breathe out, squeezing your shoulder blades together. On the top contracted position, squeeze the back muscles and hold for a second. Slowly lower the weight again to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	f	{"middle back"}	{biceps,lats}	\N	f
142	Sit Squats	none	Stand with your feet shoulder width apart. This will be your starting position. Begin the movement by flexing your knees and hips, sitting back with your hips. Continue until you have squatted a portion of the way down, but are above parallel, and quickly reverse the motion until you return to the starting position. Repeat for 5-10 repetitions. 	f	{quadriceps}	{abductors,glutes,hamstrings}	\N	f
143	Close-Grip EZ-Bar Press	e-z curl bar	Lie on a flat bench with an EZ bar loaded to an appropriate weight. Using a narrow grip lift the bar and hold it straight over your torso with your elbows in. The arms should be perpendicular to the floor. This will be your starting position. Now lower the bar down to your lower chest as you breathe in. Keep the elbows in as you perform this movement. Using the triceps to push the bar back up, press it back to the starting position by extending the elbows as you exhale. Repeat. 	f	{triceps}	{chest,shoulders}	\N	f
144	One Arm Pronated Dumbbell Triceps Extension	dumbbell	Lie flat on a bench while holding a dumbbell at arms length. Your arm should be perpendicular to your body. The palm of your hand should be facing towards your feet as a pronated grip is required to perform this exercise. Place your non lifting hand on your bicep for support. Slowly begin to lower the dumbbell down as you breathe in. Then, begin lifting the dumbbell upward as you contract the triceps. Remember to breathe out during the concentric (lifting part of the exercise). Repeat until you have performed your set repetitions. Switch arms and repeat the movement. 	t	{triceps}	\N	\N	f
145	Butt Lift (Bridge)	body only	Lie flat on the floor on your back with the hands by your side and your knees bent. Your feet should be placed around shoulder width. This will be your starting position. Pushing mainly with your heels, lift your hips off the floor while keeping your back straight. Breathe out as you perform this part of the motion and hold at the top for a second. Slowly go back to the starting position as you breathe in. 	t	{glutes}	{hamstrings}	\N	f
146	Leverage Shoulder Press	machine	Load an appropriate weight onto the pins and adjust the seat for your height. The handles should be near the top of the shoulders at the beginning of the motion. Your chest and head should be up and handles held with a pronated grip. This will be your starting position. Press the handles upward by extending through the elbow. After a brief pause at the top, return the weight to just above the start position, keeping tension on the muscles by not returning the weight to the stops until the set is complete. 	f	{shoulders}	{triceps}	\N	f
147	Crucifix	other	In the crucifix, you statically hold weights out to the side for time. While the event can be practiced using dumbbells, it is best to practice with one of the various implements used, such as axes and hammers, as it feels different. Begin standing, and raise your arms out to the side holding the implements. Your arms should be parallel to the ground. In competition, judges or sensors are used to let you know when you break parallel. Hold for as long as you can. Typically, the weights should be heavy enough that you fail in 30-60 seconds. 	t	{shoulders}	{forearms}	\N	f
148	Knee/Hip Raise On Parallel Bars	other	Position your body on the vertical leg raise bench so that your forearms are resting on the pads next to the torso and holding on to the handles. Your arms will be bent at a 90 degree angle. The torso should be straight with the lower back pressed against the pad of the machine and the legs extended pointing towards the floor. This will be your starting position. Now as you breathe out, lift your legs up as you keep them extended. Continue this movement until your legs are roughly parallel to the floor and then hold the contraction for a second. Tip: Do not use any momentum or swinging as you perform this exercise. Slowly go back to the starting position as you breathe in. Repeat for the recommended amount of repetitions. 	t	{abdominals}	\N	\N	f
149	One Half Locust	none	Lie facedown on the floor. Put your left hand under your left hipbone to pad your hip and pubic bone. Bend your right knee so you can hold the foot in your right hand. Lift the foot in the air and simultaneously lift your shoulders off the floor. This also stretches the right hip flexor and the chest and shoulders. Switch sides. If it doesn't bother your back, you can try it with both arms and legs at the same time. 	f	{quadriceps}	{abdominals,biceps,chest}	\N	f
150	Cable Crunch	cable	Kneel below a high pulley that contains a rope attachment. Grasp cable rope attachment and lower the rope until your hands are placed next to your face. Flex your hips slightly and allow the weight to hyperextend the lower back. This will be your starting position. With the hips stationary, flex the waist as you contract the abs so that the elbows travel towards the middle of the thighs. Exhale as you perform this portion of the movement and hold the contraction for a second. Slowly return to the starting position as you inhale. Tip: Make sure that you keep constant tension on the abs throughout the movement. Also, do not choose a weight so heavy that the lower back handles the brunt of the work. Repeat for the recommended amount of repetitions. 	t	{abdominals}	\N	\N	f
151	Lateral Raise - With Bands	bands	To begin, stand on an exercise band so that tension begins at arm's length. Grasp the handles using a pronated (palms facing your thighs) grip that is slightly less than shoulder width. The handles should be resting on the sides of your thighs. Your arms should be extended with a slight bend at the elbows and your back should be straight. This will be your starting position. Use your side shoulders to lift the handles to the sides as you exhale. Continue to lift the handles until they are slightly above parallel. Tip: As you lift the handles, slightly tilt the hand as if you were pouring water and keep your arms extended. Also, keep your torso stationary and pause for a second at the top of the movement. Lower the handles back down slowly to the starting position. Inhale as you perform this portion of the movement. Repeat for the recommended amount of repetitions. 	t	{shoulders}	\N	\N	f
152	Snatch Pull	barbell	With a barbell on the floor close to the shins, take a wide snatch grip. Lower your hips with the weight focused on the heels, back straight, head facing forward, chest up, with your shoulders just in front of the bar. This will be your starting position. Begin the first pull by driving through the heels, extending your knees. Your back angle should stay the same, and your arms should remain straight. Move the weight with control as you continue to above the knees. Next comes the second pull, the main source of acceleration for the pull. As the bar approaches the mid-thigh position, begin extending through the hips. In a jumping motion, accelerate by extending the hips, knees, and ankles, using speed to move the bar upward. There should be no need to actively pull through the arms to accelerate the weight; at the end of the second pull, the body should be fully extended, leaning slightly back. Full extension should be violent and abrupt, and ensure that you do not prolong the extension for longer than necessary. 	f	{hamstrings}	{calves,glutes,"lower back",quadriceps,traps}	\N	f
153	Iron Crosses (stretch)	none	Lie face down on the floor, with your arms extended out to your side, palms pressed to the floor. This will be your starting position. To begin, flex one knee and bring that leg across the back of your body, attempting to touch it to the ground near the opposite hand. Promptly return the leg to the starting postion, and quickly repeat with the other leg. Continue alternating for 10-20 repetitions. 	f	{quadriceps}	\N	\N	f
154	Close-Grip Push-Up off of a Dumbbell	body only	Lie on the floor and place your hands on an upright dumbbell. Supporting your weight on your toes and hands, keep your torso rigid and your elbows in with your arms straight. This will be your starting position. Lower your body, allowing the elbows to flex while you inhale. Keep your body straight, not allowing your hips to rise or sag. Press yourself back up to the starting position by extending the elbows. Breathe out as you perform this step. After a pause at the contracted position, repeat the movement for the prescribed amount of repetitions. 	f	{triceps}	{abdominals,chest,shoulders}	\N	f
155	Standing Inner-Biceps Curl	dumbbell	Stand up with a dumbbell in each hand being held at arms length. The elbows should be close to the torso. Your legs should be at about shoulder's width apart from each other. Rotate the palms of the hands so that they are facing inward in a neutral position. This will be your starting position. While holding the upper arms stationary, curl the weights out while contracting the biceps as you breathe out. Your wrist should turn so that when the weights are fully elevated you have supinated grip (palms facing up). Only the forearms should move. Continue the movement until your biceps are fully contracted and the dumbbells are at shoulder level. Tip: Keep the forearms aligned with your outer deltoids. Hold the contracted position for a second as you squeeze the biceps. Slowly begin to bring the dumbbells back to the starting position as your breathe in. Remember to rotate the wrists as you lower the weight in order to switch back to a neutral grip. Repeat for the recommended amount of repetitions. 	t	{biceps}	\N	\N	f
156	Leverage Incline Chest Press	machine	Load an appropriate weight onto the pins and adjust the seat for your height. The handles should be near the top of the pectorals at the beginning of the motion. Your chest and head should be up and your shoulder blades retracted. This will be your starting position. Press the handles forward by extending through the elbow. After a brief pause at the top, return the weight just above the start position, keeping tension on the muscles by not returning the weight to the stops until the set is complete. 	f	{chest}	{shoulders,triceps}	\N	f
157	Overhead Stretch	none	Standing straight up, lace your fingers together and open your palms to the ceiling. Keep your shoulders down as you extend your arms up. To create a full torso stretch, pull your tailbone down and stabilize your torso as you do this. Stretch the muscles on both the front and the back of the torso. 	f	{abdominals}	{chest,forearms,lats,triceps}	\N	f
158	Crossover Reverse Lunge	none	Stand with your feet shoulder width apart. This will be your starting position. Perform a rear lunge by stepping back with one foot and flexing the hips and front knee. As you do so, rotate your torso across the front leg. After a brief pause, return to the starting position and repeat on the other side, continuing in an alternating fashion. 	f	{"lower back"}	{abdominals,abductors,glutes,hamstrings,quadriceps}	\N	f
159	Leverage Shrug	machine	Load the pins to an appropriate weight. Position yourself directly between the handles. Grasp the top handles with a comfortable grip, and then lower your hips as you take a breath. Look forward with your head and keep your chest up. Drive through the floor with your heels, extending your hips and knees as you rise to a standing position. Keep your arms straight throughout the movement, finishing with your shoulders back. This will be your starting position. Raise the weight by shrugging the shoulders towards your ears, moving straight up and down. Pause at the top of the motion, and then return the weight to the starting position. 	t	{traps}	{forearms}	\N	f
160	Stomach Vacuum	body only	To begin, stand straight with your feet shoulder width apart from each other. Place your hands on your hips. This is the starting position. Now slowly inhale as much air as possible and then start to exhale as much as possible while bringing your stomach in as much as possible and hold this position. Try to visualize your navel touching your backbone. One isometric contraction is around 20 seconds. During the 20 second hold, try to breathe normally. Then inhale and bring your stomach back to the starting position. Once you have practiced this exercise, try to perform this exercise for longer than 20 seconds. Tip: You can work your way up to 40-60 seconds. Repeat for the recommended amount of sets. 	t	{abdominals}	\N	\N	f
202	Kneeling High Pulley Row	cable	Select the appropriate weight using a pulley that is above your head. Attach a rope to the cable and kneel a couple of feet away, holding the rope out in front of you with both arms extended. This will be your starting position. Initiate the movement by flexing the elbows and fully retracting your shoulders, pulling the rope toward your upper chest with your elbows out. After pausing briefly, slowly return to the starting position. 	f	{lats}	{biceps,"middle back"}	\N	f
161	Bent Over Dumbbell Rear Delt Raise With Head On Bench	dumbbell	Stand up straight while holding a dumbbell in each hand and with an incline bench in front of you. While keeping your back straight and maintaining the natural arch of your back, lean forward until your forehead touches the bench in front of you. Let the arms hang in front of you perpendicular to the ground. The palms of your hands should be facing each other and your torso should be parallel to the floor. This will be your starting position. Keeping your torso forward and stationary, and the arms straight with a slight bend at the elbows, lift the dumbbells straight to the side until both arms are parallel to the floor. Exhale as you lift the weights. Caution: avoid swinging the torso or bringing the arms back as opposed to the side. After a one second contraction at the top, slowly lower the dumbbells back to the starting position. Repeat the recommended amount of repetitions. 	t	{shoulders}	\N	\N	f
162	Frankenstein Squat	barbell	This drill teaches you the proper positioning of both the bar and your body during the clean and front squat. Place the barbell on the front of the shoulders, releasing your grip and extending your arms out in front of you. The shoulders should be pushed forward to create a shelf, and the bar should be in contact with the throat. Ensure that you only move your shoulder blades forward; don't round the thoracic spine. Squat by flexing the knees and hips, sitting in between your legs. Keep the torso upright, the arms up, and the shoulders forward, and the bar should stay in place. Go to the bottom of the squat, until your hamstrings contact your calves. Return to the upright position by driving through the front of the heel and extending the knees and hips. 	f	{quadriceps}	{abdominals,calves,glutes,hamstrings}	\N	f
163	Suspended Split Squat	other	Suspend your straps so the handles are 18-30 inches from the floor. Facing away from the setup, place your rear foot into the handle behind you. Keep your head looking forward and your chest up, with your knee slightly bent. This will be your starting position. Descend by flexing the knee and hips, lowering yourself to the ground. Keep your weight on the heel of your foot and maintain your posture throughout the exercise. At the bottom of the movement, reverse the motion, extending through the hip and knee to return to the starting position. 	f	{quadriceps}	{abductors,adductors,calves,glutes,hamstrings}	\N	f
164	Dumbbell Scaption	dumbbell	This corrective exercise strengthens the muscles that stabilize your shoulder blade. Hold a light weight in each hand, hanging at your sides. Your thumbs should pointing up. Begin the movement raising your arms out in front of you, about 30 degrees off center. Your arms should be fully extended as you perform the movement. Continue until your arms are parallel to the ground, and then return to the starting position. 	t	{shoulders}	{traps}	\N	f
165	Internal Rotation with Band	bands	Choke the band around a post. The band should be at the same height as your elbow. Stand with your right side to the band a couple of feet away. Grasp the end of the band with your right hand, and keep your elbow pressed firmly to your side. We recommend you hold a pad or foam roll in place with your elbow to keep it firmly in position. With your upper arm in position, your elbow should be flexed to 90 degrees with your hand reaching away from your torso. This will be your starting position. Execute the movement by rotating your arm in a forehand motion, keeping your elbow in place. Continue as far as you are able, pause, and then return to the starting position. 	t	{shoulders}	\N	\N	f
166	Backward Drag	other	Load a sled with the desired weight, attaching a rope or straps to the sled that you can hold onto. Begin the exercise by moving backwards for a given distance. Leaning back, extend through the legs for short steps to move as quickly as possible. 	f	{quadriceps}	{calves,forearms,glutes,hamstrings,"lower back"}	\N	f
167	Sled Overhead Triceps Extension	other	Attach dual handles to a sled using a chain or rope. Load the sled to an appropriate load. Facing away from the sled, step away until there is tension in the line. Raise your hands above your head, keeping them together, palms facing each other. Your elbows should be pointed upward with the elbows flexed. This will be your starting position. Extend through the elbow to straighten the arm. Ensure that your upper arm stays in position to isolate the triceps. Upon full extension, step forward to take the slack out of the line. You may keep your feet staggered for more stability. 	t	{triceps}	\N	\N	f
168	Inverted Row with Straps	other	Hang a rope or suspension straps from a rack or other stable object. Grasp the ends and position yourself in a supine position hanging from the ropes. Your body should be straight with your heels on the ground with your arms fully extended. This will be your starting position. Begin by flexing the elbow, pulling your chest to your hands. Retract your shoulder blades as you perform the movement. Pause at the top of the motion, and return yourself to the start position. Repeat for the desired number of repetitions. 	f	{"middle back"}	{biceps,lats}	\N	f
169	Exercise Ball Pull-In	exercise ball	Place an exercise ball nearby and lay on the floor in front of it with your hands on the floor shoulder width apart in a push-up position. Now place your lower shins on top of an exercise ball. Tip: At this point your legs should be fully extended with the shins on top of the ball and the upper body should be in a push-up type of position being supported by your two extended arms in front of you. This will be your starting position. While keeping your back completely straight and the upper body stationary, pull your knees in towards your chest as you exhale, allowing the ball to roll forward under your ankles. Squeeze your abs and hold that position for a second. Now slowly straighten your legs, rolling the ball back to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	f	{abdominals}	\N	\N	f
170	Tricep Dumbbell Kickback	dumbbell	Start with a dumbbell in each hand and your palms facing your torso. Keep your back straight with a slight bend in the knees and bend forward at the waist. Your torso should be almost parallel to the floor. Make sure to keep your head up. Your upper arms should be close to your torso and parallel to the floor. Your forearms should be pointed towards the floor as you hold the weights. There should be a 90-degree angle formed between your forearm and upper arm. This is your starting position. Now, while keeping your upper arms stationary, exhale and use your triceps to lift the weights until the arm is fully extended. Focus on moving the forearm. After a brief pause at the top contraction, inhale and slowly lower the dumbbells back down to the starting position. Repeat the movement for the prescribed amount of repetitions. 	t	{triceps}	\N	\N	f
203	One Arm Lat Pulldown	cable	Select an appropriate weight and adjust the knee pad to help keep you down. Grasp the handle with a pronated grip. This will be your starting position. Pull the handle down, squeezing your elbow to your side as you flex the elbow. Pause at the bottom of the motion, and then slowly return the handle to the starting position. For multiple repetitions, avoid completely returning the weight to keep tension on the muscles being worked. 	f	{lats}	{biceps,"middle back"}	\N	f
171	Speed Box Squat	barbell	Attach bands to the bar that are securely anchored near the ground. You may need to choke the bands to get adequate tension. Use a box of an appropriate height for this exercise. Load the bar to a weight that still requires effort, but isn't so heavy that speed is compromised. Typically, that will be between 50-70% of your one rep max. Position the bar on your upper back, shoulder blades retracted, back arched and everything tight head to toe. This will be the starting position. Unrack the bar and position yourself in front of the box. Sit back with your hips until you are seated on the box, ensuring that you descend under control and don't crash onto the surface. Pause briefly, and explode off of the box, extending through the hips and knees. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
172	Front Incline Dumbbell Raise	dumbbell	Sit down on an incline bench with the incline set anywhere between 30 to 60 degrees while holding a dumbbell on each hand. Tip: You can change the angle to hit the muscle a little differently each time. Extend your arms straight in front of you and have your palms facing down with the dumbbells raised about 1 inch above your thighs. This will be your starting position. Slowly raise the dumbbells straight up until they are slightly above your shoulders, while keeping your elbows locked. Squeeze at the top for a second and make sure you breathe out during this portion of the movement. Tip: Keep your head resting down against the bench and your legs on the floor at all times. Lower the arms back to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	t	{shoulders}	\N	\N	f
173	All Fours Quad Stretch	body only	Start off on your hands and knees, then lift your leg off the floor and hold the foot with your hand. Use your hand to hold the foot or ankle, keeping the knee fully flexed, stretching the quadriceps and hip flexors. Focus on extending your hips, thrusting them towards the floor. Hold for 10-20 seconds and then switch sides. 	f	{quadriceps}	{quadriceps}	\N	f
174	Single-Arm Push-Up	body only	Begin laying prone on the ground. Move yourself into a position supporting your weight on your toes and one arm. Your working arm should be placed directly under the shoulder, fully extended. Your legs should be extended, and for this movement you may need a wider base, placing your feet further apart than in a normal push-up. Maintain good posture, and place your free hand behind your back. This will be your starting position. Lower yourself by allowing the elbow to flex until you touch the ground. Descend slowly, and reverse direction be extending the arm to return to the starting position. 	f	{chest}	{shoulders,triceps}	\N	f
175	One-Arm Long Bar Row	barbell	Position a bar into a landmine or in a corner to keep it from moving. Load an appropriate weight onto your end. Stand next to the bar, and take a grip with one hand close to the collar. Using your hips and legs, rise to a standing position. Assume a bent-knee stance with your hips back and your chest up. Your arm should be extended. This will be your starting position. Pull the weight to your side by retracting the shoulder and flexing the elbow. Do not jerk the weight or cheat during the movement. After a brief pause, return to the starting position. 	f	{"middle back"}	{biceps,lats}	\N	f
176	Band Hip Adductions	bands	Anchor a band around a solid post or other object. Stand with your left side to the post, and put your right foot through the band, getting it around the ankle. Stand up straight and hold onto the post if needed. This will be your starting position. Keeping the knee straight, raise your right legs out to the side as far as you can. Return to the starting position and repeat for the desired rep count. Switch sides. 	t	{adductors}	\N	\N	f
177	Wide-Grip Decline Barbell Pullover	barbell	Lie down on a decline bench with both legs securely locked in position. Reach for the barbell behind the head using a pronated grip (palms facing out). Make sure to grab the barbell wider than shoulder width apart for this exercise. Slowly lift the barbell up from the floor by using your arms. When positioned properly, your arms should be fully extended and perpendicular to the floor. This is the starting position. Begin by moving the barbell back down in a semicircular motion as if you were going to place it on the floor, but instead, stop when the arms are parallel to the floor. Tip: Keep the arms fully extended at all times. The movement should only happen at the shoulder joint. Inhale as you perform this portion of the movement. Now bring the barbell up while exhaling until you are back at the starting position. Remember to keep full control of the barbell at all times. Repeat the movement for the prescribed amount of repetitions of your training program. When finished with your set, slowly lower the barbell back down until it is level with your head and release it. 	f	{chest}	{shoulders,triceps}	\N	f
178	Suspended Fallout	other	Adjust the straps so the handles are at an appropriate height, below waist level. Begin standing and grasping the handles. Lean into the straps, moving to an incline push-up position. This will be your starting position. Keeping your arms straight, lean further into the suspension straps, bringing your body closer to the ground, allowing your shoulders to extend, raising your arms up and over your head. Maintain a neutral spine and keep the rest of your body straight, your shoulders being the only joints allowed to move. Pause during the peak contraction, and then return to the starting position. 	t	{abdominals}	{chest,"lower back",shoulders}	\N	f
179	Spider Crawl	body only	Begin in a prone position on the floor. Support your weight on your hands and toes, with your feet together and your body straight. Your arms should be bent to 90 degrees. This will be your starting position. Initiate the movement by raising one foot off of the ground. Externally rotate the leg and bring the knee toward your elbow, as far forward as possible. Return this leg to the starting position and repeat on the opposite side. 	f	{abdominals}	{chest,shoulders,triceps}	\N	f
180	Hang Snatch - Below Knees	barbell	Begin with a wide grip on the bar, with an overhand or hook grip. The feet should be directly below the hips with the feet turned out. Your knees should be slightly bent, and the torso inclined forward. The spine should be fully extended and the head facing forward. The bar should be just below the knees. This will be your starting position. Aggressively extend through the legs and hips. At peak extension, shrug the shoulders and allow the elbows to flex to the side. As you move your feet into the receiving position, forcefully pull yourself below the bar as you elevate the bar overhead. Receive the bar with your body as low as possible and the arms fully extended overhead. Return to a standing position with the weight overhead, and then return the weight to the floor under control. 	f	{hamstrings}	{abdominals,calves,forearms,glutes,"lower back",quadriceps,shoulders,traps}	\N	f
497	Alternating Cable Shoulder Press	cable	Move the cables to the bottom of the tower and select an appropriate weight. Grasp the cables and hold them at shoulder height, palms facing forward. This will be your starting position. Keeping your head and chest up, extend through the elbow to press one side directly over head. After pausing at the top, return to the starting position and repeat on the opposite side. 	f	{shoulders}	{triceps}	\N	f
181	Back Flyes - With Bands	bands	Run a band around a stationary post like that of a squat rack. Grab the band by the handles and stand back so that the tension in the band rises. Extend and lift the arms straight in front of you. Tip: Your arms should be straight and parallel to the floor while perpendicular to your torso. Your feet should be firmly planted on the floor spread at shoulder width. This will be your starting position. As you exhale, move your arms to the sides and back. Keep your arms extended and parallel to the floor. Continue the movement until the arms are extended to your sides. After a pause, go back to the original position as you inhale. Repeat for the recommended amount of repetitions. 	f	{shoulders}	{"middle back",triceps}	\N	f
182	Cable Crossover	cable	To get yourself into the starting position, place the pulleys on a high position (above your head), select the resistance to be used and hold the pulleys in each hand. Step forward in front of an imaginary straight line between both pulleys while pulling your arms together in front of you. Your torso should have a small forward bend from the waist. This will be your starting position. With a slight bend on your elbows in order to prevent stress at the biceps tendon, extend your arms to the side (straight out at both sides) in a wide arc until you feel a stretch on your chest. Breathe in as you perform this portion of the movement. Tip: Keep in mind that throughout the movement, the arms and torso should remain stationary; the movement should only occur at the shoulder joint. Return your arms back to the starting position as you breathe out. Make sure to use the same arc of motion used to lower the weights. Hold for a second at the starting position and repeat the movement for the prescribed amount of repetitions. 	t	{chest}	{shoulders}	\N	f
183	Elbow to Knee	body only	Lie on the floor, crossing your right leg across your bent left knee. Clasp your hands behind your head, beginning with your shoulder blades on the ground. This will be your starting position. Perform the motion by flexing the spine and rotating your torso to bring the left elbow to the right knee. Return to the starting position and repeat the movement for the desired number of repetitions before switching sides. 	f	{abdominals}	\N	\N	f
184	Crunch - Legs On Exercise Ball	body only	Lie flat on your back with your feet resting on an exercise ball and your knees bent at a 90 degree angle. Place your feet three to four inches apart and point your toes inward so they touch. Place your hands lightly on either side of your head keeping your elbows in. Tip: Don't lock your fingers behind your head. Push the small of your back down in the floor in order to better isolate your abdominal muscles. This will be your starting position. Begin to roll your shoulders off the floor and continue to push down as hard as you can with your lower back. Your shoulders should come up off the floor only about four inches, and your lower back should remain on the floor. Breathe out as you execute this portion of the movement. Squeeze your abdominals hard at the top of the contraction and hold for a second. Tip: Focus on a slow, controlled movement. Refrain from using momentum at any time. Slowly go back down to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	t	{abdominals}	\N	\N	f
185	Standing Barbell Press Behind Neck	barbell	This exercise is best performed inside a squat rack for easier pick up of the bar. To begin, first set the bar on a rack that best matches your height. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it. Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso. Step away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Your back should be kept straight while performing this exercise. This will be your starting position. Elevate the barbell overhead by fully extending your arms while breathing out. Hold the contraction for a second and lower the barbell back down to the starting position by inhaling. Repeat for the recommended amount of repetitions. 	f	{shoulders}	{triceps}	\N	f
186	Calf Raise On A Dumbbell	dumbbell	Hang on to a sturdy object for balance and stand on a dumbbell handle, preferably one with round plates so that it rolls as in this manner you have to work harder to stabilize yourself; thus increasing the effectiveness of the exercise. Now roll your foot slightly forward so that you can get a nice stretch of the calf. This will be your starting position. Lift the calf as you roll your foot over the top of the handle so that you get a full extension. Exhale during the execution of this movement. Contract the calf hard at the top and hold for a second. Tip: As you come up, roll the dumbbell slightly backward. Now inhale as you roll the dumbbell slightly forward as you come down to get a better stretch. Repeat for the recommended amount of repetitions. 	t	{calves}	\N	\N	f
187	Linear Depth Jump	other	You will need two boxes or benches spaced a few feet away from each other. Begin by standing on one box facing towards the other platform. To initiate the movement, gently drop down to the ground between your platforms, allowing the knees and hips to flex. Reverse the motion by exploding, extending through the hips, knees, and ankles to jump onto the other platform. Land softly, asborbing the impact through the legs. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
188	Cable Incline Pushdown	cable	Lie on incline an bench facing away from a high pulley machine that has a straight bar attachment on it. Grasp the straight bar attachment overhead with a pronated (overhand; palms down) shoulder width grip and extend your arms in front of you. The bar should be around 2 inches away from your upper thighs. This will be your starting position. Keeping the upper arms stationary, lift your arms back in a semi circle until the bar is straight over your head. Breathe in during this portion of the movement. Slowly go back to the starting position using your lats and hold the contraction once you reach the starting position. Breathe out during the execution of this movement. Repeat for the recommended amount of repetitions. 	t	{lats}	\N	\N	f
189	Side Lateral Raise	dumbbell	Pick a couple of dumbbells and stand with a straight torso and the dumbbells by your side at arms length with the palms of the hand facing you. This will be your starting position. While maintaining the torso in a stationary position (no swinging), lift the dumbbells to your side with a slight bend on the elbow and the hands slightly tilted forward as if pouring water in a glass. Continue to go up until you arms are parallel to the floor. Exhale as you execute this movement and pause for a second at the top. Lower the dumbbells back down slowly to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	t	{shoulders}	\N	\N	f
190	Tricep Side Stretch	none	Bring right arm across your body and over your left shoulder, holding your elbow with your left hand, until you feel a stretch in your tricep. Then repeat for your other arm. 	f	{triceps}	{shoulders}	\N	f
191	Smith Machine Squat	machine	To begin, first set the bar on the height that best matches your height. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it. Hold on to the bar using both arms at each side (palms facing forward), unlock it and lift it off the rack by first pushing with your legs and at the same time straightening your torso. Position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times and also maintain a straight back. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance which targets overall development; however you can choose any of the three stances discussed in the foot stances section). Begin to slowly lower the bar by bending the knees as you maintain a straight posture with the head up. Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees (which is the point in which the upper legs are below parallel to the floor). Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly. Begin to raise the bar as you exhale by pushing the floor with the heel of your foot as you straighten the legs again and go back to the starting position. Repeat for the recommended amount of repetitions. 	f	{quadriceps}	{calves,glutes,hamstrings,"lower back"}	\N	f
192	Smith Machine Calf Raise	machine	Place a block or weight plate below the bar on the Smith machine. Set the bar to a position that best matches your height. Once the correct height is chosen and the bar is loaded, step onto the plates with the balls of your feet and place the bar on the back of your shoulders. Take the bar with both hands facing forward. Rotate the bar to unrack it. This will be your starting position. Raise your heels as high as possible by pushing off of the balls of your feet, flexing your calf at the top of the contraction. Your knees should remain extended. Hold the contracted position for a second before you start to go back down. Return slowly to the starting position as you breathe in while lowering your heels. Repeat for the recommended amount of repetitions. 	t	{calves}	\N	\N	f
193	Seated Dumbbell Press	dumbbell	Grab a couple of dumbbells and sit on a military press bench or a utility bench that has a back support on it as you place the dumbbells upright on top of your thighs. Clean the dumbbells up one at a time by using your thighs to bring the dumbbells up to shoulder height at each side. Rotate the wrists so that the palms of your hands are facing forward. This is your starting position. As you exhale, push the dumbbells up until they touch at the top. After a second pause, slowly come down back to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	f	{shoulders}	{triceps}	\N	f
194	3/4 Sit-Up	body only	Lie down on the floor and secure your feet. Your legs should be bent at the knees. Place your hands behind or to the side of your head. You will begin with your back on the ground. This will be your starting position. Flex your hips and spine to raise your torso toward your knees. At the top of the contraction your torso should be perpendicular to the ground. Reverse the motion, going only ¾ of the way down. Repeat for the recommended amount of repetitions. 	f	{abdominals}	\N	\N	f
195	Knee Circles	body only	Stand with your legs together and hands by your waist. Now move your knees in a circular motion as you breathe normally. Repeat for the recommended amount of repetitions. 	f	{calves}	{hamstrings,quadriceps}	\N	f
196	Superman	body only	To begin, lie straight and face down on the floor or exercise mat. Your arms should be fully extended in front of you. This is the starting position. Simultaneously raise your arms, legs, and chest off of the floor and hold this contraction for 2 seconds. Tip: Squeeze your lower back to get the best results from this exercise. Remember to exhale during this movement. Note: When holding the contracted position, you should look like superman when he is flying. Slowly begin to lower your arms, legs and chest back down to the starting position while inhaling. Repeat for the recommended amount of repetitions prescribed in your program. 	f	{"lower back"}	{glutes,hamstrings}	\N	f
197	One-Arm Kettlebell Para Press	kettlebells	Clean a kettlebell to your shoulder. Clean the kettlebell to your shoulder by extending through the legs and hips as you pull the kettlebell towards your shoulder. Rotate your wrist as you do so, so that the palm faces forward. This will be your starting position. Hold the kettlebell with the elbow out to the side, and press it up and out until it is locked out overhead. Lower the kettlebell back to your shoulder under control and repeat. Make sure to contract your lat, butt, and stomach forcefully for added stability and strength. 	f	{shoulders}	{triceps}	\N	f
198	Pull Through	cable	Begin standing a few feet in front of a low pulley with a rope or handle attached. Face away from the machine, straddling the cable, with your feet set wide apart. Begin the movement by reaching through your legs as far as possible, bending at the hips. Keep your knees slightly bent. Keeping your arms straight, extend through the hip to stand straight up. Avoid pulling upward through the shoulders; all of the motion should originate through the hips. 	f	{glutes}	{hamstrings,"lower back"}	\N	f
199	Standing Two-Arm Overhead Throw	medicine ball	Stand with your feet shoulder width apart holding a medicine ball in both hands. To begin, reach the medicine ball deep behind your head as you bend the knees slightly and lean back. Violently throw the ball forward, flexing at the hip and using your whole body to complete the movement. The medicine ball can be thrown to a partner or to a wall, receiving it as it bounces back. 	f	{shoulders}	{chest,lats}	\N	f
200	Standing Long Jump	body only	This drill is best done in sand or other soft landing surface. Ensure that you are able to measure distance. Stand in a partial squat stance with feet shoulder width apart. Utilizing a big arm swing and a countermovement of the legs, jump forward as far as you can. Attempt to land with your feet out in front you, reaching as far as possible with your legs. Measure the distance from your landing point to the starting point and track results. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
201	Kettlebell Turkish Get-Up (Squat style)	kettlebells	Lie on your back on the floor and press a kettlebell to the top position by extending the elbow. Bend the knee on the same side as the kettlebell. Keeping the kettlebell locked out at all times, pivot to the opposite side and use your non- working arm to assist you in driving forward to the lunge position. Using your free hand, push yourself to a seated position, then progressing to your feet. While looking up at the kettlebell, slowly stand up. Reverse the motion back to the starting position and repeat. 	f	{shoulders}	{abdominals,calves,hamstrings,quadriceps,triceps}	\N	f
204	Standing Palms-In Dumbbell Press	dumbbell	Start by having a dumbbell in each hand with your arm fully extended to the side using a neutral grip. Your feet should be shoulder width apart from each other. Now slowly lift the dumbbells up until you create a 90 degree angle with your arms. Note: Your forearms should be perpendicular to the floor. This the starting position. Continue to maintain a neutral grip throughout the entire exercise. Slowly lift the dumbbells up until your arms are fully extended. While inhaling lower the weights down until your arm is at a 90 degree angle again. Repeat for the recommended amount of repetitions. 	f	{shoulders}	{triceps}	\N	f
205	Incline Barbell Triceps Extension	barbell	Hold a barbell with an overhand grip (palms down) that is a little closer together than shoulder width. Lie back on an incline bench set at any angle between 45-75-degrees. Bring the bar overhead with your arms extended and elbows in. The arms should be in line with the torso above the head. This will be your starting position. Now lower the bar in a semicircular motion behind your head until your forearms touch your biceps. Inhale as you perform this movement. Tip: Keep your upper arms stationary and close to your head at all times. Only the forearms should move. Return to the starting position as you breathe out and you contract the triceps. Hold the contraction for a second. Repeat for the recommended amount of repetitions. 	t	{triceps}	{forearms}	\N	f
206	Alternate Incline Dumbbell Curl	dumbbell	Sit down on an incline bench with a dumbbell in each hand being held at arms length. Tip: Keep the elbows close to the torso.This will be your starting position. While holding the upper arm stationary, curl the right weight forward while contracting the biceps as you breathe out. As you do so, rotate the hand so that the palm is facing up. Continue the movement until your biceps is fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a second as you squeeze the biceps. Tip: Only the forearms should move. Slowly begin to bring the dumbbell back to starting position as your breathe in. Repeat the movement with the left hand. This equals one repetition. Continue alternating in this manner for the recommended amount of repetitions. 	t	{biceps}	{forearms}	\N	f
207	Elliptical Trainer	machine	To begin, step onto the elliptical and select the desired option from the menu. Most ellipticals have a manual setting, or you can select a program to run. Typically, you can enter your age and weight to estimate the amount of calories burned during exercise. Elevation can be adjusted to change the intensity of the workout. The handles can be used to monitor your heart rate to help you stay at an appropriate intensity. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
208	Bottoms-Up Clean From The Hang Position	kettlebells	Initiate the exercise by standing upright with a kettlebell in one hand. Swing the kettlebell back forcefully and then reverse the motion forcefully. Crush the kettlebell handle as hard as possible and raise the kettlebell to your shoulder. 	f	{forearms}	{biceps,shoulders}	\N	f
209	Lying Close-Grip Bar Curl On High Pulley	cable	Place a flat bench in front of a high pulley or lat pulldown machine. Hold the straight bar attachment using an underhand grip (palms up) that is about shoulder width. Lie on your back with your head over the end of the bench. Now extend your arms straight above your shoulders. Your torso and your arms should make a 90-degree angle and the elbows should be in. This will be your starting position. As you breathe out, curl the bar down in a semicircular motion until it touches your chin. Squeeze the biceps for a second at the top contracted position. Tip: As you execute this motion only the forearms should move. At no time should the upper arms be moving at all. They are to remain perpendicular throughout the movement. Return to starting position slowly. Repeat for the recommended amount of repetitions. 	t	{biceps}	\N	\N	f
210	Front Squats With Two Kettlebells	kettlebells	Clean two kettlebells to your shoulders. Clean the kettlebells to your shoulders by extending through the legs and hips as you pull the kettlebells towards your shoulders. Rotate your wrists as you do so. Looking straight ahead at all times, squat as low as you can and pause at the bottom. As you squat down, push your knees out. You should squat between your legs, keeping an upright torso, with your head and chest up. Rise back up by driving through your heels and repeat. 	f	{quadriceps}	{calves,glutes}	\N	f
211	Rear Leg Raises	body only	Place yourself on your hands knees on an exercise mat. Your head should be looking forward and the bend of the knees should create a 90-degree angle between the hamstrings and the calves. This will be your starting position. Extend one leg up and behind you. The knee and hip should both extend. Repeat for 5-10 repetitions, and then switch sides. 	f	{quadriceps}	\N	\N	f
212	Sledgehammer Swings	other	You will need a tire and a sledgehammer for this exercise. Stand in front of the tire about two feet away from it with a staggered stance. Grip the sledgehammer. If you are right handed, your left hand should be at the bottom of the handle, and your right hand should be choking up closer to the head. As you bring the sledge up, your right hand slides toward the head; as you swing down, your right hand will slide down to join your left hand. Slam it down as hard as you can against the tire. Control the bounce of the hammer off of the tire. Repeat on the other side. 	f	{abdominals}	{calves,forearms,lats,"middle back",shoulders}	\N	f
213	Exercise Ball Crunch	exercise ball	Lie on an exercise ball with your lower back curvature pressed against the spherical surface of the ball. Your feet should be bent at the knee and pressed firmly against the floor. The upper torso should be hanging off the top of the ball. The arms should either be kept alongside the body or crossed on top of your chest as these positions avoid neck strains (as opposed to the hands behind the back of the head position). Lower your torso into a stretch position keeping the neck stationary at all times. This will be your starting position. With the hips stationary, flex the waist by contracting the abdominals and curl the shoulders and trunk upward until you feel a nice contraction on your abdominals. The arms should simply slide up the side of your legs if you have them at the side or just stay on top of your chest if you have them crossed. The lower back should always stay in contact with the ball. Exhale as you perform this movement and hold the contraction for a second. As you inhale, go back to the starting position. Repeat for the recommended amount of repetitions. 	t	{abdominals}	\N	\N	f
214	Double Kettlebell Alternating Hang Clean	kettlebells	Place two kettlebells between your feet. To get in the starting position, push your butt back and look straight ahead. Clean one kettlebell to your shoulder and hold on to the other kettlebell. With a fluid motion, lower the top kettlebell while driving the bottom kettlebell up. 	f	{hamstrings}	{biceps,calves,forearms,glutes,"lower back",quadriceps,traps}	\N	f
215	One-Arm Kettlebell Split Snatch	kettlebells	Hold a kettlebell in one hand by the handle. Squat towards the floor, and then reverse the motion, extending the hips, knees, and finally the ankles, to raise the kettlebell overhead. After fully extending the body, descend into a lunge position to receive the weights overhead, one leg forward and one leg back. Ensure you drive through with your hips and lock the ketttlebells overhead in one uninterrupted motion. Return to a standing position, holding the weight overhead, and bring the feet together. Lower the weight to return to the starting position. 	f	{shoulders}	{hamstrings,quadriceps}	\N	f
216	One Arm Floor Press	barbell	Lie down on a flat surface with your back pressing against the floor or an exercise mat. Make sure your knees are bent. Have a partner hand you the bar on one hand. When starting, your arm should be just about fully extended, similar to the starting position of a barbell bench press. However, this time your grip will be neutral (palms facing your torso). Make sure the hand you are not using to lift the weight is placed by your side. Begin the exercise by lowering the barbell until your elbow touches the ground. Make sure to breathe in as this is the eccentric (lowering part of the exercise). Then start lifting the barbell back up to the original starting position. Remember to breathe out during the concentric (lifting part of the exercise). Repeat until you have performed your recommended repetitions. Switch arms and repeat the movement. 	f	{triceps}	{chest,shoulders}	\N	f
217	Dumbbell Seated Box Jump	dumbbell	Position a box a couple feet to the side of a bench. Hold a dumbbell to your chest with both hands and seat yourself on the bench facing the box. This will be your starting position. Plant your feet firmly on the ground as you lean forward, extending through the hips and knees to jump up and forward. Land on the box with both feet, absorbing the impact by allowing the hips and knees to bend. Step down and return to the starting position. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
218	Single Dumbbell Raise	dumbbell	With a wide stance, hold a dumbell with both hands, grasping the head of the dumbbell instead of the handle. Your arms should be extended and hanging at the waist. This will be your starting position. Raise the weight until it is above shoulder level, keeping your arms extended. Your torso and hips should remain stationary throughout the movement. Return to the starting position and repeat for the recommended amount of repetitions. 	t	{shoulders}	{forearms,traps}	\N	f
219	Sled Overhead Backward Walk	other	Attach dual handles to a sled connected by a rope or chain. Load the sled to a light weight. Face the sled, backing up until there is some tension in the line. Hold your hands directly above your head with your elbows extended. This will be your starting position. Walk backwards, keeping your arms raised above your head. Avoid jerky movements. 	f	{shoulders}	{calves,"middle back",quadriceps}	\N	f
220	Bottoms Up	body only	Begin by lying on your back on the ground. Your legs should be straight and your arms at your side. This will be your starting position. To perform the movement, tuck the knees toward your chest by flexing the hips and knees. Following this, extend your legs directly above you so that they are perpendicular to the ground. Rotate and elevate your pelvis to raise your glutes from the floor. After a brief pause, return to the starting position. 	f	{abdominals}	\N	\N	f
221	Palms-Up Barbell Wrist Curl Over A Bench	barbell	Start out by placing a barbell on one side of a flat bench. Kneel down on both of your knees so that your body is facing the flat bench. Use your arms to grab the barbell with a supinated grip (palms up) and bring them up so that your forearms are resting against the flat bench. Your wrists should be hanging over the edge. Start out by curling your wrist upwards and exhaling. Slowly lower your wrists back down to the starting position while inhaling. Your forearms should be stationary as your wrist is the only movement needed to perform this exercise. Repeat for the recommended amount of repetitions. 	t	{forearms}	\N	\N	f
222	Incline Inner Biceps Curl	dumbbell	Hold a dumbbell in each hand and lie back on an incline bench. The dumbbells should be at arm's length hanging at your sides and your palms should be facing out. This will be your starting position. Now as you exhale curl the weight outward and up while keeping your forearms in line with your side deltoids. Continue the curl until the dumbbells are at shoulder height and to the sides of your deltoids. Tip: The end of the movement should look similar to a double biceps pose. After a second contraction at the top of the movement, start to inhale and slowly lower the weights back to the starting position using the same path used to bring them up. Repeat for the recommended amount of repetitions. 	t	{biceps}	\N	\N	f
223	One-Legged Cable Kickback	cable	Hook a leather ankle cuff to a low cable pulley and then attach the cuff to your ankle. Face the weight stack from a distance of about two feet, grasping the steel frame for support. While keeping your knees and hips bent slightly and your abs tight, contract your glutes to slowly "kick" the working leg back in a semicircular arc as high as it will comfortably go as you breathe out. Tip: At full extension, squeeze your glutes for a second in order to achieve a peak contraction. Now slowly bring your working leg forward, resisting the pull of the cable until you reach the starting position. Repeat for the recommended amount of repetitions. Switch legs and repeat the movement for the other side. 	t	{glutes}	{hamstrings}	\N	f
224	Close-Grip Standing Barbell Curl	barbell	Hold a barbell with both hands, palms up and a few inches apart. Stand with your torso straight and your head up. Your feet should be about shoulder width and your elbows close to your torso. This will be your starting position. Tip: You will keep your upper arms and elbows stationary throughout the movement. Curl the bar up in a semicircular motion until the forearms touch your biceps. Exhale as you perform this portion of the movement and contract your biceps hard for a second at the top. Tip: Avoid bending the back or using swinging motions as you lift the weight. Only the forearms should move. Slowly go back down to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	t	{biceps}	{forearms}	\N	f
225	Shoulder Circles	none	With shoulders relaxed and arms resting loosely at your sides (or in your lap if you're seated), gently roll your shoulders forward, up, back, and down. Reverse direction. You can do this exercise alternating shoulders or both at the same time. 	f	{shoulders}	{traps}	\N	f
280	Medicine Ball Scoop Throw	medicine ball	Assume a semisquat stance with a medicine ball in your hands. Your arms should hang so the ball is near your feet. Begin by thrusting the hips forward as you extend through the legs, jumping up. As you do, swing your arms up and over your head, keeping them extended, releasing the ball at the peak of your movement. The goal is to throw the ball the greatest distance behind you. 	f	{shoulders}	{abdominals,hamstrings,quadriceps}	\N	f
226	Bent-Arm Dumbbell Pullover	dumbbell	Place a dumbbell standing up on a flat bench. Ensuring that the dumbbell stays securely placed at the top of the bench, lie perpendicular to the bench (torso across it as in forming a cross) with only your shoulders lying on the surface. Hips should be below the bench and legs bent with feet firmly on the floor. The head will be off the bench as well. Grasp the dumbbell with both hands and hold it straight over your chest with a bend in your arms. Both palms should be pressing against the underside one of the sides of the dumbbell. This will be your starting position. Caution: Always ensure that the dumbbell used for this exercise is secure. Using a dumbbell with loose plates can result in the dumbbell falling apart and falling on your face. While keeping your arms locked in the bent arm position, lower the weight slowly in an arc behind your head while breathing in until you feel a stretch on the chest. At that point, bring the dumbbell back to the starting position using the arc through which the weight was lowered and exhale as you perform this movement. Hold the weight on the initial position for a second and repeat the motion for the prescribed number of repetitions. 	f	{chest}	{lats,shoulders,triceps}	\N	f
227	Wide-Grip Lat Pulldown	cable	Sit down on a pull-down machine with a wide bar attached to the top pulley. Make sure that you adjust the knee pad of the machine to fit your height. These pads will prevent your body from being raised by the resistance attached to the bar. Grab the bar with the palms facing forward using the prescribed grip. Note on grips: For a wide grip, your hands need to be spaced out at a distance wider than shoulder width. For a medium grip, your hands need to be spaced out at a distance equal to your shoulder width and for a close grip at a distance smaller than your shoulder width. As you have both arms extended in front of you holding the bar at the chosen grip width, bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position. As you breathe out, bring the bar down until it touches your upper chest by drawing the shoulders and the upper arms down and back. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary and only the arms should move. The forearms should do no other work except for holding the bar; therefore do not try to pull down the bar using the forearms. After a second at the contracted position squeezing your shoulder blades together, slowly raise the bar back to the starting position when your arms are fully extended and the lats are fully stretched. Inhale during this portion of the movement. Repeat this motion for the prescribed amount of repetitions. 	f	{lats}	{biceps,"middle back",shoulders}	\N	f
228	Gorilla Chin/Crunch	body only	Hang from a chin-up bar using an underhand grip (palms facing you) that is slightly wider than shoulder width. Now bend your knees at a 90 degree angle so that the calves are parallel to the floor while the thighs remain perpendicular to it. This will be your starting position. As you exhale, pull yourself up while crunching your knees up at the same time until your knees are at chest level. You will stop going up as soon as your nose is at the same level as the bar. Tip: When you get to this point you should also be finishing the crunch at the same time. Slowly start to inhale as you return to the starting position. Repeat for the recommended amount of repetitions. 	f	{abdominals}	{biceps,lats}	\N	f
229	Rack Delivery	barbell	This drill teaches the delivery of the barbell to the rack position on the shoulders. Begin holding a bar in the scarecrow position, with the upper arms parallel to the floor, and the forearms hanging down. Use a hook grip, with your fingers wrapped over your thumbs. Begin by rotating the elbows around the bar, delivering the bar to the shoulders. As your elbows come forward, relax your grip. The shoulders should be protracted, providing a shelf for the bar, which should lightly contact the throat. It is important that the bar stay close to the body at all times, as with a heavier load any distance will result in an unwanted collision. As the movement becomes smoother, speed and load can be increased before progressing further. 	f	{shoulders}	{forearms,traps}	\N	f
230	Weighted Bench Dip	other	For this exercise you will need to place a bench behind your back and another one in front of you. With the benches perpendicular to your body, hold on to one bench on its edge with the hands close to your body, separated at shoulder width. Your arms should be fully extended. The legs will be extended forward on top of the other bench. Your legs should be parallel to the floor while your torso is to be perpendicular to the floor. Have your partner place the dumbbell on your lap. Note: This exercise is best performed with a partner as placing the weight on your lap can be challenging and cause injury without assistance. This will be your starting position. Slowly lower your body as you inhale by bending at the elbows until you lower yourself far enough to where there is an angle slightly smaller than 90 degrees between the upper arm and the forearm. Tip: Keep the elbows as close as possible throughout the movement. Forearms should always be pointing down. Using your triceps to bring your torso up again, lift yourself back to the starting position while exhaling. Repeat for the recommended amount of repetitions. 	f	{triceps}	{chest,shoulders}	\N	f
231	Bent-Arm Barbell Pullover	barbell	Lie on a flat bench with a barbell using a shoulder grip width. Hold the bar straight over your chest with a bend in your arms. This will be your starting position. While keeping your arms in the bent arm position, lower the weight slowly in an arc behind your head while breathing in until you feel a stretch on the chest. At that point, bring the barbell back to the starting position using the arc through which the weight was lowered and exhale as you perform this movement. Hold the weight on the initial position for a second and repeat the motion for the prescribed number of repetitions. 	f	{lats}	{chest,lats,shoulders,triceps}	\N	f
232	Incline Dumbbell Curl	dumbbell	Sit back on an incline bench with a dumbbell in each hand held at arms length. Keep your elbows close to your torso and rotate the palms of your hands until they are facing forward. This will be your starting position. While holding the upper arm stationary, curl the weights forward while contracting the biceps as you breathe out. Only the forearms should move. Continue the movement until your biceps are fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a second. Slowly begin to bring the dumbbells back to starting position as your breathe in. Repeat for the recommended amount of repetitions. 	t	{biceps}	\N	\N	f
233	Inchworm	body only	Stand with your feet close together. Keeping your legs straight, stretch down and put your hands on the floor directly in front of you. This will be your starting position. Begin by walking your hands forward slowly, alternating your left and your right. As you do so, bend only at the hip, keeping your legs straight. Keep going until your body is parallel to the ground in a pushup position. Now, keep your hands in place and slowly take short steps with your feet, moving only a few inches at a time. Continue walking until your feet are by hour hands, keeping your legs straight as you do so. 	f	{hamstrings}	\N	\N	f
234	Wide Stance Barbell Squat	barbell	This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack that best matches your height. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it. Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso. Step away from the rack and position your legs using a wider-than-shoulder-width stance with the toes slightly pointed out. Keep your head up at all times as looking down will get you off balance, and also maintain a straight back. This will be your starting position. Begin to slowly lower the bar by bending the knees as you maintain a straight posture with the head up. Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees (which is the point in which the upper legs are below parallel to the floor). Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly. Begin to raise the bar as you exhale by pushing the floor with the heel of your foot as you straighten the legs again and go back to the starting position. Repeat for the recommended amount of repetitions. 	f	{quadriceps}	{calves,glutes,hamstrings,"lower back"}	\N	f
235	Reverse Grip Bent-Over Rows	barbell	Stand erect while holding a barbell with a supinated grip (palms facing up). Bend your knees slightly and bring your torso forward, by bending at the waist, while keeping the back straight until it is almost parallel to the floor. Tip: Make sure that you keep the head up. The barbell should hang directly in front of you as your arms hang perpendicular to the floor and your torso. This is your starting position. While keeping the torso stationary, lift the barbell as you breathe out, keeping the elbows close to the body and not doing any force with the forearm other than holding the weights. On the top contracted position, squeeze the back muscles and hold for a second. Slowly lower the weight again to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	f	{"middle back"}	{biceps,lats,shoulders}	\N	f
236	Thigh Abductor	machine	To begin, sit down on the abductor machine and select a weight you are comfortable with. When your legs are positioned properly, grip the handles on each side. Your entire upper body (from the waist up) should be stationary. This is the starting position. Slowly press against the machine with your legs to move them away from each other while exhaling. Feel the contraction for a second and begin to move your legs back to the starting position while breathing in. Note: Remember to keep your upper body stationary to prevent any injuries from occurring. Repeat for the recommended amount of repetitions. 	t	{abductors}	{glutes}	\N	f
237	Pushups (Close and Wide Hand Positions)	body only	Lie on the floor face down and body straight with your toes on the floor and the hands wider than shoulder width for a wide hand position and closer than shoulder width for a close hand position. Make sure you are holding your torso up at arms length. Lower yourself until your chest almost touches the floor as you inhale. Using your pectoral muscles, press your upper body back up to the starting position and squeeze your chest. Breathe out as you perform this step. After a second pause at the contracted position, repeat the movement for the prescribed amount of repetitions. 	f	{chest}	{shoulders,triceps}	\N	f
238	Spider Curl	e-z curl bar	Start out by setting the bar on the part of the preacher bench that you would normally sit on. Make sure to align the barbell properly so that it is balanced and will not fall off. Move to the front side of the preacher bench (the part where the arms usually lay) and position yourself to lay at a 45 degree slant with your torso and stomach pressed against the front side of the preacher bench. Make sure that your feet (especially the toes) are well positioned on the floor and place your upper arms on top of the pad located on the inside part of the preacher bench. Use your arms to grab the barbell with a supinated grip (palms facing up) at about shoulder width apart or slightly closer from each other. Slowly begin to lift the barbell upwards and exhale. Hold the contracted position for a second as you squeeze the biceps. Slowly begin to bring the barbell back to the starting position as your breathe in. . Repeat for the recommended amount of repetitions. 	t	{biceps}	\N	\N	f
239	One-Arm Kettlebell Snatch	kettlebells	Place a kettlebell between your feet. Bend your knees and push your butt back to get in the proper starting position. Look straight ahead and swing the kettlebell back between your legs. Immediately reverse the direction and drive through with your hips and knees, accelerating the kettlebell upward. As the kettlebell rises to your shoulder rotate your hand and punch straight up, using momentum to receive the weight locked out overhead. 	f	{shoulders}	{calves,glutes,hamstrings,"lower back",traps,triceps}	\N	f
240	Decline Push-Up	none	Lie on the floor face down and place your hands about 36 inches apart while holding your torso up at arms length. Move your feet up to a box or bench. This will be your starting position. Next, lower yourself downward until your chest almost touches the floor as you inhale. Now breathe out and press your upper body back up to the starting position while squeezing your chest. After a brief pause at the top contracted position, you can begin to lower yourself downward again for as many repetitions as needed. 	f	{chest}	{shoulders,triceps}	\N	f
241	Natural Glute Ham Raise	body only	Using the leg pad of a lat pulldown machine or a preacher bench, position yourself so that your ankles are under the pads, knees on the seat, and you are facing away from the machine. You should be upright and maintaining good posture. This will be your starting position. Lower yourself under control until your knees are almost completely straight. Remaining in control, raise yourself back up to the starting position. If you are unable to complete a rep, use a band, a partner, or push off of a box to aid in completing a repetition. 	f	{hamstrings}	{calves,glutes,"lower back"}	\N	f
242	Groin and Back Stretch	none	Sit on the floor with your knees bent and feet together. Interlock your fingers behind your head. This will be your starting position. Curl downwards, bringing your elbows to the inside of your thighs. After a brief pause, return to the starting position with your head up and your back straight. Repeat for 10-20 repetitions. 	f	{adductors}	\N	\N	f
281	Lateral Box Jump	other	Assume a comfortable standing position, with a short box positioned next to you. This will be your starting position. Quickly dip into a quarter squat to initiate the stretch reflex, and immediately reverse direction to jump up and to the side. Bring your knees high enough to ensure your feet have good clearance over the box. Land on the center of the box, using your legs to absorb the impact. Carefully jump down to the other side of the box, and continue going back and forth for several repetitions. 	f	{adductors}	{abductors,calves,glutes,hamstrings,quadriceps}	\N	f
243	Split Clean	barbell	With a barbell on the floor close to the shins, take an overhand grip just outside the legs. Lower your hips with the weight focused on the heels, back straight, head facing forward, chest up, with your shoulders just in front of the bar. This will be your starting position. Begin the first pull by driving through the heels, extending your knees. Your back angle should stay the same, and your arms should remain straight. Move the weight with control as you continue to above the knees. Next comes the second pull, the main source of acceleration for the clean. As the bar approaches the mid-thigh position, begin extending through the hips. In a jumping motion, accelerate by extending the hips, knees, and ankles, using speed to move the bar upward. There should be no need to actively pull through the arms to accelerate the weight; at the end of the second pull, the body should be fully extended, leaning slightly back, with the arms still extended. As full extension is achieved, transition into the third pull by aggressively shrugging and flexing the arms with the elbows up and out. At peak extension, aggressively pull yourself down, rotating your elbows under the bar as you do so. Receive the bar with the feet split, aggressively moving one foot forward and one foot back. The bar should be racked onto the protracted shoulders, lightly touching the throat with the hands relaxed. Continue to descend to the bottom position, which will help in the recovery. Immediately recover by driving through the heels, keeping the torso upright and elbows up. Bring the feet together as you stand up. 	f	{quadriceps}	{calves,forearms,glutes,hamstrings,"lower back",shoulders,traps}	\N	f
244	Good Morning off Pins	barbell	Begin with a bar on a rack at about the same height as your stomach. Bend over underneath the bar and rack the bar across the rear of your shoulders as you would a power squat, not on top of your shoulders. At the proper height, you should be near parallel to the floor when bent over. Keep your back tight, shoulder blades pinched together, and your knees slightly bent. Keep your back arched and your cervical spine in proper alignment. Begin the motion by extending through the hips with your glutes and hamstrings, and you are standing with the weight. Slowly lower the weight back to the pins returning to the starting position. 	f	{hamstrings}	{abdominals,glutes,"lower back"}	\N	f
245	Child's Pose	none	Get on your hands and knees, walk your hands in front of you. Lower your buttocks down to sit on your heels. Let your arms drag along the floor as you sit back to stretch your entire spine. Once you settle onto your heels, bring your hands next to your feet and relax. "breathe" into your back. Rest your forehead on the floor. Avoid this position if you have knee problems. 	f	{"lower back"}	{glutes,"middle back"}	\N	f
246	Monster Walk	bands	Place a band around both ankles and another around both knees. There should be enough tension that they are tight when your feet are shoulder width apart. To begin, take short steps forward alternating your left and right foot. After several steps, do just the opposite and walk backward to where you started. 	f	{abductors}	\N	\N	f
247	Machine Triceps Extension	machine	Adjust the seat to the appropriate height and make your weight selection. Place your upper arms against the pads and grasp the handles. This will be your starting position. Perform the movement by extending the elbow, pulling your lower arm away from your upper arm. Pause at the completion of the movement, and then slowly return the weight to the starting position. Avoid returning the weight all the way to the stops until the set is complete to keep tension on the muscles being worked. 	t	{triceps}	\N	\N	f
248	Incline Push-Up	body only	Stand facing bench or sturdy elevated platform. Place hands on edge of bench or platform, slightly wider than shoulder width. Position forefoot back from bench or platform with arms and body straight. Arms should be perpendicular to body. Keeping body straight, lower chest to edge of box or platform by bending arms. Push body up until arms are extended. Repeat. 	f	{chest}	{shoulders,triceps}	\N	f
249	One Arm Chin-Up	other	For this exercise, start out by placing a towel around a chin up bar. Grab the chin-up bar with your palm facing you. One hand will be grabbing the chin-up bar and the other will be grabbing the towel. Bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position.v Pull your torso up until the bar touches your upper chest by drawing the shoulders and the upper arms down and back. Exhale as you perform this portion of the movement. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary as it moves through space and only the arms should move. The forearms should do no other work other than hold the bar. After a second on the contracted position, start to inhale and slowly lower your torso back to the starting position when your arms are fully extended and the lats are fully stretched. Repeat this motion for the prescribed amount of repetitions. Switch arms and repeat the movement. 	f	{"middle back"}	{biceps,forearms,lats}	\N	f
250	Decline Dumbbell Triceps Extension	dumbbell	Secure your legs at the end of the decline bench and lie down with a dumbbell on each hand on top of your thighs. The palms of your hand will be facing each other. Once you are laying down, move the dumbbells in front of you at shoulder width. The palms of the hands should be facing each other and the arms should be perpendicular to the floor and fully extended. This will be your starting position. As you breathe in and you keep the upper arms stationary (and elbows in), bring the dumbbells down slowly by moving your forearms in a semicircular motion towards you until your thumbs are next to your ears. Breathe in as you perform this portion of the movement. Lift the dumbbells back to the starting position by contracting the triceps and exhaling. Repeat for the recommended amount of repetitions. 	t	{triceps}	\N	\N	f
251	Leverage Deadlift	machine	Load the pins to an appropriate weight. Position yourself directly between the handles. Grasp the bottom handles with a comfortable grip, and then lower your hips as you take a breath. Look forward with your head and keep your chest up. This will be your starting position. Return the weight to the starting position. 	f	{quadriceps}	{glutes,hamstrings}	\N	f
252	One-Arm Side Laterals	dumbbell	Pick a dumbbell and place it in one of your hands. Your non lifting hand should be used to grab something steady such as an incline bench press. Lean towards your lifting arm and away from the hand that is gripping the incline bench as this will allow you to keep your balance. Stand with a straight torso and have the dumbbell by your side at arm's length with the palm of the hand facing you. This will be your starting position. While maintaining the torso stationary (no swinging), lift the dumbbell to your side with a slight bend on the elbow and your hand slightly tilted forward as if pouring water in a glass. Continue to go up until you arm is parallel to the floor. Exhale as you execute this movement and pause for a second at the top. Lower the dumbbell back down slowly to the starting position as you inhale. Repeat for the recommended amount of repetitions. Switch arms and repeat the exercise. 	t	{shoulders}	\N	\N	f
253	Toe Touchers	body only	To begin, lie down on the floor or an exercise mat with your back pressed against the floor. Your arms should be lying across your sides with the palms facing down. Your legs should be touching each other. Slowly elevate your legs up in the air until they are almost perpendicular to the floor with a slight bend at the knees. Your feet should be parallel to the floor. Move your arms so that they are fully extended at a 45 degree angle from the floor. This is the starting position. While keeping your lower back pressed against the floor, slowly lift your torso and use your hands to try and touch your toes. Remember to exhale while perform this part of the exercise. Slowly begin to lower your torso and arms back down to the starting position while inhaling. Remember to keep your arms straight out pointing towards your toes. Repeat for the recommended amount of repetitions. 	t	{abdominals}	\N	\N	f
254	Calf Raises - With Bands	bands	Grab an exercise band and stand on it with your toes making sure that the length of the band between the foot and the arms is the same for both sides. While holding the handles of the band, raise the arms to the side of your head as if you were getting ready to perform a shoulder press. The palms should be facing forward with the elbows bent and to the sides. This movement will create tension on the band. This will be your starting position. Keeping the hands by your shoulder, stand up on your toes as you exhale and contract the calves hard at the top of the movement. After a one second contraction, slowly go back down to the starting position. Repeat for the recommended amount of repetitions. 	t	{calves}	\N	\N	f
255	Lying Supine Dumbbell Curl	dumbbell	Lie down on a flat bench face up while holding a dumbbell in each arm on top of your thighs. Bring the dumbbells to the sides with the arms extended and the palms of the hands facing your thighs (neutral grip). While keeping the arms close to your torso and elbows in, slowly lower your arms (as you keep them extended with a slight bend at the elbows) as far down towards the floor as you can go. Once you cannot go down any further, lock your upper arms in that position and that will be your starting position. As you breathe out, slowly begin to curl the weights up as you simultaneously rotate your wrists so that the palms of the hands face up. Continue curling the weight until your biceps are fully contracted and squeeze hard at the top position for a second. Tip: Only the forearms should move. Upper arms should remain stationary and elbows should stay in throughout the movement. Return back to the starting position very slowly. 	t	{biceps}	\N	\N	f
256	JM Press	barbell	Start the exercise the same way you would a close grip bench press. You will lie on a flat bench while holding a barbell at arms length (fully extended) with the elbows in. However, instead of having the arms perpendicular to the torso, make sure the bar is set in a direct line above the upper chest. This will be your starting position. Now beginning from a fully extended position lower the bar down as if performing a lying triceps extension. Inhale as you perform this movement. When you reach the half way point, let the bar roll back about one inch by moving the upper arms towards your legs until they are perpendicular to the torso. Tip: Keep the bend at the elbows constant as you bring the upper arms forward. As you exhale, press the bar back up by using the triceps to perform a close grip bench press. Now go back to the starting position and start over. Repeat for the recommended amount of repetitions. 	f	{triceps}	{chest,shoulders}	\N	f
257	Seated Two-Arm Palms-Up Low-Pulley Wrist Curl	cable	Put a bench in front of a low pulley machine that has a barbell or EZ Curl attachment on it. Move the bench far enough away so that when you bring the handle to the top of your thighs tension is created on the cable due to the weight stack being moved up. Now hold the handle with both hands, palms up, using a shoulder-width grip. Step back and sit on the bench with your feet about shoulder width apart, firmly on the floor. Lean forward and place the forearms on your thighs with the back of your wrists over your knees. This will be your starting position. Lower the bar as far as possible, while inhaling and keeping a tight grip. Now curl the bar up as high as possible while contracting the forearms. Tip: Only the wrist should move; not the forearms. After a second contraction at the top go back to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	t	{forearms}	\N	\N	f
258	Cocoons	body only	Begin by lying on your back on the ground. Your legs should be straight and your arms extended behind your head. This will be your starting position. To perform the movement, tuck the knees toward your chest, rotating your pelvis to lift your glutes from the floor. As you do so, flex the spine, bringing your arms back over your head to perform a simultaneous crunch motion. After a brief pause, return to the starting position. 	f	{abdominals}	\N	\N	f
259	Push-Ups With Feet On An Exercise Ball	exercise ball	Lie on the floor face down and place your hands about 36 inches apart from each other holding your torso up at arms length. Place your toes on top of an exercise ball. This will allow your body to be elevated. Lower yourself until your chest almost touches the floor as you inhale. Using your pectoral muscles, press your upper body back up to the starting position and squeeze your chest. Breathe out as you perform this step. After a second pause at the contracted position, repeat the movement for the prescribed amount of repetitions. 	f	{chest}	{shoulders,triceps}	\N	f
260	Bench Press - With Bands	bands	Using a flat bench secure a band under the leg of the bench that is nearest to your head. Once the band is secure, grab it by both handles and lie down on the bench. Extend your arms so that you are holding the band handles in front of you at shoulder width. Once at shoulder width, rotate your wrists forward so that the palms of your hands are facing away from you. This will be your starting position. Bring down the handles slowly until your elbow forms a 90 degree angle. Keep full control at all times. As you breathe out, bring the handles up using your pectoral muscles. Lock your arms in the contracted position, squeeze your chest, hold for a second and then start coming down slowly. Tip: It should take at least twice as long to go down than to come up. Repeat the movement for the prescribed amount of repetitions of your training program. 	f	{chest}	{shoulders,triceps}	\N	f
261	Plate Twist	other	Lie down on the floor or an exercise mat with your legs fully extended and your upper body upright. Grab the plate by its sides with both hands out in front of your abdominals with your arms slightly bent. Slowly cross your legs near your ankles and lift them up off the ground. Your knees should also be bent slightly. Note: Move your upper body back slightly to help keep you balanced turning this exercise. This is the starting position. Move the plate to the left side and touch the floor with it. Breathe out as you perform that movement. Come back to the starting position as you breathe in and then repeat the movement but this time to the right side of the body. Tip: Use a slow controlled movement at all times. Jerking motions can injure the back. Repeat for the recommended amount of repetitions. 	f	{abdominals}	\N	\N	f
262	Barbell Bench Press - Medium Grip	barbell	Lie back on a flat bench. Using a medium width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and hold it straight over you with your arms locked. This will be your starting position. From the starting position, breathe in and begin coming down slowly until the bar touches your middle chest. After a brief pause, push the bar back to the starting position as you breathe out. Focus on pushing the bar using your chest muscles. Lock your arms and squeeze your chest in the contracted position at the top of the motion, hold for a second and then start coming down slowly again. Tip: Ideally, lowering the weight should take about twice as long as raising it. Repeat the movement for the prescribed amount of repetitions. When you are done, place the bar back in the rack. 	f	{chest}	{shoulders,triceps}	\N	f
263	Decline Barbell Bench Press	barbell	Secure your legs at the end of the decline bench and slowly lay down on the bench. Using a medium width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and hold it straight over you with your arms locked. The arms should be perpendicular to the floor. This will be your starting position. Tip: In order to protect your rotator cuff, it is best if you have a spotter help you lift the barbell off the rack. As you breathe in, come down slowly until you feel the bar on your lower chest. After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your chest muscles. Lock your arms and squeeze your chest in the contracted position, hold for a second and then start coming down slowly again. Tip: It should take at least twice as long to go down than to come up). Repeat the movement for the prescribed amount of repetitions. When you are done, place the bar back in the rack. 	f	{chest}	{shoulders,triceps}	\N	f
264	Box Squat	barbell	The box squat allows you to squat to desired depth and develop explosive strength in the squat movement. Begin in a power rack with a box at the appropriate height behind you. Typically, you would aim for a box height that brings you to a parallel squat, but you can train higher or lower if desired. Begin by stepping under the bar and placing it across the back of the shoulders. Squeeze your shoulder blades together and rotate your elbows forward, attempting to bend the bar across your shoulders. Remove the bar from the rack, creating a tight arch in your lower back, and step back into position. Place your feet wider for more emphasis on the back, glutes, adductors, and hamstrings, or closer together for more quad development. Keep your head facing forward. With your back, shoulders, and core tight, push your knees and butt out and you begin your descent. Sit back with your hips until you are seated on the box. Ideally, your shins should be perpendicular to the ground. Pause when you reach the box, and relax the hip flexors. Never bounce off of a box. Keeping the weight on your heels and pushing your feet and knees out, drive upward off of the box as you lead the movement with your head. Continue upward, maintaining tightness head to toe. 	f	{quadriceps}	{adductors,calves,glutes,hamstrings,"lower back"}	\N	f
265	Dip Machine	machine	Sit securely in a dip machine, select the weight and firmly grasp the handles. Now keep your elbows in at your sides in order to place emphasis on the triceps. The elbows should be bent at a 90 degree angle. As you contract the triceps, extend your arms downwards as you exhale. Tip: At the bottom of the movement, focus on keeping a little bend in your arms to keep tension on the triceps muscle. Now slowly let your arms come back up to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	f	{triceps}	{chest,shoulders}	\N	f
266	Kipping Muscle Up	other	Grip the rings using a false grip, with the base of your palms on top of the rings. Begin with a movement swinging your legs backward slightly. Counter that movement by swinging your legs forward and up, jerking your chin and chest back, pulling yourself up with both arms as you do so. As you reach the top position of the pull-up, pull the rings to your armpits as you roll your shoulders forward, allowing your elbows to move straight back behind you. This puts you into the proper position to continue into the dip portion of the movement. Maintaining control and stability, extend through the elbow to complete the motion. Use care when lowering yourself to the ground. 	f	{lats}	{abdominals,biceps,forearms,"middle back",shoulders,traps,triceps}	\N	f
267	Iliotibial Tract-SMR	foam roll	Lay on your side, with the bottom leg placed onto a foam roller between the hip and the knee. The other leg can be crossed in front of you. Place as much of your weight as is tolerable onto your bottom leg; there is no need to keep your bottom leg in contact with the ground. Be sure to relax the muscles of the leg you are stretching. Roll your leg over the foam from you hip to your knee, pausing for 10-30 seconds at points of tension. Repeat with the opposite leg. 	t	{abductors}	\N	\N	f
268	Chin-Up	body only	Grab the pull-up bar with the palms facing your torso and a grip closer than the shoulder width. As you have both arms extended in front of you holding the bar at the chosen grip width, keep your torso as straight as possible while creating a curvature on your lower back and sticking your chest out. This is your starting position. Tip: Keeping the torso as straight as possible maximizes biceps stimulation while minimizing back involvement. As you breathe out, pull your torso up until your head is around the level of the pull-up bar. Concentrate on using the biceps muscles in order to perform the movement. Keep the elbows close to your body. Tip: The upper torso should remain stationary as it moves through space and only the arms should move. The forearms should do no other work other than hold the bar. After a second of squeezing the biceps in the contracted position, slowly lower your torso back to the starting position; when your arms are fully extended. Breathe in as you perform this portion of the movement. Repeat this motion for the prescribed amount of repetitions. 	f	{lats}	{biceps,forearms,"middle back"}	\N	f
282	Medicine Ball Full Twist	medicine ball	For this exercise you will need a medicine ball and a partner. Stand back to back with your partner, spaced 2-3 feet apart. This will be your starting position. Hold the ball in front of the trunk. Open the hips and turn the shoulders at the same time as your partner. For full rotation, you and your partner should twist in the same direction, i.e. counter-clockwise. Pass the ball to your partner, and both of you can now twist in the opposite direction to repeat the procedure. 	f	{abdominals}	{shoulders}	\N	f
283	Chain Press	other	Begin by connecting the chains to the cable handle attachments. Position yourself on the flat bench in the same position as for a dumbbell press. Your wrists should be pronated and arms perpendicular to the floor. This will be your starting position. Lower the chains by flexing the elbows, unloading some of the chain onto the floor. Continue until your elbow forms a 90 degree angle, and then reverse the motion by extending through the elbow to lockout. 	f	{chest}	{shoulders,triceps}	\N	f
269	Reverse Band Box Squat	barbell	Begin in a power rack with a box at the appropriate height behind you. Set up the bands either on band pegs or attached to the top of the rack, ensuring they will be directly above the bar during the squat. Attach the other end to the bar. Begin by stepping under the bar and placing it across the back of the shoulders. Squeeze your shoulder blades together and rotate your elbows forward, attempting to bend the bar across your shoulders. Remove the bar from the rack, creating a tight arch in your lower back, and step back into position. Place your feet wider for more emphasis on the back, glutes, adductors, and hamstrings, or closer together for more quad development. Keep your head facing forward. With your back, shoulders, and core tight, push your knees and butt out and you begin your descent. Sit back with your hips until you are seated on the box. Ideally, your shins should be perpendicular to the ground. Pause when you reach the box, and relax the hip flexors. Never bounce off of a box. Keeping the weight on your heels and pushing your feet and knees out, drive upward off of the box as you lead the movement with your head. Continue upward, maintaining tightness head to toe. Use care to return the barbell to the rack. 	f	{quadriceps}	{abductors,adductors,calves,forearms,glutes,hamstrings,"lower back"}	\N	f
270	Standing Rope Crunch	cable	Attach a rope to a high pulley and select an appropriate weight. Stand with your back to the cable tower. Take the rope with both hands over your shoulders, holding it to your upper chest. This will be your starting position. Perform the movement by flexing the spine, crunching the weight down as far as you can. Hold the peak contraction for a moment before returning to the starting position. 	t	{abdominals}	\N	\N	f
271	Lying Glute	body only	Lie on your back with your partner kneeling beside you. Flex the hip of one leg, raising it off of the floor. Rotate the leg so the foot is over the opposite hip, the lower leg perpendicular to your body. Your partner should hold the knee and ankle in place. This will be your starting position. Attempt to push your leg towards your partner, who should be preventing any actual movement of the leg. After 10-20 seconds, completely relax as your partner gently pushes the ankle and knee towards your chest. Be sure to inform your helper when the stretch is adequate to prevent injury or overstretching. 	f	{glutes}	{abductors}	\N	f
272	Kettlebell Pistol Squat	kettlebells	Pick up a kettlebell with two hands and hold it by the horns. Hold one leg off of the floor and squat down on the other. Squat down by flexing the knee and sitting back with the hips, holding the kettlebell up in front of you. Hold the bottom position for a second and then reverse the motion, driving through the heel and keeping your head and chest up. Lower yourself again and repeat. 	f	{quadriceps}	{calves,glutes,hamstrings,shoulders}	\N	f
273	Bench Press - Powerlifting	barbell	Begin by lying on the bench, getting your head beyond the bar if possible. Tuck your feet underneath you and arch your back. Using the bar to help support your weight, lift your shoulder off the bench and retract them, squeezing the shoulder blades together. Use your feet to drive your traps into the bench. Maintain this tight body position throughout the movement. However wide your grip, it should cover the ring on the bar. Pull the bar out of the rack without protracting your shoulders. Focus on squeezing the bar and trying to pull it apart. Lower the bar to your lower chest or upper stomach. The bar, wrist, and elbow should stay in line at all times. Pause when the barbell touches your torso, and then drive the bar up with as much force as possible. The elbows should be tucked in until lockout. 	f	{triceps}	{chest,forearms,lats,shoulders}	\N	f
274	Standing Overhead Barbell Triceps Extension	barbell	To begin, stand up holding a barbell or e-z bar using a pronated grip (palms facing forward) with your hands closer than shoulder width apart from each other. Your feet should be about shoulder width apart. Now elevate the barbell above your head until your arms are fully extended. Keep your elbows in. This will be your starting position. Keeping your upper arms close to your head and elbows in, perpendicular to the floor, lower the resistance in a semicircular motion behind your head until your forearms touch your biceps. Tip: The upper arms should remain stationary and only the forearms should move. Breathe in as you perform this step. Go back to the starting position by using the triceps to raise the barbell. Breathe out as you perform this step. Repeat for the recommended amount of repetitions. 	t	{triceps}	{shoulders}	\N	f
275	Reverse Crunch	body only	Lie down on the floor with your legs fully extended and arms to the side of your torso with the palms on the floor. Your arms should be stationary for the entire exercise. Move your legs up so that your thighs are perpendicular to the floor and feet are together and parallel to the floor. This is the starting position. While inhaling, move your legs towards the torso as you roll your pelvis backwards and you raise your hips off the floor. At the end of this movement your knees will be touching your chest. Hold the contraction for a second and move your legs back to the starting position while exhaling. Repeat for the recommended amount of repetitions. 	t	{abdominals}	\N	\N	f
276	Smith Machine Decline Press	machine	Position a decline bench in the rack so that the bar will be above your chest. Load an appropriate weight and take your place on the bench. Rotate the bar to unhook it from the rack and fully extend your arms. Your back should be slightly arched and your shoulder blades retracted. This will be your starting position. Begin the movement by flexing your arms, lowering the bar to your chest. Pause briefly, and then extend your arms to push the weight back to the starting position. After completing the desired number of repetitions, rotate the bar to rack the weight. 	f	{chest}	{shoulders,triceps}	\N	f
277	Body Tricep Press	body only	Position a bar in a rack at chest height. Standing, take a shoulder width grip on the bar and step a yard or two back, feet together and arms extended so that you are leaning on the bar. This will be your starting position. Begin by flexing the elbow, lowering yourself towards the bar. Pause, and then reverse the motion by extending the elbows. Progress from bodyweight by adding chains over your shoulders. 	t	{triceps}	\N	\N	f
278	Side Jackknife	body only	Lie on your side with your bottom arm extended for support and your top hand behind your head. Simultaneously lift your top leg and upper body, bringing your elbow toward your knee in a controlled motion. Squeeze your obliques at the top, then slowly lower back to the starting position. Repeat for the desired reps before switching sides.	f	{abdominals}	\N	\N	f
279	Flat Bench Lying Leg Raise	body only	Lie with your back flat on a bench and your legs extended in front of you off the end. Place your hands either under your glutes with your palms down or by the sides holding on to the bench. This will be your starting position. As you keep your legs extended, straight as possible with your knees slightly bent but locked raise your legs until they make a 90-degree angle with the floor. Exhale as you perform this portion of the movement and hold the contraction at the top for a second. Now, as you inhale, slowly lower your legs back down to the starting position. 	t	{abdominals}	\N	\N	f
284	Rope Climb	other	Grab the rope with both hands above your head. Pull down on the rope as you take a small jump. Wrap the rope around one leg, using your feet to pinch the rope. Reach up as high as possible with your arms, gripping the rope tightly. Release the rope from your feet as you pull yourself up with your arms, bringing your knees towards your chest. Resecure your feet on the rope, and then stand up to take another high hold on the rope. Continue until you reach the top of the rope. To lower yourself, loosen the grip of your feet on the rope as you slide down using a hand over hand motion. 	f	{lats}	{biceps,forearms,"middle back",shoulders}	\N	f
285	Clean and Press	barbell	Assume a shoulder-width stance, with knees inside the arms. Now while keeping the back flat, bend at the knees and hips so that you can grab the bar with the arms fully extended and a pronated grip that is slightly wider than shoulder width. Point the elbows out to sides. The bar should be close to the shins. Position the shoulders over or slightly ahead of the bar. Establish a flat back posture. This will be your starting position. Begin to pull the bar by extending the knees. Move your hips forward and raise the shoulders at the same rate while keeping the angle of the back constant; continue to lift the bar straight up while keeping it close to your body. As the bar passes the knee, extend at the ankles, knees, and hips forcefully, similar to a jumping motion. As you do so, continue to guide the bar with your hands, shrugging your shoulders and using the momentum from your movement to pull the bar as high as possible. The bar should travel close to your body, and you should keep your elbows out. At maximum elevation, your feet should clear the floor and you should start to pull yourself under the bar. The mechanics of this could change slightly, depending on the weight used. You should descend into a squatting position as you pull yourself under the bar. As the bar hits terminal height, rotate your elbows around and under the bar. Rack the bar across the front of the shoulders while keeping the torso erect and flexing the hips and knees to absorb the weight of the bar. Stand to full height, holding the bar in the clean position. Without moving your feet, press the bar overhead as you exhale. Lower the bar under control . 	f	{shoulders}	{abdominals,calves,glutes,hamstrings,"lower back","middle back",quadriceps,shoulders,traps,triceps}	\N	f
286	Oblique Crunches - On The Floor	body only	Start out by lying on your right side with your legs lying on top of each other. Make sure your knees are bent a little bit. Place your left hand behind your head. Once you are in this set position, begin by moving your left elbow up as you would perform a normal crunch except this time the main emphasis is on your obliques. Crunch as high as you can, hold the contraction for a second and then slowly drop back down into the starting position. Remember to breathe in during the eccentric (lowering) part of the exercise and to breathe out during the concentric (elevation) part of the exercise. 	t	{abdominals}	\N	\N	f
287	Lying Crossover	body only	Lie on your back with your legs extended. Cross one leg over your body with the knee bent, attempting to touch the knee to the ground. Your partner should kneel beside you, holding your shoulder down with one hand and controlling the crossed leg with the other. this will be your starting position. Attempt to raise the bent knee off of the ground as your partner prevents any actual movement. After 10-20 seconds, relax the leg as your partner gently presses the knee towards the floor. Repeat with the other side. 	f	{abductors}	\N	\N	f
288	Anti-Gravity Press	barbell	Place a bar on the ground behind the head of an incline bench. Lay on the bench face down. With a pronated grip, pick the barbell up from the floor. Flex the elbows, performing a reverse curl to bring the bar near your chest. This will be your starting position. To begin, press the barbell out in front of your head by extending your elbows. Keep your arms parallel to the ground throughout the movement. Return to the starting position and repeat to complete the set. 	f	{shoulders}	{"middle back",traps,triceps}	\N	f
289	Heavy Bag Thrust	other	Utilize a heavy bag for this exercise. Assume an upright stance next to the bag, with your feet staggered, fairly wide apart. Place your hand on the bag at about chest height. This will be your starting position. Begin by twisting at the waist, pushing the bag forward as hard as possible. Perform this move quickly, pushing the bag away from your body. Receive the bag as it swings back by reversing these steps. 	f	{chest}	{abdominals,shoulders,triceps}	\N	f
290	Chain Handle Extension	other	You will need two cable handle attachments and a flat bench, as well as chains, for this exercise. Clip the middle of the chains to the handles, and position yourself on the flat bench. Your elbows should be pointing straight up. Begin by extending through the elbow, keeping your upper arm still, with your wrists pronated. Pause at the lockout, and reverse the motion to return to the starting position. 	t	{triceps}	\N	\N	f
291	One-Arm Kettlebell Jerk	kettlebells	Hold a kettlebell by the handle. Clean the kettlebell to your shoulder by extending through the legs and hips as you pull the kettlebell towards your shoulder. Rotate your wrist as you do so, so that the palm faces forward. This will be your starting position. Dip your body by bending the knees, keeping your torso upright. Immediately reverse direction, driving through the heels, in essence jumping to create momentum. As you do so, press the kettlebell overhead to lockout by extending the arms, using your body's momentum to move the weight. Receive the weight overhead by returning to a squat position underneath the weight. Keeping the weight overhead, return to a standing position. Lower the weight to perform the next repetition. 	f	{shoulders}	{calves,quadriceps,triceps}	\N	f
292	Shotgun Row	cable	Attach a single handle to a low cable. After selecting the correct weight, stand a couple feet back with a wide-split stance. Your arm should be extended and your shoulder forward. This will be your starting position. Perform the movement by retracting the shoulder and flexing the elbow. As you pull, supinate the wrist, turning the palm upward as you go. After a brief pause, return to the starting position. 	f	{lats}	{biceps,"middle back"}	\N	f
293	Front Plate Raise	other	While standing straight, hold a barbell plate in both hands at the 3 and 9 o'clock positions. Your palms should be facing each other and your arms should be extended and locked with a slight bend at the elbows and the plate should be down near your waist in front of you as far as you can go. Tip: The arms will remain in this position throughout the exercise. This will be your starting position. Slowly raise the plate as you exhale until it is a little above shoulder level. Hold the contraction for a second. Tip: make sure that you do not swing the weight or bend at the elbows. Your torso should remain stationary throughout the movement as well. As you inhale, slowly lower the plate back down to the starting position. Repeat for the recommended amount of repetitions. 	t	{shoulders}	\N	\N	f
358	Standing Biceps Stretch	other	Clasp your hands behind your back with your palms together, straighten arms and then rotate them so your palms face downward. Raise your arms up and hold until you feel a stretch in your biceps. 	t	{biceps}	{chest,shoulders}	\N	f
294	Barbell Rollout from Bench	barbell	Place a loaded barbell on the ground, near the end of a bench. Kneel with both legs on the bench, and take a medium to narrow grip on the barbell. This will be your starting position. To begin, extend through the hips to slowly roll the bar forward. As you roll out, flex the shoulder to roll the bar above your head. Ensure that your arms remain extended throughout the movement. When the bar has been moved as far forward as possible, return to the starting position. 	f	{abdominals}	{glutes,hamstrings,lats,shoulders}	\N	f
295	Smith Machine Bench Press	machine	Place a flat bench underneath the smith machine. Now place the barbell at a height that you can reach when lying down and your arms are almost fully extended. Once the weight you need is selected, lie down on the flat bench. Using a pronated grip that is wider than shoulder width, unlock the bar from the rack and hold it straight over you with your arms locked. This will be your starting position. As you breathe in, come down slowly until you feel the bar on your middle chest. After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your chest muscles. Lock your arms in the contracted position, hold for a second and then start coming down slowly again. Tip: It should take at least twice as long to go down than to come up. Repeat the movement for the prescribed amount of repetitions. When you are done, lock the bar back in the rack. 	f	{chest}	{shoulders,triceps}	\N	f
296	Seated Bent-Over One-Arm Dumbbell Triceps Extension	dumbbell	Sit down at the end of a flat bench with a dumbbell in one arm using a neutral grip (palms of the hand facing you). Bend your knees slightly and bring your torso forward, by bending at the waist, while keeping the back straight until it is almost parallel to the floor. Make sure that you keep the head up. The upper arm with the dumbbell should be close to the torso and aligned with it (lifted up until it is parallel to the floor while the forearms are pointing towards the floor as the hands hold the weights). Tip: There should be a 90-degree angle between the forearms and the upper arm. This is your starting position. Keeping the upper arm stationary, use the triceps to lift the weight as you exhale until the forearm is parallel to the floor and the whole arm is extended. Like many other arm exercises, only the forearm moves. After a second contraction at the top, slowly lower the dumbbell back to the starting position as you inhale. Repeat the movement for the prescribed amount of repetitions. Switch arms and repeat the exercise. 	t	{triceps}	\N	\N	f
297	Rope Crunch	cable	Kneel 1-2 feet in front of a cable system with a rope attached. After selecting an appropriate weight, grasp the rope with both hands reaching overhead. Your torso should be upright in the starting position. To begin, flex at the spine, attempting to bring your rib cage to your legs as you pull the cable down. Pause at the bottom of the motion, and then slowly return to the starting position. These can be done with twists or to the side to hit the obliques. 	t	{abdominals}	\N	\N	f
298	Band Good Morning (Pull Through)	bands	Loop the band around a post. Standing a little ways away, loop the opposite end around the neck. Your hands can help hold the band in position. Begin by bending at the hips, getting your butt back as far as possible. Keep your back flat and bend forward to about 90 degrees. Your knees should be only slightly bent. Return to the starting position be driving through with the hips to come back to a standing position. 	f	{hamstrings}	{glutes,"lower back"}	\N	f
299	Seated Dumbbell Inner Biceps Curl	dumbbell	Sit on the end of a flat bench with a dumbbell in each hand being held at arms length. The elbows should be close to the torso. Rotate the palms of the hands so that they are facing inward in a neutral position. This will be your starting position. While holding the upper arms stationary, curl the dumbbells out and up, turning the palms out as you lift and keeping your forearms in line with your outer deltoids. Tips: Only the forearms should move. Continue the movement until your biceps are fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a second as you squeeze the biceps. Slowly begin to bring the dumbbells back to the starting position as your breathe in. Remember to rotate your arms as you lower the dumbbells so that you can switch back to a neutral grip. Repeat for the recommended amount of repetitions. 	t	{biceps}	\N	\N	f
300	Cable Rope Rear-Delt Rows	cable	Sit in the same position on a low pulley row station as you would if you were doing seated cable rows for the back. Attach a rope to the pulley and grasp it with an overhand grip. Your arms should be extended and parallel to the floor with the elbows flared out. Keep your lower back upright and slide your hips back so that your knees are slightly bent. This will be your starting position. Pull the cable attachment towards your upper chest, just below the neck, as you keep your elbows up and out to the sides. Continue this motion as you exhale until the elbows travel slightly behind the back. Tip: Keep your upper arms horizontal, perpendicular to the torso and parallel to the floor throughout the motion. Go back to the initial position where the arms are extended and the shoulders are stretched forward. Inhale as you perform this portion of the movement. Repeat for the recommended amount of repetitions. 	f	{shoulders}	{biceps,"middle back"}	\N	f
301	Upper Back Stretch	none	Clasp fingers together with your thumbs pointing down, round your shoulders as you reach your hands forward. 	f	{"middle back"}	{"middle back"}	\N	f
302	Overhead Slam	medicine ball	Hold a medine ball with both hands and stand with your feet at shoulder width. This will be your starting position. Initiate the countermovement by raising the ball above your head and fully extending your body. Reverse the motion, slamming the ball into the ground directly in front of you as hard as you can. Receive the ball with both hands on the bounce and repeat the movement. 	f	{lats}	\N	\N	f
303	Clean from Blocks	barbell	With a barbell on boxes or stands of the desired height, take an overhand or hook grip just outside the legs. Lower your hips with the weight focused on the heels, back straight, head facing forward, chest up, with your shoulders just in front of the bar. This will be your starting position. Begin the first pull by driving through the heels, extending your knees. Your back angle should stay the same, and your arms should remain straight with the elbows pointed out. As full extension is achieved, transition into the receiving position by aggressively shrugging and flexing the arms with the elbows up and out. Aggressively pull yourself down, rotating your elbows under the bar as you do so. Receive the bar in a front squat position, the depth of which is dependent upon the height of the bar at the end of the third pull. The bar should be racked onto the protracted shoulders, lightly touching the throat with the hands relaxed. Continue to descend to the bottom squat position, which will help in the recovery. Immediately recover by driving through the heels, keeping the torso upright and elbows up. Continue until you have risen to a standing position. Return the weight to the boxes for the next rep. 	f	{quadriceps}	{calves,glutes,hamstrings,shoulders,traps}	\N	f
304	Standing Bent-Over Two-Arm Dumbbell Triceps Extension	dumbbell	With a dumbbell in each hand and the palms facing your torso, bend your knees slightly and bring your torso forward, by bending at the waist, while keeping the back straight until it is almost parallel to the floor. Make sure that you keep the head up. The upper arms should be close to the torso and parallel to the floor while the forearms are pointing towards the floor as the hands hold the weights. Tip: There should be a 90-degree angle between the forearms and the upper arm. This is your starting position. Keeping the upper arms stationary, use the triceps to lift the weights as you exhale until the forearms are parallel to the floor and the whole arms are extended. Like many other arm exercises, only the forearm moves. After a second contraction at the top, slowly lower the dumbbells back to their starting position as you inhale. Repeat the movement for the prescribed amount of repetitions. 	t	{triceps}	\N	\N	f
305	Isometric Chest Squeezes	body only	While either seating or standing, bend your arms at a 90-degree angle and place the palms of your hands together in front of your chest. Tip: Your hands should be open with the palms together and fingers facing forward (perpendicular to your torso). Push both hands against each other as you contract your chest. Start with slow tension and increase slowly. Keep breathing normally as you execute this contraction. Hold for the recommended number of seconds. Now release the tension slowly. Rest for the recommended amount of time and repeat. 	f	{chest}	{shoulders,triceps}	\N	f
306	Cable Reverse Crunch	cable	Connect an ankle strap attachment to a low pulley cable and position a mat on the floor in front of it. Sit down with your feet toward the pulley and attach the cable to your ankles. Lie down, elevate your legs and bend your knees at a 90-degree angle. Your legs and the cable should be aligned. If not, adjust the pulley up or down until they are. With your hands behind your head, bring your knees inward to your torso and elevate your hips off the floor. Pause for a moment and in a slow and controlled manner drop your hips and bring your legs back to the starting 90-degree angle. You should still have tension on your abs in the resting position. Repeat the same movement to failure. 	t	{abdominals}	\N	\N	f
307	Cable Rear Delt Fly	cable	Adjust the pulleys to the appropriate height and adjust the weight. The pulleys should be above your head. Grab the left pulley with your right hand and the right pulley with your left hand, crossing them in front of you. This will be your starting position. Initiate the movement by moving your arms back and outward, keeping your arms straight as you execute the movement. Pause at the end of the motion before returning the handles to the start position. 	t	{shoulders}	\N	\N	f
308	Leg Lift	body only	While standing up straight with both feet next to each other at around shoulder width, grab a sturdy surface such as the sides of a squat rack or the top of a chair to brace yourself and keep balance. With or without an ankle weight, lift one leg behind you as if performing a leg curl but standing up while keeping the other leg straight. Breathe out as you perform this movement. Slowly bring the raised leg back to the floor as you breathe in. Repeat for the recommended amount of repetitions. Repeat the movement with the opposite leg. 	t	{glutes}	{hamstrings}	\N	f
309	Circus Bell	other	The circus bell is an oversized dumbbell with a thick handle. Begin with the dumbbell between your feet, and grip the handle with both hands. Clean the dumbbell by extending through your hips and knees to deliver the implement to the desired shoulder, letting go with the extra hand. Ensure that you get one of the dumbbell heads behind the shoulder to keep from being thrown off balance. To raise it overhead, dip by flexing the knees, and the drive upwards as you extend the dumbbell overhead, leaning slightly away from it as you do so. Carefully guide the bell back to the floor, keeping it under control as much as possible. It is best to perform this event on a thick rubber mat to prevent damage to the floor. 	f	{shoulders}	{forearms,glutes,hamstrings,"lower back",traps,triceps}	\N	f
310	Intermediate Groin Stretch	other	Lie on your back with your legs extended. Loop a belt, rope, or band around one of your feet, and swing that leg as far to the side as you can. This will be your starting position. Pull gently on the belt to create tension in your groin and hamstring muscles. Hold for 10-20 seconds, and repeat on the other side. 	t	{hamstrings}	\N	\N	f
311	Concentration Curls	dumbbell	Sit down on a flat bench with one dumbbell in front of you between your legs. Your legs should be spread with your knees bent and feet on the floor. Use your right arm to pick the dumbbell up. Place the back of your right upper arm on the top of your inner right thigh. Rotate the palm of your hand until it is facing forward away from your thigh. Tip: Your arm should be extended and the dumbbell should be above the floor. This will be your starting position. While holding the upper arm stationary, curl the weights forward while contracting the biceps as you breathe out. Only the forearms should move. Continue the movement until your biceps are fully contracted and the dumbbells are at shoulder level. Tip: At the top of the movement make sure that the little finger of your arm is higher than your thumb. This guarantees a good contraction. Hold the contracted position for a second as you squeeze the biceps. Slowly begin to bring the dumbbells back to starting position as your breathe in. Caution: Avoid swinging motions at any time. Repeat for the recommended amount of repetitions. Then repeat the movement with the left arm. 	t	{biceps}	{forearms}	\N	f
312	Carioca Quick Step	none	Begin with your feet a few inches apart and your left arm up in a relaxed, athletic position. With your right foot, quick step behind and pull the knee up. Fire your arms back up when you pull the right knee, being sure that your knee goes straight up and down. Avoid turning your feet as you move and continue to look forward as you move to the side. 	f	{adductors}	{abdominals,abductors,calves,glutes,hamstrings,quadriceps}	\N	f
313	Dumbbell Shoulder Press	dumbbell	While holding a dumbbell in each hand, sit on a military press bench or utility bench that has back support. Place the dumbbells upright on top of your thighs. Now raise the dumbbells to shoulder height one at a time using your thighs to help propel them up into position. Make sure to rotate your wrists so that the palms of your hands are facing forward. This is your starting position. Now, exhale and push the dumbbells upward until they touch at the top. Then, after a brief pause at the top contracted position, slowly lower the weights back down to the starting position while inhaling. Repeat for the recommended amount of repetitions. 	f	{shoulders}	{triceps}	\N	f
369	Lying Prone Quadriceps	body only	Lay face down on the floor with your partner kneeling beside you. Flex one knee and raise that leg off the ground, attempting to touch your glutes with your foot. Your partner should hold the knee and ankle. This will be your starting position. Attempt to extend your knee while your partner prevents any actual movement. After 10-20 seconds, relax your muscles as your partner gently pushes the foot towards your glutes, further stretching the quadriceps and hip flexors. After 10-20 seconds, switch sides. 	f	{quadriceps}	\N	\N	f
314	Low Cable Triceps Extension	cable	Select the desired weight and lay down face up on the bench of a seated row machine that has a rope attached to it. Your head should be pointing towards the attachment. Grab the outside of the rope ends with your palms facing each other (neutral grip). Position your elbows so that they are bent at a 90 degree angle and your upper arms are perpendicular (90 degree angle) to your torso. Tip: Keep the elbows in and make sure that the upper arms point to the ceiling while your forearms point towards the pulley above your head. This will be your starting position. As you breathe out, extend your lower arms until they are straight and vertical. The upper arms and elbows remain stationary throughout the movement. Only the forearms should move. Contract the triceps hard for a second. As you breathe in slowly return to the starting position. Repeat for the recommended amount of repetitions. 	t	{triceps}	\N	\N	f
315	Triceps Pushdown	cable	Attach a straight or angled bar to a high pulley and grab with an overhand grip (palms facing down) at shoulder width. Standing upright with the torso straight and a very small inclination forward, bring the upper arms close to your body and perpendicular to the floor. The forearms should be pointing up towards the pulley as they hold the bar. This is your starting position. Using the triceps, bring the bar down until it touches the front of your thighs and the arms are fully extended perpendicular to the floor. The upper arms should always remain stationary next to your torso and only the forearms should move. Exhale as you perform this movement. After a second hold at the contracted position, bring the bar slowly up to the starting point. Breathe in as you perform this step. Repeat for the recommended amount of repetitions. 	t	{triceps}	\N	\N	f
316	One Arm Dumbbell Preacher Curl	dumbbell	Grab a dumbbell with the right arm and place the upper arm on top of the preacher bench or the incline bench. The dumbbell should be held at shoulder length. This will be your starting position. As you breathe in, slowly lower the dumbbell until your upper arm is extended and the biceps is fully stretched. As you exhale, use the biceps to curl the weight up until your biceps is fully contracted and the dumbbell is at shoulder height. Again, remember that to ensure full contraction you need to bring that small finger higher than the thumb. Squeeze the biceps hard for a second at the contracted position and repeat for the recommended amount of repetitions. Switch arms and repeat the movement. 	t	{biceps}	\N	\N	f
317	Bradford/Rocky Presses	barbell	Sit on a Military Press Bench with a bar at shoulder level with a pronated grip (palms facing forward). Tip: Your grip should be wider than shoulder width and it should create a 90-degree angle between the forearm and the upper arm as the barbell goes down. This is your starting position. Once you pick up the barbell with the correct grip, lift the bar up over your head by locking your arms. Now lower the bar down to the back of the head slowly as you inhale. Lift the bar back up to the starting position as you exhale. Lower the bar down to the starting position slowly as you inhale. This is one repetition. Alternate in this manner until you complete the recommended amount of repetitions. 	f	{shoulders}	{triceps}	\N	f
318	Single-Leg High Box Squat	other	Position a box in a rack. Secure a band or rope in place above the box. Standing in front of it, step onto the box to a full standing position, letting your other leg remain unsupported. Hold onto the band for balance . Continue stepping up and down on the same leg before switching to the opposite side. 	f	{quadriceps}	{glutes,hamstrings}	\N	f
319	Weighted Squat	other	Start by positioning two flat benches shoulder width apart from each other. Stand on top of them and wrap the weighted belt around your waist with the amount of weight you feel comfortable with. Make sure your toes are facing out. Once you are standing straight up with the weight hanging in between your legs, position your arms so that they are fully extended to the side of your body. This is the starting position. Begin by bending the knees as you maintain a straight posture with the head up. Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees (which is the point in which the upper legs are below parallel to the floor). Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that are perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly. Begin to move the body back up by pushing the floor of the flat bench with the ball of your foot mainly as you straighten the legs again and go back to the starting position. Exhale as you perform this portion of the exercise. Repeat for the recommended amount of repetitions. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
320	Kneeling Single-Arm High Pulley Row	cable	Attach a single handle to a high pulley and make your weight selection. Kneel in front of the cable tower, taking the cable with one hand with your arm extended. This will be your starting position. Starting with your palm facing forward, pull the weight down to your torso by flexing the elbow and retract the shoulder blade. As you do so, rotate the wrist so that at the completion of the movement, your palm is now facing you. After a brief pause, return to the starting position. 	f	{lats}	{biceps,"middle back"}	\N	f
321	One-Arm High-Pulley Cable Side Bends	cable	Connect a standard handle to a tower. Move cable to highest pulley position. Stand with side to cable. With one hand, reach up and grab handle with underhand grip. Pull down cable until elbow touches your side and the handle is by your shoulder. Position feet hip-width apart. Place free hand on hip to help gauge pivot point. Keep arm in static position. Contract oblique to bring the weight down in a side crunch. Once you reach maximum contraction, slowly release the weight to the starting position. The weight stack should never be unloaded in a resting position. The aim is constant tension during the set. Repeat to failure. Then, reposition and repeat the same series of movements on the opposite side. 	t	{abdominals}	\N	\N	f
322	Ab Crunch Machine	machine	Select a light resistance and sit down on the ab machine placing your feet under the pads provided and grabbing the top handles. Your arms should be bent at a 90 degree angle as you rest the triceps on the pads provided. This will be your starting position. At the same time, begin to lift the legs up as you crunch your upper torso. Breathe out as you perform this movement. Tip: Be sure to use a slow and controlled motion. Concentrate on using your abs to move the weight while relaxing your legs and feet. After a second pause, slowly return to the starting position as you breathe in. Repeat the movement for the prescribed amount of repetitions. 	t	{abdominals}	\N	\N	f
323	Dumbbell Alternate Bicep Curl	dumbbell	Stand (torso upright) with a dumbbell in each hand held at arms length. The elbows should be close to the torso and the palms of your hand should be facing your thighs. While holding the upper arm stationary, curl the right weight as you rotate the palm of the hands until they are facing forward. At this point continue contracting the biceps as you breathe out until your biceps is fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a second as you squeeze the biceps. Tip: Only the forearms should move. Slowly begin to bring the dumbbell back to the starting position as your breathe in. Tip: Remember to twist the palms back to the starting position (facing your thighs) as you come down. Repeat the movement with the left hand. This equals one repetition. Continue alternating in this manner for the recommended amount of repetitions. 	t	{biceps}	{forearms}	\N	f
324	Standing Soleus And Achilles Stretch	none	Stand with your feet hip-distance apart, one foot slightly in front of the other. Bend both knees, keeping your back heel on the floor. Switch sides. 	t	{calves}	\N	\N	f
325	Bench Press with Chains	barbell	Adjust the leader chain, shortening it to the desired length.Place the chains on the sleeves of the bar. Lying on the bench, get your head beyond the bar if possible. Tuck your feet underneath you and arch your back. Using the bar to help support your weight, lift your shoulder off the bench and retract them, squeezing the shoulder blades together. Use your feet to drive your traps into the bench. Maintain this tight body position throughout the movement. However wide your grip, it should cover the ring on the bar. Pull the bar out of the rack without protracting your shoulders. Focus on squeezing the bar and trying to pull it apart. Lower the bar to your lower chest or upper stomach. The bar, wrist, and elbow should stay in line at all times. Pause when the barbell touches your torso, and then drive the bar up with as much force as possible. The elbows should be tucked in until lockout. 	f	{triceps}	{chest,lats,shoulders}	\N	f
326	Landmine Linear Jammer	barbell	Position a bar into landmine or, lacking one, securely anchor it in a corner. Load the bar to an appropriate weight and position the handle attachment on the bar. Raise the bar from the floor, taking the handles to your shoulders. This will be your starting position. In an athletic stance, squat by flexing your hips and setting your hips back, keeping your arms flexed. Reverse the motion by powerfully extending through the hips, knees, and ankles, while also extending the elbows to straighten the arms. This movement should be done explosively, coming out of the squat to full extension as powerfully as possible. Return to the starting position. 	f	{shoulders}	{abdominals,calves,chest,hamstrings,quadriceps,triceps}	\N	f
327	Isometric Wipers	body only	Assume a push-up position, supporting your weight on your hands and toes while keeping your body straight. Your hands should be just outside of shoulder width. This will be your starting position. Begin by shifting your body weight as far to one side as possible, allowing the elbow on that side to flex as you lower your body. Reverse the motion by extending the flexed arm, pushing yourself up and then dropping to the other side. Repeat for the desired number of repetitions. 	f	{chest}	{abdominals,shoulders,triceps}	\N	f
328	Scapular Pull-Up	none	Take a pronated grip on a pull-up bar. From a hanging position, raise yourself a few inches without using your arms. Do this by depressing your shoulder girdle in a reverse shrugging motion. Pause at the completion of the movement, and then slowly return to the starting position before performing more repetitions. 	t	{traps}	{lats,"middle back"}	\N	f
329	Seated Dumbbell Palms-Down Wrist Curl	dumbbell	Start out by placing two dumbbells on the floor in front of a flat bench. Sit down on the edge of the flat bench with your legs at about shoulder width apart. Make sure to keep your feet on the floor. Use your arms to grab both of the dumbbells and bring them up so that your forearms are resting against your thighs with the palms of the hands facing down. Your wrists should be hanging over the edge of your thighs. Start out by curling your wrist upwards and exhaling. Slowly lower your wrists back down to the starting position while inhaling. Make sure to inhale during this part of the exercise. Tip: Your forearms should be stationary as your wrist is the only movement needed to perform this exercise. Repeat for the recommended amount of repetitions. When finished, simply lower the dumbbells to the floor. 	t	{forearms}	\N	\N	f
330	Two-Arm Kettlebell Military Press	kettlebells	Clean two kettlebells to your shoulders. Clean the kettlebells to your shoulders by extending through the legs and hips as you swing the kettlebells towards your shoulders. Rotate your wrists as you do so, so that the palms face forward. Press the kettlebells up and out. As the kettlebells pass your head, lean into the weights so that the kettlebells are racked behind your head. Make sure to contract your lats, butt, and stomach for added stability. 	f	{shoulders}	{triceps}	\N	f
331	Ankle Circles	none	Use a sturdy object like a squat rack to hold yourself. Lift the right leg in the air (just around 2 inches from the floor) and perform a circular motion with the big toe. Pretend that you are drawing a big circle with it. Tip: One circle equals 1 repetition. Breathe normally as you perform the movement. When you are done with the right foot, then repeat with the left leg. 	t	{calves}	\N	\N	f
332	Seated Dumbbell Palms-Up Wrist Curl	dumbbell	Start out by placing two dumbbells on the floor in front of a flat bench. Sit down on the edge of the flat bench with your legs at about shoulder width apart. Make sure to keep your feet on the floor. Use your arms to grab both of the dumbbells and bring them up so that your forearms are resting against your thighs with the palms of the hands facing up. Your wrists should be hanging over the edge of your thighs. Start out by curling your wrist upwards and exhaling. Slowly lower your wrists back down to the starting position while inhaling. Make sure to inhale during this part of the exercise. Tip: Your forearms should be stationary as your wrist is the only movement needed to perform this exercise. Repeat for the recommended amount of repetitions. When finished, simply lower the dumbbells to the floor. 	t	{forearms}	\N	\N	f
333	Arm Circles	none	Stand up and extend your arms straight out by the sides. The arms should be parallel to the floor and perpendicular (90-degree angle) to your torso. This will be your starting position. Slowly start to make circles of about 1 foot in diameter with each outstretched arm. Breathe normally as you perform the movement. Continue the circular motion of the outstretched arms for about ten seconds. Then reverse the movement, going the opposite direction. 	t	{shoulders}	{traps}	\N	f
334	Side Leg Raises	body only	Stand next to a chair, which you may hold onto as a support. Stand on one leg. This will be your starting position. Keeping your leg straight, raise it as far out to the side as possible, and swing it back down, allowing it to cross the opposite leg. Repeat this swinging motion 5-10 times, increasing the range of motion as you do so. 	f	{adductors}	\N	\N	f
335	Snatch Balance	barbell	Begin with the feet in the pulling position, the bar racked across the back of the shoulders, and the hands placed in a wide snatch grip. Pop the bar with an abrupt dip and drive of the knees, and aggressively drive under the bar, transitioning the feet into the receiving position. Receive the bar locked out overhead near the bottom of the squat. The torso should remain vertical, lowering the hips between the legs. Continue to descend to full depth, and return to a standing position. Carefully lower the weight. 	f	{quadriceps}	{calves,glutes,hamstrings,shoulders,triceps}	\N	f
336	High Cable Curls	cable	Stand between a couple of high pulleys and grab a handle in each arm. Position your upper arms in a way that they are parallel to the floor with the palms of your hands facing you. This will be your starting position. Curl the handles towards you until they are next to your ears. Make sure that as you do so you flex your biceps and exhale. The upper arms should remain stationary and only the forearms should move. Hold for a second in the contracted position as you squeeze the biceps. Slowly bring back the arms to the starting position. Repeat for the recommended amount of repetitions. 	f	{biceps}	\N	\N	f
337	Flat Bench Leg Pull-In	body only	Lie on an exercise mat or a flat bench with your legs off the end. Place your hands either under your glutes with your palms down or by the sides holding on to the bench (or with palms down by the side on an exercise mat). Also extend your legs straight out. This will be your starting position. Bend your knees and pull your upper thighs into your midsection as you breathe out. Continue this movement until your knees are near your chest. Hold the contracted position for a second. As you breathe in, slowly return to the starting position. Repeat for the recommended amount of repetitions. 	f	{abdominals}	\N	\N	f
338	Kettlebell One-Legged Deadlift	kettlebells	Hold a kettlebell by the handle in one hand. Stand on one leg, on the same side that you hold the kettlebell. Keeping that knee slightly bent, perform a stiff legged deadlift by bending at the hip, extending your free leg behind you for balance. Continue lowering the kettlebell until you are parallel to the ground, and then return to the upright position. 	f	{hamstrings}	{glutes,"lower back"}	\N	f
339	Calf Stretch Hands Against Wall	none	Stand facing a wall from several feet away. Stagger your stance, placing one foot forward. Lean forward and rest your hands on the wall, keeping your heel, hip and head in a straight line. Attempt to keep your heel on the ground. Hold for 10-20 seconds and then switch sides. 	t	{calves}	\N	\N	f
340	Band Pull Apart	bands	Begin with your arms extended straight out in front of you, holding the band with both hands. Initiate the movement by performing a reverse fly motion, moving your hands out laterally to your sides. Keep your elbows extended as you perform the movement, bringing the band to your chest. Ensure that you keep your shoulders back during the exercise. Pause as you complete the movement, returning to the starting position under control. 	t	{shoulders}	{"middle back",traps}	\N	f
341	One-Arm Side Deadlift	barbell	Stand to the side of a barbell next to its center. Bend your knees and lower your body until you are able to reach the barbell. Grasp the bar as if you were grabbing a briefcase (palms facing you since the bar is sideways). You may need a wrist wrap if you are using a significant amount of weight. This is your starting position. Use your legs to help lift the barbell up while exhaling. Your arms should extend fully as bring the barbell up until you are in a standing position. Slowly bring the barbell back down while inhaling. Tip: Make sure to bend your knees while lowering the weight to avoid any injury from occurring. Repeat for the recommended amount of repetitions. Switch arms and repeat the movement. 	f	{quadriceps}	{abdominals,calves,glutes,hamstrings,"lower back",traps}	\N	f
342	Balance Board	other	Place a balance board in front of you. Stand up on it and try to balance yourself. Hold the balance for as long as desired. 	f	{calves}	{hamstrings,quadriceps}	\N	f
343	Side Lying Groin Stretch	none	Start off by lying on your right side and bend your right knee in front of you to stabilize the torso. Rest your head on your right hand or shoulder. Lift your left leg upward and hold it by the back of the knee (easier) or the foot (harder). Pull your left knee in toward your left shoulder and simultaneously press your foot or knee down to the floor. To intensify this stretch, straighten your left leg. Switch sides. 	t	{adductors}	{hamstrings}	\N	f
344	Double Kettlebell Jerk	kettlebells	Hold a kettlebell by the handle in each hand. Clean the kettlebells to your shoulders by extending through the legs and hips as you pull the kettlebells towards your shoulders. Rotate your wrists as you do so, so that the palms face forward. This will be your starting position. Dip your body by bending the knees, keeping your torso upright. Immediately reverse direction, driving through the heels, in essence jumping to create momentum. As you do so, press the kettlebells overhead to lockout by extending the arms, using your body's momentum to move the weights. Return your feet to the ground in a split fashion, with one foot forward and one foot back. Keeping the weights overhead, return to a standing position, bringing your feet together. Lower the weights to perform the next repetition. 	f	{shoulders}	{calves,quadriceps,triceps}	\N	f
345	Front Cone Hops (or hurdle hops)	other	Set up a row of cones or other small barriers, placing them a few feet apart. Stand in front of the first cone with your feet shoulder width apart. This will be your starting position. Begin by jumping with both feet over the first cone, swinging both arms as you jump. Absorb the impact of landing by bending the knees, rebounding out of the first leap by jumping over the next cone. Continue until you have jumped over all of the cones. 	f	{quadriceps}	{abductors,adductors,calves,glutes,hamstrings}	\N	f
346	Pushups	body only	Lie on the floor face down and place your hands about 36 inches apart while holding your torso up at arms length. Next, lower yourself downward until your chest almost touches the floor as you inhale. Now breathe out and press your upper body back up to the starting position while squeezing your chest. After a brief pause at the top contracted position, you can begin to lower yourself downward again for as many repetitions as needed. 	f	{chest}	{shoulders,triceps}	\N	f
347	Stride Jump Crossover	other	Stand to the side of a box with your inside foot on top of it, close to the edge. Begin by swinging the arms upward as you push through the top leg, jumping upward as high as possible. Attempt to drive the opposite knee upward. Land in the opposite position that you started, on the opposite side of the box. The foot that was initially on the box will now be on the ground, with the opposite foot now on the box. Repeat the movement, crossing back over to the other side. 	f	{quadriceps}	{abductors,adductors,calves,hamstrings}	\N	f
348	Squats - With Bands	bands	To start out, make sure that the exercise band is at an even split between both the left and right side of the body. To do this, use your hands to grab both sides of the band and place both feet in the middle of the band. Your feet should be shoulder width apart from each other. When holding the bands, they should be the same height on each side. You should be using a pronated grip (palms facing forward) and have the handles of the bands next to your face for this exercise. This is the starting position. Slowly start to bend the knees and lower the legs so that your thighs are parallel to the floor while exhaling. Use the heel of your feet to push your body up to the starting position as you exhale. Repeat for the recommended amount of repetitions. 	f	{quadriceps}	{calves,glutes,hamstrings,"lower back"}	\N	f
349	Triceps Overhead Extension with Rope	cable	Attach a rope to a low pulley. After selecting an appropriate weight, grasp the rope with both hands and face away from the cable. Position your hands behind your head with your elbows point straight up. Your elbows should start out flexed, and you can stagger your stance and lean gently away from the machine to create greater stability. This will be your starting position. To perform the movement, extend through the elbow while keeping the upper arm in position, raising your hands above your head. Squeeze your triceps at the top of the movement, and slowly lower the weight back to the start position. 	t	{triceps}	\N	\N	f
350	Bent Over Two-Dumbbell Row	dumbbell	With a dumbbell in each hand (palms facing your torso), bend your knees slightly and bring your torso forward by bending at the waist; as you bend make sure to keep your back straight until it is almost parallel to the floor. Tip: Make sure that you keep the head up. The weights should hang directly in front of you as your arms hang perpendicular to the floor and your torso. This is your starting position. While keeping the torso stationary, lift the dumbbells to your side (as you breathe out), keeping the elbows close to the body (do not exert any force with the forearm other than holding the weights). On the top contracted position, squeeze the back muscles and hold for a second. Slowly lower the weight again to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	f	{"middle back"}	{biceps,lats,shoulders}	\N	f
351	Linear Acceleration Wall Drill	none	Lean at around 45 degrees against a wall. Your feet should be together, glutes contracted. Begin by lifting your right knee quickly, pausing, and then driving it straight down into the ground. Switch legs, raising the opposite knee, and then attacking the ground straight down. Repeat once more with your right leg, and as soon as the right foot strikes the ground hammer them out rapidly, alternating left and right as fast as you can. 	f	{hamstrings}	{calves,glutes,quadriceps}	\N	f
352	Seated Good Mornings	barbell	Set up a box in a power rack. The pins should be set at an appropriate height. Begin by stepping under the bar and placing it across the back of the shoulders, not on top of your traps. Squeeze your shoulder blades together and rotate your elbows forward, attempting to bend the bar across your shoulders. Remove the bar from the rack, creating a tight arch in your lower back. Keep your head facing forward. With your back, shoulders, and core tight, push your knees and butt out and you begin your descent. Sit back with your hips until you are seated on the box. This will be your starting position. Keeping the bar tight, bend forward at the hips as much as possible. If you set the pins to what would be parallel, you not only have a safety if you fail, but know when to stop. Pause just above the pins and reverse the motion until your torso it upright. 	f	{"lower back"}	{glutes}	\N	f
353	Dips - Triceps Version	body only	To get into the starting position, hold your body at arm's length with your arms nearly locked above the bars. Now, inhale and slowly lower yourself downward. Your torso should remain upright and your elbows should stay close to your body. This helps to better focus on tricep involvement. Lower yourself until there is a 90 degree angle formed between the upper arm and forearm. Then, exhale and push your torso back up using your triceps to bring your body back to the starting position. Repeat the movement for the prescribed amount of repetitions. 	f	{triceps}	{chest,shoulders}	\N	f
354	Seated Flat Bench Leg Pull-In	body only	Sit on a bench with the legs stretched out in front of you slightly below parallel and your arms holding on to the sides of the bench. Your torso should be leaning backwards around a 45-degree angle from the bench. This will be your starting position. Bring the knees in toward you as you move your torso closer to them at the same time. Breathe out as you perform this movement. After a second pause, go back to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	f	{abdominals}	\N	\N	f
355	Smith Machine Reverse Calf Raises	machine	Adjust the barbell on the smith machine to fit your height and align a raised platform right under the bar. Stand on the platform with the heels of your feet secured on top of it with the balls of your feet extending off it. Position your toes facing forward with a shoulder width stance. Now, place your shoulders under the barbell while maintaining the foot positioning described and push the barbell up by extending your hips and knees until your torso is standing erect. The knees should be kept with a slight bend; never locked. This will be your starting position. Tip: The barbell on your back is only for balance purposes. Raise the balls of your feet as you breathe out by extending your toes as high as possible and flexing your calf. Ensure that the knee is kept stationary at all times. There should be no bending at any time. Hold the contracted position for a second before you start to go back down. Slowly go back down to the starting position as you breathe in by lowering the balls of your feet and toes. Repeat for the recommended amount of repetitions. 	t	{calves}	\N	\N	f
356	Barbell Side Split Squat	barbell	Stand up straight while holding a barbell placed on the back of your shoulders (slightly below the neck). Your feet should be placed wide apart with the foot of the lead leg angled out to the side. This will be your starting position. Lower your body towards the side of your angled foot by bending the knee and hip of your lead leg and while keeping the opposite leg only slightly bent. Breathe in as you lower your body. Return to the starting position by extending the hip and knee of the lead leg. Breathe out as you perform this movement. After performing the recommended amount of reps, repeat the movement with the opposite leg. 	f	{quadriceps}	{calves,hamstrings,"lower back"}	\N	f
357	Barbell Walking Lunge	barbell	Begin standing with your feet shoulder width apart and a barbell across your upper back. Step forward with one leg, flexing the knees to drop your hips. Descend until your rear knee nearly touches the ground. Your posture should remain upright, and your front knee should stay above the front foot. Drive through the heel of your lead foot and extend both knees to raise yourself back up. Step forward with your rear foot, repeating the lunge on the opposite leg. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
359	One-Arm Kettlebell Split Jerk	kettlebells	Hold a kettlebell by the handle. Clean the kettlebell to your shoulder by extending through the legs and hips as you pull the kettlebell towards your shoulder. Rotate your wrist as you do so, so that the palm faces forward. This will be your starting position. Dip your body by bending the knees, keeping your torso upright. Immediately reverse direction, driving through the heels, in essence jumping to create momentum. As you do so, press the kettlebell overhead to lockout by extending the arms, using your body's momentum to move the weight. Receive the weight overhead by returning to a squat position underneath the weight, positioning one leg in front of you and one leg behind you. Keeping the weight overhead, return to a standing position and bring your feet together. Lower the weight to perform the next repetition. 	f	{shoulders}	{glutes,hamstrings,quadriceps,triceps}	\N	f
360	Kettlebell Arnold Press	kettlebells	Clean a kettlebell to your shoulder. Clean the kettlebell to your shoulder by extending through the legs and hips as you raise the kettlebell towards your shoulder. The palm should be facing inward. Looking straight ahead, press the kettlebell out and overhead, rotating your wrist so that your palm faces forward at the top of the motion. Return the kettlebell to the starting position, with the palm facing in. 	f	{shoulders}	{triceps}	\N	f
361	Romanian Deadlift	barbell	Put a barbell in front of you on the ground and grab it using a pronated (palms facing down) grip that a little wider than shoulder width. Tip: Depending on the weight used, you may need wrist wraps to perform the exercise and also a raised platform in order to allow for better range of motion. Bend the knees slightly and keep the shins vertical, hips back and back straight. This will be your starting position. Keeping your back and arms completely straight at all times, use your hips to lift the bar as you exhale. Tip: The movement should not be fast but steady and under control. Once you are standing completely straight up, lower the bar by pushing the hips back, only slightly bending the knees, unlike when squatting. Tip: Take a deep breath at the start of the movement and keep your chest up. Hold your breath as you lower and exhale as you complete the movement. Repeat for the recommended amount of repetitions. 	f	{hamstrings}	{calves,glutes,"lower back"}	\N	f
362	Seated Triceps Press	dumbbell	Sit down on a bench with back support and grasp a dumbbell with both hands and hold it overhead at arm's length. Tip: a better way is to have somebody hand it to you especially if it is very heavy. The resistance should be resting in the palms of your hands with your thumbs around it. The palm of the hand should be facing inward. This will be your starting position. Keeping your upper arms close to your head (elbows in) and perpendicular to the floor, lower the resistance in a semi-circular motion behind your head until your forearms touch your biceps. Tip: The upper arms should remain stationary and only the forearms should move. Breathe in as you perform this step. Go back to the starting position by using the triceps to raise the dumbbell. Breathe out as you perform this step. Repeat for the recommended amount of repetitions. 	t	{triceps}	\N	\N	f
363	Cable Rope Overhead Triceps Extension	cable	Attach a rope to the bottom pulley of the pulley machine. Grasping the rope with both hands, extend your arms with your hands directly above your head using a neutral grip (palms facing each other). Your elbows should be in close to your head and the arms should be perpendicular to the floor with the knuckles aimed at the ceiling. This will be your starting position. Slowly lower the rope behind your head as you hold the upper arms stationary. Inhale as you perform this movement and pause when your triceps are fully stretched. Return to the starting position by flexing your triceps as you breathe out. Repeat for the recommended amount of repetitions. 	t	{triceps}	\N	\N	f
364	Reverse Triceps Bench Press	barbell	Lie back on a flat bench. Using a close, supinated grip (around shoulder width), lift the bar from the rack and hold it straight over you with your arms locked extended in front of you and perpendicular to the floor. This will be your starting position. As you breathe in, come down slowly until you feel the bar on your middle chest. Tip: Make sure that as opposed to a regular bench press, you keep the elbows close to the torso at all times in order to maximize triceps involvement. After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your triceps muscles. Lock your arms in the contracted position, hold for a second and then start coming down slowly again. Tip: It should take at least twice as long to go down than to come up. Repeat the movement for the prescribed amount of repetitions. When you are done, place the bar back in the rack. 	f	{triceps}	{chest,shoulders}	\N	f
365	Handstand Push-Ups	body only	With your back to the wall bend at the waist and place both hands on the floor at shoulder width. Kick yourself up against the wall with your arms straight. Your body should be upside down with the arms and legs fully extended. Keep your whole body as straight as possible. Tip: If doing this for the first time, have a spotter help you. Also, make sure that you keep facing the wall with your head, rather than looking down. Slowly lower yourself to the ground as you inhale until your head almost touches the floor. Tip: It is of utmost importance that you come down slow in order to avoid head injury. Push yourself back up slowly as you exhale until your elbows are nearly locked. Repeat for the recommended amount of repetitions. 	f	{shoulders}	{triceps}	\N	f
366	Standing Gastrocnemius Calf Stretch	none	Place your right heel on a step with your knee extended and lean forward to grab your right toe with your right hand. Your left knee should be slightly bent and your back should be straight. Support your weight on your left leg and place your left hand on your left thigh. Pull your right toes toward your knee until you feel a stretch in your calf. 	f	{calves}	{hamstrings}	\N	f
367	Smith Incline Shoulder Raise	barbell	Place an incline bench underneath the smith machine. Place the barbell at a height that you can reach when lying down and your arms are almost fully extended. Once the weight you need is selected, lie down on the incline bench and make sure your shoulders are aligned right under the barbell. Using a shoulder width pronated (palms forward) grip, lift the bar from the rack and hold it straight over you with a slight bend at the elbows. This will be your starting position. As you breathe out, lift the bar up until your arms are fully extended. Note: The contraction should be felt around the shoulders. After a second pause, bring the bar back down to the starting position as you breathe in. Repeat the movement for the prescribed amount of repetitions. When you are done, place the bar back in the rack. 	t	{shoulders}	{chest}	\N	f
368	Seated Hamstring and Calf Stretch	other	Loop a belt, rope, or band around one foot. Sit down with both legs extended . This will be your starting position. Leaning forward slightly, pull on the belt to draw the toes of your foot back. Hold this position for 10-20 seconds and then repeat with the other leg. 	f	{hamstrings}	{calves}	\N	f
370	Bodyweight Mid Row	other	Begin by taking a medium to wide grip on a pull-up apparatus with your palms facing away from you. From a hanging position, tuck your knees to your chest, leaning back and getting your legs over your side of the pull-up apparatus. This will be your starting position. Beginning with your arms straight, flex the elbows and retract the shoulder blades to raise your body up until your legs contact the pull-up apparatus. After a brief pause, return to the starting position. 	f	{"middle back"}	{biceps,lats}	\N	f
371	See-Saw Press (Alternating Side Press)	dumbbell	Grab a dumbbell with each hand and stand up erect. Clean (lift) the dumbbells to the chest/shoulder level and then rotate your wrists so that your palms are facing towards you as if you were getting ready to perform an Arnold Press. This will be your starting position. Now start extending your left arm overhead as you rotate the wrist so that the palm of your hand faces forward as you go up. Your elbows should come out also as you lift the weight. Simultaneously, you will also be bending from your hip to your opposite side. Tip: If you perform the exercise correctly, is should look as if you are trying to reach for something overhead on the right hand side of your body, but with your left arm. Breathe out as you perform this movement. Once you reach the top position breathe in. Then, with the weight fully extended overhead and you bent over to your right hand side, begin the movement to the left side. Repeat for the recommended amount of repetitions. 	f	{shoulders}	{abdominals,triceps}	\N	f
372	Lying One-Arm Lateral Raise	dumbbell	While holding a dumbbell in one hand, lay with your chest down on a flat bench. The other hand can be used to hold to the leg of the bench for stability. Position the palm of the hand that is holding the dumbbell in a neutral manner (palms facing your torso) as you keep the arm extended with the elbow slightly bent. This will be your starting position. Now raise the arm with the dumbbell to the side until your elbow is at shoulder height and your arm is roughly parallel to the floor as you exhale. Tip: Maintain your arm perpendicular to the torso while keeping your arm extended throughout the movement. Also, keep the contraction at the top for a second. Slowly lower the dumbbell to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	t	{shoulders}	\N	\N	f
373	Tire Flip	other	Begin by gripping the bottom of the tire on the tread, and position your feet back a bit. Your chest should be driving into the tire. To lift the tire, extend through the hips, knees, and ankles, driving into the tire and up. As the tire reaches a 45 degree angle, step forward and drive a knee into the tire. As you do so adjust your grip to the upper portion of the tire and push it forward as hard as possible to complete the turn. Repeat as necessary. 	f	{quadriceps}	{calves,chest,forearms,glutes,hamstrings,"lower back",shoulders,traps,triceps}	\N	f
374	Cable Shrugs	cable	Grasp a cable bar attachment that is attached to a low pulley with a shoulder width or slightly wider overhand (palms facing down) grip. Stand erect close to the pulley with your arms extended in front of you holding the bar. This will be your starting position. Lift the bar by elevating the shoulders as high as possible as you exhale. Hold the contraction at the top for a second. Tip: The arms should remain extended at all times. Refrain from using the biceps to help lift the bar. Only the shoulders should be moving up and down. Lower the bar back to the original position. Repeat for the recommended amount of repetitions. 	t	{traps}	\N	\N	f
375	IT Band and Glute Stretch	other	Loop a belt, rope, or band around one of your feet, and swing that leg across your body to the opposite side, keeping the leg extended as you lay on the ground. This will be your starting position. Keeping your foot off of the floor, pull on the belt, using the tension to pull the toes up. Hold for 10-20 seconds, and repeat on the other side. 	f	{abductors}	\N	\N	f
376	Barbell Curl	barbell	Stand up with your torso upright while holding a barbell at a shoulder-width grip. The palm of your hands should be facing forward and the elbows should be close to the torso. This will be your starting position. While holding the upper arms stationary, curl the weights forward while contracting the biceps as you breathe out. Tip: Only the forearms should move. Continue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second and squeeze the biceps hard. Slowly begin to bring the bar back to starting position as your breathe in. Repeat for the recommended amount of repetitions. 	t	{biceps}	{forearms}	\N	f
377	Close-Grip Front Lat Pulldown	cable	Sit down on a pull-down machine with a wide bar attached to the top pulley. Make sure that you adjust the knee pad of the machine to fit your height. These pads will prevent your body from being raised by the resistance attached to the bar. Grab the bar with the palms facing forward using the prescribed grip. Note on grips: For a wide grip, your hands need to be spaced out at a distance wider than your shoulder width. For a medium grip, your hands need to be spaced out at a distance equal to your shoulder width and for a close grip at a distance smaller than your shoulder width. As you have both arms extended in front of you - while holding the bar at the chosen grip width - bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position. As you breathe out, bring the bar down until it touches your upper chest by drawing the shoulders and the upper arms down and back. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary (only the arms should move). The forearms should do no other work except for holding the bar; therefore do not try to pull the bar down using the forearms. After a second in the contracted position, while squeezing your shoulder blades together, slowly raise the bar back to the starting position when your arms are fully extended and the lats are fully stretched. Inhale during this portion of the movement. 6. Repeat this motion for the prescribed amount of repetitions. 	f	{lats}	{biceps,"middle back",shoulders}	\N	f
378	Rocket Jump	body only	Begin in a relaxed stance with your feet shoulder width apart and hold your arms close to the body. To initiate the move, squat down halfway and explode back up as high as possible. Fully extend your entire body, reaching overhead as far as possible. As you land, absorb your impact through the legs. 	f	{quadriceps}	{calves,hamstrings}	\N	f
379	Push Up to Side Plank	body only	Get into pushup position on the toes with your hands just outside of shoulder width. Perform a pushup by allowing the elbows to flex. As you descend, keep your body straight. Do one pushup and as you come up, shift your weight on the left side of the body, twist to the side while bringing the right arm up towards the ceiling in a side plank. Lower the arm back to the floor for another pushup and then twist to the other side. Repeat the series, alternating each side, for 10 or more reps. 	f	{chest}	{abdominals,shoulders,triceps}	\N	f
381	Freehand Jump Squat	body only	Cross your arms over your chest. With your head up and your back straight, position your feet at shoulder width. Keeping your back straight and chest up, squat down as you inhale until your upper thighs are parallel, or lower, to the floor. Now pressing mainly with the ball of your feet, jump straight up in the air as high as possible, using the thighs like springs. Exhale during this portion of the movement. When you touch the floor again, immediately squat down and jump again. Repeat for the recommended amount of repetitions. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
382	Standing Bent-Over One-Arm Dumbbell Triceps Extension	dumbbell	With a dumbbell in one hand and the palm facing your torso, bend your knees slightly and bring your torso forward, by bending at the waist, while keeping the back straight until it is almost parallel to the floor. Make sure that you keep the head up. The upper arm should be close to the torso and parallel to the floor while the forearm is pointing towards the floor as the hand holds the weight. Tip: There should be a 90-degree angle between the forearm and the upper arm. This is your starting position. Keeping the upper arms stationary, use the triceps to lift the weights as you exhale until the forearms are parallel to the floor and the whole arm is extended. Like many other arm exercises, only the forearm moves. After a second contraction at the top, slowly lower the dumbbell back to the starting position as you inhale. Repeat the movement for the prescribed amount of repetitions. Switch arms and repeat the exercise. 	t	{triceps}	{shoulders}	\N	f
383	Wide-Grip Rear Pull-Up	body only	Grab the pull-up bar with the palms facing forward using a wide grip. As you have both arms extended in front of you holding the bar, bring your torso forward and head so that there is an imaginary line from the pull-up bar to the back of your neck. This is your starting position. Pull your torso up until the bar is near the back of your neck. To do this, draw the shoulders and upper arms down and back while slightly leaning your head forward. Exhale as you perform this portion of the movement. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary as it moves through space and only the arms should move. The forearms should do no other work other than hold the bar. After a second on the contracted position, start to inhale and slowly lower your torso back to the starting position when your arms are fully extended and the lats are fully stretched. Repeat this motion for the prescribed amount of repetitions. 	f	{lats}	{biceps,"middle back",shoulders}	\N	f
384	Janda Sit-Up	body only	Position your body on the floor in the basic sit-up position; knees to a ninety degree angle with feet flat on the floor and arms either crossed over your chest or to the sides. This will be your starting position. As you strongly tighten your glutes and hamstrings, fill your lungs with air and in a slow (three to six second count) ascent, slowly exhale. Tip: It is important to tighten the glutes and hamstrings as this will cause the hip flexors to be inactivated in a process called reciprocal inhibition, which basically means that opposite muscles to the contracted ones will relax. As you inhale, slowly go back in a controlled manner to the starting position. Repeat for the recommended amount of repetitions. 	t	{abdominals}	\N	\N	f
385	Kneeling Jump Squat	barbell	Begin kneeling on the floor with a barbell racked across the back of your shoulders, or you can use your body weight for this exercise. This can be done inside of a power rack to make unracking easier. Sit back with your hips until your glutes touch your feet, keeping your head and chest up. Explode up with your hips, generating enough power to land with your feet flat on the floor. Continue with the squat by driving through your heels and extending the knees to come to a standing position. 	f	{glutes}	{calves,hamstrings,quadriceps}	\N	f
386	Smith Machine Incline Bench Press	machine	Place an incline bench underneath the smith machine. Place the barbell at a height that you can reach when lying down and your arms are almost fully extended. Once the weight you need is selected, lie down on the incline bench and make sure your upper chest is aligned with the barbell. Using a pronated grip (palms facing forward) that is wider than shoulder width, unlock the bar from the rack and hold it straight over you with your arms locked. This will be your starting position. As you breathe in, come down slowly until you feel the bar on your upper chest. After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your chest muscles. Lock your arms in the contracted position, hold for a second and then start coming down slowly again. Tip: It should take at least twice as long to go down than to come up. Repeat the movement for the prescribed amount of repetitions. When you are done, place the bar back in the rack. 	f	{chest}	{shoulders,triceps}	\N	f
387	Incline Bench Pull	barbell	Grab a dumbbell in each hand and lie face down on an incline bench that is set to an incline that is approximately 30 degrees. Let the arms hang to your sides fully extended as they point to the floor. Turn the wrists until your hands have a pronated (palms down) grip. Now flare the elbows out. This will be your starting position. As you breathe out, start to pull the dumbbells up as if you are doing a reverse bench press. You will do this by bending at the elbows and bringing the upper arms up as you let the forearms hang. Continue this motion until the upper arms are at the same level as your back. Tip: The elbows will come out to the side and your upper arms and torso should make the letter "T" at the top of the movement. Hold the contraction at the top for a second. Slowly go back down to the starting position as you breathe in. Repeat for the recommended amount of repetitions. 	t	{"middle back"}	{lats,shoulders}	\N	f
388	Rope Straight-Arm Pulldown	cable	Attach a rope to a high pulley and make your weight selection. Stand a couple feet back from the pulley with your feet staggered and take the rope with both hands. Lean forward from the hip, keeping your back straight, with your arms extended up in front of you. This will be your starting position. Keeping your arms straight, extend the shoulder to pull the rope down to your thighs. Pause at the bottom of the motion, squeezing your lats. Return to the starting position without allowing the weight to fully rest on the stack. 	t	{lats}	\N	\N	f
389	Isometric Neck Exercise - Front And Back	body only	With your head and neck in a neutral position (normal position with head erect facing forward), place both of your hands on the front side of your head. Now gently push forward as you contract the neck muscles but resisting any movement of your head. Start with slow tension and increase slowly. Keep breathing normally as you execute this contraction. Hold for the recommended number of seconds. Now release the tension slowly. Rest for the recommended amount of time and repeat with your hands placed on the back side of your head. 	t	{neck}	\N	\N	f
390	Lower Back Curl	body only	Lie on your stomach with your arms out to your sides. This will be your starting position. Using your lower back muscles, extend your spine lifting your chest off of the ground. Do not use your arms to push yourself up. Keep your head up during the movement. Repeat for 10-20 repetitions. 	f	{abdominals}	\N	\N	f
392	Snatch	barbell	Place your feet at a shoulder width stance with the barbell resting right above the connection between the toes and the rest of the foot. With a palms facing down grip, bend at the knees and keeping the back flat grab the bar using a wider than shoulder width grip. Bring the hips down and make sure that your body drops as if you were going to sit on a chair. This will be your starting position. Start pushing the floor as if it were a moving platform with your feet and simultaneously start lifting the barbell keeping it close to your legs. As the bar reaches the middle of your thighs, push the floor with your legs and lift your body to a complete extension in an explosive motion. Lift your shoulders back in a shrugging movement as you bring the bar up while lifting your elbows out to the side and keeping them above the bar for as long as possible. Now in a very quick but powerful motion, you have to get your body under the barbell when it has reached a high enough point where it can be controlled and drop while locking your arms and holding the barbell overhead as you assume a squat position. Finalize the movement by rising up out of the squat position to finish the lift. At the end of the lift both feet should be on line and the arms fully extended holding the barbell overhead. 	f	{quadriceps}	{biceps,glutes,hamstrings,"lower back",shoulders,traps,triceps}	\N	f
393	Linear 3-Part Start Technique	none	This drill helps you accelerate as quickly as possible into a sprint from a dead stop. It helps to use a line to start from. Begin with two feet on the line. Place your left foot with the toe next to your right ankle. Place your right foot 4-6 inches behind the left. Place your right hand onto the line, and thing bring your nose close to your left knee. Squat down as you lean foward, your head being lower than your hips and your weight loaded onto the left leg. This will be your starting position. Take your left hand up so that it is parallel to the ground, pointing behind you, and explode out when ready. 	f	{hamstrings}	{calves,quadriceps}	\N	f
394	Single Leg Push-off	other	Stand on the ground with one foot resting on the box, heel close to the edge. Push off with your foot on top of the box, trying to gain as much height as possible by extending through the hip and knee. Land with the same foot on top of the box, returning your other foot back to the start position. 	f	{quadriceps}	{calves,hamstrings}	\N	f
395	Hamstring Stretch	none	Lie on your back with one leg extended above you, with the hip at ninety degrees. Keep the other leg flat on the floor. Loop a belt, band, or rope over the ball of your foot. This will be your starting position. Pull on the belt to create tension in the calves and hamstrings. Hold this stretch for 10-30 seconds, and repeat with the other leg. 	t	{hamstrings}	\N	\N	f
396	Fast Skipping	body only	Start in a relaxed position with one leg slightly forward. This will be your starting position. Skip by executing a step-hop pattern of right-right-step to left-left-step, and so on, alternating back and forth. Perform fast skips by maintaining close contact with the ground and reduce air time, moving as quickly as possible. 	f	{quadriceps}	{abductors,adductors,calves,glutes,hamstrings}	\N	f
397	Overhead Squat	barbell	Start out by having a barbell in front of you on the floor. Your feet should be wider than shoulder width apart from each other. Bend the knees and use a pronated grip (palms facing you) to grab the barbell. Your hands should be at a wider than shoulder width apart from each other before lifting. Once you are positioned, lift the barbell up until you can rest it on your chest. Move the barbell over and slightly behind your head and make sure your arms are fully extended. Keep your head up at all times and also maintain a straight back. Retract your shoulder blades. This is your starting position. Slowly lower the weight by bending your knees until your thighs are parallel to the ground while inhaling. Tip: Keep your back straight while performing this exercise to avoid any injuries and your arms should remain extended and over your head at all times. Now use your feet and legs to help bring the weight back up to the starting position while exhaling. Repeat for the recommended amount of repetitions. 	f	{quadriceps}	{abdominals,calves,glutes,hamstrings,"lower back",shoulders,triceps}	\N	f
398	Barbell Squat To A Bench	barbell	This exercise is best performed inside a squat rack for safety purposes. To begin, first place a flat bench or a box behind you. The flat bench is used to teach you to set your hips back and to hit depth.  Then, set the bar on a rack that best matches your height. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it. Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso. Step away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times as looking down will get you off balance and also maintain a straight back. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances discussed in the foot stances section). Begin to slowly lower the bar by bending the knees and sitting your hips back as you maintain a straight posture with the head up. Continue down until you slightly touch the bench behind you. Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly. Begin to raise the bar as you exhale by pushing the floor with the heel of your foot as you straighten the legs and extend the hips to go back to the starting position. Repeat for the recommended amount of repetitions. 	f	{quadriceps}	{calves,glutes,hamstrings,"lower back"}	\N	f
399	Dumbbell Lying Rear Lateral Raise	dumbbell	While holding a dumbbell in each hand, lay with your chest down on a slightly inclined (around 15 degrees when measured from the floor) adjustable bench. Position the palms of the hands in a neutral manner (palms facing your torso) as you keep the arms extended with the elbows slightly bent. This will be your starting position. Now raise the arms to the side until your elbows are at shoulder height and your arms are roughly parallel to the floor as you exhale. Tip: Maintain your arms perpendicular to the torso while keeping them extended throughout the movement. Also, keep the contraction at the top for a second. Slowly lower the dumbbells to the starting position as you inhale. Repeat for the recommended amount of repetitions and then switch to the other arm. 	t	{shoulders}	\N	\N	f
473	Cable Deadlifts	cable	Move the cables to the bottom of the towers and select an appropriate weight. Stand directly in between the uprights. To begin, squat down be flexing your hips and knees until you can reach the handles. After grasping them, begin your ascent. Driving through your heels extend your hips and knees keeping your hands hanging at your side. Keep your head and chest up throughout the movement. After reaching a full standing position, Return to the starting position and repeat. 	f	{quadriceps}	{forearms,glutes,hamstrings,"lower back"}	\N	f
400	Gironda Sternum Chins	other	Grasp the pull-up bar with a shoulder width underhand grip. Now hang with your arms fully extended and stick your chest out and lean back. Tip: You will be leaning back throughout the entire movement. This will be your starting position. Start pulling yourself towards the bar with your spine arched throughout the movement and your head leaning back as far away from the bar as possible. Exhale as you perform this portion of the movement. Tip: At the upper end of the movement, your hips and legs will be at about a 45-degree angle to the floor. Keep pulling until your collarbone passes the bar and your lower chest or sternum area touches it. Hold that contraction for a second. Tip: By the time you've completed this portion of the movement; your head will be parallel to the floor. Slowly start going back to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	f	{lats}	{biceps,"middle back"}	\N	f
401	Box Squat with Bands	barbell	Begin in a power rack with a box at the appropriate height behind you. Set up the bands on the sleeves, secured to either band pegs, the rack, or dumbbells so that there is appropriate tension. If dumbbells are used, secure them so that they don't move. Also, ensure that the dumbbells you are using are heavy enough for the bands that you are using. Additional plates can be used to hold the dumbbells down. If more tension is needed, you can either widen the base on the floor or choke the bands. Typically, you would aim for a box height that brings you to a parallel squat, but you can train higher or lower if desired. Begin by stepping under the bar and placing it across the back of the shoulders. Squeeze your shoulder blades together and rotate your elbows forward, attempting to bend the bar across your shoulders. Remove the bar from the rack, creating a tight arch in your lower back, and step back into position. Place your feet wider for more emphasis on the back, glutes, adductors, and hamstrings, or closer together for more quad development. Keep your head facing forward. With your back, shoulders, and core tight, push your knees and butt out and you begin your descent. Sit back with your hips until you are seated on the box. Ideally, your shins should be perpendicular to the ground. Pause when you reach the box, and relax the hip flexors. Never bounce off of a box. Keeping the weight on your heels and pushing your feet and knees out, drive upward off of the box as you lead the movement with your head. Continue upward, maintaining tightness head to toe. Use care to return the barbell to the rack. 	f	{quadriceps}	{abductors,adductors,calves,glutes,hamstrings,"lower back"}	\N	f
402	Scissor Kick	body only	To begin, lie down with your back pressed against the floor or on an exercise mat (optional). Your arms should be fully extended to the sides with your palms facing down. Note: The arms should be stationary the entire time. With a slight bend at the knees, lift your legs up so that your heels are about 6 inches off the ground. This is the starting position. Now lift your left leg up to about a 45 degree angle while your right leg is lowered until the heel is about 2-3 inches from the ground. Switch movements by raising your right leg up and lowering your left leg. Remember to breathe while performing this exercise. Repeat for the recommended amount of repetitions. 	t	{abdominals}	\N	\N	f
403	Palms-Down Dumbbell Wrist Curl Over A Bench	dumbbell	Start out by placing two dumbbells on one side of a flat bench. Kneel down on both of your knees so that your body is facing the flat bench. Use your arms to grab both of the dumbbells with a pronated grip (palms facing down) and bring them up so that your forearms are resting against the flat bench. Your wrists should be hanging over the edge. Start out by curling your wrist upwards and exhaling. Slowly lower your wrists back down to the starting position while inhaling. Your forearms should be stationary as your wrist is the only movement needed to perform this exercise. Repeat for the recommended amount of repetitions. 	t	{forearms}	\N	\N	f
404	Clean Shrug	barbell	Begin with a shoulder width, double overhand or hook grip, with the bar hanging at the mid thigh position. Your back should be straight and inclined slightly forward. Shrug your shoulders towards your ears. While this exercise can usually by loaded with heavier weight than a clean, avoid overloading to the point that the execution slows down. 	f	{traps}	{forearms,shoulders}	\N	f
405	Ball Leg Curl	exercise ball	Begin on the floor laying on your back with your feet on top of the ball. Position the ball so that when your legs are extended your ankles are on top of the ball. This will be your starting position. Raise your hips off of the ground, keeping your weight on the shoulder blades and your feet. Flex the knees, pulling the ball as close to you as you can, contracting the hamstrings. After a brief pause, return to the starting position. 	t	{hamstrings}	{calves,glutes}	\N	f
406	Standing One-Arm Dumbbell Curl Over Incline Bench	dumbbell	Stand on the back side of an incline bench as if you were going to be a spotter for someone. Have a dumbbell in one hand and rest it across the incline bench with a supinated (palms up) grip. Position your non lifting hand at the corner or side of the incline bench. The chest should be pressed against the top part of the incline and your feet should be pressed against the floor at a wide stance. This is the starting position. While holding the upper arm stationary, curl the dumbbell upward while contracting the biceps as you breathe out. Only the forearms should move. Continue the movement until your biceps are fully contracted and the dumbbell is at shoulder level. Hold the contracted position for a second. Slowly begin to bring the dumbbells back to starting position as your breathe in. Repeat for the recommended amount of repetitions. Switch arms while performing this exercise. 	t	{biceps}	\N	\N	f
407	Seated Dumbbell Curl	dumbbell	Sit on a flat bench with a dumbbell on each hand being held at arms length. The elbows should be close to the torso. Rotate the palms of the hands so that they are facing your torso. This will be your starting position. While holding the upper arm stationary, curl the weights and start twisting the wrists once the dumbbells pass your thighs so that the palms of your hands face forward at the end of the movement. Make sure that you contract the biceps as you breathe out and make sure that only the forearms move. Continue the movement until your biceps are fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a second as you squeeze the biceps. Slowly begin to bring the dumbbells back to the starting position as your breathe in and as you rotate the wrists back to a neutral grip. Repeat for the recommended amount of repetitions. 	t	{biceps}	\N	\N	f
418	Barbell Curls Lying Against An Incline	barbell	Lie against an incline bench, with your arms holding a barbell and hanging down in a horizontal line. This will be your starting position. While keeping the upper arms stationary, curl the weight up as high as you can while squeezing the biceps. Breathe out as you perform this portion of the movement. Tip: Only the forearms should move. Do not swing the arms. After a second contraction, slowly go back to the starting position as you inhale. Tip: Make sure that you go all of the way down. Repeat for the recommended amount of repetitions. 	t	{biceps}	\N	\N	f
408	Single-Arm Cable Crossover	cable	Begin by moving the pulleys to the high position, select the resistance to be used, and take a handle in each hand. Step forward in front of both pulleys with your arms extended in front of you, bringing your hands together. Your head and chest should be up as you lean forward, while your feet should be staggered. This will be your starting position. Keeping your left arm in place, allow your right arm to extend out to the side, maintaining a slight bend at the elbow. The right arm should be perpendicular to the body at approximately shoulder level. Return your arm back to the starting position by pulling your hand back to the midline of the body. Hold for a second at the starting position and repeat the movement on the opposite side. Continue alternating back and forth for the prescribed number of repetitions. 	t	{chest}	\N	\N	f
409	Rack Pulls	barbell	Set up in a power rack with the bar on the pins. The pins should be set to the desired point; just below the knees, just above, or in the mid thigh position. Position yourself against the bar in proper deadlifting position. Your feet should be under your hips, your grip shoulder width, back arched, and hips back to engage the hamstrings. Since the weight is typically heavy, you may use a mixed grip, a hook grip, or use straps to aid in holding the weight. With your head looking forward, extend through the hips and knees, pulling the weight up and back until lockout. Be sure to pull your shoulders back as you complete the movement. Return the weight to the pins and repeat. 	f	{"lower back"}	{forearms,glutes,hamstrings,traps}	\N	f
410	Kettlebell Figure 8	kettlebells	Place one kettlebell between your legs and take a wider than shoulder width stance. Bend over by pushing your butt out and keeping your back flat. Pick up a kettlebell and pass it to your other hand between your legs. The receiving hand should reach from behind the legs. Go back and forth for several repetitions. 	f	{abdominals}	{hamstrings,shoulders}	\N	f
411	Cross Body Hammer Curl	dumbbell	Stand up straight with a dumbbell in each hand. Your hands should be down at your side with your palms facing in. While keeping your palms facing in and without twisting your arm, curl the dumbbell of the right arm up towards your left shoulder as you exhale. Touch the top of the dumbbell to your shoulder and hold the contraction for a second. Slowly lower the dumbbell along the same path as you inhale and then repeat the same movement for the left arm. Continue alternating in this fashion until the recommended amount of repetitions is performed for each arm. 	t	{biceps}	{forearms}	\N	f
412	Wide Stance Stiff Legs	barbell	Begin with a barbell loaded on the floor. Adopt a wide stance, and then bend at the hips to grab the bar. Your hips should be as far back as possible, and your legs nearly straight. Keep your back straight, and your head and chest up. This will be your starting position. Begin the movement be engaging the hips, driving them forward as you allow the arms to hang straight. Continue until you are standing straight up, and then slowly return the weight to the starting position. For successive reps, the weight need not touch the floor. 	f	{hamstrings}	{adductors,glutes,"lower back"}	\N	f
413	Rhomboids-SMR	foam roll	Lay down with your back on the floor. Place a foam roll underneath your upper back, and cross your arms in front of you, protracting your shoulders. This will be your starting position. Raise your hips off of the ground, placing your weight onto the foam roll. Shift your weight to one side at a time, rolling over your middle and upper back. Pause at points of tension for 10-30 seconds. 	f	{"middle back"}	{traps}	\N	f
414	Incline Push-Up Depth Jump	other	For this drill you will need a box about 12 inches high, and two thick mats or aerobics steps. Place the steps just outside of your shoulders, and place your feet on top of the box so that you are in an incline pushup position, your hands just inside the steps. This will be your starting position. Begin by bending at the elbows to lower your body, quickly reversing position to push your body off of the ground. As you leave the ground, move your hands onto the steps, bending your elbows to absorb the impact. Repeat the motion to return to the starting position. 	f	{chest}	{shoulders,triceps}	\N	f
415	Leg Press	machine	Using a leg press machine, sit down on the machine and place your legs on the platform directly in front of you at a medium (shoulder width) foot stance. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances described in the foot positioning section). Lower the safety bars holding the weighted platform in place and press the platform all the way up until your legs are fully extended in front of you. Tip: Make sure that you do not lock your knees. Your torso and the legs should make a perfect 90-degree angle. This will be your starting position. As you inhale, slowly lower the platform until your upper and lower legs make a 90-degree angle. Pushing mainly with the heels of your feet and using the quadriceps go back to the starting position as you exhale. Repeat for the recommended amount of repetitions and ensure to lock the safety pins properly once you are done. You do not want that platform falling on you fully loaded. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
416	Standing Cable Lift	cable	Connect a standard handle on a tower, and move the cable to the lowest pulley position. With your side to the cable, grab the handle with one hand and step away from the tower. You should be approximately arm's length away from the pulley, with the tension of the weight on the cable. Your outstretched arm should be aligned with the cable. With your feet positioned shoulder width apart, squat down and grab the handle with both hands. Your arms should still be fully extended. In one motion, pull the handle up and across your body until your arms are in a fully-extended position above your head. Keep your back straight and your arms close to your body as you pivot your back foot and straighten your legs to get a full range of motion. Retract your arms and then your body. Return to the neutral position in a slow and controlled manner. Repeat to failure. Then, reposition and repeat the same series of movements on the opposite side. 	f	{abdominals}	{shoulders}	\N	f
417	Decline Oblique Crunch	body only	Secure your legs at the end of the decline bench and slowly lay down on the bench. Raise your upper body off the bench until your torso is about 35-45 degrees if measured from the floor. Put one hand beside your head and the other on your thigh. This will be your starting position. Raise your upper body slowly from the starting position while turning your torso to the left. Continue crunching up as you exhale until your right elbow touches your left knee. Hold this contracted position for a second. Tip: Focus on keeping your abs tight and keeping the movement slow and controlled. Lower your body back down slowly to the starting position as you inhale. After completing one set on the right for the recommended amount of repetitions, switch to your left side. Tip: Focus on really twisting your torso and feeling the contraction when you are in the up position. 	f	{abdominals}	\N	\N	f
419	Barbell Step Ups	barbell	Stand up straight while holding a barbell placed on the back of your shoulders (slightly below the neck) and stand upright behind an elevated platform (such as the one used for spotting behind a flat bench). This is your starting position. Place the right foot on the elevated platform. Step on the platform by extending the hip and the knee of your right leg. Use the heel mainly to lift the rest of your body up and place the foot of the left leg on the platform as well. Breathe out as you execute the force required to come up. Step down with the left leg by flexing the hip and knee of the right leg as you inhale. Return to the original standing position by placing the right foot of to next to the left foot on the initial position. Repeat with the right leg for the recommended amount of repetitions and then perform with the left leg. 	f	{quadriceps}	{calves,glutes,hamstrings,quadriceps}	\N	f
420	Standing Elevated Quad Stretch	other	Start by standing with your back about two to three feet away from a bench or step. Lift one leg behind you and rest your foot on the step,either on your instep or the ball of your foot, whichever you find most comfortable. Keep your supporting knee slightly bent and avoid letting that knee extend out beyond your toes. Switch sides. 	f	{quadriceps}	\N	\N	f
421	Cable Russian Twists	cable	Connect a standard handle attachment, and position the cable to a middle pulley position. Lie on a stability ball perpendicular to the cable and grab the handle with one hand. You should be approximately arm's length away from the pulley, with the tension of the weight on the cable. Grab the handle with both hands and fully extend your arms above your chest. You hands should be directly in-line with the pulley. If not, adjust the pulley up or down until they are. Keep your hips elevated and abs engaged. Rotate your torso away from the pulley for a full-quarter rotation. Your body should be flat from head to knees. Pause for a moment and in a slow and controlled manner reset to the starting position. You should still have side tension on the cable in the resting position. Repeat the same movement to failure. Then, reposition and repeat the same series of movements on the opposite side. 	f	{abdominals}	\N	\N	f
422	Clean and Jerk	barbell	With a barbell on the floor close to the shins, take an overhand or hook grip just outside the legs. Lower your hips with the weight focused on the heels, back straight, head facing forward, chest up, with your shoulders just in front of the bar. This will be your starting position. Begin the first pull by driving through the heels, extending your knees. Your back angle should stay the same, and your arms should remain straight. Move the weight with control as you continue to above the knees. Next comes the second pull, the main source of acceleration for the clean. As the bar approaches the mid-thigh position, begin extending through the hips. In a jumping motion, accelerate by extending the hips, knees, and ankles, using speed to move the bar upward. There should be no need to actively pull through the arms to accelerate the weight; at the end of the second pull, the body should be fully extended, leaning slightly back, with the arms still extended. As full extension is achieved, transition into the third pull by aggressively shrugging and flexing the arms with the elbows up and out. At peak extension, aggressively pull yourself down, rotating your elbows under the bar as you do so. Receive the bar in a front squat position, the depth of which is dependent upon the height of the bar at the end of the third pull. The bar should be racked onto the protracted shoulders, lightly touching the throat with the hands relaxed. Continue to descend to the bottom squat position, which will help in the recovery. Immediately recover by driving through the heels, keeping the torso upright and elbows up. Continue until you have risen to a standing position. The second phase is the jerk, which raises the weight overhead. Standing with the weight racked on the front of the shoulders, begin with the dip. With your feet directly under your hips, flex the knees without moving the hips backward. Go down only slightly, and reverse direction as powerfully as possible. Drive through the heels create as much speed and force as possible, and be sure to move your head out of the way as the bar leaves the shoulders. At this moment as the feet leave the floor, the feet must be placed into the receiving position as quickly as possible. In the brief moment the feet are not actively driving against the platform, the athletes effort to push the bar up will drive them down. The feet should be split, with one foot forward, and one foot back. Receive the bar with the arms locked out overhead. Return to a standing position. 	f	{shoulders}	{abdominals,glutes,hamstrings,"lower back",quadriceps,traps,triceps}	\N	f
423	Supine One-Arm Overhead Throw	medicine ball	Lay on the ground on your back with your knees bent. Hold the ball with one hand, extending the arm fully behind your head. This will be your starting position. Initiate the movement at the shoulder, throwing the ball directly forward of you as you sit up, attempting to go for maximum distance. The ball can be thrown to a partner or bounced off of a wall. 	f	{abdominals}	{chest,lats,shoulders}	\N	f
424	Straight-Arm Pulldown	cable	You will start by grabbing the wide bar from the top pulley of a pulldown machine and using a wider than shoulder-width pronated (palms down) grip. Step backwards two feet or so. Bend your torso forward at the waist by around 30-degrees with your arms fully extended in front of you and a slight bend at the elbows. If your arms are not fully extended then you need to step a bit more backwards until they are. Once your arms are fully extended and your torso is slightly bent at the waist, tighten the lats and then you are ready to begin. While keeping the arms straight, pull the bar down by contracting the lats until your hands are next to the side of the thighs. Breathe out as you perform this step. While keeping the arms straight, go back to the starting position while breathing in. Repeat for the recommended amount of repetitions. 	t	{lats}	\N	\N	f
425	Moving Claw Series	none	This move helps prepare your running form to help you excel at sprinting. As you run, be sure to flex the knee, aiming to kick your glutes as the hip extends. Reload the quad as the leg moves back forward, attacking the ground on the next step. Ensure that as you run, you block with the arms, punching through in a rapid 1-2 motion. 	f	{hamstrings}	{calves,quadriceps}	\N	f
426	Push-Up Wide	body only	With your hands wide apart, support your body on your toes and hands in a plank position. Your elbows should be extended and your body straight. Do not allow your hips to sag. This will be your starting position. To begin, allow the elbows to flex, lowering your chest to the floor as you inhale. Using your pectoral muscles, press your upper body back up to the starting position by extending the elbows. Exhale as you perform this step. After pausing at the contracted position, repeat the movement for the prescribed amount of repetitions. 	f	{chest}	{abdominals,shoulders,triceps}	\N	f
427	Medicine Ball Chest Pass	medicine ball	You will need a partner for this exercise. Lacking one, this movement can be performed against a wall. Begin facing your partner holding the medicine ball at your torso with both hands. Pull the ball to your chest, and reverse the motion by extending through the elbows. For sports applications, you can take a step as you throw. Your partner should catch the ball, and throw it back to you. Receive the throw with both hands at chest height. 	f	{chest}	{shoulders,triceps}	\N	f
428	T-Bar Row with Handle	barbell	Position a bar into a landmine or in a corner to keep it from moving. Load an appropriate weight onto your end. Stand over the bar, and position a Double D row handle around the bar next to the collar. Using your hips and legs, rise to a standing position. Assume a wide stance with your hips back and your chest up. Your arms should be extended. This will be your starting position. Pull the weight to your upper abdomen by retracting the shoulder blades and flexing the elbows. Do not jerk the weight or cheat during the movement. After a brief pause, return to the starting position. 	f	{"middle back"}	{biceps,lats}	\N	f
429	Dumbbell Squat	dumbbell	Stand up straight while holding a dumbbell on each hand (palms facing the side of your legs). Position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times as looking down will get you off balance and also maintain a straight back. This will be your starting position. Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances discussed in the foot stances section. Begin to slowly lower your torso by bending the knees as you maintain a straight posture with the head up. Continue down until your thighs are parallel to the floor. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly. Begin to raise your torso as you exhale by pushing the floor with the heel of your foot mainly as you straighten the legs again and go back to the starting position. Repeat for the recommended amount of repetitions. 	f	{quadriceps}	{calves,glutes,hamstrings,"lower back"}	\N	f
430	Kneeling Forearm Stretch	none	Start by kneeling on a mat with your palms flat and your fingers pointing back toward your knees. Slowly lean back keeping your palms flat on the floor until you feel a stretch in your wrists and forearms. Hold for 20-30 seconds. 	t	{forearms}	\N	\N	f
431	Alternate Heel Touchers	body only	Lie on the floor with the knees bent and the feet on the floor around 18-24 inches apart. Your arms should be extended by your side. This will be your starting position. Crunch over your torso forward and up about 3-4 inches to the right side and touch your right heel as you hold the contraction for a second. Exhale while performing this movement. Now go back slowly to the starting position as you inhale. Now crunch over your torso forward and up around 3-4 inches to the left side and touch your left heel as you hold the contraction for a second. Exhale while performing this movement and then go back to the starting position as you inhale. Now that both heels have been touched, that is considered 1 repetition. Continue alternating sides in this manner until all prescribed repetitions are done. 	t	{abdominals}	\N	\N	f
432	Dumbbell Prone Incline Curl	dumbbell	Grab a dumbbell on each hand and lie face down on an incline bench with your shoulders near top of the incline. Your knees can rest on the seat or your legs can be straddled to the sides (my preferred way). Let your arms extend and hang naturally in front of you so that they are perpendicular to the floor. Now keep your elbows in by your side and face the palms forward. This will be your starting position. Raise the dumbbells by contracting the biceps until your arms are fully flexed. Exhale as you perform this portion of the movement and ensure that only the forearms move. The upper arms should remain stationary at all times. Lower the dumbbells until your arms are fully extended. Repeat for the recommended amount of times. 	t	{biceps}	\N	\N	f
433	Standing Alternating Dumbbell Press	dumbbell	Stand with a dumbbell in each hand. Raise the dumbbells to your shoulders with your palms facing forward and your elbows pointed out. This will be your starting position. Extend one arm to press the dumbbell straight up, keeping your off hand in place. Do not lean or jerk the weight during the movement. After a brief pause, return the weight to the starting position. Repeat for the opposite side, continuing to alternate between arms. 	f	{shoulders}	{triceps}	\N	f
434	Decline EZ Bar Triceps Extension	barbell	Secure your legs at the end of the decline bench and slowly lay down on the bench. Using a close grip (a grip that is slightly less than shoulder width), lift the EZ bar from the rack and hold it straight over you with your arms locked and elbows in. The arms should be perpendicular to the floor. This will be your starting position. Tip: In order to protect your rotator cuff, it is best if you have a spotter help you lift the barbell off the rack. As you breathe in and you keep the upper arms stationary, bring the bar down slowly by moving your forearms in a semicircular motion towards you until you feel the bar slightly touch your forehead. Breathe in as you perform this portion of the movement. Lift the bar back to the starting position by contracting the triceps and exhaling. Repeat until the recommended amount of repetitions is performed. 	t	{triceps}	\N	\N	f
435	Running, Treadmill	machine	To begin, step onto the treadmill and select the desired option from the menu. Most treadmills have a manual setting, or you can select a program to run. Typically, you can enter your age and weight to estimate the amount of calories burned during exercise. Elevation can be adjusted to change the intensity of the workout. Treadmills offer convenience, cardiovascular benefits, and usually have less impact than running outside. A 150 lb person will burn over 450 calories running 8 miles per hour for 30 minutes. Maintain proper posture as you run, and only hold onto the handles when necessary, such as when dismounting or checking your heart rate. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
436	Ring Dips	other	Grip a ring in each hand, and then take a small jump to help you get into the starting position with your arms locked out. Begin by flexing the elbow, lowering your body until your arms break 90 degrees. Avoid swinging, and maintain good posture throughout the descent. Reverse the motion by extending the elbow, pushing yourself back up into the starting position. Repeat for the desired number of repetitions. 	f	{triceps}	{chest,shoulders}	\N	f
437	Downward Facing Balance	exercise ball	Lie facedown on top of an exercise ball. While resting on your stomach on the ball, walk your hands forward along the floor and lift your legs, extending your elbows and knees. 	t	{glutes}	{abdominals,hamstrings}	\N	f
438	Sled Reverse Flye	other	Attach dual handles to a sled connected by a rope or chain. Load the sled to a light weight. Face the sled, backing up until there is some tension in the line. Take both handles at arms length at about waist level. Bend the knees slightly and keep your chest and head up. This will be your starting position. Without flexing the elbow, pull the handles upward and apart, performing a reverse fly with some external rotation. Your palms should be facing forward as you do this. Return to the starting position, taking a couple steps back to take the slack out of the line. 	t	{shoulders}	\N	\N	f
449	Wide-Grip Standing Barbell Curl	barbell	Stand up with your torso upright while holding a barbell at the wide outer handle. The palm of your hands should be facing forward. The elbows should be close to the torso. This will be your starting position. While holding the upper arms stationary, curl the weights forward while contracting the biceps as you breathe out. Tip: Only the forearms should move. Continue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second and squeeze the biceps hard. Slowly begin to bring the bar back to starting position as your breathe in. Repeat for the recommended amount of repetitions. 	t	{biceps}	\N	\N	f
439	Split Snatch	barbell	Begin with a loaded barbell on the floor. The bar should be close to or touching the shins, and a wide grip should be taken on the bar. The feet should be directly below the hips, with the feet turned out as needed. Lower the hips, with the chest up and the head looking forward. The shoulders should be just in front of the bar. This will be the starting position. Begin the first pull by driving through the front of the heels, raising the bar from the ground. The back angle should stay the same until the bar passes the knees. Transition into the second pull by extending through the hips knees and ankles, driving the bar up as quickly as possible. The bar should be close to the body. At peak extension, shrug the shoulders and allow the elbows to flex to the side. As you move your feet into the receiving position, forcefully pull yourself below the bar as you elevate the bar overhead. The feet should move forcefully to a split position, one foot forward one foot back. Receive the bar with your body as low as possible and the arms fully extended overhead. Keeping the bar aligned over the front of the heels, your head and chest up, drive through heels of the feet to move to a standing position, bringing your feet together. Carefully return the weight to floor. 	f	{hamstrings}	{calves,forearms,glutes,hamstrings,"lower back",quadriceps,shoulders,traps,triceps}	\N	f
440	London Bridges	other	Attach a climbing rope to a high beam or cross member. Below it, ensure that the smith machine bar is locked in place with the safeties and cannot move. Alternatively, a secure box could also be utilized. Stand on the bar, using the rope to balance yourself. This will be your starting position. Keeping your body straight, lean back and lower your body by slowly going hand over hand with the rope. Continue until you are perpendicular to the ground. Keeping your body straight, reverse the motion, going hand over hand back to the starting position. 	f	{lats}	{biceps,forearms,"middle back"}	\N	f
441	Single-Leg Hop Progression	other	Arrange a line of cones in front of you. Assume a relaxed standing position, balanced on one leg. Raise the knee of your opposite leg. This will be your starting position. Hop forward, jumping and landing with the same leg over the cone. Use a countermovement jump to hop from cone to cone. At the end, turn around and go back on the other leg. 	f	{quadriceps}	{abductors,adductors,calves,hamstrings}	\N	f
442	Barbell Seated Calf Raise	barbell	Place a block about 12 inches in front of a flat bench. Sit on the bench and place the ball of your feet on the block. Have someone place a barbell over your upper thighs about 3 inches above your knees and hold it there. This will be your starting position. Raise up on your toes as high as possible as you squeeze the calves and as you breathe out. After a second contraction, slowly go back to the starting position. Tip: To get maximum benefit stretch your calves as far as you can. Repeat for the recommended amount of repetitions. 	t	{calves}	\N	\N	f
443	Hanging Pike	body only	Hang from a chin-up bar with your legs and feet together using an overhand grip (palms facing away from you) that is slightly wider than shoulder width. Tip: You may use wrist wraps in order to facilitate holding on to the bar. Now bend your knees at a 90 degree angle and bring the upper legs forward so that the calves are perpendicular to the floor while the thighs remain parallel to it. This will be your starting position. Pull your legs up as you exhale until you almost touch your shins with the bar above you. Tip: Try to straighten your legs as much as possible while at the top. Lower your legs as slowly as possible until you reach the starting position. Tip: Avoid swinging and using momentum at all times. Repeat for the recommended amount of repetitions. 	f	{abdominals}	\N	\N	f
444	Farmer's Walk	other	There are various implements that can be used for the farmers walk. These can also be performed with heavy dumbbells or short bars if these implements aren't available. Begin by standing between the implements. After gripping the handles, lift them up by driving through your heels, keeping your back straight and your head up. Walk taking short, quick steps, and don't forget to breathe. Move for a given distance, typically 50-100 feet, as fast as possible. 	f	{forearms}	{abdominals,glutes,hamstrings,"lower back",quadriceps,traps}	\N	f
445	Deficit Deadlift	barbell	Begin by having a platform or weight plates that you can stand on, usually 1-3 inches in height. Approach the bar so that it is centered over your feet. You feet should be about hip width apart. Bend at the hip to grip the bar at shoulder width, allowing your shoulder blades to protract. Typically, you would use an overhand grip or an over/under grip on heavier sets. With your feet, and your grip set, take a big breath and then lower your hips and bend the knees until your shins contact the bar. Look forward with your head, keep your chest up and your back arched, and begin driving through the heels to move the weight upward. After the bar passes the knees, aggressively pull the bar back, pulling your shoulder blades together as you drive your hips forward into the bar. Lower the bar by bending at the hips and guiding it to the floor. 	f	{"lower back"}	{forearms,glutes,hamstrings,"middle back",quadriceps,traps}	\N	f
446	Cuban Press	dumbbell	Take a dumbbell in each hand with a pronated grip in a standing position. Raise your upper arms so that they are parallel to the floor, allowing your lower arms to hang in the "scarecrow" position. This will be your starting position. To initiate the movement, externally rotate the shoulders to move the upper arm 180 degrees. Keep the upper arms in place, rotating the upper arms until the wrists are directly above the elbows, the forearms perpendicular to the floor. Now press the dumbbells by extending at the elbows, straightening your arms overhead. Return to the starting position as you breathe in by reversing the steps. Repeat for the recommended amount of repetitions. 	f	{shoulders}	{traps}	\N	f
447	Reverse Cable Curl	cable	Stand up with your torso upright while holding a bar attachment that is attached to a low pulley using a pronated (palms down) and shoulder width grip. Make sure also that you keep the elbows close to the torso. This will be your starting position. While holding the upper arms stationary, curl the weights while contracting the biceps as you breathe out. Only the forearms should move. Continue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second as you squeeze the muscle. Slowly begin to bring the bar back to starting position as your breathe in. Repeat for the recommended amount of repetitions. 	t	{biceps}	{forearms}	\N	f
448	EZ-Bar Skullcrusher	e-z curl bar	Using a close grip, lift the EZ bar and hold it with your elbows in as you lie on the bench. Your arms should be perpendicular to the floor. This will be your starting position. Keeping the upper arms stationary, lower the bar by allowing the elbows to flex. Inhale as you perform this portion of the movement. Pause once the bar is directly above the forehead. Lift the bar back to the starting position by extending the elbow and exhaling. Repeat. 	t	{triceps}	{forearms}	\N	f
460	Side Neck Stretch	none	Start with your shoulders relaxed, gently tilt your head towards your shoulder. Assist stretch with a gentle pull on the side of the head. 	t	{neck}	\N	\N	f
450	Plyo Push-up	body only	Move into a prone position on the floor, supporting your weight on your hands and toes. Your arms should be fully extended with the hands around shoulder width. Keep your body straight throughout the movement. This will be your starting position. Descend by flexing at the elbow, lowering your chest towards the ground. At the bottom, reverse the motion by pushing yourself up through elbow extension as quickly as possible. Attempt to push your upper body up until your hands leave the ground. Return to the starting position and repeat the exercise. For added difficulty, add claps into the movement while you are air borne. 	f	{chest}	{shoulders,triceps}	\N	f
451	Clean Pull	barbell	With a barbell on the floor close to the shins, take an overhand or hook grip just outside the legs. Lower your hips with the weight focused on the heels, back straight, head facing forward, chest up, with your shoulders just in front of the bar. This will be your starting position. Begin the first pull by driving through the heels, extending your knees. Your back angle should stay the same, and your arms should remain straight and elbows out. Move the weight with control as you continue to above the knees. Next comes the second pull, the main source of acceleration for the clean. As the bar approaches the mid-thigh position, begin extending through the hips. In a jumping motion, accelerate by extending the hips, knees, and ankles, using speed to move the bar upward. There should be no need to actively pull through the arms to accelerate the weight; at the end of the second pull, the body should be fully extended, leaning slightly back, with the arms still extended. Full extension should be violent and abrupt, and ensure that you do not prolong the extension for longer than necessary. 	f	{quadriceps}	{forearms,glutes,hamstrings,"lower back",traps}	\N	f
452	Reverse Flyes With External Rotation	dumbbell	To begin, lie down on an incline bench set at a 30-degree angle with the chest and stomach pressing against the incline. Have the dumbbells in each hand with the palms facing down to the floor. Your arms should be in front of you so that they are perpendicular to the angle of the bench. Tip: Your elbows should have a slight bend. The legs should be stationary while applying pressure with the ball of your toes (your heels should not be touching the floor). This is the starting position. Maintaining the slight bend of the elbows, move the weights out and away from each other in an arc motion while exhaling. As you lift the weight, your wrist should externally rotate by 90-degrees so that you go from a palms down (pronated) grip to a palms facing each other (neutral) grip. Tip: Try to squeeze your shoulder blades together to get the best results from this exercise. The arms should be elevated until they are level with the head. Feel the contraction and slowly lower the weights back down to the starting position while inhaling. Repeat for the recommended amount of repetitions. 	t	{shoulders}	\N	\N	f
453	Single-Leg Lateral Hop	other	Stand to the side of a cone or hurdle. To get into the start position, stand on one leg with your knee slightly bent. To begin, execute a counterjump to hop sideways over the cone. Land on your jumping leg, and immediately rebound out of it by jumping back to the start position. Continue hopping back and forth. 	f	{quadriceps}	{abductors,adductors,calves,hamstrings}	\N	f
454	Rack Pull with Bands	barbell	Set up in a power rack with the bar on the pins. The pins should be set to the desired point; just below the knees, just above, or in the mid thigh position. Attach bands to the base of the rack, or secure them with dumbbells. Attach the other end to the bar. You may need to choke the bands to provide tension. Position yourself against the bar in proper deadlifting position. Your feet should be under your hips, your grip shoulder width, back arched, and hips back to engage the hamstrings. Since the weight is typically heavy, you may use a mixed grip, a hook grip, or use straps to aid in holding the weight. With your head looking forward, extend through the hips and knees, pulling the weight up and back until lockout. Be sure to pull your shoulders back as you complete the movement. Return the weight to the pins and repeat. 	f	{"lower back"}	{forearms,glutes,hamstrings,quadriceps,traps}	\N	f
455	Donkey Calf Raises	other	For this exercise you will need access to a donkey calf raise machine. Start by positioning your lower back and hips under the padded lever provided. The tailbone area should be the one making contact with the pad. Place both of your arms on the side handles and place the balls of your feet on the calf block with the heels extending off. Align the toes forward, inward or outward, depending on the area you wish to target, and straighten the knees without locking them. This will be your starting position. Raise your heels as you breathe out by extending your ankles as high as possible and flexing your calf. Ensure that the knee is kept stationary at all times. There should be no bending at any time. Hold the contracted position by a second before you start to go back down. Go back slowly to the starting position as you breathe in by lowering your heels as you bend the ankles until calves are stretched. Repeat for the recommended amount of repetitions. 	t	{calves}	\N	\N	f
456	Seated Leg Tucks	body only	Sit on a bench with the legs stretched out in front of you slightly below parallel and your arms holding on to the sides of the bench. Your torso should be leaning backwards around a 45-degree angle from the bench. This will be your starting position. Bring the knees in toward you as you move your torso closer to them at the same time. Breathe out as you perform this movement. After a second pause, go back to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	t	{abdominals}	\N	\N	f
457	Single-Leg Stride Jump	other	Stand to the side of a box with your inside foot on top of it, close to the edge. Begin by swinging the arms upward as you push through the top leg, jumping upward as high as possible. Attempt to drive the opposite knee upward. Land in the same position that you started, using your inside leg to decelerate the impact. 	f	{quadriceps}	{abductors,adductors,calves,hamstrings}	\N	f
458	Kettlebell Sumo High Pull	kettlebells	Place a kettlebell on the ground between your feet. Position your feet in a wide stance, and grasp the kettlebell with two hands. Set your hips back as far as possible, with your knees bent. Keep your chest and head up. This will be your starting position. Begin by extending the hips and knees, simultaneously pulling the kettlebell to your shoulders, raising your elbows as you do so. Reverse the motion to return to the starting position. 	f	{traps}	{adductors,glutes,hamstrings,quadriceps,shoulders}	\N	f
459	Jerk Balance	barbell	This drill helps you learn to drive yourself low enough during the jerk and corrects those who move backward during the movement. Begin with the bar racked in the jerk position, with the shoulders forward, torso upright, and the feet split slightly apart. Initiate the movement as you would a normal jerk, dipping at the knees while keeping your torso vertical, and driving back up forcefully, using momentum and not your arms to elevate the weight. Keep the rear foot in place, using it to drive your body forward into a full split as you jerk the weight. Recover by standing up with the weight overhead. 	f	{shoulders}	{glutes,hamstrings,quadriceps,triceps}	\N	f
461	Neck Press	barbell	Lie back on a flat bench. Using a medium-width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and hold it straight over your neck with your arms locked. This will be your starting position. As you breathe in, come down slowly until you feel the bar on your neck. After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your chest muscles. Lock your arms and squeeze your chest in the contracted position, hold for a second and then start coming down slowly again. Tip: It should take at least twice as long to go down than to come up). Repeat the movement for the prescribed amount of repetitions. When you are done, place the bar back in the rack. 	f	{chest}	{shoulders,triceps}	\N	f
462	Dumbbell Raise	dumbbell	Grab a dumbbell in each arm and stand up straight with your arms extended by your sides with a slight bend at the elbows and your back straight. This will be your starting position. Tip: The dumbbell should be next to your thighs with the palm of your hands facing back. Use your side shoulders to lift the dumbbells as you exhale. The dumbbells should be to the side of the body as you move them up. Continue to lift it until the dumbbells are nearly in line with your chin. Tip: Your elbows should drive the motion. As you lift the dumbbell, your elbow should always be higher than your forearm. Also, keep your torso stationary and pause for a second at the top of the movement. Lower the dumbbells back down slowly to the starting position. Inhale as you perform this portion of the movement. Repeat for the recommended amount of repetitions. 	f	{shoulders}	{biceps}	\N	f
463	Standing Low-Pulley Deltoid Raise	cable	Start by standing to the right side of a low pulley row. Use your left hand to come across the body and grab a single handle attached to the low pulley with a pronated grip (palms facing down). Rest your arm in front of you. Your right hand should grab the machine for better support and balance. Make sure that your back is erect and your feet are shoulder width apart from each other. This is the starting position. Begin to use the left hand and come across your body out until it is elevated to shoulder height while exhaling. Feel the contraction at the top for a second and begin to slowly lower the handle back down to the original starting position while inhaling. Repeat for the recommended amount of repetitions. Switch arms and repeat the exercise. 	t	{shoulders}	{forearms}	\N	f
464	Dynamic Chest Stretch	none	Stand with your hands together, arms extended directly in front of you. This will be your starting position. Keeping your arms straight, quickly move your arms back as far as possible and back in again, similar to an exaggerated clapping motion. Repeat 5-10 times, increasing speed as you do so. 	f	{chest}	{"middle back"}	\N	f
465	Middle Back Stretch	none	Stand so your feet are shoulder width apart and your hands are on your hips. Twist at your waist until you feel a stretch. Hold for 10 to 15 seconds, then twist to the other side. 	t	{"middle back"}	{abdominals,lats,"lower back"}	\N	f
466	One Knee To Chest	none	Start off by lying on the floor. Extend one leg straight and pull the other knee to your chest. Hold under the knee joint to protect the kneecap. Gently tug that knee toward your nose. Switch sides. This stretches the buttocks and lower back of the bent leg and the hip flexor of the straight leg. 	f	{glutes}	{hamstrings,"lower back"}	\N	f
467	Lunge Pass Through	kettlebells	Stand with your torso upright holding a kettlebell in your right hand. This will be your starting position. Step forward with your left foot and lower your upper body down by flexing the hip and the knee, keeping the torso upright. Lower your back knee until it nearly touches the ground. As you lunge, pass the kettlebell under your front leg to your opposite hand. Pressing through the heel of your foot, return to the starting position. Repeat the movement for the recommended amount of repetitions, alternating legs. 	f	{hamstrings}	{calves,glutes,quadriceps}	\N	f
468	Parallel Bar Dip	other	Stand between a set of parallel bars. Place a hand on each bar, and then take a small jump to help you get into the starting position with your arms locked out. Begin by flexing the elbow, lowering your body until your arms break 90 degrees. Avoid swinging, and maintain good posture throughout the descent. Reverse the motion by extending the elbow, pushing yourself back up into the starting position. Repeat for the desired number of repetitions. 	f	{triceps}	{chest,shoulders}	\N	f
469	Calves-SMR	foam roll	Begin seated on the floor. Place a foam roller underneath your lower leg. Your other leg can either be crossed over the opposite or be placed on the floor, supporting some of your weight. This will be your starting position. Place your hands to your side or just behind you, and press down to raise your hips off of the floor, placing much of your weight against your calf muscle. Roll from below the knee to above the ankle, pausing at points of tension for 10-30 seconds. Repeat for the other leg. 	f	{calves}	\N	\N	f
470	Leverage High Row	machine	Load an appropriate weight onto the pins and adjust the seat height so that you can just reach the handles above you. Adjust the knee pad to help keep you down. Grasp the handles with a pronated grip. This will be your starting position. Pull the handles towards your torso, retracting your shoulder blades as you flex the elbow. Pause at the bottom of the motion, and then slowly return the handles to the starting position. For multiple repetitions, avoid completely returning the weight to the stops to keep tension on the muscles being worked. 	f	{"middle back"}	{lats}	\N	f
471	Bent-Knee Hip Raise	body only	Lay flat on the floor with your arms next to your sides. Now bend your knees at around a 75 degree angle and lift your feet off the floor by around 2 inches. Using your lower abs, bring your knees in towards you as you maintain the 75 degree angle bend in your legs. Continue this movement until you raise your hips off of the floor by rolling your pelvis backward. Breathe out as you perform this portion of the movement. Tip: At the end of the movement your knees will be over your chest. Squeeze your abs at the top of the movement for a second and then return to the starting position slowly as you breathe in. Tip: Maintain a controlled motion at all times. Repeat for the recommended amount of repetitions. 	f	{abdominals}	\N	\N	f
472	Incline Push-Up Wide	body only	Stand facing a Smith machine bar or sturdy elevated platform at an appropriate height. Place your hands on the bar, with your hands wider than shoulder width. Position your feet back from the bar with arms and body straight. Your arms should be perpendicular to the body. This will be your starting position. Keeping your body straight, lower your chest to the bar by bending the arms. Return to the starting position by extending the elbows, pressing yourself back up. 	f	{chest}	{abdominals,shoulders,triceps}	\N	f
475	Lying Hamstring	other	Lie on your back with your legs extended. Your partner should be kneeling beside you. Raise one leg up towards the ceiling and have your partner hold the ankle. Your partner can use their shoulder to brace your leg if necessary. This will be your starting position. With your partner holding your leg in place, attempt to flex the knee, contracting the hamstrings for 10-20 seconds. Then relax your leg, allowing your partner to gently push the leg towards your head. Be sure to inform your helper when the stretch is adequate to prevent injury or overstretching. Switch sides once complete. 	f	{hamstrings}	{calves}	\N	f
476	Step-up with Knee Raise	body only	Stand facing a box or bench of an appropriate height with your feet together. This will be your starting position. Begin the movement by stepping up, putting your left foot on the top of the bench. Extend through the hip and knee of your front leg to stand up on the box. As you stand on the box with your left leg, flex your right knee and hip, bringing your knee as high as you can. Reverse this motion to step down off the box, and then repeat the sequence on the opposite leg. 	f	{glutes}	{hamstrings,quadriceps}	\N	f
477	Bicycling	other	To begin, seat yourself on the bike and adjust the seat to your height. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
478	Two-Arm Kettlebell Jerk	kettlebells	Clean two kettlebells to your shoulders. Clean the kettlebells to your shoulders by extending through the legs and hips as you swing the kettlebells towards your shoulders. Rotate your wrists as you do so, so that the palms face forward. Squat down a few inches and reverse the motion rapidly driving both kettlebells overhead. Immediately after the initial push, squat down again and get under the kettlebells. Once the kettlebells are locked out, stand upright to complete the exercise. 	f	{shoulders}	{calves,quadriceps,triceps}	\N	f
479	Elevated Back Lunge	barbell	Position a bar onto a rack at shoulder height loaded to an appropriate weight. Place a short, raised platform behind you. Rack the bar onto your upper back, keeping your back arched and tight. Step onto your raised platform with both feet. This will be your starting position. Begin by stepping backwards with one leg. Descend by flexing your hips and knees until your knee touches the floor. Pause, and extend through the hips and knees to rise up, returning all the way to the starting position before alternating. 	f	{quadriceps}	{glutes,hamstrings}	\N	f
480	Cable Seated Crunch	cable	Seat on a flat bench with your back facing a high pulley. Grasp the cable rope attachment with both hands (with the palms of the hands facing each other) and place your hands securely over both shoulders. Tip: Allow the weight to hyperextend the lower back slightly. This will be your starting position. With the hips stationary, flex the waist so the elbows travel toward the hips. Breathe out as you perform this step. As you inhale, go back to the initial position slowly. Repeat for the recommended amount of repetitions. 	t	{abdominals}	\N	\N	f
481	Car Deadlift	other	This event apparatus typically has neutral grip handles, however some have a straight bar that you can approach like a normal deadlift. The apparatus can be loaded with a vehicle or other heavy objects such as tractor tires or kegs. Center yourself between the handles if you are a strong squatter, or back a couple inches if you are a strong deadlifter. You feet should be about hip width apart. Bend at the hip to grip the handles. With your feet and your grip set, take a big breath and then lower your hips and flex the knees. Look forward with your head, keep your chest up and your back arched, and begin driving through the heels to move the weight upward. As the weight comes up, pull your shoulder blades together as you drive your hips forward. Lower the weight by bending at the hips and guiding it to the floor. 	f	{quadriceps}	{forearms,glutes,hamstrings,"lower back",traps}	\N	f
482	Close-Grip Dumbbell Press	dumbbell	Place a dumbbell standing up on a flat bench. Ensuring that the dumbbell stays securely placed at the top of the bench, lie perpendicular to the bench with only your shoulders lying on the surface. Hips should be below the bench and your legs bent with your feet firmly on the floor. Grasp the dumbbell with both hands and hold it straight over your chest at arm's length. Both palms should be pressing against the underside of the sides of the dumbbell. This will be your starting position. Initiate the movement by lowering the dumbbell to your chest. Return to the starting position by extending the elbows. 	f	{triceps}	{chest,shoulders}	\N	f
483	Kettlebell Pirate Ships	kettlebells	With a wide stance, hold a kettlebell with both hands. Allow it to hang at waist level with your arms extended. This will be your starting position. Initiate the movement by turning to one side, swinging the kettlebell to head height. Briefly pause at the top of the motion. Allow the bell to drop as you rotate to the opposite side, again raising the kettlebell to head height. Repeat for the desired amount of repetitions. 	f	{shoulders}	{abdominals}	\N	f
484	Chest Push with Run Release	medicine ball	Begin in an athletic stance with the knees bent, hips back, and back flat. Hold the medicine ball near your legs. This will be your starting position. While taking your first step draw the medicine ball into your chest. As you take the second step, explosively push the ball forward, immediately sprinting for 10 yards after the release. If you are really fast, you can catch your own pass! 	f	{chest}	{abdominals,shoulders,triceps}	\N	f
485	Bodyweight Squat	body only	Stand with your feet shoulder width apart. You can place your hands behind your head. This will be your starting position. Begin the movement by flexing your knees and hips, sitting back with your hips. Continue down to full depth if you are able,and quickly reverse the motion until you return to the starting position. As you squat, keep your head and chest up and push your knees out. 	f	{quadriceps}	{glutes,hamstrings}	\N	f
486	Leg-Over Floor Press	kettlebells	Lie on the floor with one kettlebell in place on your chest, holding it by the handle. Extend leg on working side over leg on non-working side.Your free arm can be extended out to your side for support. Press the kettlebll into a locked out position. Lower the weight until the elbow touches the ground, keeping the kettlebell above the elbow. Repeat for the desired number of repetitions. 	f	{chest}	{shoulders,triceps}	\N	f
487	Incline Hammer Curls	dumbbell	Seat yourself on an incline bench with a dumbbell in each hand. You should pressed firmly against he back with your feet together. Allow the dumbbells to hang straight down at your side, holding them with a neutral grip. This will be your starting position. Initiate the movement by flexing at the elbow, attempting to keep the upper arm stationary. Continue to the top of the movement and pause, then slowly return to the start position. 	t	{biceps}	\N	\N	f
488	Mixed Grip Chin	other	Using a spacing that is just about 1 inch wider than shoulder width, grab a pull-up bar with the palms of one hand facing forward and the palms of the other hand facing towards you. This will be your starting position. Now start to pull yourself up as you exhale. Tip: With the arm that has the palms facing up concentrate on using the back muscles in order to perform the movement. The elbow of that arm should remain close to the torso. With the other arm that has the palms facing forward, the elbows will be away but in line with the torso. You will concentrate on using the lats to pull your body up. After a second contraction at the top, start to slowly come down as you inhale. Repeat for the recommended amount of repetitions. On the following set, switch grips; so if you had the right hand with the palms facing you and the left one with the palms facing forward, on the next set you will have the palms facing forward for the right hand and facing you for the left. 	f	{"middle back"}	{biceps,lats}	\N	f
489	Seated One-Arm Dumbbell Palms-Up Wrist Curl	dumbbell	Sit on a flat bench with a dumbbell in your right hand. Place your feet flat on the floor, at a distance that is slightly wider than shoulder width apart. Lean forward and place your right forearm on top of your upper right thigh with your palm up. Tip: Make sure that the front of the wrist lies on top of your knees. This will be your starting position. Lower the dumbbell as far as possible as you keep a tight grip on the dumbbell. Inhale as you perform this movement. Now curl the dumbbell as high as possible as you contract the forearms and as you exhale. Keep the contraction for a second before you lower again. Tip: The only movement should happen at the wrist. Perform for the recommended amount of repetitions, switch arms and repeat the movement. 	t	{forearms}	\N	\N	f
490	Stiff Leg Barbell Good Morning	barbell	This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack that best matches your height. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it. Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso. Step away from the rack and position your legs using a shoulder width medium stance. Keep your head up at all times as looking down will get you off balance and also maintain a straight back. This will be your starting position. Keeping your legs stationary, move your torso forward by bending at the hips while inhaling. Lower your torso until it is parallel with the floor. Begin to raise the bar as you exhale by elevating your torso back to the starting position. Repeat for the recommended amount of repetitions. 	f	{"lower back"}	{glutes,hamstrings}	\N	f
491	Extended Range One-Arm Kettlebell Floor Press	kettlebells	Lie on the floor and position a kettlebell for one arm to press. The kettlebell should be held by the handle. The leg on the same side that you are pressing should be bent, with the knee crossing over the midline of the body. Press the kettlebell by extending the elbow and adducting the arm, pressing it above your body. Return to the starting position. 	f	{chest}	{shoulders,triceps}	\N	f
492	Front Dumbbell Raise	dumbbell	Pick a couple of dumbbells and stand with a straight torso and the dumbbells on front of your thighs at arms length with the palms of the hand facing your thighs. This will be your starting position. While maintaining the torso stationary (no swinging), lift the left dumbbell to the front with a slight bend on the elbow and the palms of the hands always facing down. Continue to go up until you arm is slightly above parallel to the floor. Exhale as you execute this portion of the movement and pause for a second at the top. Inhale after the second pause. Now lower the dumbbell back down slowly to the starting position as you simultaneously lift the right dumbbell. Continue alternating in this fashion until all of the recommended amount of repetitions have been performed for each arm. 	t	{shoulders}	\N	\N	f
493	Jefferson Squats	barbell	Place a barbell on the floor. Stand in the middle of the bar length wise. Bend down by bending at the knees and keeping your back straight and grasp the front of the bar with your right hand. Your palm should be in (neutral grip) facing the left side. Grasp the rear of the bar with your left hand. The palm of your hand should be in neutral grip alignment (palms facing the right side). Tip: Ensure that your grip is even on the bar. Your torso should be positioned right in the middle of the bar and the distance between your torso and your right hand (which should be at the front) should be the same as the distance between your torso and your left hand (which should be to your back). Now stand straight up with the weight. Tip: Your feet should be shoulder width apart and your toes slightly pointed out. Squat down by bending at the knees and keeping your back straight until your upper thighs are parallel with the floor. Tip: Keep your back as vertical as possible with the floor and your head up. Also remember to not let your knees go past your toes. Inhale during this portion of the movement. Now drive yourself back up to the starting position by pushing with the feet . Tip: Keep the bar hanging at arm's length and your elbows locked with a slight bend. The arms only serve as hooks. Avoid doing any lifting with them. Do the lifting with your thighs; not your arms. 	f	{quadriceps}	{calves,glutes,hamstrings,"lower back",traps}	\N	f
494	Single Leg Butt Kick	body only	Begin by standing on one leg, with the bent knee raised. This will be your start position. Using a countermovement jump, take off upward by extending the hip, knee, and ankle of the grounded leg. Immediately flex the knee and attempt to touch your butt with the heel of your jumping leg. Return the leg to a partially bent position underneath the hips and land. Your opposite leg should stay in relatively the same position throughout the drill. 	f	{quadriceps}	{calves,hamstrings}	\N	f
495	Overhead Cable Curl	cable	To begin, set a weight that is comfortable on each side of the pulley machine. Note: Make sure that the amount of weight selected is the same on each side. Now adjust the height of the pulleys on each side and make sure that they are positioned at a height higher than that of your shoulders. Stand in the middle of both sides and use an underhand grip (palms facing towards the ceiling) to grab each handle. Your arms should be fully extended and parallel to the floor with your feet positioned shoulder width apart from each other. Your body should be evenly aligned the handles. This is the starting position. While exhaling, slowly squeeze the biceps on each side until your forearms and biceps touch. While inhaling, move your forearms back to the starting position. Note: Your entire body is stationary during this exercise except for the forearms. Repeat for the recommended amount of repetitions prescribed in your program. 	t	{biceps}	\N	\N	f
496	Seated Floor Hamstring Stretch	none	Sit on a mat with your right leg extended in front of you and your left leg bent with your foot against your right inner thigh. Lean forward from your hips and reach for your ankle until you feel a stretch in your hamstring. Hold for 15 seconds, then repeat for your other side. 	f	{hamstrings}	{calves}	\N	f
498	Split Jump	body only	Assume a lunge stance position with one foot forward with the knee bent, and the rear knee nearly touching the ground. Ensure that the front knee is over the midline of the foot. Extending through both legs, jump as high as possible, swinging your arms to gain lift. As you jump, bring your feet together, and move them back to their initial positions as you land. Absorb the impact by reverting back to the starting position. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
499	Seated Cable Shoulder Press	cable	Adjust the weight to an appropriate amount and be seated, grasping the handles. Your upper arms should be about 90 degrees to the body, with your head and chest up. The elbows should also be bent to about 90 degrees. This will be your starting position. Begin by extending through the elbow, pressing the handles together above your head. After pausing at the top, return the handles to the starting position. Ensure that you maintain tension on the cables. You can also execute this movement with your back off the pad and alternate hands. 	f	{shoulders}	{triceps}	\N	f
500	Pelvic Tilt Into Bridge	none	Lie down with your feet on the floor, heels directly under your knees. Lift only your tailbone to the ceiling to stretch your lower back. (Don't lift the entire spine yet.) Pull in your stomach. To go into a bridge, lift the entire spine except the neck. 	f	{"lower back"}	\N	\N	f
501	One-Arm Kettlebell Clean and Jerk	kettlebells	Hold a kettlebell by the handle. Clean the kettlebell to your shoulder by extending through the legs and hips as you pull the kettlebell towards your shoulder. Rotate your wrist as you do so, so that the palm faces forward. Dip your body by bending the knees, keeping your torso upright. Immediately reverse direction, driving through the heels, in essence jumping to create momentum. As you do so, press the kettlebell overhead to lockout by extending the arms, using your body's momentum to move the weight. Receive the weight overhead by returning to a squat position underneath the weight. Keeping the weight overhead, return to a standing position. Lower the weight to the floor to perform the next repetition. 	f	{shoulders}	\N	\N	f
502	External Rotation with Cable	cable	Adjust the cable to the same height as your elbow. Stand with your left side to the band a couple of feet away. Grasp the handle with your right hand, and keep your elbow pressed firmly to your side. We recommend you hold a pad or foam roll in place with your elbow to keep it firmly in position. With your upper arm in position, your elbow should be flexed to 90 degrees with your hand reaching across the front of your torso. This will be your starting position. Execute the movement by rotating your arm in a backhand motion, keeping your elbow in place. 	t	{shoulders}	\N	\N	f
503	Dumbbell Rear Lunge	dumbbell	Stand with your torso upright holding two dumbbells in your hands by your sides. This will be your starting position. Step backward with your right leg around two feet or so from the left foot and lower your upper body down, while keeping the torso upright and maintaining balance. Inhale as you go down. Tip: As in the other exercises, do not allow your knee to go forward beyond your toes as you come down, as this will put undue stress on the knee joint. Make sure that you keep your front shin perpendicular to the ground. Keep the torso upright during the lunge; flexible hip flexors are important. A long lunge emphasizes the Gluteus Maximus; a short lunge emphasizes Quadriceps. Push up and go back to the starting position as you exhale. Tip: Use the ball of your feet to push in order to accentuate the quadriceps. To focus on the glutes, press with your heels. Now repeat with the opposite leg. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
504	Dumbbell Bench Press	dumbbell	Lie down on a flat bench with a dumbbell in each hand resting on top of your thighs. The palms of your hands will be facing each other. Then, using your thighs to help raise the dumbbells up, lift the dumbbells one at a time so that you can hold them in front of you at shoulder width. Once at shoulder width, rotate your wrists forward so that the palms of your hands are facing away from you. The dumbbells should be just to the sides of your chest, with your upper arm and forearm creating a 90 degree angle. Be sure to maintain full control of the dumbbells at all times. This will be your starting position. Then, as you breathe out, use your chest to push the dumbbells up. Lock your arms at the top of the lift and squeeze your chest, hold for a second and then begin coming down slowly. Tip: Ideally, lowering the weight should take about twice as long as raising it. Repeat the movement for the prescribed amount of repetitions of your training program. 	f	{chest}	{shoulders,triceps}	\N	f
505	Arnold Dumbbell Press	dumbbell	Sit on an exercise bench with back support and hold two dumbbells in front of you at about upper chest level with your palms facing your body and your elbows bent. Tip: Your arms should be next to your torso. The starting position should look like the contracted portion of a dumbbell curl. Now to perform the movement, raise the dumbbells as you rotate the palms of your hands until they are facing forward. Continue lifting the dumbbells until your arms are extended above you in straight arm position. Breathe out as you perform this portion of the movement. After a second pause at the top, begin to lower the dumbbells to the original position by rotating the palms of your hands towards you. Tip: The left arm will be rotated in a counter clockwise manner while the right one will be rotated clockwise. Breathe in as you perform this portion of the movement. Repeat for the recommended amount of repetitions. 	f	{shoulders}	{triceps}	\N	f
506	Hamstring-SMR	foam roll	In a seated position, extend your legs over a foam roll so that it is position on the back of the upper legs. Place your hands to the side or behind you to help support your weight. This will be your starting position. Using your hands, lift your hips off of the floor and shift your weight on the foam roll to one leg. Relax the hamstrings of the leg you are stretching. Roll over the foam from below the hip to above the back of the knee, pausing at points of tension for 10-30 seconds. Repeat for the other leg. 	t	{hamstrings}	\N	\N	f
507	Cable One Arm Tricep Extension	cable	With your right hand, grasp a single handle attached to the high-cable pulley using a supinated (underhand; palms facing up) grip. You should be standing directly in front of the weight stack. Now pull the handle down so that your upper arm and elbow are locked in to the side of your body. Your upper arm and forearm should form an acute angle (less than 90-degrees). You can keep the other arm by the waist and you can have one leg in front of you and the other one back for better balance. This will be your starting position. As you contract the triceps, move the single handle attachment down to your side until your arm is straight. Breathe out as you perform this movement. Tip: Only the forearms should move. Your upper arms should remain stationary at all times. Squeeze the triceps and hold for a second in this contracted position. Slowly return the handle to the starting position. Repeat for the recommended amount of repetitions and then perform the same movement with the other arm. 	t	{triceps}	\N	\N	f
508	Band Good Morning	bands	Using a 41 inch band, stand on one end, spreading your feet a small amount. Bend at the hips to loop the end of the band behind your neck. This will be your starting position. Keeping your legs straight, extend through the hips to come to a near vertical position. Ensure that you do not round your back as you go down back to the starting position. 	f	{hamstrings}	{glutes,"lower back"}	\N	f
509	Side To Side Chins	other	Grab the pull-up bar with the palms facing forward using a wide grip. As you have both arms extended in front of you holding the bar at a wide grip, bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position. Pull your torso up while leaning to the left hand side until the bar almost touches your upper chest by drawing the shoulders and the upper arms down and back. Exhale as you perform this portion of the movement. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary as it moves through space (no swinging) and only the arms should move. The forearms should do no other work other than hold the bar. After a second of contraction, inhale as you go back to the starting position. Now, pull your torso up while leaning to the right hand side until the bar almost touches your upper chest by drawing the shoulders and the upper arms down and back. Exhale as you perform this portion of the movement. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary as it moves through space and only the arms should move. The forearms should do no other work other than hold the bar. After a second of contraction, inhale as you go back to the starting position. Repeat steps 3-6 until you have performed the prescribed amount of repetitions for each side. 	f	{lats}	{biceps,forearms,"middle back",shoulders}	\N	f
510	Standing Dumbbell Reverse Curl	dumbbell	To begin, stand straight with a dumbbell in each hand using a pronated grip (palms facing down). Your arms should be fully extended while your feet are shoulder width apart from each other. This is the starting position. While holding the upper arms stationary, curl the weights while contracting the biceps as you breathe out. Only the forearms should move. Continue the movement until your biceps are fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a second as you squeeze the muscle. Slowly begin to bring the dumbbells back to starting position as your breathe in. Repeat for the recommended amount of repetitions. 	t	{biceps}	{forearms}	\N	f
511	Straight-Arm Dumbbell Pullover	dumbbell	Place a dumbbell standing up on a flat bench. Ensuring that the dumbbell stays securely placed at the top of the bench, lie perpendicular to the bench (torso across it as in forming a cross) with only your shoulders lying on the surface. Hips should be below the bench and legs bent with feet firmly on the floor. The head will be off the bench as well. Grasp the dumbbell with both hands and hold it straight over your chest at arms length. Both palms should be pressing against the underside one of the sides of the dumbbell. This will be your starting position.Caution: Always ensure that the dumbbell used for this exercise is secure. Using a dumbbell with loose plates can result in the dumbbell falling apart and falling on your face. While keeping your arms straight, lower the weight slowly in an arc behind your head while breathing in until you feel a stretch on the chest. At that point, bring the dumbbell back to the starting position using the arc through which the weight was lowered and exhale as you perform this movement. Hold the weight on the initial position for a second and repeat the motion for the prescribed number of repetitions. 	f	{chest}	{lats,shoulders,triceps}	\N	f
512	Lying Close-Grip Barbell Triceps Extension Behind The Head	barbell	While holding a barbell or EZ Curl bar with a pronated grip (palms facing forward), lie on your back on a flat bench with your head close to the end of the bench. Tip: If you are holding a barbell grab it using a shoulder-width grip and if you are using an E-Z Bar grab it on the inner handles. Extend your arms in front of you and slowly bring the bar back in a semi circular motion (while keeping the arms extended) to a position over your head. At the end of this step your arms should be overhead and parallel to the floor. This will be your starting position. Tip: Keep your elbows in at all times. As you inhale, lower the bar by bending at the elbows and while keeping the upper arm stationary. Keep lowering the bar until your forearms are perpendicular to the floor. As you exhale bring the bar back up to the starting position by pushing the bar up in a semi-circular motion until the lower arms are also parallel to the floor. Contract the triceps hard at the top of the movement for a second. Tip: Again, only the forearms should move. The upper arms should remain stationary at all times. Repeat for the recommended amount of repetitions. 	t	{triceps}	\N	\N	f
513	Incline Push-Up Medium	body only	Stand facing a Smith machine bar or sturdy elevated platform at an appropriate height. Place your hands on the bar, with your hands about shoulder width apart. Position your feet back from the bar with arms and body straight. This will be your starting position. Keeping your body straight, lower your chest to the bar by bending the arms. Return to the starting position by extending the elbows, pressing yourself back up. 	f	{chest}	{abdominals,shoulders,triceps}	\N	f
514	Rocky Pull-Ups/Pulldowns	other	Grab the pull-up bar with the palms facing forward using a wide grip. As you have both arms extended in front of you holding the bar at the chosen grip width, bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position. Pull your torso up until the bar touches your upper chest by drawing the shoulders and the upper arms down and back. Exhale as you perform this portion of the movement. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary as it moves through space and only the arms should move. The forearms should do no other work other than hold the bar. After a second on the contracted position, start to inhale and slowly lower your torso back to the starting position when your arms are fully extended and the lats are fully stretched. Now repeat the same movements as described above except this time your torso will remain straight as you go up and the bar will touch the back of the neck instead of the upper chest. Tip: Use the head to lean forward slightly as it will help you properly execute this portion of the exercise. Once you have lowered yourself back down to the starting position, repeat the exercise for the prescribed amount of repetitions in your program. 	f	{lats}	{biceps,"middle back",shoulders}	\N	f
525	Dumbbell Shrug	dumbbell	Stand erect with a dumbbell on each hand (palms facing your torso), arms extended on the sides. Lift the dumbbells by elevating the shoulders as high as possible while you exhale. Hold the contraction at the top for a second. Tip: The arms should remain extended at all times. Refrain from using the biceps to help lift the dumbbells. Only the shoulders should be moving up and down. Lower the dumbbells back to the original position. Repeat for the recommended amount of repetitions. 	t	{traps}	\N	\N	f
515	Standing Calf Raises	machine	Adjust the padded lever of the calf raise machine to fit your height. Place your shoulders under the pads provided and position your toes facing forward (or using any of the two other positions described at the beginning of the chapter). The balls of your feet should be secured on top of the calf block with the heels extending off it. Push the lever up by extending your hips and knees until your torso is standing erect. The knees should be kept with a slight bend; never locked. Toes should be facing forward, outwards or inwards as described at the beginning of the chapter. This will be your starting position. Raise your heels as you breathe out by extending your ankles as high as possible and flexing your calf. Ensure that the knee is kept stationary at all times. There should be no bending at any time. Hold the contracted position by a second before you start to go back down. Go back slowly to the starting position as you breathe in by lowering your heels as you bend the ankles until calves are stretched. Repeat for the recommended amount of repetitions. 	t	{calves}	\N	\N	f
516	Trail Running/Walking	none	Running or hiking on trails will get the blood pumping and heart beating almost immediately. Make sure you have good shoes. While you use the muscles in your calves and buttocks to pull yourself up a hill, the knees, joints and ankles absorb the bulk of the pounding coming back down. Take smaller steps as you walk downhill, keep your knees bent to reduce the impact and slow down to avoid falling. A 150 lb person can burn over 200 calories for 30 minutes walking uphill, compared to 175 on a flat surface. If running the trail, a 150 lb person can burn well over 500 calories in 30 minutes. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
517	Cat Stretch	none	Position yourself on the floor on your hands and knees. Pull your belly in and round your spine, lower back, shoulders, and neck, letting your head drop. Hold for 15 seconds. 	f	{"lower back"}	{"middle back",traps}	\N	f
518	Weighted Sit-Ups - With Bands	other	Start out by strapping the bands around the base of the decline bench. Place the handles towards the inside of the decline bench so that when lying down, you can reach for both of them. Position your legs through the decline machine until they are secured. Now reach for the exercise bands with both hands. Use a pronated (palms forward) grip to grasp the handles. Position them near your collar bone and rotate your wrist to a neutral grip (palms facing the torso). Note: Your arms should remain stationary throughout the exercise. This is the starting position. Move your torso upward until your upper body is perpendicular to the floor while exhaling. Hold the contraction for a second and lower your upper body back down to the starting position while inhaling. Repeat for the recommended amount of repetitions. 	t	{abdominals}	\N	\N	f
519	Incline Push-Up Reverse Grip	body only	Stand facing a Smith machine bar or sturdy elevated platform at an appropriate height. Place your hands on the bar palms up, with your hands about shoulder width apart. Position your feet back from the bar with arms and body straight. This will be your starting position. Keeping your body straight, lower your chest to the bar by bending the arms. Return to the starting position by extending the elbows, pressing yourself back up. 	f	{chest}	{abdominals,shoulders,triceps}	\N	f
520	Squat with Bands	barbell	Set up the bands on the sleeves, secured to either band pegs, the rack, or dumbbells so that there is appropriate tension. Begin by stepping under the bar and placing it across the back of the shoulders. Squeeze your shoulder blades together and rotate your elbows forward, attempting to bend the bar across your shoulders. Remove the bar from the rack, creating a tight arch in your lower back, and step back into position. Place your feet wide for more emphasis on the back, glutes, adductors, and hamstrings. Keep your head facing forward. With your back, shoulders, and core tight, push your knees and butt out and you begin your descent. Sit back with your hips as much as possible. Ideally, your shins should be perpendicular to the ground. Lower bar position necessitates a greater torso lean to keep the bar over the heels. Continue until you break parallel, which is defined as the crease of the hip being in line with the top of the knee. Keeping the weight on your heels and pushing your feet and knees out, drive upward as you lead the movement with your head. Continue upward, maintaining tightness head to toe, until you have returned to the starting position. 	f	{quadriceps}	{adductors,calves,glutes,hamstrings,"lower back"}	\N	f
521	Weighted Pull Ups	other	Attach a weight to a dip belt and secure it around your waist. Grab the pull-up bar with the palms of your hands facing forward. For a medium grip, your hands should be spaced at shoulder width. Both arms should be extended in front of you holding the bar at the chosen grip. You'll want to bring your torso back about 30 degrees while creating a curvature in your lower back and sticking your chest out. This will be your starting position. Now, exhale and pull your torso up until your head is above your hands. Concentrate on squeezing yourshoulder blades back and down as you reach the top contracted position. After a brief moment at the top contracted position, inhale and slowly lower your torso back to the starting position with your arms extended and your lats fully stretched. 	f	{lats}	{biceps,"middle back"}	\N	f
522	Seated Hamstring	none	In a seated position with your legs extended, have your partner stand behind you. Now, lean forward as your partner braces your shoulders with their hands. This will be your starting position. Attempt to push your torso back for 10-20 seconds, as your partner prevents any actual movement of your torso. Now relax your muscles as your partner increases the stretch by gently pushing your torso forward for 10-20 seconds. 	f	{hamstrings}	{calves}	\N	f
523	Barbell Deadlift	barbell	Stand in front of a loaded barbell. While keeping the back as straight as possible, bend your knees, bend forward and grasp the bar using a medium (shoulder width) overhand grip. This will be the starting position of the exercise. Tip: If it is difficult to hold on to the bar with this grip, alternate your grip or use wrist straps. While holding the bar, start the lift by pushing with your legs while simultaneously getting your torso to the upright position as you breathe out. In the upright position, stick your chest out and contract the back by bringing the shoulder blades back. Think of how the soldiers in the military look when they are in standing in attention. Go back to the starting position by bending at the knees while simultaneously leaning the torso forward at the waist while keeping the back straight. When the weights on the bar touch the floor you are back at the starting position and ready to perform another repetition. Perform the amount of repetitions prescribed in the program. 	f	{"lower back"}	{calves,forearms,glutes,hamstrings,lats,"middle back",quadriceps,traps}	\N	f
524	Double Kettlebell Push Press	kettlebells	Clean two kettlebells to your shoulders. Squat down a few inches and reverse the motion rapidly. Use the momentum from the legs to drive the kettlebells overhead. Once the kettlebells are locked out, lower the kettlebells to your shoulders and repeat. 	f	{shoulders}	{calves,quadriceps,triceps}	\N	f
526	Bench Jump	body only	Begin with a box or bench 1-2 feet in front of you. Stand with your feet shoulder width apart. This will be your starting position. Perform a short squat in preparation for the jump; swing your arms behind you. Rebound out of this position, extending through the hips, knees, and ankles to jump as high as possible. Swing your arms forward and up. Jump over the bench, landing with the knees bent, absorbing the impact through the legs. Turn around and face the opposite direction, then jump back over the bench. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
527	Standing Dumbbell Press	dumbbell	Standing with your feet shoulder width apart, take a dumbbell in each hand. Raise the dumbbells to head height, the elbows out and about 90 degrees. This will be your starting position. Maintaining strict technique with no leg drive or leaning back, extend through the elbow to raise the weights together directly above your head. Pause, and slowly return the weight to the starting position. 	f	{shoulders}	{triceps}	\N	f
528	Box Squat with Chains	barbell	Begin in a power rack with a box at the appropriate height behind you. Typically, you would aim for a box height that brings you to a parallel squat, but you can train higher or lower if desired. To set up the chains, begin by looping the leader chain over the sleeves of the bar. The heavy chain should be attached using a snap hook. Adjust the length of the lead chain so that a few links are still on the floor at the top of the movement. Begin by stepping under the bar and placing it across the back of the shoulders. Squeeze your shoulder blades together and rotate your elbows forward, attempting to bend the bar across your shoulders. Remove the bar from the rack, creating a tight arch in your lower back, and step back into position. Place your feet wider for more emphasis on the back, glutes, adductors, and hamstrings, or closer together for more quad development. Keep your head facing forward. With your back, shoulders, and core tight, push your knees and butt out and you begin your descent. Sit back with your hips until you are seated on the box. Ideally, your shins should be perpendicular to the ground. Pause when you reach the box, and relax the hip flexors. Never bounce off of a box. Keeping the weight on your heels and pushing your feet and knees out, drive upward off of the box as you lead the movement with your head. Continue upward, maintaining tightness head to toe. 	f	{quadriceps}	{abductors,adductors,calves,glutes,hamstrings,"lower back"}	\N	f
529	Suspended Push-Up	other	Anchor your suspension straps securely to the top of a rack or other object. Leaning into the straps, take a handle in each hand and move into a push-up plank position. You should be as close to parallel to the ground as you can manage with your arms fully extended, maintaining good posture. Maintaining a straight, rigid torso, descend slowly by allowing the elbows to flex. Continue until your elbows break 90 degrees, pausing before you extend to return to the starting position. 	f	{chest}	{shoulders,triceps}	\N	f
530	Hang Clean - Below the Knees	barbell	Begin with a shoulder width, double overhand or hook grip, with the bar hanging just below the knees. Your back should be straight and inclined slightly forward. Begin by aggressively extending through the hips, knees and ankles, driving the weight upward. As you do so, shrug your shoulders towards your ears. As full extension is achieved, transition into the third pull by aggressively shrugging and flexing the arms with the elbows up and out. At peak extension, aggressively pull yourself down, rotating your elbows under the bar as you do so. Receive the bar in a front squat position, the depth of which is dependent upon the height of the bar at the end of the third pull. The bar should be racked onto the protracted shoulders, lightly touching the throat with the hands relaxed. Continue to descend to the bottom squat position, which will help in the recovery. Immediately recover by driving through the heels, keeping the torso upright and elbows up. Continue until you have risen to a standing position. 	f	{quadriceps}	{calves,forearms,glutes,hamstrings,"lower back",shoulders,traps}	\N	f
531	Smith Single-Leg Split Squat	machine	To begin, place a flat bench 2-3 feet behind the smith machine. Then, set the bar on the height that best matches your height. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it. Hold on to the bar using both arms at each side (palms facing forward), unlock it and lift it off the rack by first pushing with your legs and at the same time straightening your torso. Position your legs by placing one foot slightly forward under the bar and extending your other leg back and place the top of your foot on the bench. This will be your starting position Begin to slowly lower the bar by bending the knee as you maintain a straight posture with the head up. Continue down until the angle between the upper leg and the calf becomes slightly less than 90-degrees (which is the point in which the upper legs are below parallel to the floor). Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knee should make an imaginary straight line with the toes that is perpendicular to the front. If your knee is past that imaginary line (if it is past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly. Begin to raise the bar as you exhale by pushing the floor with the heel of your foot mainly as you straighten your leg again and go back to the starting position. Repeat for the recommended amount of repetitions. Switch legs and repeat the movement. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
532	Seated Overhead Stretch	none	Sit up straight on an exercise mat. Touch the soles of your feet together with your feet six to eight inches in front of your hips. Place one hand on the floor beside you and your other hand behind your head. Lift your elbow to the ceiling as you incline your torso to the other side. Hold for 10 to 20 seconds, then switch sides. 	t	{abdominals}	\N	\N	f
533	Front Two-Dumbbell Raise	dumbbell	Pick a couple of dumbbells and stand with a straight torso and the dumbbells on front of your thighs at arms length with the palms of the hand facing your thighs. This will be your starting position. While maintaining the torso stationary (no swinging), lift the dumbbells to the front with a slight bend on the elbow and the palms of the hands always facing down. Continue to go up until you arms are slightly above parallel to the floor. Exhale as you execute this portion of the movement and pause for a second at the top. As you inhale, lower the dumbbells back down slowly to the starting position. Repeat for the recommended amount of repetitions. 	t	{shoulders}	\N	\N	f
546	Front Leg Raises	body only	Stand next to a chair or other support, holding on with one hand. Swing your leg forward, keeping the leg straight. Continue with a downward swing, bringing the leg as far back as your flexibility allows. Repeat 5-10 times, and then switch legs. 	f	{hamstrings}	\N	\N	f
534	Decline Reverse Crunch	body only	Lie on your back on a decline bench and hold on to the top of the bench with both hands. Don't let your body slip down from this position. Hold your legs parallel to the floor using your abs to hold them there while keeping your knees and feet together. Tip: Your legs should be fully extended with a slight bend on the knee. This will be your starting position. While exhaling, move your legs towards the torso as you roll your pelvis backwards and you raise your hips off the bench. At the end of this movement your knees will be touching your chest. Hold the contraction for a second and move your legs back to the starting position while inhaling. Repeat for the recommended amount of repetitions. 	f	{abdominals}	\N	\N	f
535	Weighted Jump Squat	barbell	Position a lightly loaded barbell across the back of your shoulders. You could also use a weighted vest, sandbag, or other type of resistance for this exercise. The weight should be light enough that it doesn't slow you down significantly. Your feet should be just outside of shoulder width with your head and chest up. This will be your starting position. Using a countermovement, squat partially down and immediately reverse your direction to explode off of the ground, extending through your hips, knees, and ankles. Maintain good posture throughout the jump. As you return to the ground, absorb the impact through your legs. 	f	{quadriceps}	{calves,glutes,hamstrings,"lower back"}	\N	f
536	Reverse Grip Triceps Pushdown	cable	Start by setting a bar attachment (straight or e-z) on a high pulley machine. Facing the bar attachment, grab it with the palms facing up (supinated grip) at shoulder width. Lower the bar by using your lats until your arms are fully extended by your sides. Tip: Elbows should be in by your sides and your feet should be shoulder width apart from each other. This is the starting position. Slowly elevate the bar attachment up as you inhale so it is aligned with your chest. Only the forearms should move and the elbows/upper arms should be stationary by your side at all times. Then begin to lower the cable bar back down to the original staring position while exhaling and contracting the triceps hard. Repeat for the recommended amount of repetitions. 	t	{triceps}	\N	\N	f
537	Muscle Snatch	barbell	Begin with a loaded barbell held at the mid thigh position with a wide grip. The feet should be directly below the hips, with the feet turned out as needed. Lower the hips, with the chest up and the head looking forward. The shoulders should be just in front of the bar. This will be the starting position. Begin the pull by driving through the front of the heels, raising the bar. Transition into the second pull by extending through the hips knees and ankles, driving the bar up as quickly as possible. The bar should be close to the body. Continue raising the bar to the overhead position, without rebending the knees. 	f	{hamstrings}	{glutes,"lower back",quadriceps,shoulders,triceps}	\N	f
538	Smith Machine Hip Raise	machine	Position a bench in the rack and load the bar to an appropriate weight. Lie down on the bench, placing the bottom of your feet against the bar. Unlock the bar and extend your legs. You may need to use your hands to assist you. For added stability grasp the sides of the Smith Machine. This will be your starting position. Initiate the movement by rotating your pelvis, flexing your spine to raise your hips off of the bench. Maintain a slight bend in the knees throughout the motion. After a brief pause, return the hips to the bench. Repeat for the desired number of repetitions. 	t	{abdominals}	\N	\N	f
539	Shoulder Stretch	none	Reach your left arm across your body and hold it straight. 	f	{shoulders}	\N	\N	f
540	Clock Push-Up	body only	Move into a prone position on the floor, supporting your weight on your hands and toes. Your arms should be fully extended with the hands around shoulder width. Keep your body straight throughout the movement. This will be your starting position. Descend by flexing at the elbow, lowering your chest toward the ground. At the bottom, reverse the motion by pushing yourself up through elbow extension as quickly as possible until you are air borne. Aim to "jump" 12-18 inches to one side. As you accelerate up, move your outside foot away from your direction of travel. Leaving the ground, shift your body about 30 degrees for the next repetition. Return to the starting position and repeat the exercise, working all the way around until you are back where you started. 	f	{chest}	{shoulders,triceps}	\N	f
541	Chin To Chest Stretch	none	Get into a seated position on the floor. Place both hands at the rear of your head, fingers interlocked, thumbs pointing down and elbows pointing straight ahead. Slowly pull your head down to your chest. Hold for 20-30 seconds. 	f	{neck}	{traps}	\N	f
542	Alternating Kettlebell Row	kettlebells	Place two kettlebells in front of your feet. Bend your knees slightly and push your butt out as much as possible. As you bend over to get into the starting position grab both kettlebells by the handles. Pull one kettlebell off of the floor while holding on to the other kettlebell. Retract the shoulder blade of the working side, as you flex the elbow, drawing the kettlebell towards your stomach or rib cage. Lower the kettlebell in the working arm and repeat with your other arm. 	t	{"middle back"}	{biceps,lats}	\N	f
543	Cross-Body Crunch	body only	Lie flat on your back and bend your knees about 60 degrees. Keep your feet flat on the floor and place your hands loosely behind your head. This will be your starting position. Now curl up and bring your right elbow and shoulder across your body while bring your left knee in toward your left shoulder at the same time. Reach with your elbow and try to touch your knee. Exhale as you perform this movement. Tip: Try to bring your shoulder up towards your knee rather than just your elbow and remember that the key is to contract the abs as you perform the movement; not just to move the elbow. Now go back down to the starting position as you inhale and repeat with the left elbow and the right knee. Continue alternating in this manner until all prescribed repetitions are done. 	f	{abdominals}	\N	\N	f
544	Two-Arm Kettlebell Clean	kettlebells	Place two kettlebells between your feet. To get in the starting position, push your butt back and look straight ahead. Clean the kettlebells to your shoulders by extending through the legs and hips as you raise the kettlebells towards your shoulders. Rotate your wrists as you do so. Lower the kettlebells back to the starting position and repeat. 	f	{shoulders}	{calves,glutes,hamstrings,"lower back",traps}	\N	f
545	Around The Worlds	dumbbell	Lay down on a flat bench holding a dumbbell in each hand with the palms of the hands facing towards the ceiling. Tip: Your arms should be parallel to the floor and next to your thighs. To avoid injury, make sure that you keep your elbows slightly bent. This will be your starting position. Now move the dumbbells by creating a semi-circle as you displace them from the initial position to over the head. All of the movement should happen with the arms parallel to the floor at all times. Breathe in as you perform this portion of the movement. Reverse the movement to return the weight to the starting position as you exhale. 	f	{chest}	{shoulders}	\N	f
547	Lateral Cone Hops	other	Position a number of cones in a row several feet apart. Stand next to the end of the cones, facing 90 degrees to the direction of travel. This will be your starting position. Begin the jump by dipping with the knees to initiate a stretch reflex, and immediately reverse direction to push off the ground, jumping up and sideways over the cone. Use your legs to absorb impact upon landing, and rebound into the next jump, continuing down the row of cones. 	f	{adductors}	{abductors,calves,glutes,hamstrings,quadriceps}	\N	f
548	Face Pull	cable	Facing a high pulley with a rope or dual handles attached, pull the weight directly towards your face, separating your hands as you do so. Keep your upper arms parallel to the ground. 	f	{shoulders}	{"middle back"}	\N	f
549	Dead Bug	body only	Begin lying on your back with your hands extended above you toward the ceiling. Bring your feet, knees, and hips up to 90 degrees. Exhale hard to bring your ribcage down and flatten your back onto the floor, rotating your pelvis up and squeezing your glutes. Hold this position throughout the movement. This will be your starting position. Initiate the exercise by extending one leg, straightening the knee and hip to bring the leg just above the ground. Maintain the position of your lumbar and pelvis as you perform the movement, as your back is going to want to arch. Stay tight and return the working leg to the starting position. Repeat on the opposite side, alternating until the set is complete. 	f	{abdominals}	\N	\N	f
550	Side Bridge	body only	Lie on your side with your elbow directly under your shoulder and legs stacked or staggered for balance. Engage your core and lift your hips until your body forms a straight line from head to heels. Hold this position, keeping your hips elevated and core tight. Lower with control and switch sides as needed.	f	{abdominals}	{shoulders}	\N	f
551	Seated Band Hamstring Curl	other	Secure a band close to the ground and place a bench a couple feet away from it. Seat yourself on the bench and secure the band behind your ankles, beginning with your legs straight. This will be your starting position. Flex the knees, bringing your feet towards the bench. You may need to lean back slightly to keep your feet from striking the floor. Pause at the completion of the movement, and then slowly return to the starting position. 	t	{hamstrings}	\N	\N	f
552	Lying Bent Leg Groin	other	Lie on your back with your knees bent and the soles of the feet pressed together. Have your partner hold your knees. This will be your starting position. Attempt to squeeze your knees together, while your partner prevents any movement from occurring. After 10-20 seconds, relax your muscles as your partner gently pushes your knees towards the floor. Be sure to inform your helper when the stretch is adequate to prevent injury or overstretching. 	f	{adductors}	\N	\N	f
553	Dumbbell One-Arm Upright Row	dumbbell	Grab a dumbbell and stand up straight with your arm extended in front of you with a slight bend at the elbows and your back straight. This will be your starting position. Tip: The dumbbell should be resting on top of your thigh with the palm of your hands facing your thighs. Keep the other hand can be kept fully extended to the side, by the waist or grabbing a fixed surface. This will be your starting position. Use your side shoulders to lift the dumbbell as you exhale. The dumbbell should be close to the body as you move it up. Continue to lift it until the dumbbell is nearly in line with your chin. Tip: Your elbows should drive the motion. As you lift the dumbbell, your elbow should always be higher than your forearm. Also, keep your torso stationary and pause for a second at the top of the movement. Lower the dumbbell back down slowly to the starting position. Inhale as you perform this portion of the movement. Repeat for the recommended amount of repetitions and switch arms. 	f	{shoulders}	{biceps,traps}	\N	f
554	The Straddle	none	Begin in a seated, upright position. Start by extending your legs in front of you in a V. With your hands on the floor, lean forward as far as possible. Hold for 10 to 20 seconds. 	f	{hamstrings}	{adductors,calves}	\N	f
555	Bent Over Two-Arm Long Bar Row	barbell	Put weight on one of the ends of an Olympic barbell. Make sure that you either place the other end of the barbell in the corner of two walls; or put a heavy object on the ground so the barbell cannot slide backward. Bend forward until your torso is as close to parallel with the floor as you can and keep your knees slightly bent. Now grab the bar with both arms just behind the plates on the side where the weight was placed and put your other hand on your knee. This will be your starting position. Pull the bar straight up with your elbows in (to maximize back stimulation) until the plates touch your lower chest. Squeeze the back muscles as you lift the weight up and hold for a second at the top of the movement. Breathe out as you lift the weight. Tip: Use a stirrup or double handle cable attachment by hooking it under the end of the bar. Slowly lower the bar to the starting position getting a nice stretch on the lats. Tip: Do not let the plates touch the floor. To ensure the best range of motion, I recommend using small plates (25-lb ones) as opposed to larger plates (like 35-45lb ones). Repeat for the recommended amount of repetitions. 	f	{"middle back"}	{biceps,lats}	\N	f
556	Reverse Band Sumo Deadlift	barbell	Begin with a bar loaded on the floor inside of a power rack. Attach bands to the top of the rack, using either pegs or the frame itself. Attach the other end to the barbell. Approach the bar so that the bar intersects the middle of the feet. The feet should be set very wide, near the collars. Bend at the hips to grip the bar. The arms should be directly below the shoulders, inside the legs, and you can use a pronated grip, a mixed grip, or hook grip. Relax the shoulders, which in effect lengthens your arms. Take a breath, and then lower your hips, looking forward with your head with your chest up. Drive through the floor, spreading your feet apart, with your weight on the back half of your feet. Extend through the hips and knees. As the bar passes through the knees, lean back and drive the hips into the bar, pulling your shoulder blades together. Return the weight to the ground by bending at the hips and controlling the weight on the way down. 	f	{hamstrings}	{abductors,adductors,calves,forearms,glutes,"lower back",quadriceps,traps}	\N	f
557	Deadlift with Bands	barbell	To deadlift with short bands, simply loop them over the bar before you start, and step into them to set up. For long bands, they will need to be anchored to a secure base, such as heavy dumbbells or a rack. With your feet, and your grip set, take a big breath and then lower your hips and bend the knees until your shins contact the bar. Look forward with your head, keep your chest up and your back arched, and begin driving through the heels to move the weight upward. After the bar passes the knees, aggressively pull the bar back, pulling your shoulder blades together as you drive your hips forward into the bar. Lower the bar by bending at the hips and guiding it to the floor. 	f	{"lower back"}	{forearms,glutes,hamstrings,"middle back",quadriceps,traps}	\N	f
558	Upright Row - With Bands	bands	To begin, stand on an exercise band so that tension begins at arm's length. Grasp the handles using a pronated (palms facing your thighs) grip that is slightly less than shoulder width. The handles should be resting on top of your thighs. Your arms should be extended with a slight bend at the elbows and your back should be straight. This will be your starting position. Use your side shoulders to lift the handles as you exhale. The handles should be close to the body as you move them up. Continue to lift the handles until they nearly touches your chin. Tip: Your elbows should drive the motion. As you lift the handles, your elbows should always be higher than your forearms. Also, keep your torso stationary and pause for a second at the top of the movement. Lower the handles back down slowly to the starting position. Inhale as you perform this portion of the movement. Repeat for the recommended amount of repetitions. 	f	{traps}	{shoulders}	\N	f
559	Hanging Bar Good Morning	barbell	Begin with a bar on a rack at about the same height as your stomach. Suspend the bar using chains or suspension straps. Bend over underneath the bar and rack the bar across the rear of your shoulders as you would a power squat, not on top of your traps. At the proper height, you should be near parallel to the floor when bent over. Keep your back tight, shoulder blades pinched together, and your knees slightly bent. Keep your back arched and your cervical spine in proper alignment. Begin the motion by extending through the hips with your glutes and hamstrings, and you are standing with the weight. Slowly lower the weight back to the starting position, where it is supported by the chains. 	f	{hamstrings}	{abdominals,glutes,"lower back"}	\N	f
560	Smith Machine Leg Press	machine	Position a Smith machine bar a couple feet off of the ground. Ensure that it is resting on the safeties. After loading the bar to an appropriate weight, lie underneath the bar. Place the middle of your feet on the bar, tucking your knees to your chest. This will be your starting position. Begin the movement by driving through your feet to move the bar upward, extending the hips and knees. Do not lock out your knees. At the top of the motion, pause briefly before returning to the starting position. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
561	Side Hop-Sprint	other	Stand to the side of a cone or hurdle. Begin this drill by hopping sideways over the obstacle, rebounding out of your landing to hop back to where you started. Hop for a prescribed number or repetitions as quickly as possible, and finish this drill by sprinting a short distance upon landing the last hop. 	f	{quadriceps}	{abductors,adductors,calves,hamstrings}	\N	f
562	Power Snatch	barbell	Begin with a loaded barbell on the floor. The bar should be close to or touching the shins, and a wide grip should be taken on the bar. The feet should be directly below the hips, with the feet turned out as needed. Lower the hips, with the chest up and the head looking forward. The shoulders should be just in front of the bar. This will be the starting position. Begin the first pull by driving through the front of the heels, raising the bar from the ground. The back angle should stay the same until the bar passes the knees. Transition into the second pull by extending through the hips knees and ankles, driving the bar up as quickly as possible. The bar should be close to the body. At peak extension, shrug the shoulders and allow the elbows to flex to the side. As you move your feet into the receiving position, a slightly wider position, pull yourself below the bar as you elevate the bar overhead. The bar should be received in a partial squat. Continue raising the bar to the overhead position, receiving the bar locked out overhead. Return to a standing position with the weight over head. 	f	{hamstrings}	{calves,glutes,"lower back",quadriceps,shoulders,traps,triceps}	\N	f
563	One-Arm Flat Bench Dumbbell Flye	dumbbell	Lie down on a flat bench with a dumbbell in one hand resting on top of your thigh. The palm of your hand with the dumbbell in it should be at a neutral grip. By using your thighs to help you get the dumbbell up, clean the dumbbell so that you can hold it in front of you with your lifting arm being fully extended. Remember to maintain a neutral grip with this exercise. Your non lifting hand should be to the side holding the flat bench for better support. This will be your starting position. Your arm with the weight should have a slight bend on your elbow in order to prevent stress at the biceps tendon. Begin by lowering your arm with the weight in it out in a wide arc until you feel a stretch on your chest. Breathe in as you perform this portion of the movement. Tip: Keep in mind that throughout the movement, your lifting arm should remain stationary; the movement should only occur at the shoulder joint. Return your lifting arm back to the starting position as you squeeze your chest muscles and breathe out. Tip: Make sure to use the same arc of motion used to lower the weights. Hold for a second at the contracted position and repeat the movement for the prescribed amount of repetitions. Switch arms and repeat the exercise. 	t	{chest}	\N	\N	f
564	Wide-Grip Barbell Bench Press	barbell	Lie back on a flat bench with feet firm on the floor. Using a wide, pronated (palms forward) grip that is around 3 inches away from shoulder width (for each hand), lift the bar from the rack and hold it straight over you with your arms locked. The bar will be perpendicular to the torso and the floor. This will be your starting position. As you breathe in, come down slowly until you feel the bar on your middle chest. After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your chest muscles. Lock your arms and squeeze your chest in the contracted position, hold for a second and then start coming down slowly again. Tip: It should take at least twice as long to go down than to come up. Repeat the movement for the prescribed amount of repetitions. 	f	{chest}	{shoulders,triceps}	\N	f
565	Leg-Up Hamstring Stretch	none	Lie flat on your back, bend one knee, and put that foot flat on the floor to stabilize your spine. Extend the other leg in the air. If you're tight, you wont be able to straighten it. That's okay. Extend the knee so that the sole of the lifted foot faces the ceiling (or as close as you can get it). Slowly straighten the legs as much as possible and then pull the leg toward your nose. Switch sides. 	t	{hamstrings}	\N	\N	f
577	Low Pulley Row To Neck	cable	Sit on a low pulley row machine with a rope attachment. Grab the ends of the rope using a palms-down grip and sit with your back straight and your knees slightly bent. Tip: Keep your back almost completely vertical and your arms fully extended in front of you. This will be your starting position. While keeping your torso stationary, lift your elbows and start bending them as you pull the rope towards your neck while exhaling. Throughout the movement your upper arms should remain parallel to the floor. Tip: Continue this motion until your hands are almost next to your ears (the forearms will not be parallel to the floor at the end of the movement as they will be angled a bit upwards) and your elbows are out away from your sides. After holding for a second or so at the contracted position, come back slowly to the starting position as you inhale. Tip: Again, during no part of the movement should the torso move. Repeat for the recommended amount of repetitions. 	f	{shoulders}	{biceps,"middle back",traps}	\N	f
566	Incline Cable Flye	cable	To get yourself into the starting position, set the pulleys at the floor level (lowest level possible on the machine that is below your torso). Place an incline bench (set at 45 degrees) in between the pulleys, select a weight on each one and grab a pulley on each hand. With a handle on each hand, lie on the incline bench and bring your hands together at arms length in front of your face. This will be your starting position. With a slight bend of your elbows (in order to prevent stress at the biceps tendon), lower your arms out at both sides in a wide arc until you feel a stretch on your chest. Breathe in as you perform this portion of the movement. Tip: Keep in mind that throughout the movement, the arms should remain stationary. The movement should only occur at the shoulder joint. Return your arms back to the starting position as you squeeze your chest muscles and exhale. Hold the contracted position for a second. Tip: Make sure to use the same arc of motion used to lower the weights. Repeat the movement for the prescribed amount of repetitions. 	t	{chest}	{shoulders}	\N	f
567	Dips - Chest Version	other	For this exercise you will need access to parallel bars. To get yourself into the starting position, hold your body at arms length (arms locked) above the bars. While breathing in, lower yourself slowly with your torso leaning forward around 30 degrees or so and your elbows flared out slightly until you feel a slight stretch in the chest. Once you feel the stretch, use your chest to bring your body back to the starting position as you breathe out. Tip: Remember to squeeze the chest at the top of the movement for a second. Repeat the movement for the prescribed amount of repetitions. 	f	{chest}	{shoulders,triceps}	\N	f
568	World's Greatest Stretch	none	This is a three-part stretch. Begin by lunging forward, with your front foot flat on the ground and on the toes of your back foot. With your knees bent, squat down until your knee is almost touching the ground. Keep your torso erect, and hold this position for 10-20 seconds. Now, place the arm on the same side as your front leg on the ground, with the elbow next to the foot. Your other hand should be placed on the ground, parallel to your lead leg, to help support you during this portion of the stretch. After 10-20 seconds, place your hands on either side of your front foot. Raise the toes of the front foot off of the ground, and straighten your leg. You may need to reposition your rear leg to do so. Hold for 10-20 seconds, and then repeat the entire sequence for the other side. 	f	{hamstrings}	{calves,glutes,quadriceps}	\N	f
569	Alternate Leg Diagonal Bound	none	Assume a comfortable stance with one foot slightly in front of the other. Begin by pushing off with the front leg, driving the opposite knee forward and as high as possible before landing. Attempt to cover as much distance to each side with each bound. It may help to use a line on the ground to guage distance from side to side. Repeat the sequence with the other leg. 	f	{quadriceps}	{abductors,adductors,calves,glutes,hamstrings}	\N	f
570	Kettlebell Dead Clean	kettlebells	Place kettlebell between your feet. To get in the starting position, push your butt back and look straight ahead. Clean the kettlebell to your shoulder. Clean the kettlebell to your shoulders by extending through the legs and hips as you raise the kettlebell towards your shoulder. The wrist should rotate as you do so. Lower the kettlebell, keeping the hamstrings loaded by keeping your back straight and your butt out. 	f	{hamstrings}	{calves,glutes,"lower back",quadriceps,traps}	\N	f
571	Close-Grip EZ-Bar Curl with Band	e-z curl bar	Attach a band to each end of the bar. Take the bar, placing a foot on the middle of the band. Stand upright with a narrow, supinated grip on the EZ bar. The elbows should be close to the torso. This will be your starting position. While keeping the upper arms in place, flex the elbows to execute the curl. Exhale as the weight is lifted. Continue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second and squeeze the biceps hard. Slowly begin to bring the bar back to starting position as your breathe in. Repeat for the recommended amount of repetitions. 	t	{biceps}	{forearms}	\N	f
572	Barbell Hip Thrust	barbell	Begin seated on the ground with a bench directly behind you. Have a loaded barbell over your legs. Using a fat bar or having a pad on the bar can greatly reduce the discomfort caused by this exercise. Roll the bar so that it is directly above your hips, and lean back against the bench so that your shoulder blades are near the top of it. Begin the movement by driving through your feet, extending your hips vertically through the bar. Your weight should be supported by your shoulder blades and your feet. Extend as far as possible, then reverse the motion to return to the starting position. 	f	{glutes}	{calves,hamstrings}	\N	f
573	Weighted Sissy Squat	barbell	Standing upright, with feet at shoulder width and toes raised, use one hand to hold onto the beams of a squat rack and the opposite arm to hold a plate on top of your chest. This is your starting position. As you use one arm to hold yourself, bend at the knees and slowly lower your torso toward the ground by bringing your pelvis and knees forward. Inhale as you go down and stop when your upper and lower legs almost create a 90-degree angle. Hold the stretch position for a second. After your one second hold, use your thigh muscles to bring your torso back up to the starting position. Exhale as you move up. Repeat for the recommended amount of times. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
574	Landmine 180's	barbell	Position a bar into a landmine or securely anchor it in a corner. Load the bar to an appropriate weight. Raise the bar from the floor, taking it to shoulder height with both hands with your arms extended in front of you. Adopt a wide stance. This will be your starting position. Perform the movement by rotating the trunk and hips as you swing the weight all the way down to one side. Keep your arms extended throughout the exercise. Reverse the motion to swing the weight all the way to the opposite side. Continue alternating the movement until the set is complete. 	f	{abdominals}	{glutes,"lower back",shoulders}	\N	f
575	Bear Crawl Sled Drags	other	Wearing either a harness or a loose weight belt, attach the chain to the back so that you will be facing away from the sled. Bend down so that your hands are on the ground. Your back should be flat and knees bent. This is your starting position. Begin by driving with legs, alternating left and right. Use your hands to maintain balance and to help pull. Try to keep your back flat as you move over a given distance. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
576	Brachialis-SMR	foam roll	Lie on your side, with your upper arm against the foam roller. The upper arm should be more or less aligned with your body, with the outside of the bicep pressed against the foam roller. Raise your hips off of the floor, supporting your weight on your arm and on your feet. Hold for 10-30 seconds, and then switch sides. 	f	{biceps}	\N	\N	f
578	One-Arm Medicine Ball Slam	medicine ball	Start in a standing position with a staggered, athletic stance. Hold a medicine ball in one hand, on the same side as your back leg. This will be your starting position. Begin by winding the arm, raising the medicine ball above your head. As you do so, extend through the hips, knees, and ankles to load up for the slam. At peak extension, flex the shoulders, spine, and hips to throw the ball hard into the ground directly in front of you. Catch the ball on the bounce and continue for the desired number of repetitions. 	f	{abdominals}	{lats,shoulders}	\N	f
579	Plie Dumbbell Squat	dumbbell	Hold a dumbbell at the base with both hands and stand straight up. Move your legs so that they are wider than shoulder width apart from each other with your knees slightly bent. Your toes should be facing out. Note: Your arms should be stationary while performing the exercise. This is the starting position. Slowly bend the knees and lower your legs until your thighs are parallel to the floor. Make sure to inhale as this is the eccentric part of the exercise. Press mainly with the heel of the foot to bring the body back to the starting position while exhaling. Repeat for the recommended amount of repetitions. 	f	{quadriceps}	{abdominals,calves,glutes,hamstrings}	\N	f
580	Return Push from Stance	medicine ball	You will need a partner for this drill. Begin in an athletic 2 or 3 point stance. At the signal, move into a position to receive the pass from your partner. Catch the medicine ball with both hands and immediately throw it back to your partner. You can modify this drill by running different routes. 	f	{shoulders}	{chest,triceps}	\N	f
581	Sumo Deadlift	barbell	Begin with a bar loaded on the ground. Approach the bar so that the bar intersects the middle of the feet. The feet should be set very wide, near the collars. Bend at the hips to grip the bar. The arms should be directly below the shoulders, inside the legs, and you can use a pronated grip, a mixed grip, or hook grip. Relax the shoulders, which in effect lengthens your arms. Take a breath, and then lower your hips, looking forward with your head with your chest up. Drive through the floor, spreading your feet apart, with your weight on the back half of your feet. Extend through the hips and knees. As the bar passes through the knees, lean back and drive the hips into the bar, pulling your shoulder blades together. Return the weight to the ground by bending at the hips and controlling the weight on the way down. 	f	{hamstrings}	{adductors,forearms,glutes,"lower back","middle back",quadriceps,traps}	\N	f
582	Smith Machine Upright Row	machine	To begin, set the bar on the smith machine to a height that is around the middle of your thighs. Once the correct height is chosen and the bar is loaded, grasp the bar using a pronated (palms forward) grip that is shoulder width apart. You may need some wrist wraps if using a significant amount of weight. Lift the barbell up and fully extend your arms with your back straight. There should be a slight bend at the elbows. This is the starting position. Use your side shoulders to lift the bar as you exhale. The bar should be close to the body as you move it up. Continue to lift it until it nearly touches your chin. Tip: Your elbows should drive the motion. As you lift the bar, your elbows should always be higher than your forearms. Also, keep your torso stationary and pause for a second at the top of the movement. Lower the bar back down slowly to the starting position. Inhale as you perform this portion of the movement. Repeat for the recommended amount of repetitions. 	f	{traps}	{biceps,"middle back",shoulders}	\N	f
583	Physioball Hip Bridge	exercise ball	Lay on a ball so that your upper back is on the ball with your hips unsupported. Both feet should be flat on the floor, hip width apart or wider. This will be your starting position. Begin by extending the hips using your glutes and hamstrings, raising your hips upward as you bridge. Pause at the top of the motion and return to the starting position. 	f	{glutes}	{hamstrings}	\N	f
584	Dumbbell Bench Press with Neutral Grip	dumbbell	Take a dumbbell in each hand and lay back onto a flat bench. Your feet should be flat on the floor and your shoulder blades retracted. Maintaining a neutral grip, palms facing each other, begin with your arms extended directly above you, perpendicular to the floor. This will be your starting position. Begin the movement by flexing the elbow, lowering the upper arms to the side. Descend until the dumbbells are to your torso. Pause, then extend the elbow and return to the starting position. 	f	{chest}	{shoulders,triceps}	\N	f
585	Wind Sprints	body only	Hang from a pull-up bar using a pronated grip. Your arms and legs should be extended. This will be your starting position. Begin by quickly raising one knee as high as you can. Do not swing your body or your legs. 3 Immediately reverse the motion, returning that leg to the starting position. Simultaneously raise the opposite knee as high as possible. Continue alternating between legs until the set is complete. 	f	{abdominals}	\N	\N	f
586	Cable Wrist Curl	cable	Start out by placing a flat bench in front of a low pulley cable that has a straight bar attachment. Use your arms to grab the cable bar with a narrow to shoulder width supinated grip (palms up) and bring them up so that your forearms are resting against the top of your thighs. Your wrists should be hanging just beyond your knees. Start out by curling your wrist upwards and exhaling. Keep the contraction for a second. Slowly lower your wrists back down to the starting position while inhaling. Your forearms should be stationary as your wrist is the only movement needed to perform this exercise. Repeat for the recommended amount of repetitions. 	t	{forearms}	\N	\N	f
587	Decline Close-Grip Bench To Skull Crusher	barbell	Secure your legs at the end of the decline bench and slowly lay down on the bench. Using a close grip (a grip that is slightly less than shoulder width), lift the bar from the rack and hold it straight over you with your arms locked and elbows in. The arms should be perpendicular to the floor. This will be your starting position. Tip: In order to protect your rotator cuff, it is best if you have a spotter help you lift the barbell off the rack. Now lower the bar down to your lower chest as you breathe in. Keep the elbows in as you perform this movement. Using the triceps to push the bar back up, press it back to the starting position as you exhale. As you breathe in and you keep the upper arms stationary, bring the bar down slowly by moving your forearms in a semicircular motion towards you until you feel the bar slightly touch your forehead. Breathe in as you perform this portion of the movement. Lift the bar back to the starting position by contracting the triceps and exhaling. Repeat steps 3-6 until the recommended amount of repetitions is performed. 	f	{triceps}	{chest,shoulders}	\N	f
625	On Your Side Quad Stretch	none	Start off by lying on your right side, with your right knee bent at a 90-degree angle resting on the floor in front of you (this stabilizes the torso). Bend your left knee behind you and hold your left foot with your left hand. To stretch your hip flexor, press your left hip forward as you push your left foot back into your hand. Switch sides. 	t	{quadriceps}	\N	\N	f
588	Wrist Roller	other	To begin, stand straight up grabbing a wrist roller using a pronated grip (palms facing down). Your feet should be shoulder width apart. Slowly lift both arms until they are fully extended and parallel to the floor in front of you. Note: Make sure the rope is not wrapped around the roller. Your entire body should be stationary except for the forearms. This is the starting position. Rotate one wrist at a time in an upward motion to bring the weight up to the bar by rolling the rope around the roller. Once the weight has reached the bar, slowly begin to lower the weight back down by rotating the wrist in a downward motion until the weight reaches the starting position. Repeat for the prescribed amount of repetitions in your program. 	t	{forearms}	{shoulders}	\N	f
589	Keg Load	other	To load kegs, place the desired number a distance from the loading platform, typically 30-50 feet. Begin by grabbing the close handle of the first keg, tilting it onto its side to grab the opposite edge of the bottom of the keg. Lift the keg up to your chest. The higher you can place the keg, the faster you should be able to move to the platform. Shouldering is usually not allowed. Be sure to keep a firm hold on the keg. Move as quickly as possible to the platform, and load it, extending through your hips, knees, and ankles to get it as high as possible. Return to the starting position to retrieve the next keg, and repeat until the event is completed. 	f	{"lower back"}	{abdominals,biceps,calves,forearms,glutes,hamstrings,"middle back",quadriceps,shoulders,traps}	\N	f
590	Power Snatch from Blocks	barbell	Begin with a loaded barbell on boxes or stands of the desired height. A wide grip should be taken on the bar. The feet should be directly below the hips, with the feet turned out as needed. Lower the hips, with the chest up and the head looking forward. The shoulders should be just in front of the bar, with the elbows pointed out. This will be the starting position. Begin the first pull by driving through the front of the heels, raising the bar from the boxes. Transition into the second pull by extending through the hips knees and ankles, driving the bar up as quickly as possible. The bar should be close to the body. At peak extension, shrug the shoulders and allow the elbows to flex to the side. As you move your feet into the receiving position, forcefully pull yourself below the bar as you elevate the bar overhead. The feet should move to just outside the hips, turned out as necessary. Receive the bar above a full squat and with the arms fully extended overhead. Keeping the bar aligned over the front of the heels, your head and chest up, drive through heels of the feet to move to a standing position. Carefully return the weight to the boxes. 	f	{quadriceps}	{calves,forearms,glutes,hamstrings,"lower back",shoulders,traps,triceps}	\N	f
591	Leverage Decline Chest Press	machine	Load an appropriate weight onto the pins and adjust the seat for your height. The handles should be near the bottom of the pectorals at the beginning of the motion. Your chest and head should be up and your shoulder blades retracted. This will be your starting position. Press the handles forward by extending through the elbow. After a brief pause at the top, return the weight just above the start position, keeping tension on the muscles by not returning the weight to the stops until the set is complete. 	f	{chest}	{shoulders,triceps}	\N	f
592	Smith Machine Pistol Squat	machine	To begin, first set the bar to a position that best matches your height. Step under it and position the bar across the back of your shoulders. Take the bar with your hands facing forward, unlock it and lift it off the rack by extending your legs. 3 Move one foot forward about 12 inches in front of the bar. Extend the other leg out in front of you, holding it off the ground. Look forward at all times and maintain a neutral or slightly arched spine. This will be your starting position. Maintaining good posture, lower yourself by flexing the knee and hip, going down as far as flexibility allows. Pause briefly at the bottom and then return to the starting position by driving through the heel of your foot, extending the knee and hip. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
593	Board Press	barbell	Begin by lying on the bench, getting your head beyond the bar if possible. One to five boards, made out of 2x6's, can be screwed together and held in place by a training partner, bands, or just tucked under your shirt. Tuck your feet underneath you and arch your back. Using the bar to help support your weight, lift your shoulder off the bench and retract them, squeezing the shoulder blades together. Use your feet to drive your traps into the bench. Maintain this tight body position throughout the movement. You can take a standard bench grip, or shoulder width to focus on the triceps. Pull the bar out of the rack without protracting your shoulders. The bar, wrist, and elbow should stay in line at all times. Focus on squeezing the bar and trying to pull it apart. Lower the bar to the boards, and then drive the bar up with as much force as possible. The elbows should be tucked in until lockout. 	f	{triceps}	{chest,forearms,lats,shoulders}	\N	f
594	Seated Barbell Twist	barbell	Start out by sitting at the end of a flat bench with a barbell placed on top of your thighs. Your feet should be shoulder width apart from each other. Grip the bar with your palms facing down and make sure your hands are wider than shoulder width apart from each other. Begin to lift the barbell up over your head until your arms are fully extended. Now lower the barbell behind your head until it is resting along the base of your neck. This is the starting position. While keeping your feet and head stationary, move your waist from side to side so that your oblique muscles feel the contraction. Only move from side to side as far as your waist will allow you to go. Stretching or moving too far can cause an injury to occur. Tip: Use a slow and controlled motion. Remember to breathe out while twisting your body to the side and in when moving back to the starting position. Repeat for the recommended amount of repetitions. 	t	{abdominals}	\N	\N	f
595	Double Kettlebell Windmill	kettlebells	Place a kettlebell in front of your front foot and clean and press a kettlebell overhead with your opposite arm. Clean the kettlebell to your shoulder by extending through the legs and hips as you pull the kettlebell towards your shoulders. Rotate your wrist as you do so, so that the palm faces forward. Keeping the kettlebell locked out at all times, push your butt out in the direction of the locked out kettlebell. Turn your feet out at a forty-five degree angle from the arm with the locked out kettlebell. Bending at the hip to one side, sticking your butt out, slowly lean until you can retrieve the kettlebell from the floor. Keep your eyes on the kettlebell that you hold over your head at all times. Pause for a second after retrieving the kettlebell from the ground and reverse the motion back to the starting position. 	f	{abdominals}	{glutes,hamstrings,shoulders,triceps}	\N	f
666	Finger Curls	barbell	Hold a barbell with both hands and your palms facing up; hands spaced about shoulder width. Place your feet flat on the floor, at a distance that is slightly wider than shoulder width apart. This will be your starting position. Lower the bar as far as possible by extending the fingers. Allowing the bar to roll down the hands, catch the bar with the final joint in the fingers. Now curl bar up as high as possible by closing your hands while exhaling. Hold the contraction at the top. 	t	{forearms}	\N	\N	f
596	Atlas Stone Trainer	other	This trainer is effective for developing Atlas Stone strength for those who don't have access to stones, and are typically made from bar ends or heavy pipe. Begin by loading the desired weight onto the bar. Straddle the weight, wrapping your arms around the implement, bending at the hips. Begin by pulling the weight up past the knees, extending through the hips. As the weight clears the knees, it can be lapped by resting it on your thighs and sitting back, hugging it tightly to your chest. Finish the movement by extending through your hips and knees to raise the weight as high as possible. The weight can be returned to the lap or to the ground for successive repetitions. 	f	{"lower back"}	{biceps,forearms,glutes,hamstrings,quadriceps}	\N	f
597	Wrist Circles	body only	Start by standing straight with your feet being shoulder width apart from each other. Elevate your arms to the side of you until they are fully extended and parallel to the floor at a height that is evenly aligned with your shoulders. Tip: Your torso and arms should form the letter "T: Your palms should be facing down. This is the starting position. Keeping your entire body stationary except for the wrists, begin to rotate both wrists forward in a circular motion. Tip: Pretend that you are trying to draw circles by using your hands as the brush. Breathe normally as you perform this exercise. Repeat for the recommended amount of repetitions. 	t	{forearms}	\N	\N	f
598	Snatch Deadlift	barbell	The snatch deadlift strengthens the first pull of the snatch. Begin with a wide snatch grip with the barbell placed on the platform. The feet should be directly under the hips, with the feet turned out. Squat down to the bar, keeping the back in absolute extension with the head facing forward. Initiate the movement by driving through the heels, raising the hips. The back angle should remain the same until the bar passes the knees. At that point, drive your hips through the bar as you lay back. Return the bar to the platform by reversing the motion. 	f	{hamstrings}	{forearms,glutes,hamstrings,"lower back",quadriceps,traps}	\N	f
599	Power Clean	barbell	Stand with your feet slightly wider than shoulder width apart and toes pointing out slightly. Squat down and grasp bar with a closed, pronated grip. Your hands should be slightly wider than shoulder width apart outside knees with elbows fully extended. Place the bar about 1 inch in front of your shins and over the balls of your feet. Your back should be flat or slightly arched, your chest held up and out and your shoulder blades should be retracted. Keep your head in a neutral position (in line with vertebral column and not tilted or rotated) with your eyes focused straight ahead. Inhale during this phase. Lift the bar from the floor by forcefully extending the hips and the knees as you exhale. Tip: The upper torso should maintain the same angle. Do not bend at the waist yet and do not let the hips rise before the shoulders (this would have the effect of pushing the glutes in the air and stretching the hamstrings. Keep elbows fully extended with the head in a neutral position and the shoulders over the bar. As the bar raises keep it as close to the shins as possible. As the bar passes the knees, thrust your hips forward and slightly bend the knees to avoid locking them. Tip: At this point your thighs should be against the bar. Keep the back flat or slightly arched, elbows fully extended and your head neutral. Tip: You will hold your breath until the next phase. Inhale and then forcefully and quickly extend your hips and knees and stand on your toes. Keep the bar as close to your body as possible. Tip: Your back should be flat with the elbows pointed out to the sides and your head in a neutral position. Also, keep your shoulders over the bar and arms straight as long as possible. When your lower body joints are fully extended, shrug the shoulders upward rapidly without letting the elbows flex yet. Exhale during this portion of the movement. As the shoulders reach their highest elevation flex your elbows to begin pulling your body under the bar. Continue to pull the arms as high and as long as possible. Tip: Due to the explosive nature of this phase, your torso will be erect or with an arched back, your head will be tilted back slightly and your feet may lose contact with the floor. After the lower body has fully extended and the bar reaches near maximal height, pull your body under the bar and rotate the arms around and under the bar. Simultaneously, flex the hips and knees into a quarter squat position. Once the arms are under the bar, inhale and then lift your elbows to position the upper arms parallel to the floor. Rack the bar across the front of your collar bones and front shoulder muscles. Catch the bar with an erect and tight torso, a neutral head position and flat feet. Exhale during this movement. Stand up by extending the hips and knees to a fully erect position. Lower the bar by gradually reducing the muscular tension of the arms to allow a controlled descent of the bar to the thighs. Inhale during this movement. Simultaneously flex the hips and knees to cushion the impact of the bar on the thighs. Squat down with the elbows fully extended until the bar touches the floor. Start over at Phase 1 and repeat for the recommended amount of repetitions. 	f	{hamstrings}	{calves,forearms,glutes,"lower back","middle back",quadriceps,shoulders,traps,triceps}	\N	f
600	Barbell Hack Squat	barbell	Stand up straight while holding a barbell behind you at arms length and your feet at shoulder width. Tip: A shoulder width grip is best with the palms of your hands facing back. You can use wrist wraps for this exercise for a better grip. This will be your starting position. While keeping your head and eyes up and back straight, squat until your upper thighs are parallel to the floor. Breathe in as you slowly go down. Pressing mainly with the heel of the foot and squeezing the thighs, go back up as you breathe out. Repeat for the recommended amount of repetitions. 	f	{quadriceps}	{calves,forearms,hamstrings}	\N	f
601	Alternating Deltoid Raise	dumbbell	In a standing position, hold a pair of dumbbells at your side. Keeping your elbows slightly bent, raise the weights directly in front of you to shoulder height, avoiding any swinging or cheating. Return the weights to your side. On the next repetition, raise the weights laterally, raising them out to your side to about shoulder height. Return the weights to the starting position and continue alternating to the front and side. 	t	{shoulders}	\N	\N	f
602	Two-Arm Dumbbell Preacher Curl	dumbbell	Grab a dumbbell with each arm and place the upper arms on top of the preacher bench or the incline bench. The dumbbell should be held at shoulder length. This will be your starting position. As you breathe in, slowly lower the dumbbells until your upper arm is extended and the biceps is fully stretched. As you exhale, use the biceps to curl the weights up until your biceps is fully contracted and the dumbbells are at shoulder height. Squeeze the biceps hard for a second at the contracted position and repeat for the recommended amount of repetitions. 	t	{biceps}	\N	\N	f
603	Pallof Press	cable	Connect a standard handle to a tower, and—if possible—position the cable to shoulder height. If not, a low pulley will suffice. With your side to the cable, grab the handle with both hands and step away from the tower. You should be approximately arm's length away from the pulley, with the tension of the weight on the cable. With your feet positioned hip-width apart and knees slightly bent, hold the cable to the middle of your chest. This will be your starting position. Press the cable away from your chest, fully extending both arms. You core should be tight and engaged. Hold the repetition for several seconds before returning to the starting position. At the conclusion of the set, repeat facing the other direction. 	t	{abdominals}	{chest,shoulders,triceps}	\N	f
604	Forward Drag with Press	other	Attach a dual handled chain or rope attachment to the sled. You should be facing away from the sled, holding a handle in each hand. Begin the movement by moving forward for one step. Leaning forward, extend through the legs and hips to move, pausing with each step to extend through the elbows, pressing your hands forward. Step forward until you return to the start position prepared to press. 	f	{chest}	{calves,glutes,hamstrings,quadriceps,shoulders,triceps}	\N	f
627	One-Arm Overhead Kettlebell Squats	kettlebells	Clean and press a kettlebell with one arm. Clean the kettlebell to your shoulder by extending through the legs and hips as you pull the kettlebell towards your shoulder. Rotate your wrist as you do so. Press the weight overhead by extending through the elbow.This will be your starting position. Looking straight ahead and keeping a kettlebell locked out above you, flex the knees and hips and lower your torso between your legs, keeping your head and chest up. Pause at the bottom position for a second before rising back to the top, driving through the heels of your feet. 	f	{quadriceps}	{calves,glutes,hamstrings,shoulders}	\N	f
605	Kneeling Cable Triceps Extension	cable	Place a bench sideways in front of a high pulley machine. Hold a straight bar attachment above your head with your hands about 6 inches apart with your palms facing down. Face away from the machine and kneel. Place your head and the back of your upper arms on the bench. Your elbows should be bent with the forearms pointing towards the high pulley. This will be your starting position. While keeping your upper arms close to your head at all times with the elbows in, press the bar out in a semicircular motion until the elbows are locked and your arms are parallel to the floor. Contract the triceps hard and keep this position for a second. Exhale as you perform this movement. Slowly return to the starting position as you breathe in. Repeat for the recommended amount of repetitions. 	t	{triceps}	\N	\N	f
606	Front Cable Raise	cable	Select the weight on a low pulley machine and grasp the single hand cable attachment that is attached to the low pulley with your left hand. Face away from the pulley and put your arm straight down with the hand cable attachment in front of your thighs at arms' length with the palms of the hand facing your thighs. This will be your starting position. While maintaining the torso stationary (no swinging), lift the left arm to the front with a slight bend on the elbow and the palms of the hand always faces down. Continue to go up until you arm is slightly above parallel to the floor. Exhale as you execute this portion of the movement and pause for a second at the top. Now as you inhale lower the arm back down slowly to the starting position. Once all of the recommended amount of repetitions have been performed for this arm, switch arms and perform the exercise with the right one. 	t	{shoulders}	\N	\N	f
607	Dumbbell Lying Supination	dumbbell	Lie sideways on a flat bench with one arm holding a dumbbell and the other hand on top of the bench folded so that you can rest your head on it. Bend the elbows of the arm holding the dumbbell so that it creates a 90-degree angle between the upper arm and the forearm. Now raise the upper arm so that the forearm is parallel to the floor and perpendicular to your torso (Tip: So the forearm will be directly in front of you). The upper arm will be stationary by your torso and should be parallel to the floor (aligned with your torso at all times). This will be your starting position. As you breathe out, externally rotate your forearm so that the dumbbell is lifted up in a semicircle motion as you maintain the 90 degree angle bend between the upper arms and the forearm. You will continue this external rotation until the forearm is perpendicular to the floor and the torso pointing towards the ceiling. At this point you will hold the contraction for a second. As you breathe in, slowly go back to the starting position. Repeat for the recommended amount of repetitions and then switch to the other arm. 	t	{forearms}	\N	\N	f
608	Latissimus Dorsi-SMR	foam roll	While lying on the floor, place a foam roll under your back and to one side, just behind your arm pit. This will be your starting position. Keep the arm of the side being stretched behind and to the side of you as you shift your weight onto your lats, keeping your upper body off of the ground. Hold for 10-30 seconds, and switch sides. 	t	{lats}	\N	\N	f
609	Plank	body only	Get into a prone position on the floor, supporting your weight on your toes and your forearms. Your arms are bent and directly below the shoulder. Keep your body straight at all times, and hold this position as long as possible. To increase difficulty, an arm or leg can be raised. 	t	{abdominals}	\N	\N	f
610	Calf Stretch Elbows Against Wall	none	Stand facing a wall from a couple feet away. Lean against the wall, placing your weight on your forearms. Attempt to keep your heels on the ground. Hold for 10-20 seconds. You may move further or closer the wall, making it more or less difficult, respectively. 	t	{calves}	\N	\N	f
611	Butterfly	machine	Sit on the machine with your back flat on the pad. Take hold of the handles. Tip: Your upper arms should be positioned parallel to the floor; adjust the machine accordingly. This will be your starting position. Push the handles together slowly as you squeeze your chest in the middle. Breathe out during this part of the motion and hold the contraction for a second. Return back to the starting position slowly as you inhale until your chest muscles are fully stretched. Repeat for the recommended amount of repetitions. 	t	{chest}	\N	\N	f
612	Dumbbell Side Bend	dumbbell	Stand up straight while holding a dumbbell on the left hand (palms facing the torso) as you have the right hand holding your waist. Your feet should be placed at shoulder width. This will be your starting position. While keeping your back straight and your head up, bend only at the waist to the right as far as possible. Breathe in as you bend to the side. Then hold for a second and come back up to the starting position as you exhale. Tip: Keep the rest of the body stationary. Now repeat the movement but bending to the left instead. Hold for a second and come back to the starting position. Repeat for the recommended amount of repetitions and then change hands. 	t	{abdominals}	\N	\N	f
613	Band Skull Crusher	bands	Secure a band to the base of a rack or the bench. Lay on the bench so that the band is lined up with your head. Take hold of the band, raising your elbows so that the upper arm is perpendicular to the floor. With the elbow flexed, the band should be above your head. This will be your starting position. Extend through the elbow to straighten your arm, keeping your upper arm in place. Pause at the top of the motion, and return to the starting position. 	t	{triceps}	\N	\N	f
614	Leverage Iso Row	machine	Load an appropriate weight onto the pins and adjust the seat height so that the handles are at chest level. Grasp the handles with either a neutral or pronated grip. This will be your starting position. Pull the handles towards your torso, retracting your shoulder blades as you flex the elbow. Pause at the bottom of the motion, and then slowly return the handles to the starting position. For multiple repetitions, avoid completely returning the weight to the stops to keep tension on the muscles being worked. 	f	{lats}	{biceps,"middle back"}	\N	f
626	Machine Bench Press	machine	Sit down on the Chest Press Machine and select the weight. Step on the lever provided by the machine since it will help you to bring the handles forward so that you can grab the handles and fully extend the arms. Grab the handles with a palms-down grip and lift your elbows so that your upper arms are parallel to the floor to the sides of your torso. Tip: Your forearms will be pointing forward since you are grabbing the handles. Once you bring the handles forward and extend the arms you will be at the starting position. Now bring the handles back towards you as you breathe in. Push the handles away from you as you flex your pecs and you breathe out. Hold the contraction for a second before going back to the starting position. Repeat for the recommended amount of reps. When finished step on the lever again and slowly get the handles back to their original place. 	f	{chest}	{shoulders,triceps}	\N	f
615	Speed Squats	barbell	This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack that best matches your height. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it. Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso. Step away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times as looking down will get you off balance and also maintain a straight back. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance which targets overall development; however you can choose any of the three stances discussed in the foot stances section). Begin to lower the bar by bending the knees as you maintain a straight posture with the head up. Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees (which is the point in which the upper legs are below parallel to the floor). Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly. Begin to raise the bar as fast as possible without involving momentum as you exhale by pushing the floor with the heel of your foot mainly as you straighten the legs again and go back to the starting position. Note: You should perform these exercises as fast as possible but without breaking perfect form and without involving momentum. Repeat for the recommended amount of repetitions. 	f	{quadriceps}	{calves,glutes,hamstrings,"lower back"}	\N	f
616	Weighted Ball Side Bend	exercise ball	To begin, lie down on an exercise ball with your left side of the torso (waist, hips and shoulder) pressed against the ball. Your feet should be on the floor while your legs are crossed and hanging from the ball. Hold a weighted plate with your right hand directly to the right side of your head. Tip: Make sure the smooth side of the plate is resting against your head. Place your left arm across your torso so that your palm is on your obliques. There should be a right angle between your left forearm and upper arm. This is the starting position. Raise the side of your torso up by laterally flexing at the waist while exhaling. Hold the contraction for a second and slowly lower yourself back down to the starting position while inhaling. Repeat for the recommended amount of repetitions. Switch sides and repeat the exercise. 	t	{abdominals}	\N	\N	f
617	Quadriceps-SMR	foam roll	Lay facedown on the floor with your weight supported by your hands or forearms. Place a foam roll underneath one leg on the quadriceps, and keep the foot off of the ground. Make sure to relax the leg as much as possible. This will be your starting position. Shifting as much weight onto the leg to be stretched as is tolerable, roll over the foam from above the knee to below the hip, holding points of tension for 10-30 seconds. Switch sides. 	t	{quadriceps}	\N	\N	f
618	Side Wrist Pull	none	This stretch works best standing. Cross your left arm over the midline of your body and hold the left wrist in your right hand down at the level of your hips. Start the stretch with a bent left arm. Slowly straighten, pull, and lift it up to shoulder height, as pictured. Feel this stretch originate in your back, not your shoulders, and don't pull too hard on the shoulders joint. Switch sides. 	t	{shoulders}	{forearms,lats}	\N	f
619	Quick Leap	other	You will need a box for this exerise. Begin facing the box standing 1-2 feet from its edge. By utilizing your hips, hop onto the box, landing on both legs. Ensure that you land with your legs bent and your feet flat. Immediately upon landing, fully extend through the entire body and swing your arms overhead to explode off of the box. Use your legs to absorb the impact of landing. 	f	{quadriceps}	{calves,hamstrings}	\N	f
620	Standing Biceps Cable Curl	cable	Stand up with your torso upright while holding a cable curl bar that is attached to a low pulley. Grab the cable bar at shoulder width and keep the elbows close to the torso. The palm of your hands should be facing up (supinated grip). This will be your starting position. While holding the upper arms stationary, curl the weights while contracting the biceps as you breathe out. Only the forearms should move. Continue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second as you squeeze the muscle. Slowly begin to bring the curl bar back to starting position as your breathe in. Repeat for the recommended amount of repetitions. 	t	{biceps}	\N	\N	f
621	Lying Face Down Plate Neck Resistance	other	Lie face down with your whole body straight on a flat bench while holding a weight plate behind your head. Tip: You will need to position yourself so that your shoulders are slightly above the end of a flat bench in order for the upper chest, neck and face to be off the bench. This will be your starting position. While keeping the plate secure on the back of your head slowly lower your head (as in saying "yes") as you breathe in. Raise your head back up to the starting position in a semi-circular motion as you breathe out. Hold the contraction for a second. Repeat for the recommended amount of repetitions. 	t	{neck}	\N	\N	f
622	Pallof Press With Rotation	cable	Connect a standard handle to a tower, and position the cable to shoulder height. With your side to the cable, grab the handle with one hand and step away from the tower. You should be approximately arm's length away from the pulley, with the tension of the weight on the cable. Align outstretched arm with cable. With your feet positioned hip-width apart, pull the cable into your chest and grab the handle with your other hand. Both hands should be on the handle at this time. Facing forward, press the cable away from your chest. You core should be tight and engaged. Keeping your hips straight, twist your torso away from the pulley until you get a full quarter rotation. Maintain your rigid stance and straight arms. Return to the neutral position in a slow and controlled manner. Your arms should be extended in front of you. With the side tension still engaging your core, bring your hands to your chest and immediately press outward to a fully extended position. This constitutes one rep. Repeat to failure. Then, reposition and repeat the same series of movements on the opposite side. 	f	{abdominals}	{chest,shoulders,triceps}	\N	f
623	Machine Bicep Curl	machine	Adjust the seat to the appropriate height and make your weight selection. Place your upper arms against the pads and grasp the handles. This will be your starting position. Perform the movement by flexing the elbow, pulling your lower arm towards your upper arm. Pause at the top of the movement, and then slowly return the weight to the starting position. Avoid returning the weight all the way to the stops until the set is complete to keep tension on the muscles being worked. 	t	{biceps}	\N	\N	f
624	Dumbbell One-Arm Shoulder Press	dumbbell	Grab a dumbbell and either sit on a military press bench or a utility bench that has a back support on it as you place the dumbbells upright on top of your thighs or stand up straight. Clean the dumbbell up to bring it to shoulder height. The other hand can be kept fully extended to the side, by the waist or grabbing a fixed surface. Rotate the wrist so that the palm of your hand is facing forward. This is your starting position. As you exhale, push the dumbbell up until your arm is fully extended. After a second pause, slowly come down back to the starting position as you inhale. Repeat for the recommended amount of repetitions and then switch arms. 	f	{shoulders}	{triceps}	\N	f
628	Alternate Hammer Curl	dumbbell	Stand up with your torso upright and a dumbbell in each hand being held at arms length. The elbows should be close to the torso. The palms of the hands should be facing your torso. This will be your starting position. While holding the upper arm stationary, curl the right weight forward while contracting the biceps as you breathe out. Continue the movement until your biceps is fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a second as you squeeze the biceps. Tip: Only the forearms should move. Slowly begin to bring the dumbbells back to starting position as your breathe in. Repeat the movement with the left hand. This equals one repetition. Continue alternating in this manner for the recommended amount of repetitions. 	t	{biceps}	{forearms}	\N	f
629	Ankle On The Knee	none	From a lying position, bend your knees and keep your feet on the floor. Place your ankle of one foot on your opposite knee. Grasp the thigh or knee of the bottom leg and pull both of your legs into the chest. Relax your neck and shoulders. Hold for 10-20 seconds and then switch sides. 	f	{glutes}	\N	\N	f
630	Dumbbell Lunges	dumbbell	Stand with your torso upright holding two dumbbells in your hands by your sides. This will be your starting position. Step forward with your right leg around 2 feet or so from the foot being left stationary behind and lower your upper body down, while keeping the torso upright and maintaining balance. Inhale as you go down. Note: As in the other exercises, do not allow your knee to go forward beyond your toes as you come down, as this will put undue stress on the knee joint. Make sure that you keep your front shin perpendicular to the ground. Using mainly the heel of your foot, push up and go back to the starting position as you exhale. Repeat the movement for the recommended amount of repetitions and then perform with the left leg. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
631	Kneeling Arm Drill	none	This drill helps increase arm efficiency during the run. Begin kneeling, left foot in front, right knee down. Apply pressure through the front heel to keep your glutes and hamstrings activated. Begin by blocking the arms in long, pendulum like swings. Close the arm angle, blocking with the arms as you would when jogging, progressing to a run and finally a sprint. As soon as your hands pass the hip, accelerate them forward during the sprinting motion to move them as quickly as possible. Switch knees and repeat. 	f	{shoulders}	{abdominals}	\N	f
632	Squat Jerk	barbell	Standing with the weight racked on the front of the shoulders, begin with the dip. With your feet directly under your hips, flex the knees without moving the hips backward. Go down only slightly, and reverse direction as powerfully as possible. Drive through the heels create as much speed and force as possible, and be sure to move your head out of the way as the bar leaves the shoulders. At this moment as the feet leave the floor, the feet must be placed into the receiving position as quickly as possible. In the brief moment the feet are not actively driving against the platform, the athlete's effort to push the bar up will drive them down. The feet should move forcefully to just outside the hips, turned out as necessary. Receive the bar with your body in a full squat and the arms fully extended overhead. Keeping the bar aligned over the front of the heels, your head and chest up, drive throught heels of the feet to move to a standing position. Carefully return the weight to floor. 	f	{quadriceps}	{calves,glutes,hamstrings,shoulders,triceps}	\N	f
633	Power Jerk	barbell	Standing with the weight racked on the front of the shoulders, begin with the dip. With your feet directly under your hips, flex the knees without moving the hips backward. Go down only slightly, and reverse direction as powerfully as possible. Drive through the heels create as much speed and force as possible, and be sure to move your head out of the way as the bar leaves the shoulders. At this moment as the feet leave the floor, the feet must be placed into the receiving position as quickly as possible. In the brief moment the feet are not actively driving against the platform, the athletes effort to push the bar up will drive them down. The feet should be moved to a slightly wider stance, with the knees partially bent. Receive the bar with the arms locked out overhead. Return to a standing position. 	f	{quadriceps}	{abdominals,calves,glutes,hamstrings,shoulders,triceps}	\N	f
634	Platform Hamstring Slides	other	For this movement a wooden floor or similar is needed. Lay on your back with your legs extended. Place a gym towel or a light weight underneath your heel. This will be your starting position. Begin the movement by flexing the knee, keeping your other leg straight. Continue bringing the heel closer to you, sliding it on the floor. At full knee flexion, reverse the movement to return to the starting position. 	t	{hamstrings}	{glutes}	\N	f
635	Reverse Band Power Squat	barbell	Begin in a power rack with the pins and bar set at the appropriate height. After loading the bar, attach bands to the top of the rack, using either pegs or the frame itself. Attach the other end of the bands to the bar. Begin by stepping under the bar and placing it across the back of the shoulders. Squeeze your shoulder blades together and rotate your elbows forward, attempting to bend the bar across your shoulders. Remove the bar from the rack, creating a tight arch in your lower back, and step back into position. Place your feet wide for more emphasis on the back, glutes, adductors, and hamstrings. Keep your head facing forward. With your back, shoulders, and core tight, push your knees and butt out and you begin your descent. Sit back with your hips as much as possible. Ideally, your shins should be perpendicular to the ground. Lower bar position necessitates a greater torso lean to keep the bar over the heels. Continue until you break parallel, which is defined as the crease of the hip being in line with the top of the knee. Keeping the weight on your heels and pushing your feet and knees out, drive upward as you lead the movement with your head. Continue upward, maintaining tightness head to toe, until you have returned to the starting position. 	f	{quadriceps}	{adductors,calves,glutes,hamstrings,"lower back"}	\N	f
636	Lying Leg Curls	machine	Adjust the machine lever to fit your height and lie face down on the leg curl machine with the pad of the lever on the back of your legs (just a few inches under the calves). Tip: Preferably use a leg curl machine that is angled as opposed to flat since an angled position is more favorable for hamstrings recruitment. Keeping the torso flat on the bench, ensure your legs are fully stretched and grab the side handles of the machine. Position your toes straight (or you can also use any of the other two stances described on the foot positioning section). This will be your starting position. As you exhale, curl your legs up as far as possible without lifting the upper legs from the pad. Once you hit the fully contracted position, hold it for a second. As you inhale, bring the legs back to the initial position. Repeat for the recommended amount of repetitions. 	t	{hamstrings}	\N	\N	f
637	One Handed Hang	other	Grab onto a chinup bar with one hand, using a pronated grip. Keep your feet on the floor or a step. Allow the majority of your weight to hang from that hand, while keeping your feet on the ground. Hold for 10-20 seconds and switch sides. 	f	{lats}	{biceps}	\N	f
638	Overhead Lat	other	Sit upright on the floor with your partner behind you. Raise one arm straight up, and flex the elbow, attempting to touch your hand to your back. Your parner should hold your tricep and wrist. This will be your starting position. Attempt to pull your upper arm to your side as your partner prevents you from doing actually doing so. After 10-20 seconds, relax the arm and allow your partner to further stretch the lat by applying gentle pressure to the tricep. Hold for 10-20 seconds, and then switch sides. 	f	{lats}	{triceps}	\N	f
639	Single-Leg Leg Extension	machine	Seat yourself in the machine and adjust it so that you are positioned properly. The pad should be against the lower part of the shin but not in contact with the ankle. Adjust the seat so that the pivot point is in line with your knee. Select a weight appropriate for your abilities. Maintaining good posture, fully extend one leg, pausing at the top of the motion. Return to the starting position without letting the weight stop, keeping tension on the muscle. Repeat for the desired number of repetitions. 	t	{quadriceps}	\N	\N	f
640	Tate Press	dumbbell	Lie down on a flat bench with a dumbbell in each hand on top of your thighs. The palms of your hand will be facing each other. By using your thighs to help you get the dumbbells up, clean the dumbbells one arm at a time so that you can hold them in front of you at shoulder width. Note: when holding the dumbbells in front of you, make sure your arms are wider than shoulder width apart from each other using a pronated (palms forward) grip. Allow your elbows to point out. This is your starting position. Keeping the upper arms stationary, slowly move the dumbbells in and down in a semi circular motion until they touch the upper chest while inhaling. Keep full control of the dumbbells at all times and do not move the upper arms nor rest the dumbbells on the chest. As you breathe out, move the dumbbells up using your triceps and the same semi-circular motion but in reverse. Attempt to keep the dumbbells together as they move up. Lock your arms in the contracted position, hold for a second and then start coming down again slowly again. Tip: It should take at least twice as long to go down than to come up. Repeat the movement for the prescribed amount of repetitions of your training program. 	t	{triceps}	{chest,shoulders}	\N	f
641	Smith Machine Bent Over Row	machine	Set the barbell attached to the smith machine to a height that is about 2 inches below your knees. Bend your knees slightly and bring your torso forward, by bending at the waist, while keeping the back straight until it is almost parallel to the floor. Tip: Make sure that you keep the head up. Now grasp the barbell using an overhand (pronated) grip and unlock it from the smith machine rack. Then let it hang directly in front of you as your arms hang extended perpendicular to the floor and your torso. This is your starting position. While keeping the torso stationary, lift the barbell as you breathe out, keeping the elbows close to the body and not doing any force with the forearm other than holding the weights. On the top contracted position, squeeze the back muscles and hold for a second. Slowly lower the weight again to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	f	{"middle back"}	{biceps,lats,shoulders}	\N	f
642	Butt-Ups	body only	Begin a pushup position but with your elbows on the ground and resting on your forearms. Your arms should be bent at a 90 degree angle. Arch your back slightly out rather than keeping your back completely straight. Raise your glutes toward the ceiling, squeezing your abs tightly to close the distance between your ribcage and hips. The end result will be that you'll end up in a high bridge position. Exhale as you perform this portion of the movement. Lower back down slowly to your starting position as you breathe in. Tip: Don't let your back sag downwards. Repeat for the recommended amount of repetitions. 	f	{abdominals}	\N	\N	f
643	Sled Drag - Harness	other	To begin, load the sled with the desired weight and attach the pulling strap. You can pull with handles, use a harness, or attach the pulling strap to a weight belt. Whether pulling forwards or backwards, lean in the direction of travel and progress by extending through the hips and knees. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
644	Standing Low-Pulley One-Arm Triceps Extension	cable	Grab a single handle with your left arm next to the low pulley machine. Turn away from the machine keeping the handle to the side of your body with your arm fully extended. Now use both hands to elevate the single handle directly above the head with the palm facing forward. Keep your upper arm completely vertical (perpendicular to the floor) and put your right hand on your left elbow to help keep it steady. This is the starting position. Keeping your upper arms close to your head (elbows in) and perpendicular to the floor, lower the resistance in a semicircular motion behind your head until your forearms touch your biceps. Tip: The upper arms should remain stationary and only the forearms should move. Breathe in as you perform this step. Go back to the starting position by using the triceps to raise the single handle. Breathe out as you perform this step. Repeat for the recommended amount of repetitions. Switch arms and repeat the exercise. 	t	{triceps}	{chest,shoulders}	\N	f
645	Flexor Incline Dumbbell Curls	dumbbell	Hold the dumbbell towards the side farther from you so that you have more weight on the side closest to you. (This can be done for a good effect on all bicep dumbbell exercises). Now do a normal incline dumbbell curl, but keep your wrists as far back as possible so as to neutralize any stress that is placed on them. Sit on an incline bench that is angled at 45-degrees while holding a dumbbell on each hand. Let your arms hang down on your sides, with the elbows in, and turn the palms of your hands forward with the thumbs pointing away from the body. Tip: You will keep this hand position throughout the movement as there should not be any twisting of the hands as they come up. This will be your starting position. Curl up the two dumbbells at the same time until your biceps are fully contracted and exhale. Tip: Do not swing the arms or use momentum. Keep a controlled motion at all times. Hold the contracted position for a second at the top. As you inhale, slowly go back to the starting position. Repeat for the recommended amount of repetitions. 	t	{biceps}	\N	\N	f
646	Push-Ups - Close Triceps Position	body only	Lie on the floor face down and place your hands closer than shoulder width for a close hand position. Make sure that you are holding your torso up at arms' length. Lower yourself until your chest almost touches the floor as you inhale. Using your triceps and some of your pectoral muscles, press your upper body back up to the starting position and squeeze your chest. Breathe out as you perform this step. After a second pause at the contracted position, repeat the movement for the prescribed amount of repetitions. 	f	{triceps}	{chest,shoulders}	\N	f
667	Anterior Tibialis-SMR	other	Begin seated on the ground with your legs bent and your feet on the floor. Using a Muscle Roller or a rolling pin, apply pressure to the muscles on the outside of your shins. Work from just below the knee to above the ankle, pausing at points of tension for 10-30 seconds. Repeat on the other leg. 	f	{calves}	\N	\N	f
647	Russian Twist	body only	Lie down on the floor placing your feet either under something that will not move or by having a partner hold them. Your legs should be bent at the knees. Elevate your upper body so that it creates an imaginary V-shape with your thighs. Your arms should be fully extended in front of you perpendicular to your torso and with the hands clasped. This is the starting position. Twist your torso to the right side until your arms are parallel with the floor while breathing out. Hold the contraction for a second and move back to the starting position while breathing out. Now move to the opposite side performing the same techniques you applied to the right side. Repeat for the recommended amount of repetitions. 	f	{abdominals}	{"lower back"}	\N	f
648	Seated Biceps	body only	Sit on the floor with your knees bent and your partner standing behind you. Extend your arms straight behind you with your palms facing each other. Your partner will hold your wrists for you. This will be the starting position. Attempt to flex your elbows, while your partner prevents any actual movement. After 10-20 seconds, relax your arms while your partner gently pulls your wrists up to stretch your biceps. Be sure to let your partner know when the stretch is appropriate to prevent injury or overstretching. 	t	{biceps}	{chest,shoulders}	\N	f
649	Chest Push (single response)	medicine ball	Begin in a kneeling position holding the medicine ball with both hands tightly into the chest. Execute the pass by exploding forward and outward with the hips while pushing the ball as far as possible. Follow through by falling forward, catching yourself with your hands. 	f	{chest}	{abdominals,shoulders,triceps}	\N	f
650	Elevated Cable Rows	cable	Get a platform of some sort (it can be an aerobics or calf raise platform) that is around 4-6 inches in height. Place it on the seat of the cable row machine. Sit down on the machine and place your feet on the front platform or crossbar provided making sure that your knees are slightly bent and not locked. Lean over as you keep the natural alignment of your back and grab the V-bar handles. With your arms extended pull back until your torso is at a 90-degree angle from your legs. Your back should be slightly arched and your chest should be sticking out. You should be feeling a nice stretch on your lats as you hold the bar in front of you. This is the starting position of the exercise. Keeping the torso stationary, pull the handles back towards your torso while keeping the arms close to it until you touch the abdominals. Breathe out as you perform that movement. At that point you should be squeezing your back muscles hard. Hold that contraction for a second and slowly go back to the original position while breathing in. Repeat for the recommended amount of repetitions. 	f	{lats}	{"middle back",traps}	\N	f
651	Runner's Stretch	none	It's easiest to get into this stretch if you start standing up, put one leg behind you, and slowly lower your torso down to the floor. Keep the front heel on the floor (if it lifts up, scoot your other leg further back). Place your hands on either side of your front leg. To get more out of this stretch, push your butt up toward the ceiling, and then gradually lower it back toward the floor. You'll Stretch the hip flexor of the back leg and the hamstring and buttocks of the front. 	f	{hamstrings}	{calves}	\N	f
652	Hip Lift with Band	bands	After choosing a suitable band, lay down in the middle of the rack, after securing the band on either side of you. If your rack doesn't have pegs, the band can be secured using heavy dumbbells or similar objects, just ensure they won't move. Adjust your position so that the band is directly over your hips. Bend your knees and place your feet flat on the floor. Your hands can be on the floor or holding the band in position. Keeping your shoulders on the ground, drive through your heels to raise your hips, pushing into the band as high as you can. Pause at the top of the motion, and return to the starting position. 	f	{glutes}	{calves,hamstrings}	\N	f
653	Bent Over Barbell Row	barbell	Holding a barbell with a pronated grip (palms facing down), bend your knees slightly and bring your torso forward, by bending at the waist, while keeping the back straight until it is almost parallel to the floor. Tip: Make sure that you keep the head up. The barbell should hang directly in front of you as your arms hang perpendicular to the floor and your torso. This is your starting position. Now, while keeping the torso stationary, breathe out and lift the barbell to you. Keep the elbows close to the body and only use the forearms to hold the weight. At the top contracted position, squeeze the back muscles and hold for a brief pause. Then inhale and slowly lower the barbell back to the starting position. Repeat for the recommended amount of repetitions. 	f	{"middle back"}	{biceps,lats,shoulders}	\N	f
654	Piriformis-SMR	foam roll	Sit with your buttocks on top of a foam roll. Bend your knees, and then cross one leg so that the ankle is over the knee. This will be your starting position. Shift your weight to the side of the crossed leg, rolling over the buttocks until you feel tension in your upper glute. You may assist the stretch by using one hand to pull the bent knee towards your chest. Hold this position for 10-30 seconds, and then switch sides. 	t	{glutes}	\N	\N	f
655	Narrow Stance Leg Press	machine	Using a leg press machine, sit down on the machine and place your legs on the platform directly in front of you at a less-than-shoulder-width narrow stance with the toes slightly pointed out. Your feet should be around 3 inches or less apart. Tip: Keep your head up at all times and also maintain the back on the pad at all times. Lower the safety bars holding the weighted platform in place and press the platform all the way up until your legs are fully extended in front of you. Tip: Make sure that you do not lock your knees. Your torso and the legs should make a perfect 90-degree angle. This will be your starting position. As you inhale, slowly lower the platform until your upper and lower legs make a 90-degree angle. Pushing mainly with the heels of your feet and using the quadriceps go back to the starting position as you exhale. Repeat for the recommended amount of repetitions and ensure to lock the safety pins properly once you are done. You do not want that platform falling on you fully loaded. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
665	Standing Front Barbell Raise Over Head	barbell	To begin, stand straight with a barbell in your hands. You should grip the bar with palms facing down and a closer than shoulder width grip apart from each other. Your feet should be shoulder width apart from each other. Your elbows should be slightly bent. This is the starting position. Lift the barbell up until it is directly over your head while exhaling. Make sure to keep your elbows slightly bent when performing each repetition. Once you feel the contraction, begin to lower the barbell back down to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	t	{shoulders}	\N	\N	f
718	Groiners	body only	Begin in a pushup position on the floor. This will be your starting position. Using both legs, jump forward landing with your feet next to your hands. Keep your head up as you do so. Return to the starting position and immediately repeat the movement, continuing for 10-20 repetitions. 	f	{adductors}	\N	\N	f
656	Seated One-arm Cable Pulley Rows	cable	To get into the starting position, first sit down on the machine and place your feet on the front platform or crossbar provided making sure that your knees are slightly bent and not locked. Lean over as you keep the natural alignment of your back and grab the single handle attachment with your left arm using a palms-down grip. With your arm extended pull back until your torso is at a 90-degree angle from your legs. Your back should be slightly arched and your chest should be sticking out. You should be feeling a nice stretch on your lat as you hold the bar in front of you. The right arm can be kept by the waist. This is the starting position of the exercise. Keeping the torso stationary, pull the handles back towards your torso while keeping the arms close to it as you rotate the wrist, so that by the time your hand is by your abdominals it is in a neutral position (palms facing the torso). Breathe out as you perform that movement. At that point you should be squeezing your back muscles hard. Hold that contraction for a second and slowly go back to the original position while breathing in. Tip: Remember to rotate the wrist as you go back to the starting position so that the palms are facing down again. Repeat for the recommended amount of repetitions and then perform the same movement with the right hand. 	f	{"middle back"}	{biceps,lats,traps}	\N	f
657	Side Laterals to Front Raise	dumbbell	In a standing position, hold a pair of dumbbells at your side. This will be your starting position. Keeping your elbows slightly bent, raise the weights directly in front of you to shoulder height, avoiding any swinging or cheating. At the top of the exercise move the weights out in front of you, keeping your arms extended. Lower the weights with a controlled motion. On the next repetition, raise the weights in front of you to shoulder height before moving the weights laterally to your sides. Lower the weights to the starting position. 	t	{shoulders}	{traps}	\N	f
658	Reverse Band Deadlift	barbell	Set the bar up in a power rack. Attach bands to the top of the rack, using either bands pegs or the frame itself. Attach the other end of the bands to the bar. Approach the bar so that it is centered over your feet. You feet should be about hip width apart. Bend at the hip to grip the bar at shoulder width, allowing your shoulder blades to protract. Typically, you would use an overhand grip or an over/under grip on heavier sets. With your feet, and your grip set, take a big breath and then lower your hips and bend the knees until your shins contact the bar. Look forward with your head, keep your chest up and your back arched, and begin driving through the heels to move the weight upward. After the bar passes the knees, aggressively pull the bar back, pulling your shoulder blades together as you drive your hips forward into the bar. Lower the bar by bending at the hips and guiding it to the floor. 	f	{"lower back"}	{abductors,adductors,calves,glutes,hamstrings,quadriceps}	\N	f
659	Elbows Back	none	Stand up straight. Place both hands on your lower back, fingers pointing downward and elbows out. Then gently pull your elbows back aiming to touch them together. 	t	{chest}	{shoulders}	\N	f
660	Lying Rear Delt Raise	dumbbell	While holding a dumbbell in each hand, lay with your chest down on a flat bench. Position the palms of the hands in a neutral manner (palms facing your torso) as you keep the arms extended with the elbows slightly bent. This will be your starting position. Now raise the arms to the side until your elbows are at shoulder height and your arms are roughly parallel to the floor as you exhale. Tip: Maintain your arms perpendicular to the torso while keeping them extended throughout the movement. Also, keep the contraction at the top for a second. Slowly lower the dumbbells to the starting position as you inhale. Repeat for the recommended amount of repetitions and then switch to the other arm. 	t	{shoulders}	\N	\N	f
661	Intermediate Hip Flexor and Quad Stretch	other	Lie face down on the floor, with a rope, belt, or band looped around one foot. Flex the knee and extend the hip of the leg to be stretched, using both hands to pull on the belt. Your knee and your hip should come off of the floor, creating tension in the hip flexors and quadriceps. Hold the stretch for 10-20 seconds, and repeat on the other leg. 	f	{quadriceps}	\N	\N	f
662	Iron Cross	dumbbell	Lie on your back with your arms extended out to the sides and legs straight. Lift your legs toward the ceiling, then lower them to one side while keeping your shoulders on the ground. Return to the center, then lower them to the other side in a controlled motion. Repeat for the desired reps, maintaining core engagement throughout.	f	{shoulders}	{chest,glutes,hamstrings,"lower back",quadriceps,traps}	\N	f
663	Pullups	body only	Grab the pull-up bar with the palms facing forward using the prescribed grip. Note on grips: For a wide grip, your hands need to be spaced out at a distance wider than your shoulder width. For a medium grip, your hands need to be spaced out at a distance equal to your shoulder width and for a close grip at a distance smaller than your shoulder width. As you have both arms extended in front of you holding the bar at the chosen grip width, bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position. Pull your torso up until the bar touches your upper chest by drawing the shoulders and the upper arms down and back. Exhale as you perform this portion of the movement. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary as it moves through space and only the arms should move. The forearms should do no other work other than hold the bar. After a second on the contracted position, start to inhale and slowly lower your torso back to the starting position when your arms are fully extended and the lats are fully stretched. Repeat this motion for the prescribed amount of repetitions. 	f	{lats}	{biceps,"middle back"}	\N	f
664	Standing Towel Triceps Extension	body only	To begin, stand up with both arms fully extended above the head holding one end of a towel with both hands. Your elbows should be in and the arms perpendicular to the floor with the palms facing each other while your feet should be shoulder width apart from each other. This is the starting position. Now communicate with your partner so that he/she can grip the other side of the towel to apply resistance. Keeping your upper arms close to your head (elbows in) and perpendicular to the floor, lower the resistance in a semicircular motion behind your head until your forearms touch your biceps. Tip: The upper arms should remain stationary and only the forearms should move. Breathe in as you perform this step. Go back to the starting position by using the triceps to raise the towel. Breathe out as you perform this step. Repeat for the recommended amount of repetitions. 	t	{triceps}	\N	\N	f
860	Side-Lying Floor Stretch	none	First lie on your left side, bending your left knee in front of you to stabilize your torso (use your abdominal muscles as well to hold you upright). Straighten your right leg and rest the right foot on the floor behind your left. Straighten your right arm over your head and gently pull on your right wrist to stretch the entire right side of the body. Switch sides. 	f	{lats}	\N	\N	f
668	Close-Grip EZ Bar Curl	barbell	Stand up with your torso upright while holding an E-Z Curl Bar at the closer inner handle. The palm of your hands should be facing forward and they should be slightly tilted inwards due to the shape of the bar. The elbows should be close to the torso. This will be your starting position. While holding the upper arms stationary, curl the weights forward while contracting the biceps as you breathe out. Tip: Only the forearms should move. Continue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second and squeeze the biceps hard. Slowly begin to bring the bar back to starting position as your breathe in. Repeat for the recommended amount of repetitions. 	t	{biceps}	{forearms}	\N	f
669	Drag Curl	barbell	Grab a barbell with a supinated grip (palms facing forward) and get your elbows close to your torso and back. This will be your starting position. As you exhale, curl the bar up while keeping the elbows to the back as you "Drag" the bar up by keeping it in contact with your torso. Tip: As you can see, you will not be keeping the elbows pinned to your sides, but instead you will be bringing them back. Also, do not lift your shoulders. Slowly go back to the starting position as you keep the bar in contact with the torso at all times. Repeat for the recommended amount of repetitions. 	f	{biceps}	{forearms}	\N	f
670	Low Cable Crossover	cable	To move into the starting position, place the pulleys at the low position, select the resistance to be used and grasp a handle in each hand. Step forward, gaining tension in the pulleys. Your palms should be facing forward, hands below the waist, and your arms straight. This will be your starting position. With a slight bend in your arms, draw your hands upward and toward the midline of your body. Your hands should come together in front of your chest, palms facing up. Return your arms back to the starting position after a brief pause. 	t	{chest}	{shoulders}	\N	f
671	Side to Side Box Shuffle	other	Stand to one side of the box with your left foot resting on the middle of it. To begin, jump up and over to the other side of the box, landing with your right foot on top of the box and your left foot on the floor. Swing your arms to aid your movement. Continue shuffling back and forth across the box. 	f	{quadriceps}	{abductors,adductors,calves,hamstrings}	\N	f
672	Dumbbell Lying Pronation	dumbbell	Lie on a flat bench face down with one arm holding a dumbbell and the other hand on top of the bench folded so that you can rest your head on it. Bend the elbows of the arm holding the dumbbell so that it creates a 90-degree angle between the upper arm and the forearm. Now raise the upper arm so that the forearm is perpendicular to the floor and the upper arm is perpendicular to your torso. Tip: The upper arm should be parallel to the floor and also creating a 90-degree angle with your torso. This will be your starting position. As you breathe out, externally rotate your forearm so that the dumbbell is lifted forward as you maintain the 90 degree angle bend between the upper arms and the forearm. You will continue this external rotation until the forearm is parallel to the floor. At this point you will hold the contraction for a second. As you breathe in, slowly go back to the starting position. Repeat for the recommended amount of repetitions. 	t	{forearms}	\N	\N	f
673	Inverted Row	none	Position a bar in a rack to about waist height. You can also use a smith machine. Take a wider than shoulder width grip on the bar and position yourself hanging underneath the bar. Your body should be straight with your heels on the ground with your arms fully extended. This will be your starting position. Begin by flexing the elbow, pulling your chest towards the bar. Retract your shoulder blades as you perform the movement. Pause at the top of the motion, and return yourself to the start position. Repeat for the desired number of repetitions. 	f	{"middle back"}	{lats}	\N	f
674	Straight Bar Bench Mid Rows	barbell	Place a loaded barbell on the end of a bench. Standing on the bench behind the bar, take a medium, pronated grip. Stand with your hips back and chest up, maintaining a neutral spine. This will be your starting position. Row the bar to your torso by retracting the shoulder blades and flexing the elbows. Use a controlled movement with no jerking. After a brief pause, slowly return the bar to the starting position, ensuring to go all the way down. 	f	{"middle back"}	{biceps,lats}	\N	f
675	Hanging Leg Raise	body only	Hang from a chin-up bar with both arms extended at arms length in top of you using either a wide grip or a medium grip. The legs should be straight down with the pelvis rolled slightly backwards. This will be your starting position. Raise your legs until the torso makes a 90-degree angle with the legs. Exhale as you perform this movement and hold the contraction for a second or so. Go back slowly to the starting position as you breathe in. Repeat for the recommended amount of repetitions. 	t	{abdominals}	\N	\N	f
676	Frog Hops	none	Stand with your hands behind your head, and squat down keeping your torso upright and your head up. This will be your starting position. Jump forward several feet, avoiding jumping unnecessarily high. As your feet contact the ground, absorb the impact through your legs, and jump again. Repeat this action 5-10 times. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
677	Shoulder Press - With Bands	bands	To begin, stand on an exercise band so that tension begins at arm's length. Grasp the handles and lift them so that the hands are at shoulder height at each side. Rotate the wrists so that the palms of your hands are facing forward. Your elbows should be bent, with the upper arms and forearms in line to the torso. This is your starting position. As you exhale, lift the handles up until your arms are fully extended overhead. 	f	{shoulders}	{triceps}	\N	f
678	Snatch Shrug	barbell	Begin with a wide grip, with the bar hanging at the mid thigh position. You can use a hook or overhand grip. Your back should be straight and inclined slightly forward. Shrug your shoulders towards your ears. While this exercise can usually by loaded with heavier weight than a snatch, avoid overloading to the point that the execution slows down. 	f	{traps}	{forearms,shoulders}	\N	f
679	Adductor	foam roll	Lie face down with one leg on a foam roll. Rotate the leg so that the foam roll contacts against your inner thigh. Shift as much weight onto the foam roll as can be tolerated. While trying to relax the muscles if the inner thigh, roll over the foam between your hip and knee, holding points of tension for 10-30 seconds. Repeat with the other leg. 	t	{adductors}	\N	\N	f
861	Conan's Wheel	other	With the weight loaded, take a zurcher hold on the end of the implement. Place the bar in the crook of the elbow and hold onto your wrist. Try to keep the weight off of the forearms. Begin by lifting the weight from the ground. Keep a tight, upright posture as you being to walk, taking short, fast steps. Look up and away as you turn in a circle. Do not hold your breath during the event. Continue walking until you complete one or more complete turns. 	f	{quadriceps}	{abdominals,biceps,calves,forearms,"lower back",shoulders,traps}	\N	f
680	Dumbbell Lying One-Arm Rear Lateral Raise	dumbbell	While holding a dumbbell in one hand, lay with your chest down on a slightly inclined (around 15 degrees when measured from the floor) adjustable bench. The other hand can be used to hold to the leg of the bench for stability. Position the palm of the hand that is holding the dumbbell in a neutral manner (palms facing your torso) as you keep the arm extended with the elbow slightly bent. This will be your starting position. Now raise the arm with the dumbbell to the side until your elbow is at shoulder height and your arm is roughly parallel to the floor as you exhale. Tip: Maintain your arm perpendicular to the torso while keeping your arm extended throughout the movement. Also, keep the contraction at the top for a second. Slowly lower the dumbbell to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	t	{shoulders}	{"middle back"}	\N	f
681	Zottman Preacher Curl	dumbbell	Grab a dumbbell in each hand and place your upper arms on top of the preacher bench or the incline bench. The dumbbells should be held at shoulder height and the elbows should be flexed. Hold the dumbbells with the palms of your hands facing down. This will be your starting position. As you breathe in, slowly lower the dumbbells keeping the palms down until your upper arm is extended and your biceps are fully stretched. Now rotate your wrists once you are at the bottom of the movement so that the palms of the hands are facing up. As you exhale, use your biceps to curl the weights up until they are fully contracted and the dumbbells are at shoulder height. Again, remember that to ensure full contraction you need to bring that small finger higher than the thumb. Squeeze the biceps hard for a second at the contracted position and rotate your wrists so that the palms are facing down again. Repeat for the recommended amount of repetitions. 	t	{biceps}	{forearms}	\N	f
682	Standing Palms-Up Barbell Behind The Back Wrist Curl	barbell	Start by standing straight and holding a barbell behind your glutes at arm's length while using a pronated grip (palms will be facing back away from the glutes) and having your hands shoulder width apart from each other. You should be looking straight forward while your feet are shoulder width apart from each other. This is the starting position. While exhaling, slowly elevate the barbell up by curling your wrist in a semi-circular motion towards the ceiling. Note: Your wrist should be the only body part moving for this exercise. Hold the contraction for a second and lower the barbell back down to the starting position while inhaling. Repeat for the recommended amount of repetitions. When finished, lower the barbell down to the squat rack or the floor by bending the knees. Tip: It is easiest to either pick it up from a squat rack or have a partner hand it to you. 	t	{forearms}	\N	\N	f
683	90/90 Hamstring	body only	Lie on your back, with one leg extended straight out. With the other leg, bend the hip and knee to 90 degrees. You may brace your leg with your hands if necessary. This will be your starting position. Extend your leg straight into the air, pausing briefly at the top. Return the leg to the starting position. Repeat for 10-20 repetitions, and then switch to the other leg. 	f	{hamstrings}	{calves}	\N	f
684	Lunge Sprint	machine	Adjust a bar in a Smith machine to an appropriate height. Position yourself under the bar, racking it across the back of your shoulders. Unrack the bar, and then split your feet, moving one foot forward and one foot back. This will be your starting position. Lower your back knee nearly to the ground, flexing the knees and lowering your hips as you do so. At the bottom of the descent, immediately reverse direction. Explosively drive through the heel of your front foot with light pressure from your back foot. Jump up and reverse the position of your legs. Repeat for the recommended amount of repetitions. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
685	Sled Push	other	Load your pushing sled with the desired weight. Take an athletic posture, leaning into the sled with your arms fully extended, grasping the handles. Push the sled as fast as possible, focusing on extending your hips and knees to strengthen your posterior chain. 	f	{quadriceps}	{calves,chest,glutes,hamstrings,triceps}	\N	f
686	Log Lift	other	Begin standing with the log in front of you. Grasp the handles, and begin to clean the log. As you are bent over to start the clean, attempt to get the log as high as possible, pulling it into your chest. Extend through the hips and knees to bring it up to complete the clean. Push your head back and look up, creating a shelf on your chest to rest the log. Begin the press by dipping, flexing slightly through the knees and reversing the motion. This push press will generate momentum to start the log moving vertically. Continue by extending through the elbows to press the log above your head. There are no strict rules on form, so use whatever techniques you are most efficient with. As the log is pressed, ensure that you push your head through on each repetition, looking forward. Repeat as many times as possible. Attempt to control the descent of the log as it is returned to the ground. 	f	{shoulders}	{abdominals,chest,glutes,hamstrings,"lower back","middle back",quadriceps,traps,triceps}	\N	f
687	Standing Dumbbell Calf Raise	dumbbell	Stand with your torso upright holding two dumbbells in your hands by your sides. Place the ball of the foot on a sturdy and stable wooden board (that is around 2-3 inches tall) while your heels extend off and touch the floor. This will be your starting position. With the toes pointing either straight (to hit all parts equally), inwards (for emphasis on the outer head) or outwards (for emphasis on the inner head), raise the heels off the floor as you exhale by contracting the calves. Hold the top contraction for a second. As you inhale, go back to the starting position by slowly lowering the heels. Repeat for the recommended amount of times. 	t	{calves}	\N	\N	f
688	Seated Side Lateral Raise	dumbbell	Pick a couple of dumbbells and sit at the end of a flat bench with your feet firmly on the floor. Hold the dumbbells with your palms facing in and your arms straight down at your sides at arms' length. This will be your starting position. While maintaining the torso stationary (no swinging), lift the dumbbells to your side with a slight bend on the elbow and the hands slightly tilted forward as if pouring water in a glass. Continue to go up until you arms are parallel to the floor. Exhale as you execute this movement and pause for a second at the top. Lower the dumbbells back down slowly to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	t	{shoulders}	\N	\N	f
689	One-Arm Kettlebell Floor Press	kettlebells	Lie on the floor holding a kettlebell with one hand, with your upper arm supported by the floor. The palm should be facing in. Press the kettlebell straight up toward the ceiling, rotating your wrist. Lower the kettlebell back to the starting position and repeat. 	f	{chest}	{triceps}	\N	f
690	Smith Machine One-Arm Upright Row	machine	With the bar at thigh level, load an appropriate weight. Take a wide grip on the bar and unhook the weight, removing your off hand from the bar. Your arm should be extended as you stand up straight with your head and chest up. This will be your starting position. Begin the movement by flexing the elbow, raising the upper arm with the elbow pointed out. Continue until your upper arm is parallel to the floor. After a brief pause, return the weight to the starting position. Repeat for the desired number of repetitions before engaging the hooks to rack the weight. 	f	{shoulders}	{biceps,traps}	\N	f
691	Dancer's Stretch	none	Sit up on the floor. Cross your right leg over your left, keeping the knee bent. Your left leg is straight and down on the floor. Place your left arm on your right leg and your right hand on the floor. Rotate your upper body to the right, and hold for 10-20 seconds. Switch sides. 	f	{"lower back"}	{abductors,glutes}	\N	f
692	Pyramid	exercise ball	Start off by rolling your torso forward onto the ball so your hips rest on top of the ball and become the highest point of your body. Rest your hands and feet on the floor. Your arms and legs can be slightly bent or straight, depending on the size of the ball, your flexibility, and the length of your limbs. This also helps develop stabilizing strength in your torso and shoulders. 	f	{"lower back"}	{shoulders}	\N	f
693	Front Barbell Squat To A Bench	barbell	This exercise is best performed inside a squat rack for safety purposes. To begin, first set a flat bench behind you and set the bar on a rack that best matches your height. Once the correct height is chosen and the bar is loaded, bring your arms up under the bar while keeping the elbows high and the upper arm slightly above parallel to the floor. Rest the bar on top of the deltoids and cross your arms while grasping the bar for total control. Lift the bar off the rack by first pushing with your legs and at the same time straightening your torso. Step away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times as looking down will get you off balance and also maintain a straight back. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances described in the foot positioning section). Begin to slowly lower the bar by bending the knees as you maintain a straight posture with the head up. Continue down until you touch the bench with your glutes. Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly. Begin to raise the bar as you exhale by pushing the floor mainly with the heel of your foot as you straighten the legs again and go back to the starting position. Repeat for the recommended amount of repetitions. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
694	Barbell Full Squat	barbell	This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack just above shoulder level. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it. Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso. Step away from the rack and position your legs using a shoulder-width medium stance with the toes slightly pointed out. Keep your head up at all times and maintain a straight back. This will be your starting position. Begin to slowly lower the bar by bending the knees and sitting back with your hips as you maintain a straight posture with the head up. Continue down until your hamstrings are on your calves. Inhale as you perform this portion of the movement. Begin to raise the bar as you exhale by pushing the floor with the heel or middle of your foot as you straighten the legs and extend the hips to go back to the starting position. Repeat for the recommended amount of repetitions. 	f	{quadriceps}	{calves,glutes,hamstrings,"lower back"}	\N	f
695	Reverse Barbell Curl	barbell	Stand up with your torso upright while holding a barbell at shoulder width with the elbows close to the torso. The palm of your hands should be facing down (pronated grip). This will be your starting position. While holding the upper arms stationary, curl the weights while contracting the biceps as you breathe out. Only the forearms should move. Continue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second as you squeeze the muscle. Slowly begin to bring the bar back to starting position as your breathe in. Repeat for the recommended amount of repetitions. 	t	{biceps}	{forearms}	\N	f
696	Floor Glute-Ham Raise	none	You can use a partner for this exercise or brace your feet under something stable. Begin on your knees with your upper legs and torso upright. If using a partner, they will firmly hold your feet to keep you in position. This will be your starting position. Lower yourself by extending at the knee, taking care to NOT flex the hips as you go forward. Place your hands in front of you as you reach the floor. This movement is very difficult and you may be unable to do it unaided. Use your arms to lightly push off the floor to aid your return to the starting position. 	t	{hamstrings}	{calves,glutes}	\N	f
697	Cable Hip Adduction	cable	Stand in front of a low pulley facing forward with one leg next to the pulley and the other one away. Attach the ankle cuff to the cable and also to the ankle of the leg that is next to the pulley. Now step out and away from the stack with a wide stance and grasp the bar of the pulley system. Stand on the foot that does not have the ankle cuff (the far foot) and allow the leg with the cuff to be pulled towards the low pulley. This will be your starting position. Now perform the movement by moving the leg with the ankle cuff in front of the far leg by using the inner thighs to abduct the hip. Breathe out during this portion of the movement. Slowly return to the starting position as you breathe in. Repeat for the recommended amount of repetitions and then repeat the same movement with the opposite leg. 	t	{quadriceps}	\N	\N	f
719	Power Stairs	other	In the power stairs, implements are moved up a staircase. For training purposes, these can be performed with a tire or box. Begin by taking the implement with both hands. Set your feet wide, with your head and chest up. Drive through the ground with your heels, extending your knees and hips to raise the weight from the ground. As you lean back, attempt to swing the weight onto the stairs, which are usually around 16-18" high. You can use your legs to help push the weight onto the stair. Repeat for 3-5 repetitions, and continue with a heavier weight, moving as fast as possible. 	f	{hamstrings}	{adductors,calves,glutes,"lower back",quadriceps,shoulders,traps}	\N	f
698	Crunches	body only	Lie flat on your back with your feet flat on the ground, or resting on a bench with your knees bent at a 90 degree angle. If you are resting your feet on a bench, place them three to four inches apart and point your toes inward so they touch. Now place your hands lightly on either side of your head keeping your elbows in. Tip: Don't lock your fingers behind your head. While pushing the small of your back down in the floor to better isolate your abdominal muscles, begin to roll your shoulders off the floor. Continue to push down as hard as you can with your lower back as you contract your abdominals and exhale. Your shoulders should come up off the floor only about four inches, and your lower back should remain on the floor. At the top of the movement, contract your abdominals hard and keep the contraction for a second. Tip: Focus on slow, controlled movement - don't cheat yourself by using momentum. After the one second contraction, begin to come down slowly again to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	t	{abdominals}	\N	\N	f
699	Cable Internal Rotation	cable	Sit next to a low pulley sideways (with legs stretched in front of you or crossed) and grasp the single hand cable attachment with the arm nearest to the cable. Tip: If you can adjust the pulley's height, you can use a flat bench to sit on instead. Position the elbow against your side with the elbow bent at 90° and the arm pointing towards the pulley. This will be your starting position. Pull the single hand cable attachment toward your body by internally rotating your shoulder until your forearm is across your abs. You will be creating an imaginary semi-circle. Tip: The forearm should be perpendicular to your torso at all times. Slowly go back to the initial position. Repeat for the recommended amount of repetitions and then repeat the movement with the next arm. 	f	{shoulders}	\N	\N	f
700	Incline Dumbbell Flyes	dumbbell	Hold a dumbbell on each hand and lie on an incline bench that is set to an incline angle of no more than 30 degrees. Extend your arms above you with a slight bend at the elbows. Now rotate the wrists so that the palms of your hands are facing you. Tip: The pinky fingers should be next to each other. This will be your starting position. As you breathe in, start to slowly lower the arms to the side while keeping the arms extended and while rotating the wrists until the palms of the hand are facing each other. Tip: At the end of the movement the arms will be by your side with the palms facing the ceiling. As you exhale start to bring the dumbbells back up to the starting position by reversing the motion and rotating the hands so that the pinky fingers are next to each other again. Tip: Keep in mind that the movement will only happen at the shoulder joint and at the wrist. There is no motion that happens at the elbow joint. Repeat for the recommended amount of repetitions. 	f	{chest}	{shoulders}	\N	f
701	Torso Rotation	exercise ball	Stand upright holding an exercise ball with both hands. Extend your arms so the ball is straight out in front of you. This will be your starting position. Rotate your torso to one side, keeping your eyes on the ball as you move. Now, rotate back to the opposite direction. Repeat for 10-20 repetitions. 	f	{abdominals}	\N	\N	f
702	Double Kettlebell Snatch	kettlebells	Place two kettlebells behind your feet. Bend your knees and sit back to pick up the kettlebells. Swing the kettlebells between your legs forcefully and reverse the direction. Drive through with your hips and lock the ketttlebells overhead in one uninterrupted motion. 	f	{shoulders}	{glutes,hamstrings,quadriceps}	\N	f
703	Chest Push (multiple response)	medicine ball	Begin in a kneeling position facing a wall or utilize a partner. Hold the ball with both hands tight into the chest. Execute the pass by exploding forward and outward with the hips while pushing the ball as hard as possible. Follow through by falling forward, catching yourself with your hands. Immediately return to an upright position. Repeat for the desired number of repetitions. 	f	{chest}	{abdominals,shoulders,triceps}	\N	f
704	Front Raise And Pullover	barbell	Lie on a flat bench while holding a barbell using a palms down grip that is about 15 inches apart. Place the bar on your upper thighs, extend your arms and lock them while keeping a slight bend on the elbows. This will be your starting position. Now raise the weight using a semicircular motion and keeping your arms straight as you inhale. Continue the same movement until the bar is on the other side above your head . (Tip: the bar will travel approximately 180-degrees). At this point your arms should be parallel to the floor with the palms of your hands facing the ceiling. Now return the barbell to the starting position by reversing the motion as you exhale. Repeat for the recommended amount of repetitions. 	f	{chest}	{lats,shoulders,triceps}	\N	f
705	Kettlebell Turkish Get-Up (Lunge style)	kettlebells	Lie on your back on the floor and press a kettlebell to the top position by extending the elbow. Bend the knee on the same side as the kettlebell. Keeping the kettlebell locked out at all times, pivot to the opposite side and use your non- working arm to assist you in driving forward to the lunge position. Using your free hand, push yourself to a seated position, then progressing to one knee. While looking up at the kettlebell, slowly stand up. Reverse the motion back to the starting position and repeat. 	f	{shoulders}	{abdominals,hamstrings,quadriceps,triceps}	\N	f
706	Standing Olympic Plate Hand Squeeze	other	To begin, stand straight while holding a weight plate by the ridge at arm's length in each hand using a neutral grip (palms facing in). You feet should be shoulder width apart from each other. This will be your starting position. Lower the plates until the fingers are nearly extended but can still hold weights. Inhale as you lower the plates. Now raise the plates back to the starting position as you exhale by closing your hands. Repeat for the recommended amount of repetitions prescribed in your program. 	t	{forearms}	{biceps}	\N	f
707	Double Leg Butt Kick	body only	Begin standing with your knees slightly bent. Quickly squat a short distance, flexing the hips and knees, and immediately extend to jump for maximum vertical height. As you go up, tuck your heels by flexing the knees, attempting to touch the buttocks. Finish the motion by landing with the knees only partially bent, using your legs to absorb the impact. 	f	{quadriceps}	{abductors,adductors,calves,glutes,hamstrings}	\N	f
708	Standing Hip Flexors	none	Stand up straight with the spine vertical, the left foot slightly in front of the right. Bend both knees and lift the back heel off the floor as you press the right hip forward. You can't get a thorough, deep stretch in this position, however, because it's hard to relax the hip flexor and stand on it at the same time. Switch sides. 	t	{quadriceps}	\N	\N	f
793	Trap Bar Deadlift	other	For this exercise load a trap bar, also known as a hex bar, to an appropriate weight resting on the ground. Stand in the center of the apparatus and grasp both handles. Lower your hips, look forward with your head and keep your chest up. Begin the movement by driving through the heels and extend your hips and knees. Avoid rounding your back at all times. At the completion of the movement, lower the weight back to the ground under control. 	f	{quadriceps}	{glutes,hamstrings}	\N	f
709	Standing Barbell Calf Raise	barbell	This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack that best matches your height. Once the correct height is chosen and the bar is loaded, step under the bar and place the bar on the back of your shoulders (slightly below the neck). Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso. Step away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times as looking down will get you off balance and also maintain a straight back. The knees should be kept with a slight bend; never locked. This will be your starting position. Tip: For better range of motion you may also place the ball of your feet on a wooden block but be careful as this option requires more balance and a sturdy block. Raise your heels as you breathe out by extending your ankles as high as possible and flexing your calf. Ensure that the knee is kept stationary at all times. There should be no bending at any time. Hold the contracted position by a second before you start to go back down. Go back slowly to the starting position as you breathe in by lowering your heels as you bend the ankles until calves are stretched. Repeat for the recommended amount of repetitions. 	t	{calves}	\N	\N	f
710	Atlas Stones	other	Begin with the atlas stone between your feet. Bend at the hips to wrap your arms vertically around the Atlas Stone, attempting to get your fingers underneath the stone. Many stones will have a small flat portion on the bottom, which will make the stone easier to hold. Pulling the stone into your torso, drive through the back half of your feet to pull the stone from the ground. As the stone passes the knees, lap it by sitting backward, pulling the stone on top of your thighs. Sit low, getting the stone high onto your chest as you change your grip to reach over the stone. Stand, driving through with your hips. Close distance to the loading platform, and lean back, extending the hips to get the stone as high as possible. 	f	{"lower back"}	{abdominals,adductors,biceps,calves,forearms,glutes,hamstrings,"middle back",quadriceps,traps}	\N	f
711	Incline Push-Up Close-Grip	body only	Stand facing a Smith machine bar or sturdy elevated platform at an appropriate height. Place your hands next to one another on the bar. Position your feet back from the bar with arms and body straight. This will be your starting position. Keeping your body straight, lower your chest to the bar by bending the arms. Return to the starting position by extending the elbows, pressing yourself back up. 	f	{triceps}	{chest,shoulders}	\N	f
712	Reverse Barbell Preacher Curls	e-z curl bar	Grab an EZ-bar using a shoulder width and palms down (pronated) grip. Now place the upper part of both arms on top of the preacher bench and have your arms extended. This will be your starting position. As you exhale, use the biceps to curl the weight up until your biceps are fully contracted and the barbell is at shoulder height. Squeeze the biceps hard for a second at the contracted position. As you breathe in, slowly lower the barbell until your upper arms are extended and the biceps is fully stretched. Repeat for the recommended amount of repetitions. 	t	{biceps}	{forearms}	\N	f
713	Dumbbell Clean	dumbbell	Begin standing with a dumbbell in each hand with your feet shoulder width apart. Lower the weights to the floor by flexing at the hips and knees, pushing your hips back until the dumbbells reach the floor. This will be your starting position. To initiate the movement, violently jump upward by extending the hips, knees, and ankles to acclerate the weights upward. Maintaining a neutral grip on the dumbbells, keep the arms straight until full extension is reached. After full extension, rebend the hips and knees to receive the weight in a squat position. Allow the arms to bend, guiding the dumbbells to your shoulders. Upon receiving the weight in the squat position, extend the hips and knees to finish in a standing position with the weights on your shoulders. 	f	{hamstrings}	{calves,forearms,glutes,"lower back",quadriceps,shoulders,traps}	\N	f
714	Chair Leg Extended Stretch	other	Sit upright in a chair and grip the seat on the sides. Raise one leg, extending the knee, flexing the ankle as you do so. Slowly move that leg outward as far as you can, and then back to the center and down. Repeat for your other leg. 	t	{hamstrings}	{adductors}	\N	f
715	Triceps Pushdown - Rope Attachment	cable	Attach a rope attachment to a high pulley and grab with a neutral grip (palms facing each other). Standing upright with the torso straight and a very small inclination forward, bring the upper arms close to your body and perpendicular to the floor. The forearms should be pointing up towards the pulley as they hold the rope with the palms facing each other. This is your starting position. Using the triceps, bring the rope down as you bring each side of the rope to the side of your thighs. At the end of the movement the arms are fully extended and perpendicular to the floor. The upper arms should always remain stationary next to your torso and only the forearms should move. Exhale as you perform this movement. After holding for a second, at the contracted position, bring the rope slowly up to the starting point. Breathe in as you perform this step. Repeat for the recommended amount of repetitions. 	t	{triceps}	\N	\N	f
716	Barbell Squat	barbell	This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack to just below shoulder level. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it. Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso. Step away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times and also maintain a straight back. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances discussed in the foot stances section). Begin to slowly lower the bar by bending the knees and hips as you maintain a straight posture with the head up. Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees. Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly. Begin to raise the bar as you exhale by pushing the floor with the heel of your foot as you straighten the legs again and go back to the starting position. Repeat for the recommended amount of repetitions. 	f	{quadriceps}	{calves,glutes,hamstrings,"lower back"}	\N	f
717	Single-Cone Sprint Drill	other	This drill teaches quick foot action. You need a single cone. Begin standing next to the cone with one arm back and one arm forward. Chop the feet as quickly as possible, blocking with the arms. Circle the cone, keep your knees up, with violent foot action. Rest after three trips around the cone. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
720	Decline Crunch	body only	Secure your legs at the end of the decline bench and lie down. Now place your hands lightly on either side of your head keeping your elbows in. Tip: Don't lock your fingers behind your head. While pushing the small of your back down in the bench to better isolate your abdominal muscles, begin to roll your shoulders off it. Continue to push down as hard as you can with your lower back as you contract your abdominals and exhale. Your shoulders should come up off the bench only about four inches, and your lower back should remain on the bench. At the top of the movement, contract your abdominals hard and keep the contraction for a second. Tip: Focus on slow, controlled movement - don't cheat yourself by using momentum. After the one second contraction, begin to come down slowly again to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	t	{abdominals}	\N	\N	f
721	Sumo Deadlift with Chains	barbell	You can attach the chains to the sleeves of the bar, or just drape the middle over the bar so there is a greater weight increase as you lift. Attempt to keep the ends of the chains away from the plates so you don't hit them when you lower the weight. Begin with a bar loaded on the ground. Approach the bar so that the bar intersects the middle of the feet. The feet should be set very wide, near the collars. Bend at the hips to grip the bar. The arms should be directly below the shoulders, inside the legs, and you can use a pronated grip, a mixed grip, or hook grip. Relax the shoulders, which in effect lengthens your arms. Take a breath, and then lower your hips, looking forward with your head with your chest up. Drive through the floor, spreading your feet apart, with your weight on the back half of your feet. Extend through the hips and knees. As the bar passes through the knees, lean back and drive the hips into the bar, pulling your shoulder blades together. Return the weight to the ground by bending at the hips and controlling the weight on the way down. 	f	{hamstrings}	{abductors,adductors,forearms,glutes,"lower back","middle back",quadriceps,traps}	\N	f
722	Hyperextensions (Back Extensions)	other	Lie face down on a hyperextension bench, tucking your ankles securely under the footpads. Adjust the upper pad if possible so your upper thighs lie flat across the wide pad, leaving enough room for you to bend at the waist without any restriction. With your body straight, cross your arms in front of you (my preference) or behind your head. This will be your starting position. Tip: You can also hold a weight plate for extra resistance in front of you under your crossed arms. Start bending forward slowly at the waist as far as you can while keeping your back flat. Inhale as you perform this movement. Keep moving forward until you feel a nice stretch on the hamstrings and you can no longer keep going without a rounding of the back. Tip: Never round the back as you perform this exercise. Also, some people can go farther than others. The key thing is that you go as far as your body allows you to without rounding the back. Slowly raise your torso back to the initial position as you inhale. Tip: Avoid the temptation to arch your back past a straight line. Also, do not swing the torso at any time in order to protect the back from injury. Repeat for the recommended amount of repetitions. 	t	{"lower back"}	{glutes,hamstrings}	\N	f
723	Chest Stretch on Stability Ball	exercise ball	Get on your hands and knees next to an exercise ball. Place your elbows on top of the ball, keeping your arm out to your side. This will be your starting position. Lower your torso towards the floor, keeping your elbow on top of the ball. Hold the stretch for 20-30 seconds, and repeat with the other arm. 	t	{chest}	\N	\N	f
724	Good Morning	barbell	Begin with a bar on a rack at shoulder height. Rack the bar across the rear of your shoulders as you would a power squat, not on top of your shoulders. Keep your back tight, shoulder blades pinched together, and your knees slightly bent. Step back from the rack. Begin by bending at the hips, moving them back as you bend over to near parallel. Keep your back arched and your cervical spine in proper alignment. Reverse the motion by extending through the hips with your glutes and hamstrings. Continue until you have returned to the starting position. 	f	{hamstrings}	{abdominals,glutes,"lower back"}	\N	f
725	Shoulder Raise	none	Relax your arms to your sides and raise your shoulders up toward your ears, then back down. 	f	{shoulders}	{lats}	\N	f
726	Deadlift with Chains	barbell	You can attach the chains to the sleeves of the bar, or just drape the middle over the bar so there is a greater weight increase as you lift. Approach the bar so that it is centered over your feet. You feet should be about hip width apart. Bend at the hip to grip the bar at shoulder width, allowing your shoulder blades to protract. Typically, you would use an overhand grip or an over/under grip on heavier sets. With your feet, and your grip set, take a big breath and then lower your hips and bend the knees until your shins contact the bar. Look forward with your head, keep your chest up and your back arched, and begin driving through the heels to move the weight upward. After the bar passes the knees, aggressively pull the bar back, pulling your shoulder blades together as you drive your hips forward into the bar. Lower the bar by bending at the hips and guiding it to the floor. 	f	{"lower back"}	{forearms,glutes,hamstrings,"middle back",quadriceps,traps}	\N	f
727	Star Jump	body only	Begin in a relaxed stance with your feet shoulder width apart and hold your arms close to the body. To initiate the move, squat down halfway and explode back up as high as possible. Fully extend your entire body, spreading your legs and arms away from the body. As you land, bring your limbs back in and absorb your impact through the legs. 	f	{quadriceps}	{calves,glutes,hamstrings,shoulders}	\N	f
728	Smith Machine Close-Grip Bench Press	machine	Place a flat bench underneath the smith machine. Place the barbell at a height that you can reach when lying down and your arms are almost fully extended. Once the weight you need is selected, lie down on the flat bench. Using a close and pronated grip (palms facing forward) that is around shoulder width, unlock the bar from the rack and hold it straight over you with your arms locked. This will be your starting position. As you breathe in, come down slowly until you feel the bar on your middle chest. Tip: Make sure that as opposed to a regular bench press, you keep the elbows close to the torso at all times in order to maximize triceps involvement. After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your triceps muscles. Lock your arms in the contracted position, hold for a second and then start coming down slowly again. Tip: It should take at least twice as long to go down than to come up. Repeat the movement for the prescribed amount of repetitions. When you are done, lock the bar back in the rack. 	f	{triceps}	{chest,shoulders}	\N	f
873	One-Arm Open Palm Kettlebell Clean	kettlebells	Place one kettlebell between your feet. Grab the handle with one hand and raise the kettlebell rapidly, let it flip so that the ball of the kettlebell lands in the palm of your hand. Throw the kettlebell out in front of you and catch the handle with one hand. Take the kettlebell to the floor and repeat. Make sure to work both arms. 	f	{hamstrings}	{forearms,glutes,"lower back",quadriceps,shoulders}	\N	f
729	Full Range-Of-Motion Lat Pulldown	cable	Either standing or seated on a high bench, grasp two stirrup cables that are attached to the high pulleys. Grab with the opposing hand so your arms are crisscrossed about you and your palms are facing forward. Keeping your chest up and maintaining a slight arch in your lower back, pull the handles down as if you were doing a regular pulldown. The range of motion will be more of an arc. During the movement, rotate your hands so that in the bottom position your palms face each other rather than forward. Return slowly to the starting position and repeat. 	f	{lats}	{biceps,"middle back",shoulders}	\N	f
730	Power Partials	dumbbell	Stand up with your torso upright and a dumbbell on each hand being held at arms length. The elbows should be close to the torso. The palms of the hands should be facing your torso. Your feet should be about shoulder width apart. This will be your starting position. Keeping your arms straight and the torso stationary, lift the weights out to your sides until they are about shoulder level height while exhaling. Feel the contraction for a second and begin to lower the weights back down to the starting position while inhaling. Tip: Keep the palms facing down with the little finger slightly higher while lifting and lowering the weights as it will concentrate the stress on your shoulders mainly. Repeat for the recommended amount of repetitions. 	t	{shoulders}	\N	\N	f
731	Side Standing Long Jump	none	Begin standing with your feet hip width apart in an athletic stance. Your head and chest should be up, knees and hips slightly bent. This will be your starting position. Leaning to your right, extend through your hips, knees, and ankles to jump into the air. Block with the arms to lead the movement, jumping as far to your right as you can. Land facing the same direction with your feet hip width apart, absorbing the impact through your lower body. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
732	Bosu Ball Cable Crunch With Side Bends	cable	Connect a standard handle to each arm of a cable machine, and position them in the most downward position. Grab a Bosu Ball and position it in front and center of the cable machine. Lie down on the Bosu Ball with the small of your back arched around the ball. Your rear end should be close to the floor without touching it. With both hands, reach back and grab the handle of each cable. With your feet positioned in a wide stance, extend your arms straight out in front of you and in between your knees. Your hands should be at knee level. Keep your arms straight and in-line with the upward angle of the cable. Elevate your torso in a crunching motion without dropping or bending your arms. Maintain the rigid position with your arms. Slowly descend back to the starting position with your back arched around the Bosu Ball and your abdominals elongated. Repeat the same series of movements to failure. Once you reach failure, keep your abs tight and raise your torso into plank position so your back is elevated off the Bosu Ball. Lower your arms down to your side; keep them straight. Start doing alternating side bends; reach for your heels! This finishing movement will focus on your obliques. 	t	{abdominals}	\N	\N	f
733	Bodyweight Flyes	e-z curl bar	Position two equally loaded EZ bars on the ground next to each other. Ensure they are able to roll. Assume a push-up position over the bars, supporting your weight on your toes and hands with your arms extended and body straight. Place your hands on the bars. This will be your starting position. Using a slow and controlled motion, move your hands away from the midline of your body, rolling the bars apart. Inhale during this portion of the motion. After moving the bars as far apart as you can, return to the starting position by pulling them back together. Exhale as you perform this movement. 	t	{chest}	{abdominals,shoulders,triceps}	\N	f
734	Preacher Curl	barbell	To perform this movement you will need a preacher bench and an E-Z bar. Grab the E-Z curl bar at the close inner handle (either have someone hand you the bar which is preferable or grab the bar from the front bar rest provided by most preacher benches). The palm of your hands should be facing forward and they should be slightly tilted inwards due to the shape of the bar. With the upper arms positioned against the preacher bench pad and the chest against it, hold the E-Z Curl Bar at shoulder length. This will be your starting position. As you breathe in, slowly lower the bar until your upper arm is extended and the biceps is fully stretched. As you exhale, use the biceps to curl the weight up until your biceps is fully contracted and the bar is at shoulder height. Squeeze the biceps hard and hold this position for a second. Repeat for the recommended amount of repetitions. 	t	{biceps}	\N	\N	f
735	Pin Presses	barbell	Pin presses remove the eccentric phase of the bench press, developing starting strength. They also allow you to train a desired range of motion. The bench should be set up in a power rack. Set the pins to the desired point in your range of motion, whether it just be lockout or an inch off of your chest. The bar should be moved to the pins and prepared for lifting. Begin by lying on the bench, with the bar directly above the contact point during your regular bench. Tuck your feet underneath you and arch your back. Using the bar to help support your weight, lift your shoulder off the bench and retract them, squeezing the shoulder blades together. Use your feet to drive your traps into the bench. Maintain this tight body position throughout the movement. You can take a standard bench grip, or shoulder width to focus on the triceps. The bar, wrist, and elbow should stay in line at all times. Focus on squeezing the bar and trying to pull it apart. Drive the bar up with as much force as possible. The elbows should be tucked in until lockout. Return the bar to the pins, pausing before beginning the next repetition. 	f	{triceps}	{chest,forearms,lats,"middle back",shoulders}	\N	f
736	Barbell Guillotine Bench Press	barbell	Using a medium width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and hold it straight over your neck with your arms locked. This will be your starting position. As you breathe in, bring the bar down slowly until it is about 1 inch from your neck. After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your chest muscles. Lock your arms and squeeze your chest in the contracted position, hold for a second and then start coming down slowly again. It should take at least twice as long to go down than to come up. Repeat the movement for the prescribed amount of repetitions. When you are done, place the bar back in the rack. 	f	{chest}	{shoulders,triceps}	\N	f
794	Yoke Walk	other	The yoke is usually done with a yoke apparatus, but is sometimes seen with refrigerators or other heavy objects. Begin by racking the apparatus across the back of the shoulders. With your head looking forward and back arched, lift the yoke by driving through the heels. Begin walking as quickly as possible using short, quick steps. You may hold the side posts of the yoke to help steady it and hold it in position. Continue for the given distance as fast as possible, usually 75-100 feet. 	f	{quadriceps}	{abdominals,abductors,adductors,calves,glutes,hamstrings,"lower back"}	\N	f
737	Flat Bench Cable Flyes	cable	Position a flat bench between two low pulleys so that when you are laying on it, your chest will be lined up with the cable pulleys. Lay flat on the bench and keep your feet on the ground. Have someone hand you the handles on each hand. You will grab each single handle attachment with a palms up grip. Extend your arms by your side with a slight bend on your elbows. Tip: You will keep this bend constant through the whole movement. Your arms should be parallel to the floor. This is your starting position. Now start lifting the arms in a semi-circle motion directly in front of you by pulling the cables together until both hands meet at the top of the movement. Squeeze your chest as you perform this motion and breathe out during this movement. Also, hold the contraction for a second at the top. Tip: When performed correctly, at the top position of this movement, your arms should be perpendicular to your torso and the floor touching above your chest. Slowly come back to the starting position. Repeat for the recommended amount of repetitions. 	t	{chest}	\N	\N	f
738	Lying Dumbbell Tricep Extension	dumbbell	Lie on a flat bench while holding two dumbbells directly in front of you. Your arms should be fully extended at a 90-degree angle from your torso and the floor. The palms should be facing in and the elbows should be tucked in. This is the starting position. As you breathe in and you keep the upper arms stationary with the elbows in, slowly lower the weight until the dumbbells are near your ears. At that point, while keeping the elbows in and the upper arms stationary, use the triceps to bring the weight back up to the starting position as you breathe out. Repeat for the recommended amount of repetitions. 	t	{triceps}	{chest,shoulders}	\N	f
739	One-Arm Dumbbell Row	dumbbell	Choose a flat bench and place a dumbbell on each side of it. Place the right leg on top of the end of the bench, bend your torso forward from the waist until your upper body is parallel to the floor, and place your right hand on the other end of the bench for support. Use the left hand to pick up the dumbbell on the floor and hold the weight while keeping your lower back straight. The palm of the hand should be facing your torso. This will be your starting position. Pull the resistance straight up to the side of your chest, keeping your upper arm close to your side and keeping the torso stationary. Breathe out as you perform this step. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. Also, make sure that the force is performed with the back muscles and not the arms. Finally, the upper torso should remain stationary and only the arms should move. The forearms should do no other work except for holding the dumbbell; therefore do not try to pull the dumbbell up using the forearms. Lower the resistance straight down to the starting position. Breathe in as you perform this step. Repeat the movement for the specified amount of repetitions. Switch sides and repeat again with the other arm. 	f	{"middle back"}	{biceps,lats,shoulders}	\N	f
740	Rickshaw Carry	other	Position the frame at the starting point, and load with the appropriate weight. Standing in the center of the frame, begin by gripping the handles and driving through your heels to lift the frame. Ensure your chest and head are up and your back is straight. Immediately begin walking briskly with quick, controlled steps. Keep your chest up and head forward, and make sure you continue breathing. Bring the frame to the ground after you have reached the end point. 	f	{forearms}	{abdominals,calves,glutes,hamstrings,"lower back",quadriceps,traps}	\N	f
741	Cable Shoulder Press	cable	Move the cables to the bottom of the towers and select an appropriate weight. Stand directly in between the uprights. Grasp the cables and hold them at shoulder height, palms facing forward. This will be your starting position. Keeping your head and chest up, extend through the elbow to press the handles directly over head. After pausing at the top, return to the starting position and repeat. 	f	{shoulders}	{triceps}	\N	f
742	Cable Chest Press	cable	Adjust the weight to an appropriate amount and be seated, grasping the handles. Your upper arms should be about 45 degrees to the body, with your head and chest up. The elbows should be bent to about 90 degrees. This will be your starting position. Begin by extending through the elbow, pressing the handles together straight in front of you. Keep your shoulder blades retracted as you execute the movement. After pausing at full extension, return to th starting position, keeping tension on the cables. You can also execute this movement with your back off the pad, at an incline or decline, or alternate hands. 	f	{chest}	{shoulders,triceps}	\N	f
743	Straight Raises on Incline Bench	barbell	Place a bar on the ground behind the head of an incline bench. Lay on the bench face down. With a pronated grip, pick the barbell up from the floor, keeping your arms straight. Allow the bar to hang straight down. This will be your starting position. To begin, raise the barbell out in front of your head while keeping your arms extended. Return to the starting position. 	t	{shoulders}	{traps}	\N	f
744	Palms-Down Wrist Curl Over A Bench	barbell	Start out by placing a barbell on one side of a flat bench. Kneel down on both of your knees so that your body is facing the flat bench. Use your arms to grab the barbell with a pronated grip (palms down) and bring them up so that your forearms are resting against the flat bench. Your wrists should be hanging over the edge. Start out by curling your wrist upwards and exhaling. Slowly lower your wrists back down to the starting position while inhaling. Your forearms should be stationary as your wrist is the only movement needed to perform this exercise. Repeat for the recommended amount of repetitions. 	t	{forearms}	\N	\N	f
745	Peroneals Stretch	other	In a seated position, loop a belt, rope, or band around one foot. This will be your starting position. With the leg extended and the heel off of the ground, pull on the belt so that the foot is inverted, with the inside of the foot being pulled towards you. Hold for 10-20 seconds, and then switch sides. 	f	{calves}	\N	\N	f
746	Lateral Bound	body only	Assume a half squat position facing 90 degrees from your direction of travel. This will be your starting position. Allow your lead leg to do a countermovement inward as you shift your weight to the outside leg. Immediately push off and extend, attempting to bound to the side as far as possible. Upon landing, immediately push off in the opposite direction, returning to your original start position. Continue back and forth for several repetitions. 	f	{adductors}	{abductors,calves,glutes,hamstrings,quadriceps}	\N	f
830	Smith Machine Behind the Back Shrug	machine	With the bar at thigh level, load an appropriate weight. Stand with the bar behind you, taking a shoulder-width, pronated grip on the bar and unhook the weight. You should be standing up straight with your head and chest up and your arms extended. This will be your starting position. Initiate the movement by shrugging your shoulders straight up. Do not flex the arms or wrist during the movement. After a brief pause return the weight to the starting position. Repeat for the desired number of repetitions before engaging the hooks to rack the weight. 	t	{traps}	{shoulders}	\N	f
747	Close-Grip Barbell Bench Press	barbell	Lie back on a flat bench. Using a close grip (around shoulder width), lift the bar from the rack and hold it straight over you with your arms locked. This will be your starting position. As you breathe in, come down slowly until you feel the bar on your middle chest. Tip: Make sure that - as opposed to a regular bench press - you keep the elbows close to the torso at all times in order to maximize triceps involvement. After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your triceps muscles. Lock your arms in the contracted position, hold for a second and then start coming down slowly again. Tip: It should take at least twice as long to go down than to come up. Repeat the movement for the prescribed amount of repetitions. When you are done, place the bar back in the rack. 	f	{triceps}	{chest,shoulders}	\N	f
748	Palms-Up Dumbbell Wrist Curl Over A Bench	dumbbell	Start out by placing two dumbbells on one side of a flat bench. Kneel down on both of your knees so that your body is facing the flat bench. Use your arms to grab both of the dumbbells with a supinated grip (palms up) and bring them up so that your forearms are resting against the flat bench. Your wrists should be hanging over the edge. Start out by curling your wrist upwards and exhaling. Slowly lower your wrists back down to the starting position while inhaling. Make sure to inhale during this part of the exercise. Your forearms should be stationary as your wrist is the only movement needed to perform this exercise. Repeat for the recommended amount of repetitions. 	t	{forearms}	\N	\N	f
749	Bench Dips	body only	For this exercise you will need to place a bench behind your back. With the bench perpendicular to your body, and while looking away from it, hold on to the bench on its edge with the hands fully extended, separated at shoulder width. The legs will be extended forward, bent at the waist and perpendicular to your torso. This will be your starting position. Slowly lower your body as you inhale by bending at the elbows until you lower yourself far enough to where there is an angle slightly smaller than 90 degrees between the upper arm and the forearm. Tip: Keep the elbows as close as possible throughout the movement. Forearms should always be pointing down. Using your triceps to bring your torso up again, lift yourself back to the starting position. Repeat for the recommended amount of repetitions. 	f	{triceps}	{chest,shoulders}	\N	f
750	Two-Arm Kettlebell Row	kettlebells	Place two kettlebells in front of your feet. Bend your knees slightly and then push your butt out as much as possible as you bend over to get in the starting position. Grab both kettlebells and pull them to your stomach, retracting your shoulder blades and flexing the elbows. Keep your back straight. Lower and repeat. 	f	{"middle back"}	{biceps,lats}	\N	f
751	Standing Cable Wood Chop	cable	Connect a standard handle to a tower, and move the cable to the highest pulley position. With your side to the cable, grab the handle with one hand and step away from the tower. You should be approximately arm's length away from the pulley, with the tension of the weight on the cable. Your outstretched arm should be aligned with the cable. With your feet positioned shoulder width apart, reach upward with your other hand and grab the handle with both hands. Your arms should still be fully extended. In one motion, pull the handle down and across your body to your front knee while rotating your torso. Keep your back and arms straight and core tight while you pivot your back foot and bend your knees to get a full range of motion. Maintain your stance and straight arms. Return to the neutral position in a slow and controlled manner. Repeat to failure. Then, reposition and repeat the same series of movements on the opposite side. 	f	{abdominals}	{shoulders}	\N	f
752	Seated Close-Grip Concentration Barbell Curl	barbell	Sit down on a flat bench with a barbell or E-Z Bar in front of you in between your legs. Your legs should be spread with the knees bent and the feet on the floor. Use your arms to pick the barbell up and place the back of your upper arms on top of your inner thighs (around three and a half inches away from the front of the knee). A supinated grip closer than shoulder width is needed to perform this exercise. Tip: Your arm should be extended at arms length and the barbell should be above the floor. This will be your starting position. While holding the upper arms stationary, curl the weights forward while contracting the biceps as you breathe out. Only the forearms should move. Continue the movement until your biceps are fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a second as you squeeze the biceps. Slowly begin to bring the barbell back to starting position as your breathe in. Tip: Avoid swinging motions at any time. Repeat for the recommended amount of repetitions. 	t	{biceps}	\N	\N	f
753	Standing Cable Chest Press	cable	Position dual pulleys to chest height and select an appropriate weight. Stand a foot or two in front of the cables, holding one in each hand. You can stagger your stance for better stability. Position the upper arm at a 90 degree angle with the shoulder blades together. This will be your starting position. Keeping the rest of the body stationary, extend through the elbows to press the handles forward, drawing them together in front of you. Pause at the top of the motion, and return to the starting position. 	f	{chest}	{shoulders,triceps}	\N	f
754	Alternating Floor Press	kettlebells	Lie on the floor with two kettlebells next to your shoulders. Position one in place on your chest and then the other, gripping the kettlebells on the handle with the palms facing forward. Extend both arms, so that the kettlebells are being held above your chest. Lower one kettlebell, bringing it to your chest and turn the wrist in the direction of the locked out kettlebell. Raise the kettlebell and repeat on the opposite side. 	f	{chest}	{abdominals,shoulders,triceps}	\N	f
755	Snatch from Blocks	barbell	Begin with a loaded barbell on boxes or stands of the desired height. A wide grip should be taken on the bar. The feet should be directly below the hips, with the feet turned out as needed. Lower the hips, with the chest up and the head looking forward. The shoulders should be just in front of the bar, with the elbows pointed out. This will be the starting position. Begin the first pull by driving through the front of the heels, raising the bar from the boxes. Transition into the second pull by extending through the hips knees and ankles, driving the bar up as quickly as possible. The bar should be close to the body. At peak extension, shrug the shoulders and allow the elbows to flex to the side. As you move your feet into the receiving position, forcefully pull yourself below the bar as you elevate the bar overhead. The feet should move to just outside the hips, turned out as necessary. Receive the bar with your body as low as possible and the arms fully extended overhead. Keeping the bar aligned over the front of the heels, your head and chest up, drive through heels of the feet to move to a standing position. Carefully return the weight to the boxes. 	f	{quadriceps}	{calves,forearms,glutes,hamstrings,"lower back",shoulders,traps,triceps}	\N	f
756	Smith Machine Overhead Shoulder Press	machine	To begin, place a flat bench (or preferably one with back support) underneath a smith machine. Position the barbell at a height so that when seated on the flat bench, the arms must be almost fully extended to reach the barbell. Once you have the correct height, sit slightly in behind the barbell so that there is an imaginary straight line from the tip of your nose to the barbell. Your feet should be stationary. Grab the barbell with the palms facing forward, unlock it and lift it up so that your arms are fully extended. This is the starting position. Slowly begin to lower the barbell until it is level with your chin while inhaling. Then lift the barbell back to the starting position using your shoulders while exhaling. Repeat for the recommended amount of repetitions. 	f	{shoulders}	{triceps}	\N	f
757	EZ-Bar Curl	e-z curl bar	Stand up straight while holding an EZ curl bar at the wide outer handle. The palms of your hands should be facing forward and slightly tilted inward due to the shape of the bar. Keep your elbows close to your torso. This will be your starting position. Now, while keeping your upper arms stationary, exhale and curl the weights forward while contracting the biceps. Focus on only moving your forearms. Continue to raise the weight until your biceps are fully contracted and the bar is at shoulder level. Hold the top contracted position for a moment and squeeze the biceps. Then inhale and slowly lower the bar back to the starting position. Repeat for the recommended amount of repetitions. 	t	{biceps}	\N	\N	f
758	Standing Toe Touches	none	Stand with some space in front and behind you. Bend at the waist, keeping your legs straight, until you can relax and let your upper body hang down in front of you. Let your arms and hands hang down naturally. Hold for 10 to 20 seconds. 	f	{hamstrings}	{calves}	\N	f
759	Chair Upper Body Stretch	other	Sit on the edge of a chair, gripping the back of it. Straighten your arms, keeping your back straight, and pull your upper body forward so you feel a stretch. Hold for 20-30 seconds. 	f	{shoulders}	{biceps,chest}	\N	f
760	Barbell Incline Bench Press - Medium Grip	barbell	Lie back on an incline bench. Using a medium-width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and hold it straight over you with your arms locked. This will be your starting position. As you breathe in, come down slowly until you feel the bar on you upper chest. After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your chest muscles. Lock your arms in the contracted position, squeeze your chest, hold for a second and then start coming down slowly again. Tip: it should take at least twice as long to go down than to come up. Repeat the movement for the prescribed amount of repetitions. When you are done, place the bar back in the rack. 	f	{chest}	{shoulders,triceps}	\N	f
761	Bodyweight Walking Lunge	none	Begin standing with your feet shoulder width apart and your hands on your hips. Step forward with one leg, flexing the knees to drop your hips. Descend until your rear knee nearly touches the ground. Your posture should remain upright, and your front knee should stay above the front foot. Drive through the heel of your lead foot and extend both knees to raise yourself back up. Step forward with your rear foot, repeating the lunge on the opposite leg. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
762	Push Press - Behind the Neck	barbell	Standing with the weight racked on the back of the shoulders, begin with the dip. With your feet directly under your hips, flex the knees without moving the hips backward. Go down only slightly, and reverse direction as powerfully as possible. Drive through the heels create as much speed and force as possible, moving the bar in a vertical path. Using the momentum generated, finish pressing the weight overhead be extending through the arms. Return to the starting position, using your legs to absorb the impact. 	f	{shoulders}	{calves,quadriceps,triceps}	\N	f
763	Car Drivers	barbell	While standing upright, hold a barbell plate in both hands at the 3 and 9 o'clock positions. Your palms should be facing each other and your arms should be extended straight out in front of you. This will be your starting position. Initiate the movement by rotating the plate as far to one side as possible. Use the same type of movement you would use to turn a steering wheel to one side. Reverse the motion, turning it all the way to the opposite side. Repeat for the recommended amount of repetitions. 	t	{shoulders}	{forearms}	\N	f
764	Barbell Shoulder Press	barbell	Sit on a bench with back support in a squat rack. Position a barbell at a height that is just above your head. Grab the barbell with a pronated grip (palms facing forward). Once you pick up the barbell with the correct grip width, lift the bar up over your head by locking your arms. Hold at about shoulder level and slightly in front of your head. This is your starting position. Lower the bar down to the shoulders slowly as you inhale. Lift the bar back up to the starting position as you exhale. Repeat for the recommended amount of repetitions. 	f	{shoulders}	{chest,triceps}	\N	f
765	One-Arm Kettlebell Row	kettlebells	Place a kettlebell in front of your feet. Bend your knees slightly and then push your butt out as much as possible as you bend over to get in the starting position. Grab the kettlebell and pull it to your stomach, retracting your shoulder blade and flexing the elbow. Keep your back straight. Lower and repeat. 	f	{"middle back"}	{biceps,lats}	\N	f
766	Dumbbell Flyes	dumbbell	Lie down on a flat bench with a dumbbell on each hand resting on top of your thighs. The palms of your hand will be facing each other. Then using your thighs to help raise the dumbbells, lift the dumbbells one at a time so you can hold them in front of you at shoulder width with the palms of your hands facing each other. Raise the dumbbells up like you're pressing them, but stop and hold just before you lock out. This will be your starting position. With a slight bend on your elbows in order to prevent stress at the biceps tendon, lower your arms out at both sides in a wide arc until you feel a stretch on your chest. Breathe in as you perform this portion of the movement. Tip: Keep in mind that throughout the movement, the arms should remain stationary; the movement should only occur at the shoulder joint. Return your arms back to the starting position as you squeeze your chest muscles and breathe out. Tip: Make sure to use the same arc of motion used to lower the weights. Hold for a second at the contracted position and repeat the movement for the prescribed amount of repetitions. 	t	{chest}	\N	\N	f
831	Chest And Front Of Shoulder Stretch	other	Start off by standing with your legs together, holding a bodybar or a broomstick. Take a slightly wider than shoulder width grip on the pole and hold it in front of you with your palms facing down. Carefully lift the pole up and behind your head. 	t	{chest}	{shoulders}	\N	f
767	Split Jerk	barbell	Standing with the weight racked on the front of the shoulders, begin with the dip. With your feet directly under your hips, flex the knees without moving the hips backward. Go down only slightly, and reverse direction as powerfully as possible. Drive through the heels create as much speed and force as possible, and be sure to move your head out of the way as the bar leaves the shoulders. At this moment as the feet leave the floor, the feet must be placed into the receiving position as quickly as possible. In the brief moment the feet are not actively driving against the platform, the athlete's effort to push the bar up will drive them down. The feet should be moved to a split stance, one foot forward, one foot back, with the knees partially bent. Receive the bar with the arms locked out overhead. Return to a standing position, bringing the feet together. 	f	{quadriceps}	{glutes,hamstrings,shoulders,triceps}	\N	f
768	Lying T-Bar Row	machine	Load up the T-bar Row Machine with the desired weight and adjust the leg height so that your upper chest is at the top of the pad. Tip: In some machines all you can do is stand on the appropriate step that allows you to be at a height that has the upper chest at the top of the pad. Lay face down on the pad and grab the handles. You can either use a palms down, palms up, or palms in position depending on what part of your back you want to emphasize. Lift the bar off the rack and extend your arms in front of you. This will be your starting position. As you exhale slowly pull the weight up and squeeze your back at the top of the movement. Tip: Keep the upper arms as close to the torso as possible throughout the movement in order to better engage the back muscles. Also, do not lift your body off of the pad at any time and refrain from using the biceps to lift the weight. After a second contraction at the top of the movement, as you inhale, slowly go back down to the starting position. Repeat for the recommended amount of repetitions. 	f	{"middle back"}	{biceps,lats}	\N	f
769	Vertical Swing	dumbbell	Allow the dumbbell to hang at arms length between your legs, holding it with both hands. Keep your back straight and your head up. Swing the dumbbell between your legs, flexing at the hips and bending the knees slightly. Powerfully reverse the motion by extending at the hips, knees, and ankles to propel yourself upward, swinging the dumbell over your head. As you land, absorb the impact through your legs and draw the dumbbell to your torso before the next repetition. 	f	{hamstrings}	{glutes,quadriceps,shoulders}	\N	f
770	Seated Glute	body only	In a seated position with your knees bent, cross one ankle over the opposite knee. Your partner will stand behind you. Now, lean forward as your partner braces your shoulders with their hands. This will be your starting position. Attempt to push your torso back for 10-20 seconds, as your partner prevents any actual movement of your torso. Now relax your muscles as your partner increases the stretch by gently pushing your torso forward for 10-20 seconds. 	f	{glutes}	{adductors}	\N	f
771	Lying Face Up Plate Neck Resistance	other	Lie face up with your whole body straight on a flat bench while holding a weight plate on top of your forehead. Tip: You will need to position yourself so that your shoulders are slightly above the end of a flat bench in order for the traps, neck and head to be off the bench. This will be your starting position. While keeping the plate secure on your forehead slowly lower your head back in a semi-circular motion as you breathe in. Raise your head back up to the starting position in a semi-circular motion as you breathe out. Hold the contraction for a second. Repeat for the recommended amount of repetitions. 	t	{neck}	\N	\N	f
772	Lower Back-SMR	foam roll	In a seated position, place a foam roll under your lower back. Cross your arms in front of you and protract your shoulders. This will be your starting position. Raise your hips off of the floor and lean back, keeping your weight on your lower back. Now shift your weight slightly to one side, keeping your weight off of the spine and on the muscles to the side of it. Roll over your lower back, holding points of tension for 10-30 seconds. Repeat on the other side. 	f	{"lower back"}	\N	\N	f
773	Narrow Stance Hack Squats	machine	Place the back of your torso against the back pad of the machine and hook your shoulders under the shoulder pads provided. Position your legs in the platform using a less than shoulder width narrow stance with the toes slightly pointed out. Your feet should be around 3 inches or less apart. Tip: Keep your head up at all times and also maintain the back on the pad at all times. Place your arms on the side handles of the machine and disengage the safety bars (which on most designs is done by moving the side handles from a facing front position to a diagonal position). Now straighten your legs without locking the knees. This will be your starting position. Begin to slowly lower the unit by bending the knees as you maintain a straight posture with the head up (back on the pad at all times). Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees (which is the point in which the upper legs are below parallel to the floor). Inhale as you perform this portion of the movement. Begin to raise the unit as you exhale by pushing the floor with mainly with the heels of your feet as you straighten the legs again and go back to the starting position. Repeat for the recommended amount of repetitions. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
774	One-Arm Kettlebell Push Press	kettlebells	Hold a kettlebell by the handle. Clean the kettlebell to your shoulder by extending through the legs and hips as you pull the kettlebell towards your shoulder. Rotate your wrist as you do so, so that the palm faces forward. This will be your starting position. Dip your body by bending the knees, keeping your torso upright. Immediately reverse direction, driving through the heels, in essence jumping to create momentum. As you do so, press the kettlebell overhead to lockout by extending the arms, using your body's momentum to move the weight. Lower the weight to perform the next repetition. 	f	{shoulders}	{calves,quadriceps,triceps}	\N	f
806	External Rotation with Band	bands	Choke the band around a post. The band should be at the same height as your elbow. Stand with your left side to the band a couple of feet away. Grasp the end of the band with your right hand, and keep your elbow pressed firmly to your side. We recommend you hold a pad or foam roll in place with your elbow to keep it firmly in position. With your upper arm in position, your elbow should be flexed to 90 degrees with your hand reaching across the front of your torso. This will be your starting position. Execute the movement by rotating your arm in a backhand motion, keeping your elbow in place. Continue as far as you are able, pause, and then return to the starting position. 	f	{shoulders}	\N	\N	f
842	Round The World Shoulder Stretch	other	Stand up straight with your legs together, holding a bodybar or broomstick. Hold the pole behind your hips with a wider than shoulder width grip. Your palms should be down and your thumbs facing out. Slowly lift your arms up behind your head. Don't force it if it gets hard to lift further. 	f	{shoulders}	{biceps,chest}	\N	f
775	Rocking Standing Calf Raise	barbell	This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack that best matches your height. Once the correct height is chosen and the bar is loaded, step under the bar and place it on the back of your shoulders (slightly below the neck). Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso. Step away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times as looking down will get you off balance. Also maintain a straight back and keep the knees with a slight bend; never locked. This will be your starting position. Raise your heels as you breathe out by extending your ankles as high as possible and flexing your calf. Ensure that the knee is kept stationary at all times. There should be no bending (other than the slight initial bend we created during positioning) at any time. Hold the contracted position by a second before you start to go back down. Go back slowly to the starting position as you breathe in by lowering your heels as you bend the ankles until calves are stretched. Now lift your toes by contracting the tibia muscles in the front of the calves as you breathe out. Hold for a second and bring them back down as you breathe in. Repeat for the recommended amount of repetitions. 	t	{calves}	\N	\N	f
776	Kettlebell Thruster	kettlebells	Clean two kettlebells to your shoulders. Clean the kettlebells to your shoulders by extending through the legs and hips as you pull the kettlebells towards your shoulders. Rotate your wrists as you do so. This will be your starting position. Begin to squat by flexing your hips and knees, lowering your hips between your legs. Maintain an upright, straight back as you descend as low as you can. At the bottom, reverse direction and squat by extending your knees and hips, driving through your heels. As you do so, press both kettlebells overhead by extending your arms straight up, using the momentum from the squat to help drive the weights upward. As you begin the next repetition, return the weights to the shoulders. 	f	{shoulders}	{quadriceps,triceps}	\N	f
777	Body-Up	body only	Assume a plank position on the ground. You should be supporting your bodyweight on your toes and forearms, keeping your torso straight. Your forearms should be shoulder-width apart. This will be your starting position. Pressing your palms firmly into the ground, extend through the elbows to raise your body from the ground. Keep your torso rigid as you perform the movement. Slowly lower your forearms back to the ground by allowing the elbows to flex. Repeat. 	t	{triceps}	{abdominals,forearms}	\N	f
778	Incline Dumbbell Flyes - With A Twist	dumbbell	Hold a dumbbell in each hand and lie on an incline bench that is set to an incline angle of no more than 30 degrees. Extend your arms above you with a slight bend at the elbows. Now rotate the wrists so that the palms of your hands are facing you. Tip: The pinky fingers should be next to each other. This will be your starting position. As you breathe in, start to slowly lower the arms to the side while keeping the arms extended and while rotating the wrists until the palms of the hand are facing each other. Tip: At the end of the movement the arms will be by your side with the palms facing the ceiling. As you exhale start to bring the dumbbells back up to the starting position by reversing the motion and rotating the hands so that the pinky fingers are next to each other again. Tip: Keep in mind that the movement will only happen at the shoulder joint and at the wrist. There is no motion that happens at the elbow joint. Repeat for the recommended amount of repetitions. 	f	{chest}	{shoulders}	\N	f
779	Dynamic Back Stretch	none	Stand with your feet shoulder width apart. This will be your starting position. Keeping your arms straight, swing them straight up in front of you 5-10 times, increasing the range of motion each time until your arms are above your head. 	f	{lats}	\N	\N	f
780	Standing Pelvic Tilt	none	Start off with your feet hip-distance apart. Bend your knees slightly to keep them soft and springy. You may want to move your pelvis forward and backward and back few times before holding the tailbone forward in this stretch. 	t	{"lower back"}	{glutes}	\N	f
781	External Rotation	dumbbell	Lie sideways on a flat bench with one arm holding a dumbbell and the other hand on top of the bench folded so that you can rest your head on it. Bend the elbows of the arm holding the dumbbell so that it creates a 90-degree angle between the upper arm and the forearm. Tip: Keep the arm parallel to your torso. Now bend the elbow while keeping the upper arm stationary. In this manner, the forearm will be parallel to the floor and perpendicular to your torso (Tip: So the forearm will be directly in front of you). The upper arm will be stationary by your torso and should be parallel to the floor (aligned with your torso at all times). This will be your starting position. As you breathe out, externally rotate your forearm so that the dumbbell is lifted up in a semicircle motion as you maintain the 90 degree angle bend between the upper arms and the forearm. You will continue this external rotation until the forearm is perpendicular to the floor and the torso pointing towards the ceiling. At this point you will hold the contraction for a second. As you breathe in, slowly go back to the starting position. Repeat for the recommended amount of repetitions and then switch to the other arm. 	t	{shoulders}	\N	\N	f
782	Behind Head Chest Stretch	other	Sit upright on the floor with your partner behind you. Place your hands behind your hand, and push your elbows back as far as you can. Your partner should hold your elbows. This will be your starting position. Gently attempt to pull your elbows forward with your hands still behind your head for 10 or more seconds. Your partner should prevent your elbows from moving. Now, relax your muscles and have your partner gently pull the elbows back as far as it comfortable for you. Be sure to let your partner know when the stretch is adequate to prevent overstretching or injury. 	t	{chest}	{shoulders}	\N	f
807	Smith Machine Stiff-Legged Deadlift	machine	To begin, set the bar on the smith machine to a height that is around the middle of your thighs. Once the correct height is chosen and the bar is loaded, grasp the bar using a pronated (palms forward) grip that is shoulder width apart. You may need some wrist wraps if using a significant amount of weight. Lift the bar up by fully extending your arms while keeping your back straight. Stand with your torso straight and your legs spaced using a shoulder width or narrower stance. The knees should be slightly bent. This is your starting position. Keeping the knees stationary, lower the barbell to over the top of your feet by bending at the waist while keeping your back straight. Keep moving forward as if you were going to pick something from the floor until you feel a stretch on the hamstrings. Exhale as you perform this movement Start bringing your torso up straight again as soon as you feel the hamstrings stretch by extending your hips and waist until you are back at the starting position. Inhale as you perform this movement. Repeat for the recommended amount of repetitions. 	f	{hamstrings}	{glutes,"lower back"}	\N	f
783	Calf Press On The Leg Press Machine	machine	Using a leg press machine, sit down on the machine and place your legs on the platform directly in front of you at a medium (shoulder width) foot stance. Lower the safety bars holding the weighted platform in place and press the platform all the way up until your legs are fully extended in front of you without locking your knees. (Note: In some leg press units you can leave the safety bars on for increased safety. If your leg press unit allows for this, then this is the preferred method of performing the exercise.) Your torso and the legs should make perfect 90-degree angle. Now carefully place your toes and balls of your feet on the lower portion of the platform with the heels extending off. Toes should be facing forward, outwards or inwards as described at the beginning of the chapter. This will be your starting position. Press on the platform by raising your heels as you breathe out by extending your ankles as high as possible and flexing your calf. Ensure that the knee is kept stationary at all times. There should be no bending at any time. Hold the contracted position by a second before you start to go back down. Go back slowly to the starting position as you breathe in by lowering your heels as you bend the ankles until calves are stretched. Repeat for the recommended amount of repetitions. 	t	{calves}	\N	\N	f
784	Bench Sprint	other	Stand on the ground with one foot resting on a bench or box with your heel close to the edge. Push off with your foot on top of the bench, extending through the hip and knee. Land with the opposite foot on top of the box, returning your other foot back to the start position. Continue alternating from one foot to another to complete the set. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
785	Upright Barbell Row	barbell	Grasp a barbell with an overhand grip that is slightly less than shoulder width. The bar should be resting on the top of your thighs with your arms extended and a slight bend in your elbows. Your back should also be straight. This will be your starting position. Now exhale and use the sides of your shoulders to lift the bar, raising your elbows up and to the side. Keep the bar close to your body as you raise it. Continue to lift the bar until it nearly touches your chin. Tip: Your elbows should drive the motion, and should always be higher than your forearms. Remember to keep your torso stationary and pause for a second at the top of the movement. Lower the bar back down slowly to the starting position. Inhale as you perform this portion of the movement. Repeat for the recommended amount of repetitions. 	f	{shoulders}	{traps}	\N	f
786	Lying Close-Grip Barbell Triceps Press To Chin	e-z curl bar	While holding a barbell or EZ Curl bar with a pronated grip (palms facing forward), lie on your back on a flat bench with your head off the end of the bench. Tip: If you are holding a barbell grab it using a shoulder-width grip and if you are using an E-Z Bar grab it on the inner handles. Extend your arms in front of you as you hold the barbell over your chest. The arms should be perpendicular to your torso (90-degree angle). This will be your starting position. As you inhale, lower the bar in a semi-circular motion by bending at the elbows and while keeping the upper arm stationary and elbows in. Keep lowering the bar until it lightly touches your chin. As you exhale bring the bar back up to the starting position by pushing the bar up in a semi-circular motion. Contract the triceps hard at the top of the movement for a second. Tip: Again, only the forearms should move. The upper arms should remain stationary at all times. Repeat for the recommended amount of repetitions. 	t	{triceps}	\N	\N	f
787	Prone Manual Hamstring	none	You will need a partner for this exercise. Lay face down with your legs straight. Your assistant will place their hand on your heel. To begin, flex the knee to curl your leg up. Your partner should provide resistance, starting light and increasing the pressure as the movement is completed. Communicate with your partner to monitor appropriate resistance levels. Pause at the top, returning the leg to the starting position as your partner provides resistance going the other direction. 	t	{hamstrings}	\N	\N	f
788	Hurdle Hops	other	Set up a row of hurdles or other small barriers, placing them a few feet apart. Stand in front of the first hurdle with your feet shoulder width apart. This will be your starting position. Begin by jumping with both feet over the first hurdle, swinging both arms as you jump. Absorb the impact of landing by bending the knees, rebounding out of the first leap by jumping over the next hurdle. Continue until you have jumped over all of the hurdles. 	f	{hamstrings}	{abductors,adductors,calves,glutes,hamstrings}	\N	f
789	Chest Push from 3 point stance	medicine ball	Begin in a three point stance, squatted down with your back flat and one hand on the ground. Place the medicine ball directly in front of you. To begin, take your first step as you pull the ball to your chest, positioning both hands to prepare for the throw. As you execute the second step, explosively release the ball forward as hard as possible. 	f	{chest}	{abdominals,shoulders,triceps}	\N	f
790	Plate Pinch	other	Grab two wide-rimmed plates and put them together with the smooth sides facing outward Use your fingers to grip the outside part of the plate and your thumb for the other side thus holding both plates together. This is the starting position. Squeeze the plate with your fingers and thumb. Hold this position for as long as you can. Repeat for the recommended amount of sets prescribed in your program. Switch arms and repeat the movements. 	t	{forearms}	\N	\N	f
791	Smith Machine Hang Power Clean	machine	Position the bar at knee height and load it to an appropriate weight. Take a pronated grip on the bar outside of shoulder width and unhook the bar from the machine. Your arms should be fully extended with your head and chest up. Your elbows should be pointed out with your shoulders back and down. Your hips should be back, loading the tension into the hamstrings. This will be your starting position. Initate the movement by forcefully extending the hips and knees, accelerating into the bar. Ensure that you keep your arms straight during this part of the motion. Upon full extension, rebend the hips and knees to lower your receiving position. Allow the arms to flex at this point, rotating the elbows around the bar to receive it on your shoulders. Extend through the hips and knees to come to a standing position with the bar racked on your shoulders to complete the movement. 	f	{hamstrings}	{glutes,"lower back",quadriceps,shoulders,traps}	\N	f
792	Plyo Kettlebell Pushups	kettlebells	Place a kettlebell on the floor. Place yourself in a pushup position, on your toes with one hand on the ground and one hand holding the kettlebell, with your elbows extended. This will be your starting position. Begin by lowering yourself as low as you can, keeping your back straight. Quickly and forcefully reverse direction, pushing yourself up to the other side of the kettlebell, switching hands as you do so. Continue the movement by descending and repeating the movement back and forth. 	f	{chest}	{shoulders,triceps}	\N	f
795	Underhand Cable Pulldowns	cable	Sit down on a pull-down machine with a wide bar attached to the top pulley. Adjust the knee pad of the machine to fit your height. These pads will prevent your body from being raised by the resistance attached to the bar. Grab the pull-down bar with the palms facing your torso (a supinated grip). Make sure that the hands are placed closer than the shoulder width. As you have both arms extended in front of you holding the bar at the chosen grip width, bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position. As you breathe out, pull the bar down until it touches your upper chest by drawing the shoulders and the upper arms down and back. Tip: Concentrate on squeezing the back muscles once you reach the fully contracted position and keep the elbows close to your body. The upper torso should remain stationary as your bring the bar to you and only the arms should move. The forearms should do no other work other than hold the bar. After a second on the contracted position, while breathing in, slowly bring the bar back to the starting position when your arms are fully extended and the lats are fully stretched. Repeat this motion for the prescribed amount of repetitions. 	f	{lats}	{biceps,"middle back",shoulders}	\N	f
796	Single Leg Glute Bridge	body only	Lay on the floor with your feet flat and knees bent. Raise one leg off of the ground, pulling the knee to your chest. This will be your starting position. Execute the movement by driving through the heel, extending your hip upward and raising your glutes off of the ground. Extend as far as possible, pause and then return to the starting position. 	t	{glutes}	{hamstrings}	\N	f
797	Advanced Kettlebell Windmill	kettlebells	Clean and press a kettlebell overhead with one arm. Keeping the kettlebell locked out at all times, push your butt out in the direction of the locked out kettlebell. Keep the non-working arm behind your back and turn your feet out at a forty-five degree angle from the arm with the kettlebell. Lower yourself as far as possible. Pause for a second and reverse the motion back to the starting position. 	t	{abdominals}	{glutes,hamstrings,shoulders}	\N	f
798	Kettlebell Hang Clean	kettlebells	Place kettlebell between your feet. To get in the starting position, push your butt back and look straight ahead. Clean kettlebell to your shoulder. Clean the kettlebell to your shoulders by extending through the legs and hips as you raise the kettlebell towards your shoulder. The wrist should rotate as you do so. Lower kettlebell to a hanging position between your legs while keeping the hamstrings loaded. Keep your head up at all times. 	f	{hamstrings}	{calves,glutes,"lower back",shoulders,traps}	\N	f
799	Dumbbell Step Ups	dumbbell	Stand up straight while holding a dumbbell on each hand (palms facing the side of your legs). Place the right foot on the elevated platform. Step on the platform by extending the hip and the knee of your right leg. Use the heel mainly to lift the rest of your body up and place the foot of the left leg on the platform as well. Breathe out as you execute the force required to come up. Step down with the left leg by flexing the hip and knee of the right leg as you inhale. Return to the original standing position by placing the right foot of to next to the left foot on the initial position. Repeat with the right leg for the recommended amount of repetitions and then perform with the left leg. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
800	Barbell Shrug	barbell	Stand up straight with your feet at shoulder width as you hold a barbell with both hands in front of you using a pronated grip (palms facing the thighs). Tip: Your hands should be a little wider than shoulder width apart. You can use wrist wraps for this exercise for a better grip. This will be your starting position. Raise your shoulders up as far as you can go as you breathe out and hold the contraction for a second. Tip: Refrain from trying to lift the barbell by using your biceps. Slowly return to the starting position as you breathe in. Repeat for the recommended amount of repetitions. 	t	{traps}	\N	\N	f
801	Wide-Grip Decline Barbell Bench Press	barbell	Lie back on a decline bench with the feet securely locked at the front of the bench. Using a wide, pronated (palms forward) grip that is around 3 inches away from shoulder width (for each hand), lift the bar from the rack and hold it straight over you with your arms locked. The bar will be perpendicular to the torso and the floor. This will be your starting position. As you breathe in, come down slowly until you feel the bar on your lower chest. After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your chest muscles. Lock your arms and squeeze your chest in the contracted position, hold for a second and then start coming down slowly again. Tip: It should take at least twice as long to go down than to come up. Repeat the movement for the prescribed amount of repetitions. 	f	{chest}	{shoulders,triceps}	\N	f
802	Romanian Deadlift from Deficit	barbell	Begin standing while holding a bar at arm's length in front of you. You can stand on a raised platform to increase the range of motion. Begin by flexing the knees slightly, and then flex at the hip, moving your butt back as far as possible, lowering the torso as far as flexibility allows. The back should remain in absolute extension at all times, and the bar should remain in contact with the legs. If done properly, there should be heavy tension felt in the hamstrings. Reverse the motion to return to the starting position. 	f	{hamstrings}	{forearms,glutes,"lower back",traps}	\N	f
803	Seated Bent-Over Rear Delt Raise	dumbbell	Place a couple of dumbbells looking forward in front of a flat bench. Sit on the end of the bench with your legs together and the dumbbells behind your calves. Bend at the waist while keeping the back straight in order to pick up the dumbbells. The palms of your hands should be facing each other as you pick them. This will be your starting position. Keeping your torso forward and stationary, and the arms slightly bent at the elbows, lift the dumbbells straight to the side until both arms are parallel to the floor. Exhale as you lift the weights. (Note: avoid swinging the torso or bringing the arms back as opposed to the side.) After a one second contraction at the top, slowly lower the dumbbells back to the starting position. Repeat for the recommended amount of repetitions. 	t	{shoulders}	\N	\N	f
804	Leg Pull-In	body only	Lie on an exercise mat with your legs extended and your hands either palms facing down next to you or under your glutes. Tip: My preference is with the hands next to me. This will be your starting position. Bend your knees and pull your upper thighs into your midsection as you breathe out. Continue the motion until your knees are around chest level. Contract your abs as you execute this movement and hold for a second at the top. Tip: As you perform the motion, the lower legs (calves) should always remain parallel to the floor. Return to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	f	{abdominals}	\N	\N	f
805	Kettlebell Seated Press	kettlebells	Sit on the floor and spread your legs out comfortably. Clean one kettlebell to your shoulder. Press the kettlebell up and out until it is locked out overhead. Return to the starting position. 	f	{shoulders}	{triceps}	\N	f
808	Seated Leg Curl	machine	Adjust the machine lever to fit your height and sit on the machine with your back against the back support pad. Place the back of lower leg on top of padded lever (just a few inches under the calves) and secure the lap pad against your thighs, just above the knees. Then grasp the side handles on the machine as you point your toes straight (or you can also use any of the other two stances) and ensure that the legs are fully straight right in front of you. This will be your starting position. As you exhale, pull the machine lever as far as possible to the back of your thighs by flexing at the knees. Keep your torso stationary at all times. Hold the contracted position for a second. Slowly return to the starting position as you breathe in. Repeat for the recommended amount of repetitions. 	t	{hamstrings}	\N	\N	f
809	Triceps Pushdown - V-Bar Attachment	cable	Attach a V-Bar to a high pulley and grab with an overhand grip (palms facing down) at shoulder width. Standing upright with the torso straight and a very small inclination forward, bring the upper arms close to your body and perpendicular to the floor. The forearms should be pointing up towards the pulley as they hold the bar. The thumbs should be higher than the small finger. This is your starting position. Using the triceps, bring the bar down until it touches the front of your thighs and the arms are fully extended perpendicular to the floor. The upper arms should always remain stationary next to your torso and only the forearms should move. Exhale as you perform this movement. After a second hold at the contracted position, bring the V-Bar slowly up to the starting point. Breathe in as you perform this step. Repeat for the recommended amount of repetitions. 	t	{triceps}	\N	\N	f
810	Calf-Machine Shoulder Shrug	machine	Position yourself on the calf machine so that the shoulder pads are above your shoulders. Your torso should be straight with the arms extended normally by your side. This will be your starting position. Raise your shoulders up towards your ears as you exhale and hold the contraction for a full second. Slowly return to the starting position as you inhale. Repeat for the recommended amount of repetitions. 	t	{traps}	\N	\N	f
811	Spell Caster	dumbbell	Hold a dumbbell in each hand with a pronated grip. Your feet should be wide with your hips and knees extended. This will be your starting position. Begin the movement by pulling both of the dumbbells to one side next to your hip, rotating your torso. Keeping your arms straight and the dumbbells parallel to the ground, rotate your torso to swing the weights to your opposite side. Continue alternating, rotating from one side to the other until the set is complete. 	f	{abdominals}	{glutes,shoulders}	\N	f
812	Bent Press	kettlebells	Clean a kettlebell to your shoulder. Clean the kettlebell to your shoulders by extending through the legs and hips as you raise the kettlebell towards your shoulder. The wrist should rotate as you do so. This will be your starting position. Begin my leaning to the side opposite the kettlebell, continuing until you are able to touch the ground with your free hand, keeping your eyes on the kettlebell. As you do so, press the weight vertically be extending through the elbow, keeping your arm perpendicular to the ground. Return to an upright position, with the kettlebell above your head. Return the kettlebell to the shoulder and repeat for the desired number of repetitions. 	f	{abdominals}	{glutes,hamstrings,"lower back",quadriceps,shoulders,triceps}	\N	f
813	Elbow Circles	none	Sit or stand with your feet slightly apart. Place your hands on your shoulders with your elbows at shoulder level and pointing out. Slowly make a circle with your elbows. Breathe out as you start the circle and breathe in as you complete the circle. 	t	{shoulders}	{traps}	\N	f
814	One-Arm Kettlebell Clean	kettlebells	Place a kettlebell between your feet. As you bend down to grab the kettlebell, push your butt back and keep your eyes looking forward. Clean the kettlebell to your shoulders by extending through the legs and hips as you raise the kettlebell towards your shoulder. The wrist should rotate as you do so. Return the weight to the starting position. 	f	{hamstrings}	{glutes,"lower back",shoulders,traps}	\N	f
815	Sumo Deadlift with Bands	barbell	To deadlift with short bands, simply loop them over the bar before you start, and step into them to set up. Ensure that they under the back half of your foot, directly where you are driving into the floor. Begin with a bar loaded on the ground. Approach the bar so that the bar intersects the middle of the feet. The feet should be set very wide, near the collars. Bend at the hips to grip the bar. The arms should be directly below the shoulders, inside the legs, and you can use a pronated grip, a mixed grip, or hook grip. Take a breath, and then lower your hips, looking forward with your head with your chest up. Drive through the floor, spreading your feet apart, with your weight on the back half of your feet. Extend through the hips and knees. As the bar passes through the knees, lean back and drive the hips into the bar, pulling your shoulder blades together. Return the weight to the ground by bending at the hips and controlling the weight on the way down. 	f	{hamstrings}	{adductors,forearms,glutes,"lower back","middle back",quadriceps,traps}	\N	f
816	Seated Front Deltoid	body only	Sit upright on the floor with your legs bent, your partner standing behind you. Stick your arms straight out to your sides, with your palms facing the ground. Attempt to move them as far behind you as possible, as your assistant holds your wrists. This will be your starting position. Keeping your elbows straight, attempt to move your arms to the front, with your partner gently restraining you to prevent any actual movement for 10-20 seconds. Now, relax your muscles and allow your partner to gently increase the stretch on the shoulders and chest. Hold for 10 to 20 seconds. 	f	{shoulders}	{chest}	\N	f
817	One Arm Against Wall	none	From a standing position, place a bent arm against a wall or doorway. Slowly lean toward your arm until you feel a stretch in your lats. 	t	{lats}	\N	\N	f
818	One-Arm Kettlebell Swings	kettlebells	Stand with your feet shoulder-width apart, holding a kettlebell in one hand with an overhand grip. Hinge at your hips and swing the kettlebell back between your legs, then drive your hips forward explosively to swing it up to chest height. Control the descent as the kettlebell swings back down, maintaining a strong core and neutral spine. Repeat for the desired reps, then switch arms.	f	{hamstrings}	{calves,glutes,"lower back",shoulders}	\N	f
819	Jerk Dip Squat	barbell	This movement strengthens the dip portion of the jerk. Begin with the bar racked in the jerk position, with the shoulders forward to create a shelf and the bar lightly contacting the throat. The feet should be directly under the hips, with the feet turned out as is comfortable. Keeping the torso vertical, dip by flexing the knees, allowing them to travel forward and without moving the hips to the rear. The dip should not be excessive. Return the weight to the starting position by driving forcefully though the feet. 	f	{quadriceps}	{abdominals,calves}	\N	f
820	Seated Calf Raise	machine	Sit on the machine and place your toes on the lower portion of the platform provided with the heels extending off. Choose the toe positioning of your choice (forward, in, or out) as per the beginning of this chapter. Place your lower thighs under the lever pad, which will need to be adjusted according to the height of your thighs. Now place your hands on top of the lever pad in order to prevent it from slipping forward. Lift the lever slightly by pushing your heels up and release the safety bar. This will be your starting position. Slowly lower your heels by bending at the ankles until the calves are fully stretched. Inhale as you perform this movement. Raise the heels by extending the ankles as high as possible as you contract the calves and breathe out. Hold the top contraction for a second. Repeat for the recommended amount of repetitions. 	t	{calves}	\N	\N	f
821	One-Arm Kettlebell Military Press To The Side	kettlebells	Clean a kettlebell to your shoulder. Clean the kettlebell to your shoulder by extending through the legs and hips as you pull the kettlebell towards your shoulder. Rotate your wrist as you do so, so that the palm faces inward. This will be your starting position. Look at the kettlebell and press it up and out until it is locked out overhead. Lower the kettlebell back to your shoulder under control and repeat. Make sure to contract your lat, butt, and stomach forcefully for added stability and strength. 	f	{shoulders}	{triceps}	\N	f
822	Cable Preacher Curl	cable	Place a preacher bench about 2 feet in front of a pulley machine. Attach a straight bar to the low pulley. Sit at the preacher bench with your elbow and upper arms firmly on top of the bench pad and have someone hand you the bar from the low pulley. Grab the bar and fully extend your arms on top of the preacher bench pad. This will be your starting position. Now start pilling the weight up towards your shoulders and squeeze the biceps hard at the top of the movement. Exhale as you perform this motion. Also, hold for a second at the top. Now slowly lower the weight to the starting position. Repeat for the recommended amount of repetitions. 	t	{biceps}	{forearms}	\N	f
823	Kettlebell Seesaw Press	kettlebells	Clean two kettlebells two your shoulders. Press one kettlebell. Lower the kettlebell and immediately press the other kettlebell. Make sure to do the same amount of reps on both sides. 	f	{shoulders}	{triceps}	\N	f
824	Svend Press	other	Begin in a standing position. Press two lightweight plates together with your hands. Hold the plates together close to your chest to create an isometric contraction in your chest muscles. Your fingers should be pointed forward. This is your starting position. Squeeze the plates between your palms and extend your arms directly out in front of you in a controlled motion. Pause at the top of the motion, and then slowly return to the starting position. 	f	{chest}	{forearms,shoulders,triceps}	\N	f
825	Stiff-Legged Dumbbell Deadlift	dumbbell	Grasp a couple of dumbbells holding them by your side at arm's length. Stand with your torso straight and your legs spaced using a shoulder width or narrower stance. The knees should be slightly bent. This is your starting position. Keeping the knees stationary, lower the dumbbells to over the top of your feet by bending at the waist while keeping your back straight. Keep moving forward as if you were going to pick something from the floor until you feel a stretch on the hamstrings. Exhale as you perform this movement Start bringing your torso up straight again by extending your hips and waist until you are back at the starting position. Inhale as you perform this movement. Repeat for the recommended amount of repetitions. 	f	{hamstrings}	{glutes,"lower back"}	\N	f
826	Box Skip	other	You will need several boxes lined up about 8 feet apart. Begin facing the first box with one leg slightly behind the other. Drive off the back leg, attempting to gain as much height with the hips as possible. Immediately upon landing on the box, drive the other leg forward and upward to gain height and distance, leaping from the box. Land between the first two boxes with the same leg that landed on the first box. Then, step to the next box and repeat. 	f	{hamstrings}	{abductors,adductors,calves,glutes,quadriceps}	\N	f
827	Floor Press with Chains	barbell	Adjust the j-hooks so they are at the appropriate height to rack the bar. For this exercise, drape the chains directly over the end of the bar, trying to keep the ends away from the plates. Begin lying on the floor with your head near the end of a power rack. Keeping your shoulder blades pulled together, pull the bar off of the hooks. Lower the bar towards the bottom of your chest or upper stomach, squeezing the bar and attempting to pull it apart as you do so. Ensure that you tuck your elbows throughout the movement. Lower the bar until your upper arm contacts the ground and pause, preventing any slamming or bouncing of the weight. Press the bar back up as fast as you can, keeping the bar, your wrists, and elbows in line as you do so. 	f	{triceps}	{chest,shoulders}	\N	f
828	Seated Head Harness Neck Resistance	other	Place a neck strap on the floor at the end of a flat bench. Once you have selected the weights, sit at the end of the flat bench with your feet wider than shoulder width apart from each other. Your toes should be pointed out. Slowly move your torso forward until it is almost parallel with the floor. Using both hands, securely position the neck strap around your head. Tip: Make sure the weights are still lying on the floor to prevent any strain on the neck. Now grab the weight with both hands while elevating your torso back until it is almost perpendicular to the floor. Note: Your head and torso needs to be slightly tilted forward to perform this exercise. Now place both hands on top of your knees. This is the starting position. Slowly lower your neck down until your chin touches the upper part of your chest while breathing in. While exhaling, bring your neck back to the starting position. Repeat for the recommended amount of repetitions. 	t	{neck}	\N	\N	f
829	Bent Over Low-Pulley Side Lateral	cable	Select a weight and hold the handle of the low pulley with your right hand. Bend at the waist until your torso is nearly parallel to the floor. Your legs should be slightly bent with your left hand placed on your lower left thigh. Your right arm should be hanging from your shoulder in front of you and with a slight bend at the elbow. This will be your starting position. Raise your right arm, elbow slightly bent, to the side until the arm is parallel to the floor and in line with your right ear. Breathe out as you perform this step. Slowly lower the weight back to the starting position as you breathe in. Repeat for the recommended amount of repetitions and repeat the movement with the other arm. 	t	{shoulders}	{"lower back","middle back",traps}	\N	f
859	Neck-SMR	other	Using a muscle roller or a rolling pin, place the roller behind your head and against your neck. Make sure that you do not place the roller directly against the spine, but turned slightly so that the roller is pressed against the muscles to either side of the spine. This will be your starting position. Starting at the top of your neck, slowly roll down the muscles of your neck, pausing at points of tension for 10-30 seconds. 	f	{neck}	\N	\N	f
832	Standing One-Arm Dumbbell Triceps Extension	dumbbell	To begin, stand up with a dumbbell held in one hand. Your feet should be about shoulder width apart from each other. Now fully extend the arm with the dumbbell over your head. Tip: The small finger of your hand should be facing the ceiling and the palm of your hand should be facing forward. The dumbbell should be above your head. This will be your starting position. Keeping your upper arm close to your head (elbows in) and perpendicular to the floor, lower the resistance in a semicircular motion behind your head until your forearm touch your bicep. Tip: The upper arm should remain stationary and only the forearm should move. Breathe in as you perform this step. Go back to the starting position by using the triceps to raise the dumbbell. Breathe out as you perform this step. Repeat for the recommended amount of repetitions. Switch arms and repeat the exercise. 	t	{triceps}	{chest,shoulders}	\N	f
833	Jackknife Sit-Up	body only	Lie flat on the floor (or exercise mat) on your back with your arms extended straight back behind your head and your legs extended also. This will be your starting position. As you exhale, bend at the waist while simultaneously raising your legs and arms to meet in a jackknife position. Tip: The legs should be extended and lifted at approximately a 35-45 degree angle from the floor and the arms should be extended and parallel to your legs. The upper torso should be off the floor. While inhaling, lower your arms and legs back to the starting position. Repeat for the recommended amount of repetitions. 	f	{abdominals}	\N	\N	f
834	Sandbag Load	other	To load sandbags or other objects, begin with the implements placed a distance from the loading platform, typically 50 feet. Begin by lifting the sandbag. Sandbags are extremely awkward, and the manner of lifting them can vary depending on the particular sandbag used. Reach as far around it as possible, extending through the hips and knees to pull it up high. Shouldering is usually not allowed. Move as quickly as possible to the platform, and load it, extending through your hips, knees, and ankles to get it as high as possible. Place it onto the platform, ensuring it doesn't fall off. Return to the starting position to retrieve the next sandbag, and repeat until the event is completed. 	f	{quadriceps}	{abdominals,biceps,calves,forearms,glutes,hamstrings,"lower back","middle back",shoulders,traps}	\N	f
835	Dumbbell Floor Press	dumbbell	Lay on the floor holding dumbbells in your hands. Your knees can be bent. Begin with the weights fully extended above you. Lower the weights until your upper arm comes in contact with the floor. You can tuck your elbows to emphasize triceps size and strength, or to focus on your chest angle your arms to the side. Pause at the bottom, and then bring the weight together at the top by extending through the elbows. 	f	{triceps}	{chest,shoulders}	\N	f
836	Spinal Stretch	none	Sit in a chair so your back is straight and your feet planted on the floor. Interlace your fingers behind your head, elbows out and your chin down. Twist your upper body to one side about 3 times as far as you can. Then lean forward and twist your torso to reach your elbow to the floor on the inside of your knee. Return to upright position and then repeat for your other side. 	t	{"middle back"}	{lats,"lower back",neck,traps}	\N	f
837	Standing Hamstring and Calf Stretch	other	Being by looping a belt, band, or rope around one foot. While standing, place that foot forward. Bend your back leg, while keeping the front one straight. Now raise the toes of your front foot off of the ground and lean forward. Using the belt, pull on the top of the foot to increase the stretch in the calf. Hold for 10-20 seconds and repeat with the other foot. 	f	{hamstrings}	\N	\N	f
838	Standing Concentration Curl	dumbbell	Taking a dumbbell in your working hand, lean forward. Allow your working arm to hang perpendicular to the ground with the elbow pointing out. This will be your starting position. Flex the elbow to curl the weight, keeping the upper arm stationary. At the top of the repetition, flex the biceps and pause. Lower the dumbbell back to the starting position. Repeat the movement for the prescribed amount of repetitions. 	t	{biceps}	{forearms}	\N	f
839	Bent Over One-Arm Long Bar Row	barbell	Put weight on one of the ends of an Olympic barbell. Make sure that you either place the other end of the barbell in the corner of two walls; or put a heavy object on the ground so the barbell cannot slide backward. Bend forward until your torso is as close to parallel with the floor as you can and keep your knees slightly bent. Now grab the bar with one arm just behind the plates on the side where the weight was placed and put your other hand on your knee. This will be your starting position. Pull the bar straight up with your elbow in (to maximize back stimulation) until the plates touch your lower chest. Squeeze the back muscles as you lift the weight up and hold for a second at the top of the movement. Breathe out as you lift the weight. Tip: Do not allow for any swinging of the torso. Only the arm should move. Slowly lower the bar to the starting position getting a nice stretch on the lats. Tip: Do not let the plates touch the floor. To ensure the best range of motion, I recommend using small plates (25-lb ones) as opposed to larger plates (like 35-45lb ones). Repeat for the recommended amount of repetitions and switch arms. 	f	{"middle back"}	{biceps,lats,"lower back",traps}	\N	f
840	Standing Dumbbell Upright Row	dumbbell	Grasp a dumbbell in each hand with a pronated (palms forward) grip that is slightly less than shoulder width. The dumbbells should be resting on top of your thighs. Your arms should be extended with a slight bend at the elbows and your back should be straight. This will be your starting position. Use your side shoulders to lift the dumbbells as you exhale. The dumbbells should be close to the body as you move it up and the elbows should drive the motion. Continue to lift them until they nearly touch your chin. Tip: Your elbows should drive the motion. As you lift the dumbbells, your elbows should always be higher than your forearms. Also, keep your torso stationary and pause for a second at the top of the movement. Lower the dumbbells back down slowly to the starting position. Inhale as you perform this portion of the movement. Repeat for the recommended amount of repetitions. 	f	{traps}	{biceps,shoulders}	\N	f
841	Frog Sit-Ups	body only	Lie with your back flat on the floor (or exercise mat) and your legs extended in front of you. Now bend at the knees and place your outer thighs by the floor (or mat) as you make the soles of your feet touch each other. Now try pushing both soles and bringing them up as near you as possible while you keep the outer thighs on the floor (or at least almost touching it). Tip: In this position your legs should create a diamond shape. Now, cross your arms in front of you by touching the opposite shoulders. This will be your starting position. As you exhale flatten your lower back to the floor while curling the torso upwards. Tip: This will be like performing the first 1/4 movement of a sit up. Hold at the top position for a second. As you inhale, slowly lower back to the starting position. Repeat for the recommended amount of repetitions. 	t	{abdominals}	\N	\N	f
843	Glute Kickback	body only	Kneel on the floor or an exercise mat and bend at the waist with your arms extended in front of you (perpendicular to the torso) in order to get into a kneeling push-up position but with the arms spaced at shoulder width. Your head should be looking forward and the bend of the knees should create a 90-degree angle between the hamstrings and the calves. This will be your starting position. As you exhale, lift up your right leg until the hamstrings are in line with the back while maintaining the 90-degree angle bend. Contract the glutes throughout this movement and hold the contraction at the top for a second. Tip: At the end of the movement the upper leg should be parallel to the floor while the calf should be perpendicular to it. Go back to the initial position as you inhale and now repeat with the left leg. Continue to alternate legs until all of the recommended repetitions have been performed. 	f	{glutes}	{hamstrings}	\N	f
844	Prowler Sprint	other	Place your sled on an appropriate surface, loaded to a suitable weight. The sled should provide enough resistance to require effort, but not so heavy that you are significantly slowed down. You may use the upright or the low handles for this exercise. Place your hands on the handles with your arms extended, leaning into the implement. With good posture, drive through the ground with alternating, short steps. Move as fast as you can for a short distance. 	f	{hamstrings}	{calves,chest,glutes,quadriceps,shoulders}	\N	f
845	Scissors Jump	body only	Assume a lunge stance position with one foot forward with the knee bent, and the rear knee nearly touching the ground. Ensure that the front knee is over the midline of the foot. Extending through both legs, jump as high as possible, swinging your arms to gain lift. As you jump as high as you can, switch the position of your legs, moving your front leg to the back and the rear leg to the front. As you land, absorb the impact through the legs by adopting the lunge position, and repeat. 	f	{quadriceps}	{glutes,hamstrings}	\N	f
846	Step Mill	machine	To begin, step onto the stepmill and select the desired option from the menu. You can choose a manual setting, or you can select a program to run. Typically, you can enter your age and weight to estimate the amount of calories burned during exercise. Use caution so that you don't trip as you climb the stairs. It is recommended that you maintain your grip on the handles so that you don't fall. Stepmills offer convenience, cardiovascular benefits, and usually have less impact than running outside while offering a similar rate of calories burned. They are typically much harder than other cardio equipment. A 150 lb person will typically burn over 300 calories in 30 minutes, compared to about 175 calories walking. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
847	Squat with Plate Movers	barbell	To begin, first set the bar on a rack to just below shoulder level. Position a weight plate on the ground a couple feet back from the rack. Once the bar is loaded, step under it and place the back of your shoulders across it. Hold on to the bar with both hands and lift it off the rack by first pushing with your legs and at the same time straighten your torso. Step away from the rack and adopt a wide stance with the toes slightly pointed out, with one foot on the weight plate. Keep your head up at all times. This will be your starting position. Begin to slowly lower the bar by bending the knees and hips. Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees. Raise the bar as you exhale by pushing the floor with the heels of your feet as you extend the hips and knees. At the top of the movement, side step, bringing your feet together on the opposite side of the plate. Using your inside foot, push the weight plate, sliding it across the floor to where you were just standing. Place your inside foot on the weight plate, adopting a wide stance for the next repetition. 	f	{quadriceps}	{abductors,adductors,calves,glutes,hamstrings}	\N	f
848	Seated Palm-Up Barbell Wrist Curl	barbell	Hold a barbell with both hands and your palms facing up; hands spaced about shoulder width. Place your feet flat on the floor, at a distance that is slightly wider than shoulder width apart. Lean forward and place your forearms on top of your upper thighs with your palms up. Tip: Make sure that the front of the wrists lay on top of your knees. This will be your starting position. Lower the bar as far as possible while inhaling and keeping a tight grip. Now curl bar up as high as possible while flexing the forearms and exhaling. Hold the contraction at the top for a second and Tip: Only the wrist should move. 	t	{forearms}	\N	\N	f
849	Standing One-Arm Cable Curl	cable	Start out by grabbing single handle next to the low pulley machine. Make sure you are far enough from the machine so that your arm is supporting the weight. Make sure that your upper arm is stationary, perpendicular to the floor with elbows in and palms facing forward. Your non lifting arm should be grabbing your waist. This will allow you to keep your balance. Slowly begin to curl the single handle upwards while keeping the upper arm stationary until your forearm touches your bicep while exhaling. Tip: Only the forearm should move. Hold the contraction position as you squeeze the bicep and then lower the single handle back down to the starting position as you inhale. Repeat for the recommended amount of repetitions. Switch arms while performing this exercise. 	t	{biceps}	\N	\N	f
850	Barbell Ab Rollout - On Knees	barbell	Hold an Olympic barbell loaded with 5-10lbs on each side and kneel on the floor. Now place the barbell on the floor in front of you so that you are on all your hands and knees (as in a kneeling push up position). This will be your starting position. Slowly roll the barbell straight forward, stretching your body into a straight position. Tip: Go down as far as you can without touching the floor with your body. Breathe in during this portion of the movement. After a second pause at the stretched position, start pulling yourself back to the starting position as you breathe out. Tip: Go slowly and keep your abs tight at all times. 	f	{abdominals}	{"lower back",shoulders}	\N	f
851	Alternating Kettlebell Press	kettlebells	Clean two kettlebells to your shoulders. Clean the kettlebells to your shoulders by extending through the legs and hips as you pull the kettlebells towards your shoulders. Rotate your wrists as you do so. Press one directly overhead by extending through the elbow, turning it so the palm faces forward while holding the other kettlebell stationary . Lower the pressed kettlebell to the starting position and immediately press with your other arm. 	f	{shoulders}	{triceps}	\N	f
852	Push-Ups With Feet Elevated	body only	Lie on the floor face down and place your hands about 36 inches apart from each other holding your torso up at arms length. Place your toes on top of a flat bench. This will allow your body to be elevated. Note: The higher the elevation of the flat bench, the higher the resistance of the exercise is. Lower yourself until your chest almost touches the floor as you inhale. Using your pectoral muscles, press your upper body back up to the starting position and squeeze your chest. Breathe out as you perform this step. After a second pause at the contracted position, repeat the movement for the prescribed amount of repetitions. 	f	{chest}	{shoulders,triceps}	\N	f
853	Hack Squat	machine	Place the back of your torso against the back pad of the machine and hook your shoulders under the shoulder pads provided. Position your legs in the platform using a shoulder width medium stance with the toes slightly pointed out. Tip: Keep your head up at all times and also maintain the back on the pad at all times. Place your arms on the side handles of the machine and disengage the safety bars (which on most designs is done by moving the side handles from a facing front position to a diagonal position). Now straighten your legs without locking the knees. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances described in the foot positioning section). Begin to slowly lower the unit by bending the knees as you maintain a straight posture with the head up (back on the pad at all times). Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees (which is the point in which the upper legs are below parallel to the floor). Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly. Begin to raise the unit as you exhale by pushing the floor with mainly with the heel of your foot as you straighten the legs again and go back to the starting position. Repeat for the recommended amount of repetitions. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
854	Standing Hip Circles	body only	Begin standing on one leg, holding to a vertical support. Raise the unsupported knee to 90 degrees. This will be your starting position. Open the hip as far as possible, attempting to make a big circle with your knee. Perform this movement slowly for a number of repetitions, and repeat on the other side. 	t	{abductors}	{adductors}	\N	f
855	Zercher Squats	barbell	This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack that best matches your height. The correct height should be anywhere above the waist but below the chest. Once the correct height is chosen and the bar is loaded, lock your hands together and place the bar on top of your arms in between the forearm and upper arm. Lift the bar up so that it is resting on top of your forearms. If you are holding the bar properly, it should look as if you have your arms crossed but with a bar running across them. Step away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times as looking down will get you off balance and also maintain a straight back. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances discussed in the foot stances section). Begin to lower the bar by bending the knees as you maintain a straight posture with the head up. Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees (which is the point in which the upper legs are below parallel to the floor). Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly. Begin to raise the bar as you exhale by pushing the floor with the ball of your foot mainly as you straighten the legs again and go back to the starting position. Repeat for the recommended amount of repetitions. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
856	Walking, Treadmill	machine	To begin, step onto the treadmill and select the desired option from the menu. Most treadmills have a manual setting, or you can select a program to run. Typically, you can enter your age and weight to estimate the amount of calories burned during exercise. Elevation can be adjusted to change the intensity of the workout. Treadmills offer convenience, cardiovascular benefits, and usually have less impact than walking outside. When walking, you should move at a moderate to fast pace, not a leisurely one. Being an activity of lower intensity, walking doesn't burn as many calories as some other activities, but still provides great benefit. A 150 lb person will burn about 175 calories walking 4 miles per hour for 30 minutes, compared to 450 calories running twice as fast. Maintain proper posture as you walk, and only hold onto the handles when necessary, such as when dismounting or checking your heart rate. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
857	Barbell Lunge	barbell	This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack just below shoulder level. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it. Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso. Step away from the rack and step forward with your right leg and squat down through your hips, while keeping the torso upright and maintaining balance. Inhale as you go down. Note: Do not allow your knee to go forward beyond your toes as you come down, as this will put undue stress on the knee joint. li> Using mainly the heel of your foot, push up and go back to the starting position as you exhale. Repeat the movement for the recommended amount of repetitions and then perform with the left leg. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
858	Lying Machine Squat	machine	Adjust the leg machine to a height that will allow you to get inside it with your knees bent and the thighs slightly below parallel. Once you select the weight, position yourself inside the machine face up with the knees bent and thighs slightly below parallel to the platform. Make sure that the knees do not go past the toes. The angle created between the hamstrings and the calves should be one that is slightly less than 90 degrees (since your starting position requires you to start slightly below parallel). Your back and your head should be resting on the machine while your shoulders are pressed under the shoulder pads. Place your hands by the handles and position your feet slightly pointing out at a shoulder width position. This will be your starting position. While pressing with the balls of the feet as you breathe out, make your whole body erect as you squeeze the quads. Hold the contracted position for a second. Tip: Since you are starting below parallel, you can opt to use your hands to help you up by pressing on your thighs only on the first repetition. Slowly squat down as you inhale but instead of going all the way down to the starting position, just stop once your thighs are parallel to the platform. The angle between your hamstrings and calves should be a 90-degree angle. Repeat for the recommended amount of repetitions. 	f	{quadriceps}	{calves,glutes,hamstrings}	\N	f
862	Incline Cable Chest Press	cable	Adjust the weight to an appropriate amount and be seated, grasping the handles. Your upper arms should be about 45 degrees to the body, with your head and chest up. The elbows should be bent to about 90 degrees. This will be your starting position. Begin by extending through the elbow, pressing the handles together straight in front of you. Keep your shoulder blades retracted as you execute the movement. After pausing at full extension, return to the starting position, keeping tension on the cables. 	f	{chest}	{shoulders,triceps}	\N	f
863	Hang Clean	barbell	Begin with a shoulder width, double overhand or hook grip, with the bar hanging at the mid thigh position. Your back should be straight and inclined slightly forward. Begin by aggressively extending through the hips, knees and ankles, driving the weight upward. As you do so, shrug your shoulders towards your ears. Immediately recover by driving through the heels, keeping the torso upright and elbows up. Continue until you have risen to a standing position. 	f	{quadriceps}	{calves,forearms,glutes,hamstrings,"lower back",shoulders,traps}	\N	f
864	Dumbbell Incline Shoulder Raise	dumbbell	Sit on an Incline Bench while holding a dumbbell on each hand on top of your thighs. Lift your legs up to kick the weights to your shoulders and lean back. Position the dumbbells above your shoulders with your arms extended. The arms should be perpendicular to the floor with your palms facing forward and knuckles pointing towards the ceiling. This will be your starting position. While keeping the arms straight and locked, lift the dumbbells by raising the shoulders from the bench as you breathe out. Bring back the dumbbells to the starting position as you breathe in. Repeat for the recommended amount of repetitions. 	t	{shoulders}	{triceps}	\N	f
865	Alternating Renegade Row	kettlebells	Place two kettlebells on the floor about shoulder width apart. Position yourself on your toes and your hands as though you were doing a pushup, with the body straight and extended. Use the handles of the kettlebells to support your upper body. You may need to position your feet wide for support. Push one kettlebell into the floor and row the other kettlebell, retracting the shoulder blade of the working side as you flex the elbow, pulling it to your side. Then lower the kettlebell to the floor and begin the kettlebell in the opposite hand. Repeat for several reps. 	f	{"middle back"}	{abdominals,biceps,chest,lats,triceps}	\N	f
866	Reverse Machine Flyes	machine	Adjust the handles so that they are fully to the rear. Make an appropriate weight selection and adjust the seat height so the handles are at shoulder level. Grasp the handles with your hands facing inwards. This will be your starting position. In a semicircular motion, pull your hands out to your side and back, contracting your rear delts. Keep your arms slightly bent throughout the movement, with all of the motion occurring at the shoulder joint. Pause at the rear of the movement, and slowly return the weight to the starting position. 	t	{shoulders}	\N	\N	f
867	Barbell Ab Rollout	barbell	For this exercise you will need to get into a pushup position, but instead of having your hands of the floor, you will be grabbing on to an Olympic barbell (loaded with 5-10 lbs on each side) instead. This will be your starting position. While keeping a slight arch on your back, lift your hips and roll the barbell towards your feet as you exhale. Tip: As you perform the movement, your glutes should be coming up, you should be keeping the abs tight and should maintain your back posture at all times. Also your arms should be staying perpendicular to the floor throughout the movement. If you don't, you will work out your shoulders and back more than the abs. After a second contraction at the top, start to roll the barbell back forward to the starting position slowly as you inhale. Repeat for the recommended amount of repetitions. 	f	{abdominals}	{"lower back",shoulders}	\N	f
868	Dumbbell Tricep Extension -Pronated Grip	dumbbell	Lie down on a flat bench holding two dumbbells directly above your shoulders. Your arms should be fully extended and form a 90 degree angle from your torso and the floor. The palms of your hands should be facing forward, and your elbows should be tucked in. This will be your starting position. Now, inhale and slowly lower the dumbbells until they are near your ears. Be sure to keep your upper arms stationary and your elbows tucked in. Then, exhale and use your triceps to return the weight to the starting position. 	t	{triceps}	\N	\N	f
869	Foot-SMR	other	This exercise stretches the fascia of the muscles in the feet. Start off seated with your shoes removed. Using a foot roller or a similar object, such as a small section of pvc pipe, place your foot against the roller across the arch of your foot. This will be your starting position. Press down firmly, rolling across the arch of your foot. Hold for 10-30 seconds, and then switch feet. 	f	{calves}	\N	\N	f
870	Overhead Triceps	body only	Sit upright on the floor with your partner behind you. Raise one arm straight up, and flex the elbow, attempting to touch your hand to your back. Your parner should hold your elbow and wrist. This will be your starting position. Attempt to extend the arm straight into the air as your partner prevents you from doing actually doing so. After 10-20 seconds, relax the arm and allow your partner to further stretch the tricep by applying gentle pressure to the wrist. Hold for 10-20 seconds, and then switch sides. 	f	{triceps}	{lats}	\N	f
871	Rowing, Stationary	machine	To begin, seat yourself on the rower. Make sure that your heels are resting comfortably against the base of the foot pedals and that the straps are secured. Select the program that you wish to use, if applicable. Sit up straight and bend forward at the hips. There are three phases of movement when using a rower. The first phase is when you come forward on the rower. Your knees are bent and against your chest. Your upper body is leaning slightly forward while still maintaining good posture. Next, push against the foot pedals and extend your legs while bringing your hands to your upper abdominal area, squeezing your shoulders back as you do so. To avoid straining your back, use primarily your leg and hip muscles. The recovery phase simply involves straightening your arms, bending the knees, and bringing your body forward again as you transition back into the first phase. 	f	{quadriceps}	{biceps,calves,glutes,hamstrings,"lower back","middle back"}	\N	f
872	V-Bar Pullup	body only	Start by placing the middle of the V-bar in the middle of the pull-up bar (assuming that the pull-up station you are using does not have neutral grip handles). The V-Bar handles will be facing down so that you can hang from the pull-up bar through the use of the handles. Once you securely place the V-bar, take a hold of the bar from each side and hang from it. Stick your chest out and lean yourself back slightly in order to better engage the lats. This will be your starting position. Using your lats, pull your torso up while leaning your head back slightly so that you do not hit yourself with the chin-up bar. Continue until your chest nearly touches the V-bar. Exhale as you execute this motion. After a second hold on the contracted position, slowly lower your body back to the starting position as you breathe in. Repeat for the prescribed number of repetitions. 	f	{lats}	{biceps,"middle back",shoulders}	\N	f
\.


--
-- Data for Name: family; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.family (id, family_name, family_admin, created_at) FROM stdin;
5	testFamily3	53	2025-04-07 20:54:31.662417
7	testFamily2	53	2025-04-08 13:49:26.359557
8	MyFamily	54	2025-04-09 18:53:13.696497
9	testFamily	51	2025-04-14 19:04:25.760313
\.


--
-- Data for Name: family_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.family_members (family_id, user_id, joined_at) FROM stdin;
5	53	2025-04-07 20:54:31.662417
7	53	2025-04-08 13:49:26.359557
8	54	2025-04-09 18:53:13.696497
9	51	2025-04-14 19:04:25.760313
9	53	2025-04-15 18:19:39.254504
\.


--
-- Data for Name: family_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.family_requests (id, family_id, sender_id, receiver_id, status, created_at) FROM stdin;
7	5	53	51	t	2025-04-07 20:58:29.162723
9	7	53	51	t	2025-04-08 13:49:35.120737
10	8	54	51	t	2025-04-09 18:53:26.236873
\.


--
-- Data for Name: motivational_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.motivational_messages (id, message, category) FROM stdin;
\.


--
-- Data for Name: predictive_exercise; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.predictive_exercise (predictive_id, exercise_id) FROM stdin;
\.


--
-- Data for Name: predictiveanalysis; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.predictiveanalysis (id, user_id, predictive, predictive_value, confidence, updated_at) FROM stdin;
\.


--
-- Data for Name: step_goals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.step_goals (id, user_id, goal_type, created_at, achieve_by, achieved, achieved_at, notes, target_steps) FROM stdin;
\.


--
-- Data for Name: strength_goals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.strength_goals (id, user_id, goal_type, created_at, achieve_by, achieved, achieved_at, notes, target_weight, target_reps, target_exercise) FROM stdin;
3	51	strength	2025-04-12 18:41:13.24599	2025-11-23	f	\N	\N	225.00	1	273
\.


--
-- Data for Name: user_engagement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_engagement (id, user_id, last_login, day_streak, last_workout) FROM stdin;
1	1	2025-04-11 15:14:02.871319	61	\N
2	1	2025-04-11 15:26:16.895712	62	\N
3	1	2025-04-11 18:11:49.698854	53	\N
4	1	2025-04-12 19:30:24.695407	51	\N
5	1	2025-04-12 19:30:54.023993	51	\N
6	1	2025-04-12 19:47:13.859427	51	\N
7	1	2025-04-13 14:30:08.972978	51	\N
8	1	2025-04-13 14:40:51.784133	51	\N
9	1	2025-04-13 14:46:21.26259	51	\N
10	1	2025-04-13 16:51:28.033469	51	\N
11	1	2025-04-14 13:49:28.586144	51	\N
12	1	2025-04-14 18:00:12.588496	51	\N
13	1	2025-04-14 19:04:06.859426	51	\N
14	1	2025-04-14 19:09:20.038864	51	\N
15	1	2025-04-14 19:09:26.413321	51	\N
16	1	2025-04-14 19:32:48.149986	51	\N
17	1	2025-04-14 19:48:06.176257	51	\N
18	1	2025-04-14 19:52:07.33774	51	\N
19	1	2025-04-14 19:56:27.708882	51	\N
20	1	2025-04-14 19:58:38.803742	51	\N
21	1	2025-04-14 20:01:31.496324	51	\N
22	1	2025-04-14 20:16:51.938771	51	\N
23	1	2025-04-14 20:24:56.853468	51	\N
24	1	2025-04-14 20:39:08.948767	51	\N
25	1	2025-04-14 20:41:46.09534	51	\N
26	1	2025-04-14 21:06:06.882115	51	\N
27	1	2025-04-15 18:47:18.139538	51	\N
28	1	2025-04-15 19:07:25.155938	51	\N
29	1	2025-04-15 19:13:20.962095	51	\N
30	1	2025-04-15 19:18:47.953359	51	\N
31	1	2025-04-15 19:33:52.567194	51	\N
32	1	2025-04-16 17:24:30.879527	51	\N
33	1	2025-04-16 17:48:36.942464	51	\N
34	1	2025-04-16 17:58:24.053306	51	\N
35	1	2025-04-16 18:06:56.905725	51	\N
36	1	2025-04-16 18:16:36.546741	51	\N
37	1	2025-04-16 18:19:03.58586	51	\N
38	1	2025-04-16 18:22:20.953181	51	\N
39	1	2025-04-16 18:40:02.234309	51	\N
40	1	2025-04-17 18:30:22.967694	51	\N
41	1	2025-04-17 18:57:32.180511	51	\N
42	1	2025-04-17 18:59:30.425319	51	\N
43	1	2025-04-17 19:10:05.955511	51	\N
44	1	2025-04-17 19:12:14.734042	53	\N
45	1	2025-04-17 19:13:58.355082	53	\N
46	1	2025-04-17 19:15:49.331055	51	\N
47	1	2025-04-18 19:48:54.246089	53	\N
48	1	2025-04-18 23:24:29.326347	53	\N
49	1	2025-04-18 23:29:22.626484	53	\N
50	1	2025-04-18 23:30:50.215315	53	\N
51	1	2025-04-19 00:11:18.093156	53	\N
52	1	2025-04-19 00:17:20.15461	53	\N
53	1	2025-04-19 00:21:38.142511	53	\N
54	1	2025-04-19 00:22:51.099757	53	\N
55	1	2025-04-19 00:26:23.968559	53	\N
56	1	2025-04-19 00:27:22.207302	53	\N
57	1	2025-04-19 00:33:36.962067	53	\N
58	1	2025-04-19 00:41:16.455443	53	\N
59	1	2025-04-19 00:45:54.700651	53	\N
60	1	2025-04-19 00:49:54.390899	53	\N
61	1	2025-04-19 00:51:09.560021	53	\N
62	1	2025-04-19 00:51:51.10807	53	\N
63	1	2025-04-19 00:56:55.833541	53	\N
64	1	2025-04-19 01:31:37.624518	51	\N
65	1	2025-04-19 01:34:08.884884	51	\N
\.


--
-- Data for Name: user_exercise_max; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_exercise_max (id, user_id, exercise_id, calculated_1rm, weight_actual, reps_actual, date_performed) FROM stdin;
1	1	3	172.36	140.00	8	2025-03-23 19:32:15.889536
2	1	5	172.36	140.00	8	2025-03-23 19:32:15.897364
3	1	8	172.36	140.00	8	2025-03-23 19:32:15.903651
4	1	3	172.36	140.00	8	2025-03-23 19:45:53.689423
5	1	5	172.36	140.00	8	2025-03-23 19:45:53.697363
6	1	8	172.36	140.00	8	2025-03-23 19:45:53.702796
7	1	5	172.36	140.00	8	2025-03-23 19:45:53.70735
8	2	3	172.36	140.00	8	2025-03-23 19:45:53.743006
9	2	5	172.36	140.00	8	2025-03-23 19:45:53.748653
10	2	8	172.36	140.00	8	2025-03-23 19:45:53.754168
11	2	5	172.36	140.00	8	2025-03-23 19:45:53.758697
12	3	3	172.36	140.00	8	2025-03-23 19:45:53.792786
13	3	5	172.36	140.00	8	2025-03-23 19:45:53.799452
14	3	8	172.36	140.00	8	2025-03-23 19:45:53.805245
15	3	5	172.36	140.00	8	2025-03-23 19:45:53.810511
16	4	3	172.36	140.00	8	2025-03-23 19:45:53.84583
17	4	5	172.36	140.00	8	2025-03-23 19:45:53.851227
18	4	8	172.36	140.00	8	2025-03-23 19:45:53.855498
19	4	5	172.36	140.00	8	2025-03-23 19:45:53.860909
20	5	3	172.36	140.00	8	2025-03-23 19:45:53.895735
21	5	5	172.36	140.00	8	2025-03-23 19:45:53.901119
22	5	8	172.36	140.00	8	2025-03-23 19:45:53.906234
23	5	5	172.36	140.00	8	2025-03-23 19:45:53.911222
24	6	3	172.36	140.00	8	2025-03-23 19:45:53.9507
25	6	5	172.36	140.00	8	2025-03-23 19:45:53.955548
26	6	8	172.36	140.00	8	2025-03-23 19:45:53.960006
27	6	5	172.36	140.00	8	2025-03-23 19:45:53.964458
28	7	3	172.36	140.00	8	2025-03-23 19:45:53.99796
29	7	5	172.36	140.00	8	2025-03-23 19:45:54.003655
30	7	8	172.36	140.00	8	2025-03-23 19:45:54.009258
31	7	5	172.36	140.00	8	2025-03-23 19:45:54.014864
32	8	3	172.36	140.00	8	2025-03-23 19:45:54.107308
33	8	5	172.36	140.00	8	2025-03-23 19:45:54.112494
34	8	8	172.36	140.00	8	2025-03-23 19:45:54.117213
35	8	5	172.36	140.00	8	2025-03-23 19:45:54.123269
36	9	3	172.36	140.00	8	2025-03-23 19:45:54.160156
37	9	5	172.36	140.00	8	2025-03-23 19:45:54.165311
38	9	8	172.36	140.00	8	2025-03-23 19:45:54.170809
39	9	5	172.36	140.00	8	2025-03-23 19:45:54.176177
40	10	3	172.36	140.00	8	2025-03-23 19:45:54.209648
41	10	5	172.36	140.00	8	2025-03-23 19:45:54.215578
42	10	8	172.36	140.00	8	2025-03-23 19:45:54.220861
43	10	5	172.36	140.00	8	2025-03-23 19:45:54.225656
44	11	3	172.36	140.00	8	2025-03-23 19:45:54.26175
45	11	5	172.36	140.00	8	2025-03-23 19:45:54.266709
46	11	8	172.36	140.00	8	2025-03-23 19:45:54.271655
47	11	5	172.36	140.00	8	2025-03-23 19:45:54.276073
48	12	3	172.36	140.00	8	2025-03-23 19:45:54.311197
49	12	5	172.36	140.00	8	2025-03-23 19:45:54.316965
50	12	8	172.36	140.00	8	2025-03-23 19:45:54.321627
51	12	5	172.36	140.00	8	2025-03-23 19:45:54.327153
52	13	3	172.36	140.00	8	2025-03-23 19:45:54.360911
53	13	5	172.36	140.00	8	2025-03-23 19:45:54.365645
54	13	8	172.36	140.00	8	2025-03-23 19:45:54.370307
55	13	5	172.36	140.00	8	2025-03-23 19:45:54.376022
56	14	3	172.36	140.00	8	2025-03-23 19:45:54.413003
57	14	5	172.36	140.00	8	2025-03-23 19:45:54.419403
58	14	8	172.36	140.00	8	2025-03-23 19:45:54.424463
59	14	5	172.36	140.00	8	2025-03-23 19:45:54.429467
60	15	3	172.36	140.00	8	2025-03-23 19:45:54.464281
61	15	5	172.36	140.00	8	2025-03-23 19:45:54.469446
62	15	8	172.36	140.00	8	2025-03-23 19:45:54.4745
63	15	5	172.36	140.00	8	2025-03-23 19:45:54.478789
64	16	3	172.36	140.00	8	2025-03-23 19:45:54.510513
65	16	5	172.36	140.00	8	2025-03-23 19:45:54.515878
66	16	8	172.36	140.00	8	2025-03-23 19:45:54.520304
67	16	5	172.36	140.00	8	2025-03-23 19:45:54.524687
68	17	3	172.36	140.00	8	2025-03-23 19:45:54.557527
69	17	5	172.36	140.00	8	2025-03-23 19:45:54.563538
70	17	8	172.36	140.00	8	2025-03-23 19:45:54.568185
71	17	5	172.36	140.00	8	2025-03-23 19:45:54.572714
72	18	3	172.36	140.00	8	2025-03-23 19:45:54.606551
73	18	5	172.36	140.00	8	2025-03-23 19:45:54.61165
74	18	8	172.36	140.00	8	2025-03-23 19:45:54.616096
75	18	5	172.36	140.00	8	2025-03-23 19:45:54.621062
76	19	3	172.36	140.00	8	2025-03-23 19:45:54.656405
77	19	5	172.36	140.00	8	2025-03-23 19:45:54.661972
78	19	8	172.36	140.00	8	2025-03-23 19:45:54.666897
79	19	5	172.36	140.00	8	2025-03-23 19:45:54.672344
80	20	3	172.36	140.00	8	2025-03-23 19:45:54.705519
81	20	5	172.36	140.00	8	2025-03-23 19:45:54.710856
82	20	8	172.36	140.00	8	2025-03-23 19:45:54.716515
83	20	5	172.36	140.00	8	2025-03-23 19:45:54.72125
84	21	3	172.36	140.00	8	2025-03-23 19:45:54.753254
85	21	5	172.36	140.00	8	2025-03-23 19:45:54.758594
86	21	8	172.36	140.00	8	2025-03-23 19:45:54.764131
87	21	5	172.36	140.00	8	2025-03-23 19:45:54.768698
88	22	3	172.36	140.00	8	2025-03-23 19:45:54.79921
89	22	5	172.36	140.00	8	2025-03-23 19:45:54.804303
90	22	8	172.36	140.00	8	2025-03-23 19:45:54.809558
91	22	5	172.36	140.00	8	2025-03-23 19:45:54.814089
92	23	3	172.36	140.00	8	2025-03-23 19:45:54.847409
93	23	5	172.36	140.00	8	2025-03-23 19:45:54.852601
94	23	8	172.36	140.00	8	2025-03-23 19:45:54.858631
95	23	5	172.36	140.00	8	2025-03-23 19:45:54.863465
96	24	3	172.36	140.00	8	2025-03-23 19:45:54.898667
97	24	5	172.36	140.00	8	2025-03-23 19:45:54.905187
98	24	8	172.36	140.00	8	2025-03-23 19:45:54.909872
99	24	5	172.36	140.00	8	2025-03-23 19:45:54.914324
100	25	3	172.36	140.00	8	2025-03-23 19:45:54.948428
101	25	5	172.36	140.00	8	2025-03-23 19:45:54.953763
102	25	8	172.36	140.00	8	2025-03-23 19:45:54.958624
103	25	5	172.36	140.00	8	2025-03-23 19:45:54.963145
104	26	3	172.36	140.00	8	2025-03-23 19:45:54.996139
105	26	5	172.36	140.00	8	2025-03-23 19:45:55.00116
106	26	8	172.36	140.00	8	2025-03-23 19:45:55.005855
107	26	5	172.36	140.00	8	2025-03-23 19:45:55.010953
108	27	3	172.36	140.00	8	2025-03-23 19:45:55.043814
109	27	5	172.36	140.00	8	2025-03-23 19:45:55.049032
110	27	8	172.36	140.00	8	2025-03-23 19:45:55.053387
111	27	5	172.36	140.00	8	2025-03-23 19:45:55.058931
112	28	3	172.36	140.00	8	2025-03-23 19:45:55.092737
113	28	5	172.36	140.00	8	2025-03-23 19:45:55.098299
114	28	8	172.36	140.00	8	2025-03-23 19:45:55.103321
115	28	5	172.36	140.00	8	2025-03-23 19:45:55.108065
116	29	3	172.36	140.00	8	2025-03-23 19:45:55.141918
117	29	5	172.36	140.00	8	2025-03-23 19:45:55.147279
118	29	8	172.36	140.00	8	2025-03-23 19:45:55.153579
119	29	5	172.36	140.00	8	2025-03-23 19:45:55.15818
120	30	3	172.36	140.00	8	2025-03-23 19:45:55.192897
121	30	5	172.36	140.00	8	2025-03-23 19:45:55.19857
122	30	8	172.36	140.00	8	2025-03-23 19:45:55.20356
123	30	5	172.36	140.00	8	2025-03-23 19:45:55.208737
124	31	3	172.36	140.00	8	2025-03-23 19:45:55.240833
125	31	5	172.36	140.00	8	2025-03-23 19:45:55.246336
126	31	8	172.36	140.00	8	2025-03-23 19:45:55.250532
127	31	5	172.36	140.00	8	2025-03-23 19:45:55.255032
128	32	3	172.36	140.00	8	2025-03-23 19:45:55.287293
129	32	5	172.36	140.00	8	2025-03-23 19:45:55.293383
130	32	8	172.36	140.00	8	2025-03-23 19:45:55.29839
131	32	5	172.36	140.00	8	2025-03-23 19:45:55.303014
132	33	3	172.36	140.00	8	2025-03-23 19:45:55.338741
133	33	5	172.36	140.00	8	2025-03-23 19:45:55.344341
134	33	8	172.36	140.00	8	2025-03-23 19:45:55.349685
135	33	5	172.36	140.00	8	2025-03-23 19:45:55.355507
136	34	3	172.36	140.00	8	2025-03-23 19:45:55.388936
137	34	5	172.36	140.00	8	2025-03-23 19:45:55.394015
138	34	8	172.36	140.00	8	2025-03-23 19:45:55.399235
139	34	5	172.36	140.00	8	2025-03-23 19:45:55.404576
140	35	3	172.36	140.00	8	2025-03-23 19:45:55.437531
141	35	5	172.36	140.00	8	2025-03-23 19:45:55.44258
142	35	8	172.36	140.00	8	2025-03-23 19:45:55.448359
143	35	5	172.36	140.00	8	2025-03-23 19:45:55.453522
144	36	3	172.36	140.00	8	2025-03-23 19:45:55.485445
145	36	5	172.36	140.00	8	2025-03-23 19:45:55.490213
146	36	8	172.36	140.00	8	2025-03-23 19:45:55.495494
147	36	5	172.36	140.00	8	2025-03-23 19:45:55.500144
148	37	3	172.36	140.00	8	2025-03-23 19:45:55.532853
149	37	5	172.36	140.00	8	2025-03-23 19:45:55.538614
150	37	8	172.36	140.00	8	2025-03-23 19:45:55.543535
151	37	5	172.36	140.00	8	2025-03-23 19:45:55.547987
152	38	3	172.36	140.00	8	2025-03-23 19:45:55.583071
153	38	5	172.36	140.00	8	2025-03-23 19:45:55.58886
154	38	8	172.36	140.00	8	2025-03-23 19:45:55.593628
155	38	5	172.36	140.00	8	2025-03-23 19:45:55.598389
156	39	3	172.36	140.00	8	2025-03-23 19:45:55.631044
157	39	5	172.36	140.00	8	2025-03-23 19:45:55.636238
158	39	8	172.36	140.00	8	2025-03-23 19:45:55.640285
159	39	5	172.36	140.00	8	2025-03-23 19:45:55.645378
160	40	3	172.36	140.00	8	2025-03-23 19:45:55.677375
161	40	5	172.36	140.00	8	2025-03-23 19:45:55.682907
162	40	8	172.36	140.00	8	2025-03-23 19:45:55.687321
163	40	5	172.36	140.00	8	2025-03-23 19:45:55.691615
164	41	3	172.36	140.00	8	2025-03-23 19:45:55.724686
165	41	5	172.36	140.00	8	2025-03-23 19:45:55.73042
166	41	8	172.36	140.00	8	2025-03-23 19:45:55.734648
167	41	5	172.36	140.00	8	2025-03-23 19:45:55.739094
168	42	3	172.36	140.00	8	2025-03-23 19:45:55.772382
169	42	5	172.36	140.00	8	2025-03-23 19:45:55.778514
170	42	8	172.36	140.00	8	2025-03-23 19:45:55.782981
171	42	5	172.36	140.00	8	2025-03-23 19:45:55.787513
172	43	3	172.36	140.00	8	2025-03-23 19:45:55.820714
173	43	5	172.36	140.00	8	2025-03-23 19:45:55.826475
174	43	8	172.36	140.00	8	2025-03-23 19:45:55.83131
175	43	5	172.36	140.00	8	2025-03-23 19:45:55.836134
176	44	3	172.36	140.00	8	2025-03-23 19:45:55.869194
177	44	5	172.36	140.00	8	2025-03-23 19:45:55.873609
178	44	8	172.36	140.00	8	2025-03-23 19:45:55.878406
179	44	5	172.36	140.00	8	2025-03-23 19:45:55.883775
180	45	3	172.36	140.00	8	2025-03-23 19:45:55.915574
181	45	5	172.36	140.00	8	2025-03-23 19:45:55.920189
182	45	8	172.36	140.00	8	2025-03-23 19:45:55.924692
183	45	5	172.36	140.00	8	2025-03-23 19:45:55.929552
184	46	3	172.36	140.00	8	2025-03-23 19:45:55.962619
185	46	5	172.36	140.00	8	2025-03-23 19:45:55.967411
186	46	8	172.36	140.00	8	2025-03-23 19:45:55.971883
187	46	5	172.36	140.00	8	2025-03-23 19:45:55.977412
188	47	3	172.36	140.00	8	2025-03-23 19:45:56.009339
189	47	5	172.36	140.00	8	2025-03-23 19:45:56.014342
190	47	8	172.36	140.00	8	2025-03-23 19:45:56.018527
191	47	5	172.36	140.00	8	2025-03-23 19:45:56.023898
192	48	3	172.36	140.00	8	2025-03-23 19:45:56.055685
193	48	5	172.36	140.00	8	2025-03-23 19:45:56.060041
194	48	8	172.36	140.00	8	2025-03-23 19:45:56.064109
195	48	5	172.36	140.00	8	2025-03-23 19:45:56.069091
196	49	3	172.36	140.00	8	2025-03-23 19:45:56.102636
197	49	5	172.36	140.00	8	2025-03-23 19:45:56.107468
198	49	8	172.36	140.00	8	2025-03-23 19:45:56.112067
199	49	5	172.36	140.00	8	2025-03-23 19:45:56.117115
200	50	3	172.36	140.00	8	2025-03-23 19:45:56.15008
201	50	5	172.36	140.00	8	2025-03-23 19:45:56.155041
202	50	8	172.36	140.00	8	2025-03-23 19:45:56.159316
203	50	5	172.36	140.00	8	2025-03-23 19:45:56.165658
204	51	600	277.01	225.00	8	2025-04-01 15:04:49.018107
205	51	857	116.96	95.00	8	2025-04-01 15:04:49.032732
206	51	273	300.00	300.00	1	2025-04-01 18:28:39.421657
207	51	716	415.00	415.00	1	2025-04-01 18:31:47.026805
208	53	716	315.00	315.00	1	2025-04-09 18:44:34.64554
209	54	273	405.00	405.00	1	2025-04-09 18:47:33.474194
210	51	273	305.00	305.00	1	2025-04-09 19:03:54.802845
211	53	273	250.00	250.00	1	2025-04-09 20:32:22.391127
\.


--
-- Data for Name: user_goals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_goals (id, user_id, goal_type, created_at, achieve_by, achieved, achieved_at, notes) FROM stdin;
\.


--
-- Data for Name: user_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_stats (id, user_id, height, weight, created_at) FROM stdin;
1	1	51	338.48	2025-03-23 19:23:50.130609
2	2	84	104.75	2025-03-23 19:23:50.164457
3	3	70	286.83	2025-03-23 19:23:50.237239
4	4	49	164.28	2025-03-23 19:23:50.270413
5	5	48	277.03	2025-03-23 19:23:50.306147
6	6	77	274.65	2025-03-23 19:23:50.341301
7	7	85	165.27	2025-03-23 19:23:50.373761
8	8	73	195.34	2025-03-23 19:23:50.40397
9	9	48	168.20	2025-03-23 19:23:50.435127
10	10	77	125.82	2025-03-23 19:23:50.46466
11	11	75	154.30	2025-03-23 19:23:50.496005
12	12	80	105.29	2025-03-23 19:23:50.526653
13	13	54	328.00	2025-03-23 19:23:50.558488
14	14	85	129.94	2025-03-23 19:23:50.592694
15	15	85	183.96	2025-03-23 19:23:50.624545
16	16	58	236.11	2025-03-23 19:23:50.655434
17	17	79	198.98	2025-03-23 19:23:50.685302
18	18	78	121.64	2025-03-23 19:23:50.71738
19	19	65	333.48	2025-03-23 19:23:50.748807
20	20	80	168.53	2025-03-23 19:23:50.778772
21	21	53	345.60	2025-03-23 19:23:50.810095
22	22	85	216.57	2025-03-23 19:23:50.843278
23	23	59	311.22	2025-03-23 19:23:50.874937
24	24	69	147.98	2025-03-23 19:23:50.908488
25	25	63	239.32	2025-03-23 19:23:50.942644
26	26	53	254.70	2025-03-23 19:23:50.973551
27	27	60	275.21	2025-03-23 19:23:51.006241
28	28	62	320.17	2025-03-23 19:23:51.038752
29	29	48	308.21	2025-03-23 19:23:51.072834
30	30	56	81.52	2025-03-23 19:23:51.106178
31	31	58	304.69	2025-03-23 19:23:51.137228
32	32	52	298.44	2025-03-23 19:23:51.170974
33	33	59	307.47	2025-03-23 19:23:51.203045
34	34	55	263.71	2025-03-23 19:23:51.236033
35	35	64	96.85	2025-03-23 19:23:51.268219
36	36	86	247.63	2025-03-23 19:23:51.298643
37	37	64	209.85	2025-03-23 19:23:51.332243
38	38	72	216.56	2025-03-23 19:23:51.366613
39	39	55	216.90	2025-03-23 19:23:51.398909
40	40	66	279.57	2025-03-23 19:23:51.431414
41	41	84	181.87	2025-03-23 19:23:51.462924
42	42	51	339.78	2025-03-23 19:23:51.502113
43	43	67	201.22	2025-03-23 19:23:51.53714
44	44	78	235.66	2025-03-23 19:23:51.572353
45	45	64	123.97	2025-03-23 19:23:51.604091
46	46	74	96.33	2025-03-23 19:23:51.637295
47	47	86	291.52	2025-03-23 19:23:51.667943
48	48	65	233.43	2025-03-23 19:23:51.69884
49	49	50	143.04	2025-03-23 19:23:51.731851
50	50	48	310.29	2025-03-23 19:23:51.762324
51	51	74	250.00	2025-03-30 14:14:37.493371
52	53	74	250.00	2025-03-30 14:17:38.915376
53	54	74	250.00	2025-03-30 14:24:07.851873
54	55	74	250.00	2025-03-30 14:32:50.070251
55	56	74	250.00	2025-03-30 15:04:16.196541
56	61	74	215.00	2025-04-11 15:14:02.891484
57	62	66	150.00	2025-04-11 15:26:16.908772
58	51	74	245.00	2025-04-12 19:23:24.139417
59	51	74	240.00	2025-04-12 19:25:41.175583
\.


--
-- Data for Name: user_steps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_steps (user_id, date_performed, steps) FROM stdin;
42	2024-02-20	16111
1	2024-02-20	16111
8	2024-02-20	16111
46	2022-03-11	13424
11	2023-08-20	13072
27	2024-04-22	16706
50	2024-08-19	9148
43	2023-08-24	15921
43	2022-09-24	5614
24	2022-12-30	9761
21	2024-04-04	19468
44	2022-10-30	12085
10	2022-11-09	8775
47	2024-06-06	14287
7	2022-08-18	7386
50	2024-12-29	9254
21	2021-10-29	13403
28	2024-09-13	19359
25	2022-04-20	16081
46	2022-10-17	19848
46	2021-08-17	10818
23	2021-05-08	11744
13	2021-05-02	17007
13	2021-10-24	7677
19	2023-11-05	17679
41	2021-01-15	16289
13	2024-03-28	11561
43	2024-09-01	17061
6	2022-01-13	6061
34	2022-12-30	18824
2	2020-10-10	16355
22	2022-04-21	13623
28	2024-03-05	13992
2	2024-08-26	9467
41	2021-07-01	9108
25	2024-05-22	11620
50	2020-10-06	6863
9	2021-07-17	17837
36	2024-01-01	12197
16	2020-11-26	5107
42	2023-01-24	19220
1	2021-11-01	10956
45	2021-07-11	9902
42	2023-11-14	7495
44	2022-04-21	17452
40	2022-07-13	5272
50	2024-11-28	9863
36	2024-04-26	8892
32	2021-05-17	14444
45	2021-08-16	17821
18	2024-08-14	16383
36	2025-02-09	5279
40	2023-08-06	13689
18	2023-11-19	15764
11	2021-04-13	13588
42	2023-04-20	7150
2	2023-06-04	6862
4	2020-10-12	5223
41	2024-11-27	8682
40	2021-06-18	6717
39	2021-02-21	17892
12	2025-03-14	11452
36	2024-07-25	15375
36	2024-02-07	12686
41	2022-07-23	11147
33	2022-04-13	16927
9	2021-06-25	19978
25	2021-07-26	15415
43	2024-03-14	6488
34	2023-03-14	15181
18	2024-11-15	5111
48	2023-06-01	6130
22	2023-09-18	10501
36	2020-12-28	7012
6	2020-10-23	6017
46	2025-01-10	10857
47	2022-01-15	13899
12	2022-07-24	12453
21	2025-02-01	17734
8	2023-05-25	6489
19	2021-05-13	5991
20	2022-02-06	7451
34	2024-07-15	13482
11	2023-04-07	15404
43	2021-11-08	11237
21	2023-05-02	17841
32	2021-07-13	17549
35	2020-11-30	19624
21	2021-11-20	5201
36	2024-10-29	13205
30	2022-02-18	18218
48	2023-02-12	15809
25	2022-08-12	12108
39	2021-12-04	9737
23	2023-05-22	9205
25	2022-08-23	13971
40	2021-06-06	11685
37	2021-06-23	13319
50	2024-10-13	18002
3	2021-01-05	17085
20	2021-03-10	10001
45	2023-06-29	12067
35	2023-08-01	19593
43	2021-12-17	5677
14	2024-04-17	5066
16	2024-11-09	5631
34	2021-09-21	8051
41	2022-07-03	19033
50	2023-03-17	18945
23	2021-04-22	12089
37	2024-01-07	17842
2	2023-09-03	7562
18	2023-05-22	10566
39	2024-09-23	7764
41	2022-04-12	7211
34	2023-02-18	9415
42	2020-10-27	8711
14	2021-05-26	10199
37	2024-12-15	13530
27	2021-10-01	9889
23	2020-11-01	7174
23	2021-08-24	12661
47	2024-12-21	6598
42	2024-12-18	14994
28	2023-05-17	19911
10	2023-10-29	18183
12	2023-01-03	16575
50	2022-12-23	17054
32	2022-01-13	17965
32	2022-01-31	8158
36	2021-10-09	9880
19	2024-09-27	14389
16	2024-01-15	18043
10	2022-04-08	14481
40	2023-02-24	13676
35	2023-10-31	12662
34	2022-12-18	8004
16	2024-04-10	19427
43	2021-12-21	12826
43	2021-03-26	9451
5	2025-02-22	14894
18	2022-04-14	7039
11	2024-10-25	8589
49	2025-01-05	12731
10	2024-10-25	14026
13	2021-04-01	12587
47	2021-02-11	7895
43	2023-07-10	10460
48	2023-03-31	14264
10	2023-10-27	12051
29	2024-12-11	15143
20	2024-11-14	18003
15	2024-01-11	5565
17	2024-09-27	11576
1	2021-02-03	16259
38	2024-05-05	15685
38	2022-10-27	9329
2	2021-10-06	17041
8	2022-08-08	12508
6	2022-07-08	17691
33	2022-08-19	12262
6	2022-09-07	15290
38	2021-04-17	16000
42	2023-11-17	13114
42	2024-06-11	14404
18	2025-01-16	18615
10	2022-09-03	6291
17	2020-12-09	14562
40	2023-08-08	16570
46	2024-04-26	15252
15	2021-07-21	19184
20	2024-06-03	6822
23	2024-08-18	19035
41	2023-06-30	18972
8	2024-01-07	19963
12	2024-02-22	18355
10	2023-04-28	16242
4	2023-08-04	13228
3	2020-12-30	17130
34	2024-06-04	17196
17	2023-08-14	19372
48	2022-03-08	14705
40	2021-01-09	18291
9	2025-01-27	19177
5	2024-04-08	9524
29	2025-03-04	11887
7	2025-03-10	8733
20	2022-10-04	12807
29	2023-12-17	18342
1	2022-12-11	15313
5	2023-05-13	10436
37	2023-07-20	9683
20	2021-07-31	19257
41	2023-02-21	11930
13	2023-05-05	14708
43	2022-07-02	13082
43	2022-02-23	12632
28	2024-12-19	17657
1	2024-02-01	9602
37	2022-09-12	19288
24	2021-08-16	8641
19	2020-12-23	18263
28	2022-02-14	14115
42	2022-10-03	10040
45	2023-01-28	6751
14	2024-07-27	18673
10	2024-10-10	13683
8	2024-11-15	8939
41	2021-05-19	16175
5	2024-09-10	9172
39	2024-08-19	13701
2	2023-10-22	8636
44	2024-12-27	18320
40	2024-11-17	8076
46	2022-12-02	5604
5	2021-02-13	14135
7	2024-06-02	12009
35	2020-12-31	9502
39	2024-08-22	5695
13	2024-07-24	5611
23	2022-06-22	5992
30	2024-09-03	17792
43	2023-09-02	17548
17	2022-08-21	6767
1	2023-01-20	5530
50	2024-08-18	16578
38	2022-06-28	6919
6	2021-10-26	18628
15	2024-11-02	16097
20	2022-01-12	17377
4	2023-08-14	10698
1	2022-08-30	18973
50	2021-09-28	18483
50	2024-11-19	12073
47	2024-02-09	15825
37	2021-01-17	13899
29	2022-12-10	8175
45	2023-11-18	14134
17	2021-05-24	14749
43	2023-01-28	9591
17	2021-08-07	15921
6	2022-06-13	19092
35	2024-04-26	18006
39	2023-09-06	17852
9	2021-02-01	6880
8	2023-08-06	13296
45	2021-10-03	19187
12	2021-08-10	16859
33	2022-05-02	6710
1	2022-06-08	16954
36	2022-06-20	15786
17	2023-06-15	12533
40	2025-03-09	5725
15	2024-11-19	16706
12	2024-07-07	11634
24	2024-03-30	11359
18	2023-11-15	12858
1	2024-11-15	8196
5	2022-07-10	8394
6	2023-06-09	15826
19	2021-03-11	14746
44	2023-06-26	13444
22	2023-11-09	16599
19	2023-11-04	13630
33	2022-03-08	11573
3	2021-02-22	5461
13	2022-03-21	14141
48	2024-01-29	16718
29	2023-09-14	12193
4	2024-01-21	6891
48	2021-10-22	18671
22	2022-01-20	16450
17	2024-12-29	9469
37	2025-01-18	16880
14	2022-07-31	14203
2	2022-07-29	5696
43	2021-11-16	15769
16	2024-01-26	14781
23	2024-02-16	14215
26	2020-10-08	19535
44	2020-11-21	10442
47	2024-12-10	13600
37	2022-08-03	11405
35	2024-10-15	10073
3	2022-02-03	15935
17	2022-07-30	6389
46	2020-12-31	16742
47	2022-10-25	19322
35	2023-10-11	17769
34	2020-11-02	10603
20	2024-11-11	8830
35	2022-11-05	15205
35	2022-12-02	17627
48	2023-11-10	19926
18	2024-06-14	14923
23	2024-01-17	12662
49	2021-10-06	17973
16	2024-03-26	15227
48	2024-07-07	15437
37	2022-12-25	7021
25	2020-12-12	6098
11	2023-05-31	10214
8	2024-06-06	13933
37	2024-06-08	16162
17	2025-02-17	6146
36	2023-05-02	14294
18	2024-11-10	12169
17	2022-04-10	16298
36	2024-12-07	10521
23	2024-11-24	18555
34	2023-04-19	18191
28	2024-09-05	10069
45	2025-01-01	13900
10	2024-06-09	12090
16	2020-12-09	12046
38	2024-02-04	11308
31	2024-05-19	15865
47	2022-12-23	13129
19	2024-06-27	8642
34	2023-07-02	14288
37	2021-03-04	18135
35	2024-02-25	9535
42	2022-01-27	10059
36	2023-10-14	14688
12	2021-07-23	18743
17	2022-02-20	11714
17	2022-11-29	9521
2	2020-10-28	5567
42	2023-05-29	9050
45	2024-11-09	10222
35	2023-08-09	11702
46	2021-06-10	11504
3	2021-09-18	14753
38	2024-12-30	8005
23	2022-06-05	18646
45	2021-12-24	16539
12	2023-11-05	7755
30	2024-03-19	9690
38	2021-05-18	12806
47	2022-09-21	6558
5	2021-09-13	16564
23	2025-02-11	8392
32	2024-11-13	18428
49	2023-06-01	8747
15	2024-12-04	14977
18	2021-04-04	17624
24	2025-03-06	11181
21	2024-10-25	18193
33	2023-04-17	5756
3	2024-04-21	13986
30	2022-07-07	19328
19	2024-07-10	5890
49	2023-06-10	8038
3	2024-10-01	7640
41	2024-02-01	11119
48	2022-11-16	19234
3	2023-07-16	11757
36	2023-08-25	18372
5	2022-11-19	7824
21	2023-01-10	19250
32	2024-09-16	6304
9	2024-04-20	7467
40	2021-03-18	9173
25	2024-12-03	5750
16	2021-07-29	16818
17	2021-03-02	16086
33	2024-04-22	13722
1	2021-08-12	15717
13	2025-01-01	11560
44	2021-01-31	14809
19	2024-11-02	15233
16	2021-09-12	7110
50	2021-01-25	7630
13	2023-04-22	7350
38	2022-07-13	10152
36	2021-06-14	11298
39	2025-02-28	15889
31	2023-09-06	6149
4	2023-08-21	13587
35	2022-07-13	14435
8	2021-01-14	12838
49	2024-02-06	5407
49	2024-08-26	5062
27	2022-08-11	7506
34	2022-04-13	13621
29	2025-01-20	12975
26	2021-03-21	15683
17	2024-02-04	13194
9	2020-11-18	15626
47	2024-10-15	6962
26	2021-02-21	17822
18	2021-12-02	10026
25	2023-06-04	15045
46	2022-01-11	18386
39	2023-04-01	7326
8	2023-01-05	6727
48	2023-06-02	9516
12	2020-11-14	12140
13	2025-03-05	6894
33	2023-12-31	14765
12	2024-07-18	6579
26	2022-02-12	9388
4	2023-04-02	5515
5	2023-01-01	10326
3	2021-08-30	17554
28	2022-09-14	15786
21	2021-07-09	13185
32	2025-01-19	10276
33	2025-02-25	16094
29	2022-01-27	6021
19	2024-09-11	14531
14	2020-11-04	5279
13	2024-12-05	11402
17	2024-03-02	16564
47	2020-12-07	8057
12	2022-05-22	5674
8	2025-03-21	12672
33	2020-10-23	8274
40	2024-05-04	13869
45	2021-09-03	9725
46	2024-01-13	19819
34	2024-09-19	6962
2	2023-08-02	5187
18	2021-04-26	14647
42	2024-12-29	16786
32	2021-12-29	9154
10	2022-04-22	16018
39	2024-07-05	19511
38	2024-03-09	7954
29	2020-10-28	11303
39	2022-11-04	12811
43	2025-01-30	8351
37	2023-08-21	11314
14	2024-10-19	13872
40	2021-03-27	9786
24	2021-04-17	14921
45	2023-09-13	13309
38	2024-12-18	18791
41	2023-08-03	13381
11	2021-11-27	12089
41	2024-11-21	18698
12	2021-03-07	7626
27	2022-08-03	7539
39	2021-08-05	11860
4	2024-01-05	5187
26	2024-01-15	12936
30	2021-06-19	15222
11	2023-09-09	16502
39	2022-07-15	18508
9	2022-12-05	19025
32	2024-03-17	10168
36	2024-09-21	5971
50	2023-04-17	15140
18	2021-06-02	16243
39	2022-10-20	9304
29	2021-10-07	5626
11	2022-08-02	7433
32	2022-10-15	5212
21	2024-01-15	17791
12	2021-10-15	10572
25	2022-10-19	16224
40	2022-03-23	18190
16	2024-12-09	11133
20	2024-02-28	5097
12	2024-10-29	18902
43	2023-06-21	9297
3	2021-01-24	8833
37	2021-11-14	13215
35	2022-08-15	6823
27	2022-07-24	13499
34	2025-01-17	11650
2	2024-05-18	13006
45	2022-05-14	9618
7	2024-03-17	11699
39	2024-11-21	15109
48	2024-09-18	13889
10	2025-03-21	7976
1	2020-12-30	12695
20	2023-10-02	13576
46	2021-07-01	5926
1	2021-05-28	18680
45	2024-01-26	11915
14	2023-05-01	5603
9	2024-07-12	18340
12	2024-07-19	18202
42	2021-09-09	7728
16	2023-03-19	13103
25	2021-01-13	12538
34	2022-11-28	8497
39	2023-06-11	11117
17	2023-11-19	9040
2	2023-04-23	14855
35	2022-06-28	18055
29	2024-09-16	17089
12	2025-01-29	10452
38	2022-05-09	9436
7	2025-02-26	18554
13	2021-12-31	7429
2	2025-01-31	16950
33	2025-01-05	19086
27	2021-11-07	17232
4	2021-02-18	5217
14	2025-03-21	10832
26	2021-07-25	11955
10	2022-05-10	18423
25	2024-03-05	12307
20	2021-04-29	10256
3	2023-04-18	18314
32	2024-02-25	9509
16	2022-06-24	9590
49	2024-02-13	16503
41	2025-02-25	9228
3	2024-07-08	8091
17	2024-11-08	13766
13	2022-10-19	7848
6	2025-01-08	13160
27	2024-01-15	9968
14	2023-11-21	13063
21	2022-03-04	14303
4	2023-05-12	12049
26	2020-12-19	16650
31	2022-09-07	13613
1	2021-05-23	14390
6	2022-02-25	6320
12	2022-02-01	8951
17	2021-09-22	15562
19	2023-10-29	7487
40	2024-03-11	9357
41	2022-06-07	19060
25	2022-05-01	15586
39	2021-03-13	17226
29	2021-09-11	13828
25	2022-05-03	10786
18	2022-04-01	18606
32	2023-11-12	11119
7	2022-08-06	14637
27	2024-07-03	15660
3	2021-10-13	11033
24	2023-01-25	7786
11	2022-10-01	8502
11	2023-11-24	10503
23	2023-01-22	11833
34	2024-01-03	7249
25	2021-11-06	13101
23	2023-12-20	11643
2	2025-03-07	6866
29	2022-05-14	15930
1	2021-06-24	19244
38	2023-12-15	18867
7	2021-07-28	18684
47	2022-08-18	6785
31	2023-05-08	13069
4	2024-11-28	8199
22	2023-04-30	7528
23	2024-04-06	5778
11	2024-03-15	12108
30	2025-01-17	7894
39	2022-08-27	13712
34	2025-02-28	10490
16	2022-04-20	7035
5	2022-12-30	12751
47	2022-11-07	13788
42	2021-01-26	9469
40	2024-09-07	15060
34	2024-06-15	5524
28	2024-07-17	12086
24	2024-10-08	13331
15	2021-01-23	8828
18	2024-09-18	13963
12	2023-11-28	19858
36	2022-10-05	10614
12	2023-10-23	19752
19	2023-04-28	18217
3	2023-04-08	18966
4	2023-03-17	5021
25	2021-01-30	15346
25	2021-04-08	16297
3	2021-08-14	13344
12	2024-07-17	7911
13	2022-08-06	15601
13	2021-06-28	7331
10	2024-03-29	18143
17	2024-10-02	11792
17	2020-12-11	6519
47	2021-01-26	17973
45	2023-03-27	9895
8	2025-03-02	9558
23	2024-11-14	13225
42	2024-11-07	11373
10	2023-03-05	12651
36	2021-12-02	11945
44	2024-11-21	16301
29	2021-05-16	10514
39	2023-06-17	19268
49	2021-06-27	13106
43	2021-09-08	15903
17	2021-04-09	7598
37	2020-12-25	6930
14	2022-08-19	19800
44	2021-09-12	5344
17	2025-02-06	15361
47	2022-02-07	13095
26	2022-04-29	13467
10	2022-10-17	13870
36	2023-09-21	14608
42	2023-05-06	8485
22	2024-10-28	15466
29	2021-05-30	13318
42	2023-04-13	9106
32	2025-03-04	13177
17	2023-05-01	17585
1	2021-10-12	16890
28	2020-12-26	11888
9	2024-07-27	11331
38	2024-03-10	6279
18	2020-11-21	11974
37	2022-03-21	16178
4	2025-01-12	19405
34	2023-02-08	15509
36	2024-01-12	10328
31	2024-06-12	15518
39	2022-11-16	11053
27	2021-08-13	15758
36	2024-04-01	13401
1	2020-10-25	13364
3	2022-05-31	9420
31	2021-03-04	8068
3	2022-05-13	12238
18	2024-06-30	16239
39	2022-11-14	8721
43	2023-05-22	17703
10	2024-08-15	11626
47	2022-12-07	8775
6	2024-03-01	8113
25	2023-04-21	8393
23	2022-10-08	9360
6	2023-05-16	11283
38	2024-07-24	12375
18	2022-06-17	14404
44	2024-06-22	15917
49	2023-09-22	12722
17	2024-08-30	5265
35	2022-07-15	6927
32	2024-08-03	19804
16	2022-06-19	18662
24	2022-05-24	15906
44	2023-02-28	13076
19	2024-07-06	9718
47	2020-10-19	16206
14	2024-06-05	8716
23	2022-07-18	9858
48	2022-09-21	10244
15	2023-07-13	11391
12	2023-10-17	18552
41	2022-08-16	5142
49	2023-09-03	12707
41	2025-03-07	14203
28	2023-04-28	8143
39	2023-09-18	19042
17	2024-02-27	17768
17	2025-02-19	9252
13	2023-12-02	12523
9	2024-02-23	14952
1	2024-12-09	5228
37	2021-07-11	18622
11	2022-11-18	6501
1	2025-03-10	8685
7	2024-06-10	17114
48	2023-07-20	13217
1	2022-06-14	19840
29	2022-01-16	9534
17	2024-07-15	19579
7	2021-11-01	6449
25	2023-08-31	6650
18	2023-01-01	13280
17	2022-09-10	15777
44	2021-09-17	16965
49	2022-04-30	15557
33	2024-12-13	14855
28	2021-02-16	5068
37	2022-07-24	11621
34	2022-02-15	11253
35	2023-04-19	17246
24	2023-10-13	15269
17	2022-05-12	7202
32	2021-11-06	18339
29	2021-02-28	12047
42	2023-06-28	12957
21	2022-09-30	12983
29	2025-02-06	17745
30	2023-11-21	16316
5	2022-08-05	11021
15	2025-01-06	16772
23	2024-01-11	18147
21	2022-06-06	15093
36	2021-03-12	18604
6	2024-09-03	14341
33	2021-02-01	10098
22	2021-07-08	7399
25	2022-09-02	5113
6	2023-10-28	7821
31	2022-10-04	9400
12	2023-12-14	14671
23	2020-10-03	19747
34	2022-06-22	10643
20	2020-10-25	6084
50	2020-11-18	17933
22	2021-01-11	9389
4	2022-07-21	10276
33	2024-02-04	15381
19	2023-12-11	5537
32	2024-04-12	7670
36	2023-03-24	13296
24	2023-12-20	19795
27	2021-02-20	14512
21	2022-10-26	19715
21	2022-01-04	7957
42	2022-12-26	16353
20	2024-01-05	17332
2	2024-02-07	6717
15	2023-11-24	11693
17	2023-10-02	18913
26	2024-05-01	8597
21	2023-09-24	11086
45	2022-01-12	12674
7	2021-12-23	9878
45	2021-06-29	10164
16	2022-01-06	13323
45	2023-04-02	13677
45	2021-03-22	15990
27	2020-11-28	18626
46	2024-10-01	5468
50	2024-03-29	15676
42	2023-09-13	8975
42	2023-02-24	10779
29	2021-09-07	10781
10	2023-03-24	7636
21	2025-01-28	13894
28	2022-08-30	11071
13	2021-12-08	10629
32	2022-05-16	7923
22	2021-09-12	13140
43	2023-12-23	6249
47	2024-09-11	14197
11	2023-08-31	15526
38	2022-06-08	10835
22	2021-02-15	11146
5	2023-09-29	14153
22	2024-05-17	19426
10	2024-03-13	16759
33	2023-06-04	12341
42	2025-02-21	10632
44	2021-05-23	7354
7	2024-08-03	7945
30	2023-09-17	10679
50	2024-05-06	12501
35	2023-06-27	14922
42	2024-10-19	14089
15	2022-06-21	6903
36	2023-05-15	15033
42	2023-09-21	14751
18	2022-11-22	11717
42	2021-02-26	9233
40	2024-10-18	7244
10	2024-07-28	7520
36	2021-04-18	15569
26	2022-07-15	10009
5	2023-02-16	9460
43	2024-07-22	12142
3	2023-07-19	10001
49	2021-05-18	11478
16	2021-10-15	15473
48	2022-10-07	9311
1	2021-06-17	12583
22	2023-10-30	9510
5	2024-11-25	14776
44	2023-08-24	10086
9	2022-05-19	10603
45	2024-03-28	14662
32	2020-12-11	18453
29	2025-02-09	17498
32	2023-07-01	5973
20	2021-08-27	15821
21	2024-12-20	9275
25	2023-05-04	5783
13	2024-07-02	16991
10	2024-05-14	18684
16	2021-01-08	8251
29	2020-12-25	9542
1	2021-09-20	6151
12	2024-02-05	7627
25	2021-04-17	17995
24	2024-09-19	12434
49	2024-09-16	6411
42	2023-07-04	18277
6	2021-05-22	16205
42	2020-12-26	13348
22	2023-09-09	10141
22	2023-05-16	19295
11	2022-10-04	5152
49	2023-12-20	10916
7	2023-02-27	18101
47	2024-09-22	8801
31	2022-02-05	16619
5	2021-07-23	14290
47	2025-03-07	15617
2	2022-05-27	5104
18	2025-02-25	14064
1	2022-12-27	19546
9	2021-08-10	16868
14	2024-09-23	17873
34	2023-01-29	16130
39	2022-01-15	11165
44	2021-02-11	10450
44	2020-10-13	7294
23	2023-01-31	15338
28	2021-01-03	6255
35	2023-05-21	11619
18	2020-12-14	12471
40	2024-08-14	5391
17	2024-06-22	6177
14	2023-06-27	18947
34	2023-03-23	12580
20	2024-03-23	15777
40	2021-09-20	19135
5	2024-12-21	5525
37	2020-11-28	8456
40	2021-09-29	13750
5	2021-04-14	19111
23	2024-08-10	18032
31	2022-02-07	5551
8	2023-09-22	15338
1	2021-04-18	15015
35	2022-09-09	14216
45	2022-01-08	6782
39	2023-07-16	16055
43	2023-05-12	12392
48	2020-11-17	13739
37	2024-06-27	14284
18	2023-02-02	15530
15	2021-05-11	18013
33	2023-09-11	11972
34	2023-03-09	15586
14	2023-09-16	18520
33	2021-10-05	15893
9	2021-02-12	17443
5	2023-11-11	8695
6	2023-04-07	10350
47	2022-09-20	12097
3	2021-08-01	12265
29	2023-10-24	12571
8	2023-12-20	11580
11	2022-06-02	6077
29	2021-09-27	8879
29	2025-03-10	17421
37	2023-06-30	12870
15	2023-05-08	6603
32	2024-08-13	11517
17	2021-04-18	10980
42	2023-05-20	7114
19	2020-10-13	10752
24	2022-12-05	15691
5	2021-12-23	12813
42	2021-10-15	10934
40	2024-11-27	9516
32	2024-12-21	5565
5	2023-01-04	13534
29	2024-09-07	5956
33	2024-11-06	10225
24	2021-04-16	16370
46	2023-06-10	18419
20	2022-06-02	13301
7	2022-03-27	13110
27	2024-03-17	10124
5	2025-02-24	5296
6	2024-05-25	15001
35	2023-11-17	7699
36	2022-09-22	13680
37	2025-01-21	18161
39	2023-11-29	7968
49	2024-06-02	8347
18	2022-02-12	10064
43	2023-07-19	9726
35	2025-02-23	10679
25	2021-02-07	11347
21	2023-01-17	15087
47	2023-04-12	10560
36	2021-10-11	15300
11	2023-11-01	11145
20	2021-09-16	14477
46	2021-02-19	8633
8	2023-03-17	12639
42	2023-01-04	15466
36	2021-09-07	5717
40	2022-06-24	8618
34	2022-08-20	5989
37	2022-05-31	9116
37	2024-03-12	14063
13	2023-07-13	17756
19	2023-05-27	6176
33	2022-02-23	13273
14	2022-06-09	8992
10	2021-09-18	17202
27	2023-01-21	11894
37	2024-07-24	15927
21	2021-01-29	10432
11	2021-05-27	18225
34	2023-07-03	13737
33	2021-06-14	18445
13	2024-08-20	14981
39	2024-01-20	14696
14	2020-10-16	16588
50	2022-11-28	8078
41	2022-07-04	14124
40	2023-03-17	17279
19	2021-07-23	18169
1	2025-02-21	12788
35	2025-03-07	16628
18	2023-05-25	10824
14	2024-03-02	19703
11	2022-12-02	16824
14	2023-11-18	13352
12	2024-03-28	6033
5	2020-12-18	8832
36	2023-05-11	16794
24	2022-10-07	10924
37	2023-08-06	7781
8	2023-09-12	11296
49	2024-08-03	10889
34	2023-10-08	6414
38	2023-02-06	6812
28	2021-05-17	12511
50	2023-01-28	16067
46	2023-06-26	7461
48	2023-11-15	13861
17	2023-09-06	15962
31	2022-08-31	10757
34	2021-09-22	15315
29	2024-06-14	12329
23	2020-10-23	9701
18	2023-06-28	9470
43	2024-02-04	14467
2	2023-05-30	8935
11	2024-02-27	17299
7	2024-02-21	6972
47	2022-02-22	13048
12	2022-01-11	5020
24	2023-10-01	16962
20	2024-01-02	7251
27	2023-11-10	15474
35	2021-08-25	17505
9	2022-02-01	5001
39	2023-07-09	10479
42	2024-03-29	7215
32	2023-09-04	6559
7	2024-03-04	8882
46	2021-08-12	12147
21	2025-02-03	14889
3	2024-05-07	13628
49	2021-02-25	12963
49	2023-05-27	8800
41	2024-03-17	13439
41	2023-08-27	8248
7	2024-03-09	18745
2	2025-02-10	10878
28	2023-04-14	8813
36	2022-01-12	17908
13	2023-03-04	7395
44	2021-01-20	5465
18	2024-03-18	8899
14	2023-02-19	9066
2	2021-04-04	9189
38	2024-12-13	9718
47	2020-12-30	11448
48	2022-12-14	8283
32	2021-04-10	17384
30	2024-12-26	16911
48	2022-02-14	19940
30	2021-07-30	14473
14	2024-09-25	8055
3	2023-04-26	8560
17	2021-12-02	15859
44	2023-07-31	16368
17	2023-09-09	13570
16	2025-01-24	9196
50	2020-12-03	12223
8	2024-07-26	9491
50	2024-09-10	19662
20	2022-07-05	13304
3	2021-11-26	12489
49	2021-10-13	9804
27	2021-01-20	12980
26	2024-09-13	13699
15	2021-05-08	11545
46	2021-10-07	8034
48	2021-01-21	10531
45	2022-10-29	14870
51	2025-04-13	9500
51	2025-04-14	10000
51	2025-04-12	4500
53	2025-04-18	10000
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, username, fname, lname, password_hash, dob, sex, bfl, key, created_at) FROM stdin;
1	adudney0@nytimes.com	adudney0	Ashley	Dudney	dcda2bb809f58a58e17b7060bfc98b36ce49d0af0d492cd80a761dfd23aff1c2	1967-08-09	M	\N	N#A6YCw}r[mU0w,I7lR23bwF\\;qmd!4Z218z%$tm&bSU^>Nv4w{K-sc.+m],ky;J	2025-03-23 19:23:50.116563
2	cgrafton1@chronoengine.com	cgrafton1	Chad	Grafton	e716621af99574b500d6bcb7f8c52d718898e2cd2747ac3d5d6cf9ac1309a697	1976-02-16	F	\N	}N`MsgbT}Br=e-Z|bX:uar/.BJC1P774*2>#)<pBPnz[])/[c~kWtdt@,m?n7%gv	2025-03-23 19:23:50.152215
3	pgoering2@pinterest.com	pgoering2	Phillie	Goering	00027b67468b5605d12ac43d16646c5b2e9f331e65971fa74a5ac5e8153f164d	1970-10-18	F	\N	BeFq7|#~(d)/lz1|s5,0XA?y?XB.SqL3QsD2$B-aRhOPK{s4e@KjTx`]5|aJx&F:	2025-03-23 19:23:50.225843
4	aklaiser3@answers.com	aklaiser3	Abba	Klaiser	dc0e489f707c30484f231ef26ecdbf54377da3196ebbe7cae638b20b0122ed3f	1962-12-03	M	\N	8,)]s?W;)DT!/+CVF#@c=LngVNzsuY,1|&X4n)D9_K;g{AaV<.BcP8I)moJJfy7|	2025-03-23 19:23:50.25887
5	acurtoys4@google.com.hk	acurtoys4	Ana	Curtoys	f2e7551a9ab8e91c86aa50c0517167e3c08c6d0c1e1ee33f756b325746de3d9a	1991-09-03	F	\N	pd|*KCk.F0F\\[|XD=Anw81PKht8D~N)sBUk}WsgF:\\Do>xcLJjfZcTU<J-xxP;bj	2025-03-23 19:23:50.29464
6	bdurdan5@who.int	bdurdan5	Bobinette	Durdan	84829c8f3cfeee3a8ef9d0829ac6df9b25ff4f9affd115d58ad332cc1cb5c083	1938-08-23	F	\N	]Qd3!$It&Tk`2xAFXj[{%lK!{[x=f9|qw\\Uq|-b(7Vw(vrXLwNYZ&NY{2NDg_`_J	2025-03-23 19:23:50.32892
7	cissett6@sbwire.com	cissett6	Caro	Issett	449a394b58af7b0d63e4c7a651336019ae912ee292f19393e81da665bed74821	1973-09-18	F	\N	%7R1_d,t,{Ynz+3aoGf{MAd=Uwq,fE,s^D(57iM=ihFCd.b(b/8D]UWG*w1q/Ecd	2025-03-23 19:23:50.362132
8	cflorence7@artisteer.com	cflorence7	Carol	Florence	3f2d184b51ac5f8764065a65ff085e4a2fdcf99185a8b5b869408fb0598f854d	2015-12-23	F	\N	ii(ot7YJ.5OaQn0>Jc2YUIzDEgc{t:`rxw.|RuLI2c7|o<Rj,Wf9R\\=BzN[LDNAN	2025-03-23 19:23:50.392939
9	nduckhouse8@sohu.com	nduckhouse8	Neal	Duckhouse	ea1ba712b364e6587b0ab3f54fc54c0780520b2746dbb247afd23eb5d4e285c0	2004-11-23	M	\N	zBx14#1VsN*0q(;e&Xwy|PJ.^I.sz!-`Cm?@M<.?i)!{az1h8j2A-#Q>EMxc~@{n	2025-03-23 19:23:50.423699
10	amcgraw9@salon.com	amcgraw9	Allie	McGraw	09676c6ad29fc0d52153d72f614378f81af1951a2cb84eac87b8be44d1c98cd7	1937-09-14	F	\N	|d%kx!;\\}[23HmI6U*z$kC#d[?yXbSap{0z&DC4mY1X$fiq#4ssBtY#$GlWnMD.C	2025-03-23 19:23:50.454292
11	mwickendena@quantcast.com	mwickendena	Morgen	Wickenden	6c4f7b6e08477c2c4471bd40339dc94b2243087b8c94cb558656ad6bc232a71b	2020-04-25	F	\N	y3k|oiT)u_/4RlOpS@1k)^p+Ssgqv34fxnI*%XURU36{kQ\\1.pH~;:Sbx6A7K>6!	2025-03-23 19:23:50.485071
12	vcleetonb@washington.edu	vcleetonb	Virgie	Cleeton	1bddc0e00c58d0952c114d573de4443a0960efad69d0b936d9198887f1f90e8b	1982-07-24	M	\N	L4&:J@2%?5Z-m`|+dDt%~mE!(^C4;-k/8(.bq%Wr#T\\fUgJW]utePLDXnET}51&=	2025-03-23 19:23:50.515984
13	branahanc@php.net	branahanc	Barney	Ranahan	b1a8c29d44e2a1e5c753aa77be59d59f13f3d8217c15ec7007c304c7f7c7b9cf	1997-08-10	M	\N	=W3\\eeLvMI(WAC4HGVvyF266%e_c26L?q4|%(tDe#$ZHVPlZ01\\NH{ast)5Jc~bN	2025-03-23 19:23:50.547193
14	wcraggd@nsw.gov.au	wcraggd	Wallis	Cragg	b7116cc990fa2b7ae9b99fc623d6cab93833c6a6f838103827adaae2e8a18021	1996-10-22	F	\N	D_axv4|HP:-@kH-S>+9N<UZ;:}z9X_e$F**2q{.Z$Mm=oDV:|dr_0e&:|<Y`y{mW	2025-03-23 19:23:50.5803
15	bseerye@jugem.jp	bseerye	Bren	Seery	2d9bd18f391e5833a7dd5c47d6fdcff55f5abfe7533806f7ca2da23c2ec6053f	1948-05-18	F	\N	RP^;5%}#M#XgU;rsiVBJd+,$+n.5@!JyO#9iDY7Xu<Q?Kw[Jh5q&i^>y.;/2C4mV	2025-03-23 19:23:50.613652
16	dalbertsf@mac.com	dalbertsf	Demetrius	Alberts	14ac27657254d4579f3cdda3633047e1250ccf487a84bcff5e4e487ccd82bf4d	1949-07-27	M	\N	P,Ip-z1P!0DW!<?t~,MluYOQ*^_BS<$exU^ux}#iqiAuear4:U@Z=KI:Z7zGp74s	2025-03-23 19:23:50.64455
17	dingoldg@amazon.co.uk	dingoldg	Dion	Ingold	4e5fe3aa88c8ef1037298fa67e5fcfb764126ff77cb816d70dd95bc1fbdb165c	1949-11-01	M	\N	6Qr=OI5A0&hq6h(PqqPb)Sb,y8?5wXBU{N~{l#<`/:vFS~=~[0;7ItJm*7ES(F*0	2025-03-23 19:23:50.674725
18	gdurtnallh@cbslocal.com	gdurtnallh	Gene	Durtnall	7f500f07f62b4bd3e46680f35d620b59649c4f2688c1dfd80c6e8b50db07fc35	1985-11-12	M	\N	_6K%C@%aLEVs)6xe4V1Wfb-#tW*7Hd\\t>_!#a>5$/7syjD82SW3:L1RK/0(#6Z8e	2025-03-23 19:23:50.705555
19	zmcmainsi@artisteer.com	zmcmainsi	Zitella	McMains	2e6c290be0fc3b836cae98fc568b6e34148b7c9e484f27b3ff807b4b558575f2	1965-04-11	F	\N	<{#9W36R]YhJ/W{IWd0NZo^{d[*4uSeA1uK]m%#[8<TR&TRA43om)-R_X:_+#KSr	2025-03-23 19:23:50.737983
20	tlukerj@time.com	tlukerj	Toiboid	Luker	e304b9bfb0eab9d3dcd03aa2bd117ead585051ea7ef2d9ddb47be1a6a9ae0271	1987-08-28	M	\N	oWv+OLf]/yD,mD@h\\)Z2^~=@M9jO&WY~k;Wb^@%U-fOy-uEih6zE{eZ[gbiA0_i9	2025-03-23 19:23:50.768202
21	gadvanik@yellowpages.com	gadvanik	Gardy	Advani	080f662bd526229500e0d52086643ed85b9e89a6ba09c487b809dda752398617	1944-09-11	M	\N	p(&[O,WyU=Iez!CCPRM@,z,3k->yA]%l{Heb#+FWIf^#<SNZHlpldmtkjl|=s^l)	2025-03-23 19:23:50.798678
22	bdaglishl@fda.gov	bdaglishl	Bess	Daglish	c71a4c569b042e0b61193f772190800c8b0619339ca63cd5b8ec0951e3f3d269	2000-04-30	F	\N	i}8n?5h&K^,n(Ej}.c*LZyA0t8gEkxNaVz=2gYFM9V1#N%bQo~o7b^1BvcL<$yU4	2025-03-23 19:23:50.832532
23	cliggensm@xing.com	cliggensm	Cam	Liggens	e7a7cb6232b76d671ffa76f6c0e5b38f05e01dbd846e2ebb4b3b91dcf34616f0	1958-05-28	M	\N	kxZ;#TPezXL8ah66QXlmlgGYIUGw<{DEI[sB>?JC.hoZ!JXfE;]wO&;/A$tY^`A0	2025-03-23 19:23:50.862997
24	mcoatmann@taobao.com	mcoatmann	Mikol	Coatman	097324ce03ad0e92cf30985f440b582277fa57c22eeea41def7e43cabf77010e	1942-09-06	M	\N	_u250X@(z57na#(#.22<7?\\RvkhvE%fWy3-u@5%ns<Tx{eLG.~c3xRnj2iq8#NJ/	2025-03-23 19:23:50.894518
25	cwinearo@gravatar.com	cwinearo	Colas	Winear	44b2c65c976e7ba4ee141e13ca735858a1f9c1fc38a26f75bc17b048d62192d3	1946-01-08	M	\N	HJWYZM<Ye{N8`d4w_29~l-)%ZsUQ^lndc$Xy<la1_/W=31pr$gv9lfq{G;>rd7aU	2025-03-23 19:23:50.930166
26	mbankp@jimdo.com	mbankp	Maryjo	Bank	88c5aadbc0c437119482f5ee4fde436be4f7a97e52b483ba768b1301437234ff	1993-03-02	F	\N	&Umd%Co:aQv}[}pl,vT#/of{Hb!x$6R>\\[*PDA\\-#%Ty>2Um{A.@xfAQ+.j&|hD<	2025-03-23 19:23:50.961868
27	btwinameq@jalbum.net	btwinameq	Bonni	Twiname	6cbe40a3e3f15fafb5fca572cfa0cae90e70ca690d9cb56c5874d611e958992a	1998-07-05	F	\N	>#YqQ?2v_+;x8,xf8$.?U=I!8`Zzoy/1q-r<-v@v6w?I9[ES10)fhn;9Zxt*cT:1	2025-03-23 19:23:50.99587
28	sderillr@scientificamerican.com	sderillr	Susana	Derill	0501c4b32c37dd2b4ddcee546d27a658a9ff072a290bc75ea9a4eefa7b79795c	2007-01-09	F	\N	]P[`3:@n8,f4R2(!2QM[UX8UN~raOmN3<.M@.Y.O\\k8\\l1>i48h4XIoouC~ETiAB	2025-03-23 19:23:51.02728
29	lcolbruns@sourceforge.net	lcolbruns	Leonard	Colbrun	58475f04073ad3af6682e294ddc3e85847d7c756a7e51e186355a914e464eb65	1958-09-25	M	\N	jE8dr~S1YU>wFV(rM!4%u[y4*oUPleRE;.E)m)PgKrO;&5/a-YThjn#YT]fF*.4D	2025-03-23 19:23:51.061843
30	mduhamt@topsy.com	mduhamt	Molli	Duham	7465b606f2003c829be99cf55e6fd133776b9817a34592af9fe712efaf334e90	2007-01-30	F	\N	>INP.03`r;s*>GO-$d8J2|3dkR&p/FD@9,P)t6`#<\\hg\\Wgo7@Cd9N5mP</cN&Cx	2025-03-23 19:23:51.09364
31	kmapledooreu@ca.gov	kmapledooreu	Katrine	Mapledoore	57b68cbecf1125161106a6f409df362cbcc46679a3a153884d6940675f455b08	1991-03-12	F	\N	TcG3hC.7x-5!q*K:uk#Vrnn:G5*\\\\(|qp$LHUr%_0J@kr_OTLq.V6gE-~*{.rM:K	2025-03-23 19:23:51.126196
32	mshanksv@census.gov	mshanksv	Mable	Shanks	a7af95fbc815dec47125471e07d320f73a022f9843de3f0099ce2245a256d32b	1987-02-21	F	\N	W}bR/<qJ?d!-d*hP|(PBi8:-|8@@\\Nn46-rB/2?M8^N$!,5uF0;&A`yE;b@l07yZ	2025-03-23 19:23:51.160061
33	vseggiew@networksolutions.com	vseggiew	Vinni	Seggie	642b6375a3919c0c2857111d8a75451986df9c25b18f7727446db54997aca098	1961-10-04	F	\N	#{~SBxcmXW2\\@j+&?YK|Fir/5XY+PY75DL6VQ*.%^c0SfBs|5\\FI}-DU>K_.>QFs	2025-03-23 19:23:51.19206
34	adandyx@paypal.com	adandyx	Augusto	Dandy	1ae7f92a7ad70150799012822db988a999335c3168621393f7b43f59f4c105e8	1968-12-24	M	\N	?pQwA})<1qn){C:`Hk6*s0duuME3VsDi&yu:k33h2,4A6:)x9l8=B*4}T4f{s>yU	2025-03-23 19:23:51.223871
35	hmatheyy@list-manage.com	hmatheyy	Hailee	Mathey	1942b6ec438bb772e81be675193273f6536e8a9c54fe91f90e2ca67f81a00c39	1944-08-30	F	\N	0xek&O@sf?Jz@oV$Q<D(Wy]/XvIz1</!A_XNF0}Y-j|N+d,K,HOnpV\\5*@\\t*`@q	2025-03-23 19:23:51.256009
36	rablesonz@vinaora.com	rablesonz	Rhonda	Ableson	5278953fb26326bba9f28b3c6672ec77af69d0678ee6aaa1d861dfe97bacb703	1972-01-17	F	\N	QB<bfk[tM+J%.wYj-oq~Yo~bh%wu8iy(e@kNrE^/zAc-HTX)AwaDGwC$7{}d[c^Y	2025-03-23 19:23:51.287477
37	lohenehan10@marriott.com	lohenehan10	Leroy	O'Henehan	8473812110b7adbc0338fd81a694011f789c0b9e9b56015f13bef965d8902993	1954-03-19	M	\N	8N:Q?K`;4f&G+~0gS4Z7f7idUDqS;#(%EnZw~v@4<S~T(Cu&_Q;TPXufZ`gi*g{=	2025-03-23 19:23:51.32095
38	grummins11@state.gov	grummins11	Gaynor	Rummins	6c994bbf65b54cb9b503ee31a517205117aa48e2155c42ded53cccf410563297	1981-01-03	F	\N	[HL54v#Xag1^D+<2,Q>?!f<>n38{#L<@%63lLz5RlZh3(2lW}!k6)7bRW@@P-WVZ	2025-03-23 19:23:51.354486
39	gojeda12@mac.com	gojeda12	Goran	Ojeda	be11a10755d78e20452ef2c674912248941b035c95794125bf16bd768ef32492	1955-09-29	M	\N	9?1=pc{CupJ{$89;rKTP0mNs_K*N2}>V<^:[\\/`,sd,nD)$)>vPdJ7dR#eY/go^]	2025-03-23 19:23:51.387237
40	aelsbury13@miitbeian.gov.cn	aelsbury13	Ahmed	Elsbury	cdf4f6c681ba843fab03fd4c1608b78186f358f1b26342f6d16df3862d65e936	1958-08-07	M	\N	6vH[X@3u1exT0K$IsyFJ$r?zMh,ox5q02s}>8I}tOe}<oUKtY&C^oV9|@H,?}KT?	2025-03-23 19:23:51.420706
41	teversley14@hostgator.com	teversley14	Thedrick	Eversley	e94afc1d7a3a3f0df0c9e0477a4f3ba3bf32ede27f6493c524bd995b84da56d9	1982-02-03	M	\N	SUbp3xeO_\\e#VY!]wi1!uB4Y]XZ5NT[8{Z=]zA~DbZ3>3>:s}F*!-as#bk]pD.PG	2025-03-23 19:23:51.452236
42	ajoskovitch15@bigcartel.com	ajoskovitch15	Angelico	Joskovitch	35098afc52ac127c5f8d6ceb234bdf4d9d0b9064472843b371f1014532a43372	1983-01-10	M	\N	-cZZ7lv)(|f-#K9Y#5m1_50vK,zw4u5elR9.y|C=RT|(5udkV!)(w[U*8A1ko`l@	2025-03-23 19:23:51.487896
43	gcrosscombe16@usgs.gov	gcrosscombe16	Gregoor	Crosscombe	0693602f809ef40b863f0c3f123b5067e3c7302f9cca36ff331b4c3eaf197b31	1997-01-01	M	\N	Qm_sizmQTq3YV\\[lJ;#0V~_1K{*eBs|9A-!sB*59H=[#][NH}Hqh[0D&>4a{\\(MZ	2025-03-23 19:23:51.525677
44	emacmenamie17@last.fm	emacmenamie17	Ellen	MacMenamie	987a10c94a7e4f478ea7cfa456df9e5efc2f66a821261011023c18bac1bdcc1f	1964-04-06	F	\N	a^rewb4SxW,<1~yzgH*ULI}I#NG15A/o%33}F440s~d&Y\\bl{L7>>yjnpjE[>~Q;	2025-03-23 19:23:51.561983
45	fleport18@desdev.cn	fleport18	Faythe	Leport	46f6e4122cb2732feb9b1318ca61b57b3b4f32b8900456aa03a10edd5c5249d0	1989-01-29	F	\N	N<PjR!/)xV2XK3DOo>hwo[h-IkNww|r6tWp}QOG7Ien^@6.BQK/:r$;.ACT&`enJ	2025-03-23 19:23:51.593016
46	gmackinder19@newyorker.com	gmackinder19	Gabe	Mackinder	3c94def31a7c848e2e67183fe3168db0d350add9a1d38d333dc8c72fee977c5d	2003-12-25	M	\N	~@eA-cQ>zhf4;CNTEX`cXFp&hl8:M]_6tm=_=QP+?!W>l<H.v,G6!vO+9Y5O<fZ\\	2025-03-23 19:23:51.626429
47	gantognelli1a@nymag.com	gantognelli1a	Ginger	Antognelli	00bb9ce375a8d2db346fc00dfb95ba0491a683bd73ae960268b1f04bc96e996b	1997-01-04	F	\N	Td]ag]?Kw4<LQY7/w=dnUz2I;:S!E;vNLy&w]Fm\\I;s<y$s|3Jnf+AS,|rvkl)au	2025-03-23 19:23:51.658138
48	alantaph1b@umich.edu	alantaph1b	Audie	Lantaph	25692bdb9eb4f01e4bbc2bfdab03c173bca01e0dbaa95227c71d88da9ef48882	2006-02-28	F	\N	<JF5G9rD@M]>Cv_;Bi`yV2T`%G!@aa6h]#htpb{RP=1:V2`}4S?k+rDg98QF4aYp	2025-03-23 19:23:51.688757
49	chaswell1c@comcast.net	chaswell1c	Conroy	Haswell	7d910f87182369c3f213588a26d0f91016893c8b0ab0692505b22a54b0fdc56c	1988-02-24	M	\N	BGQsrg&XGmwtLAXQ/paYLPJ.{W`4=<jhLG?+-un}o}O!}Ut8DcZ$G3>3Y7h[jG`+	2025-03-23 19:23:51.721511
50	agarret1d@wp.com	agarret1d	Anabella	Garret	cd3ec17ac28a0a29979d615867624922b51347f65e95a9f88d1b6b8bdae918c7	1956-11-20	F	\N	eiyBw]l[o#2CEpDo1|},=/kF8}zVxWCH),LZFR[.[9&8H1UqozBIaHT@){kmK+TV	2025-03-23 19:23:51.752282
51	testuser@example.com	testuser	test	user	5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8	2002-11-23	M	\N	hP/.IjwSgOu7A?_;mQBjE{7CS(_5^DpU5q!0FK9h5ily={}DOR/Y&Il*Y,Y7s`H3	2025-03-30 14:14:37.341739
53	testuser1@example.com	testuser1	test	user	5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8	2002-11-23	M	\N	mq4&8$Q$gC2IlSSm`u&{y%@!h&0RB}WJ?V=;lA4qUk@bYchD0~hLV5_SDX$fq*ph	2025-03-30 14:17:38.742691
54	testuser2@example.com	testuser2	test2	user	5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8	2002-11-23	M	\N	xhvaqkI{kXWXX!z2tShUt_re1OSEe\\LXCAS`madA#I~k5jgm2y9WT\\ZpuYHqB>h`	2025-03-30 14:24:07.655789
55	testuser3@example.com	testuser3	test	user	5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8	2002-11-23	M	\N	yV}}<MG.,5cN?}d.3$]lak4$4:T,wqNo5(kkw_smZ|@G@iL[@+t4rjEv>.P{K,@^	2025-03-30 14:32:49.829952
56	testuser5@example.com	testuser5	test	user	5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8	2002-11-23	M	\N	U3Ev7f8U|aj5c?=Ia[aK:F9R2KF1#XMERo6!PqYCbzpoq=6n&`a.q]].QNNDD\\ZJ	2025-03-30 15:04:16.003074
57	example3@example.com	example4	John	Doe	5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8	2002-11-23	M	\N	K3rI=o!b[e?ZuNk~vu@H0k51{_H@TK{wanlr\\M(IvP?witVw]p8P)YN?IjBmn,Cg	2025-04-11 14:59:01.120902
59	example4@example.com	example5	John	Doe	5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8	2002-11-23	M	\N	#?^=r]2dkrLp3ICIh+<];Um7^<`8+/x/XPMxJ96i*`l:F*7VTbwc2o2R8_iJTBPD	2025-04-11 14:59:20.705811
60	example@example.com	example	John	Doe	5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8	2002-11-23	M	\N	.u;xH`U1k>BQ48=S^a8H}s$W^,+5`fo,Ow&L\\{%`FFf7XXn!ciOBXH7Qtc~fdF.|	2025-04-11 15:04:20.22295
61	example1@example.com	example1	John	Doe	5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8	2002-11-23	M	\N	a<rqr>rA=bo#PLJNE*R=r@C@P]X4hby;YkH&j,VQxPqg^9rd0n3s@,O^3e.z)uIi	2025-04-11 15:14:02.863523
62	testuser6@test.com	testuser6	test	user6	5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8	2025-01-01	M	\N	0}254c.L10Cu&\\2B;a)e;To>./?Bh35s=F00YJv*52|}6tCK8Jufl`$)9J}ex2z{	2025-04-11 15:26:16.887637
\.


--
-- Data for Name: weight_goals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.weight_goals (id, user_id, goal_type, created_at, achieve_by, achieved, achieved_at, notes, target_weight) FROM stdin;
1	51	weight	2025-04-12 18:26:24.428153	2025-11-23	f	\N	\N	215.00
\.


--
-- Data for Name: workout_cardio; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workout_cardio (id, workout_id, duration, distance, percieved_difficulty, notes) FROM stdin;
\.


--
-- Data for Name: workout_exercises; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workout_exercises (id, workout_id, exercise_id, order_exercise, notes, date_performed, sets) FROM stdin;
411	108	273	1		2025-04-01 18:28:39.414568	({1},{normal},{300.00},{3},-1)
412	109	716	1		2025-04-01 18:31:47.020837	({1},{normal},{415.00},{2},-1)
413	110	273	1		2025-04-09 17:21:35.411209	({1},{normal},{225.00},{5},-1)
414	111	716	1		2025-04-09 18:44:34.641196	({1},{normal},{315.00},{5},-1)
415	112	273	1		2025-04-09 18:47:33.470765	({1},{normal},{405.00},{5},-1)
416	113	273	1		2025-04-09 19:03:54.796719	({1},{normal},{305.00},{5},-1)
417	114	273	1		2025-04-09 20:25:33.587036	({1},{normal},{250.00},{5},-1)
418	115	273	1		2025-04-09 20:32:22.386201	({1},{normal},{250.00},{5},-1)
\.


--
-- Data for Name: workouts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workouts (id, name, user_id, workout_type, workout_date, notes, average_heart_rate) FROM stdin;
108	test workout for max	51	strength	2025-04-01 18:28:39.40076		0
109	Squat test max	51	strength	2025-04-01 18:31:47.015224		120
110	test workout	51	strength	2025-04-09 17:21:35.382281		120
111	test workout	53	strength	2025-04-09 18:44:34.630734		100
112	test workout	54	strength	2025-04-09 18:47:33.465978		100
113	Workout 1	51	strength	2025-04-09 19:03:54.789757		145
114	testWorkout	51	strength	2025-04-09 20:25:33.574601		120
115	test	53	strength	2025-04-09 20:32:22.378502		120
\.


--
-- Name: exercises_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.exercises_id_seq', 873, true);


--
-- Name: family_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.family_id_seq', 9, true);


--
-- Name: family_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.family_requests_id_seq', 10, true);


--
-- Name: motivational_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.motivational_messages_id_seq', 1, false);


--
-- Name: predictiveanalysis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.predictiveanalysis_id_seq', 1, false);


--
-- Name: user_engagement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_engagement_id_seq', 65, true);


--
-- Name: user_exercise_max_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_exercise_max_id_seq', 211, true);


--
-- Name: user_goals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_goals_id_seq', 3, true);


--
-- Name: user_stats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_stats_id_seq', 59, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 62, true);


--
-- Name: workout_cardio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.workout_cardio_id_seq', 1, false);


--
-- Name: workout_exercises_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.workout_exercises_id_seq', 418, true);


--
-- Name: workouts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.workouts_id_seq', 115, true);


--
-- Name: exercises exercises_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_pkey PRIMARY KEY (id);


--
-- Name: family family_family_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family
    ADD CONSTRAINT family_family_name_key UNIQUE (family_name);


--
-- Name: family_members family_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_members
    ADD CONSTRAINT family_members_pkey PRIMARY KEY (family_id, user_id);


--
-- Name: family family_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family
    ADD CONSTRAINT family_pkey PRIMARY KEY (id);


--
-- Name: family_requests family_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_requests
    ADD CONSTRAINT family_requests_pkey PRIMARY KEY (id);


--
-- Name: motivational_messages motivational_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.motivational_messages
    ADD CONSTRAINT motivational_messages_pkey PRIMARY KEY (id);


--
-- Name: predictive_exercise predictive_exercise_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictive_exercise
    ADD CONSTRAINT predictive_exercise_pkey PRIMARY KEY (predictive_id, exercise_id);


--
-- Name: predictiveanalysis predictiveanalysis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictiveanalysis
    ADD CONSTRAINT predictiveanalysis_pkey PRIMARY KEY (id);


--
-- Name: user_engagement user_engagement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_engagement
    ADD CONSTRAINT user_engagement_pkey PRIMARY KEY (id);


--
-- Name: user_exercise_max user_exercise_max_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_exercise_max
    ADD CONSTRAINT user_exercise_max_pkey PRIMARY KEY (id);


--
-- Name: user_goals user_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_goals
    ADD CONSTRAINT user_goals_pkey PRIMARY KEY (id);


--
-- Name: user_stats user_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_stats
    ADD CONSTRAINT user_stats_pkey PRIMARY KEY (id);


--
-- Name: user_steps user_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_steps
    ADD CONSTRAINT user_steps_pkey PRIMARY KEY (user_id, date_performed);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_key_key UNIQUE (key);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: workout_cardio workout_cardio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workout_cardio
    ADD CONSTRAINT workout_cardio_pkey PRIMARY KEY (id);


--
-- Name: workout_exercises workout_exercises_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workout_exercises
    ADD CONSTRAINT workout_exercises_pkey PRIMARY KEY (id);


--
-- Name: workouts workouts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workouts
    ADD CONSTRAINT workouts_pkey PRIMARY KEY (id);


--
-- Name: exercises exercises_createdby_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_createdby_fkey FOREIGN KEY (createdby) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: family family_family_admin_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family
    ADD CONSTRAINT family_family_admin_fkey FOREIGN KEY (family_admin) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: family_members family_members_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_members
    ADD CONSTRAINT family_members_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.family(id) ON DELETE CASCADE;


--
-- Name: family_members family_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_members
    ADD CONSTRAINT family_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: family_requests family_requests_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_requests
    ADD CONSTRAINT family_requests_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.family(id) ON DELETE CASCADE;


--
-- Name: family_requests family_requests_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_requests
    ADD CONSTRAINT family_requests_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: family_requests family_requests_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_requests
    ADD CONSTRAINT family_requests_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: predictive_exercise predictive_exercise_exercise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictive_exercise
    ADD CONSTRAINT predictive_exercise_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE;


--
-- Name: predictive_exercise predictive_exercise_predictive_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictive_exercise
    ADD CONSTRAINT predictive_exercise_predictive_id_fkey FOREIGN KEY (predictive_id) REFERENCES public.predictiveanalysis(id) ON DELETE CASCADE;


--
-- Name: predictiveanalysis predictiveanalysis_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictiveanalysis
    ADD CONSTRAINT predictiveanalysis_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: strength_goals strength_goals_target_exercise_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.strength_goals
    ADD CONSTRAINT strength_goals_target_exercise_fkey FOREIGN KEY (target_exercise) REFERENCES public.exercises(id) ON DELETE SET NULL;


--
-- Name: user_engagement user_engagement_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_engagement
    ADD CONSTRAINT user_engagement_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_exercise_max user_exercise_max_exercise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_exercise_max
    ADD CONSTRAINT user_exercise_max_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE SET NULL;


--
-- Name: user_exercise_max user_exercise_max_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_exercise_max
    ADD CONSTRAINT user_exercise_max_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_goals user_goals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_goals
    ADD CONSTRAINT user_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_stats user_stats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_stats
    ADD CONSTRAINT user_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_steps user_steps_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_steps
    ADD CONSTRAINT user_steps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: workout_cardio workout_cardio_workout_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workout_cardio
    ADD CONSTRAINT workout_cardio_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES public.workouts(id) ON DELETE CASCADE;


--
-- Name: workout_exercises workout_exercises_exercise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workout_exercises
    ADD CONSTRAINT workout_exercises_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE SET NULL;


--
-- Name: workout_exercises workout_exercises_workout_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workout_exercises
    ADD CONSTRAINT workout_exercises_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES public.workouts(id) ON DELETE CASCADE;


--
-- Name: workouts workouts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workouts
    ADD CONSTRAINT workouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

