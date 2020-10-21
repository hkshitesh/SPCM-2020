#!/bin/sh
amazon-linux-extras install epel -y
yum install nginx -y
echo -e "upstream backend {\n    server server1:8080;\n    server server2:8080;\n}" > /etc/nginx/conf.d/backend_upstream.conf
echo -e "location /app1/ {\n  proxy_pass http://backend/;\n}" > /etc/nginx/default.d/backend_proxy.conf
systemctl enable nginx
systemctl restart nginx
