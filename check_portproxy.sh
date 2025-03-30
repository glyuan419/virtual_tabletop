#!/bin/bash

powershell.exe -Command "netsh interface portproxy show all"

# 将主机的 5000 端口转发到 WSL 的 5000 端口（用管理员身份启动 powershell）
# netsh interface portproxy add v4tov4 listenport=5000 listenaddress=0.0.0.0 connectport=5000 connectaddress=172.23.41.228
