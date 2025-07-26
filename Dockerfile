FROM node:24.4.1

WORKDIR /usr/src/app

COPY . .

RUN npm install

EXPOSE 3000

CMD ["npm", "start"]
