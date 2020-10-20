version: '3.3'

services:
   database:
     image: mysql:5.7
     restart: always
     environment:
       MYSQL_ROOT_PASSWORD: root
       MYSQL_DATABASE: sysprov
       MYSQL_USER: mudit
       MYSQL_PASSWORD: 123456

   webapp:
     depends_on:
       - database
     image:  mudit999/spcm-test-repo
     ports:
       - "8000:80"
     restart: always
