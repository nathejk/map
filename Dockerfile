FROM node:argon
MAINTAINER Asbjørn Thegler <asbjoern@gmail.com>

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

EXPOSE 9080

ENV NODE_ENV production

CMD [ "npm", "start" ]
