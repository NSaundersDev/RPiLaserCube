from socket import *
import os

host = "127.0.0.1"

port = 8080

s = socket(AF_INET, SOCK_STREAM)

s.bind((host,port))

s.listen(5)

print("Listening for connections...")

q,addr = s.accept()

data = input("Enter data to be sent: ")
encodedData = data.encode();
q.send(encodedData)  
