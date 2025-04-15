FROM node:23.11.0-slim AS build

WORKDIR /app

COPY package.json .

# If you have a lock file
COPY package-lock.json . 



# Install dependencies
RUN npm i

COPY . .


RUN npm run build


RUN npm install -g serve 

CMD ["serve", "-s", "/app/dist", "-l", "5173"]

EXPOSE 5173
