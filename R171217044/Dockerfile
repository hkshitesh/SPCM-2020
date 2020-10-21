From node:latest

RUN mkdir -p /usr/src/app

Workdir /usr/src/app

copy package*.json ./

run npm install

copy . .

cmd ["npm","start"]
