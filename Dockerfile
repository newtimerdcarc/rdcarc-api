FROM node:18.17.0

WORKDIR /usr/src/app

COPY . .

RUN npm install --frozen-lockfile
RUN npm run build

EXPOSE 3000

USER node

CMD ["npm", "run", "start:prod"]