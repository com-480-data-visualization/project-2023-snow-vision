#!/usr/bin/env bash

THIS_PATH=$(realpath "$(dirname "$0")")

docker run --name snowvision_nginx -v "$THIS_PATH:/usr/share/nginx/html" -p 8888:80 -ti -d --rm nginx:alpine
