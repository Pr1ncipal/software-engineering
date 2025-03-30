FROM python:latest

# Create app directory
WORKDIR /app

# Install app dependencies
COPY requirements.txt ./

RUN pip install -r requirements.txt

# Bundle app source
COPY leaderboard.py /app/leaderboard.py
COPY leaderboardClass.py /app/leaderboardClass.py
COPY leaderboardErrors.py /app/leaderboardErrors.py
COPY global_func.py /app/global_func.py

EXPOSE 8080
CMD [ "python", "leaderboard.py" ]