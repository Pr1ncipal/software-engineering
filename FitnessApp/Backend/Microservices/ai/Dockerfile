FROM python:latest

# Create app directory
WORKDIR /app

# Install app dependencies
COPY requirements.txt ./

RUN pip install -r requirements.txt

# Bundle app source
COPY server.py /app/server.py
COPY getData.py /app/getData.py
COPY global_func.py /app/global_func.py

EXPOSE 5000

CMD [ "python", "server.py" ]