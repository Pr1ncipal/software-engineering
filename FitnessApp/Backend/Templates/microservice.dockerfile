#Should assume we are using this version of python
FROM python:3.14-rc-bookworm

WORKDIR /app

#Copy code and requirements to the docker container filesystem
COPY /FitnessApp/Backend/Microservices/MicroServiceName.py /app/MicroServiceName.py
COPY /FitnessApp/Backend/Microservices/MicroServiceName_requirements.txt /app/MicroServiceName_requirements.txt

#Install the requirements
RUN pip install --no-cache-dir -r MicroServiceName_requirements.txt

#Expose the port the app runs on
EXPOSE 8080

#Need to create a user to run the app as
RUN useradd -m myuser
USER myuser

#Run the application
CMD ["python", "MicroServiceName.py"]