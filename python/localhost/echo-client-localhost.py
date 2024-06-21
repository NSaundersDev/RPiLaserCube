from socket import *

host = "127.0.0.1"

print(host)

port=8080

s=socket(AF_INET, SOCK_STREAM)

print("socket made")

s.connect((host,port))

print("socket connected!!!")

msg=s.recv(1024)

print(msg)
