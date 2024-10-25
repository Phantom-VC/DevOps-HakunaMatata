# Use an official Nginx runtime as a parent image
FROM nginx:stable

# Copy the HTML, CSS and Javascript files into the container
COPY index.html /usr/share/nginx/html/ 
COPY style.css /usr/share/nginx/html/ 
COPY scipt.js /usr/share/nginx/html/ 

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]