import sm_tc
import time
import threading as th
import sys
from datetime import datetime
import os
from socket import *

host="192.168.1.9"
port=8081
s = socket(AF_INET, SOCK_STREAM)
s.bind((host,port))

keep_going=True

def key_capture_thread():
    global keep_going
    input()
    keep_going = False

t = sm_tc.SMtc(0)



while keep_going:
  s.listen(5)
  q,addr = s.accept()  
  # read temps from thermocouples
  temp = t.get_temp(1)

  sendData = str(temp)
  encodedData = sendData.encode()
  q.send(encodedData)
  s.close()
  time.sleep(1)

