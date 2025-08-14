# 纯静态前端，用 nginx 提供静态服务
FROM nginx:alpine
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./ /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
