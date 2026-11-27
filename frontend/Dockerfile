FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
# Copy built static files to nginx HTML directory
COPY --from=builder /app/dist /usr/share/nginx/html
# Add custom Nginx config for the React app and backend API
# client_max_body_size: nginx defaults to 1 MB, which rejected model uploads with 413.
# Allow the backend's 200 MB model limit plus multipart overhead.
# (No comments inside the echo: the config is joined into one line, so '#' would cut it off.)
RUN echo 'server { \
    listen 80; \
    client_max_body_size 210m; \
    location /api/ { \
        proxy_pass http://backend:8000/; \
        proxy_request_buffering off; \
        proxy_read_timeout 300s; \
        proxy_send_timeout 300s; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
