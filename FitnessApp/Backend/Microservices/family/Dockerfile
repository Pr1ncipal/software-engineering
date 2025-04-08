FROM python:latest

# Create app directory
WORKDIR /app

# Install app dependencies
COPY requirements.txt ./

RUN pip install -r requirements.txt

# Bundle app source
COPY family.py /app/family.py
COPY familyClass.py /app/familyClass.py
COPY familyErrors.py /app/familyErrors.py
COPY global_func.py /app/global_func.py

EXPOSE 8080

CMD [ "python", "family.py" ]