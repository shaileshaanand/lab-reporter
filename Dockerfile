FROM node:16.15-alpine3.14

ENV NODE_ENV production

RUN apk add --no-cache dumb-init

RUN mkdir /home/node/app/ && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY --chown=node:node package*.json ./

USER node

RUN npm ci --only=production && npm cache clean --force --loglevel=error

COPY --chown=node:node . .

CMD [ "dumb-init" ,"node", "src"] 