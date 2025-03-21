FROM python:latest

# Create app directory
WORKDIR /app

# Install app dependencies
COPY requirements.txt ./

RUN pip install -r requirements.txt

# Bundle app source
COPY user.py /app/user.py
COPY userClass.py /app/userClass.py
COPY userErrors.py /app/userErrors.py
COPY global_func.py /app/global_func.py

EXPOSE 8080
CMD [ "python", "user.py" ]