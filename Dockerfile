FROM node:latest
COPY . /extractor
WORKDIR /extractor
RUN npm install

ENTRYPOINT ["node", "index.js"]