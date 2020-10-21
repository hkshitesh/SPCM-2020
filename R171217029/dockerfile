FROM phpmyadmin:latest
RUN apt-get update -y
COPY ./todolist/apache2.conf /etc/apache2/apache2.conf
COPY ./todolist /var/www/html/

