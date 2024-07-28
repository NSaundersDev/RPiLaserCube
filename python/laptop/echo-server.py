import sm_tc
from socket import *
import os

host = "0.0.0.0"
port = 8081
s = socket(AF_INET, SOCK_STREAM)
s.bind((host,port))

while True == True:
	s.listen(5)

	q,addr = s.accept()

	t = sm_tc.SMtc(0)
	
	temp = t.get_temp(1)
	
	sendData = "Temp: " + str(temp)
	encodedData = sendData.encode()
	q.send(encodedData)  

s.close()
print("Loop ended")

