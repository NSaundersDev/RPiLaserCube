from socket import *

host = socket.gethostbyname("192.168.1.9")
s.bind((host, port))
print(host)

port=8080

s=socket(AF_INET, SOCK_STREAM)

print("socket made")

s.connect((host,port))

print("socket connected!!!")

msg=s.recv(1024)

print(msg)
