FROM node

#Adding project folder and changing dir
ADD . /project
WORKDIR /project

#Executing commands to build the applicaiton over docker
RUN npm install
RUN npm run build

#Exposing port for viewing the application from outside
EXPOSE 3000
