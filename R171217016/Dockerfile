From node

ADD . /
WORKDIR /

RUN npm --version
RUN npm build

EXPOSE 5000
CMD ["node", "app.js"]

