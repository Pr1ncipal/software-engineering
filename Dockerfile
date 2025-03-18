FROM postgres:latest

#Can change password for local instance if desired
ENV POSTGRES_PASSWORD password

#Name the database here before you start
ENV POSTGRES_DB sam_DB

#Can change user for local instance if desired
ENV POSTGRES_USER postgres


#Allows for data to be input into the database on startup
COPY database.sql /docker-entrypoint-initdb.d/gitfitbro.sql
COPY database.sql /tmp/gitfitbro.sql

#Expose the port for the database
EXPOSE 5432

CMD [ "postgres" ]