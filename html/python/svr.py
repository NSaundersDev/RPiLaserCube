import socket

def handle_connection(conn, addr):
  print(f"connectioed by {addr}")
  while True:
    data = conn.recv(1024)
    if not data:
      break
    print(f"recieved: {data.decode()}")
    conn.sendall(data)
  print("connection closed")

server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server_socket.bind(("localhost", 8080))
server_socket.listen(5)

print("Server started. Listening for connections")

while True:
  conn, addr = server_socket.accept()
  handle_connection(conn, addr)
  conn.close()
