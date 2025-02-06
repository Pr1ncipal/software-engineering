FROM devopsfaith/krakend

# Copy the krakend configuration file
COPY /FitnessApp/Backend/API_gateway/krakend.json /etc/krakend/krakend.json

# Expose the port the app runs on
EXPOSE 8080

# Run the application
CMD ["krakend", "run", "-c", "/etc/krakend/krakend.json"]