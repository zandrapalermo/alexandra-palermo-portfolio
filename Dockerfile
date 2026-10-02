# Start from a small, official web server image
FROM nginx:alpine

# Copy your site files into nginx's default folder for serving web pages.
# Copies everything in the project (HTML pages, style.css, script.js,
# fonts/) so new pages don't need a Dockerfile change to be served.
COPY . /usr/share/nginx/html/

# Serve clean URLs locally (e.g. /repquest -> repquest.html), matching
# the cleanUrls behavior configured for the live Vercel deployment.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# nginx listens on port 80 inside the container by default
EXPOSE 80
