FROM node:20.18.1 AS build

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


# EXPOSE 5173

# # Use the official NGINX image for production
# FROM nginx:stable-alpine as production

# # # copy nginx configuration in side conf.d folder
# COPY --from=build /app/src/app/nginx/nginx.conf /etc/nginx/default.conf



# # Expose port 80 to allow access to the app
# EXPOSE 4173

# # Run Nginx in the foreground
# ENTRYPOINT ["nginx", "-g", "daemon off;"]


# CMD ["npm", "run", "start"]
