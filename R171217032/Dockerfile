FROM python
RUN apt-get update -y
RUN pip install Flask
RUN pip install flask_mysqldb
RUN pip install wtforms
RUN pip install passlib
COPY ./Flask-Webapplication-with-mysql /var/www/html/
ENTRYPOINT python /var/www/html/app.py
