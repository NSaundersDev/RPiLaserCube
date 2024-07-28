const WebSocket = require('ws');
const ws = new WebSocket("ws://localhost:8080");
var io = require('socket.io').listen(80); // initiate socket.io server

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' }); // Send data to client

  // wait for the event raised by the client
  socket.on('my other event', function (data) {  
    console.log(data);
  });
});

ws.on('open', () => {
  console.log('connected to python svr');
});

ws.on('message', (data) => {
  console.log('Data received from server: ${data}');
});

ws.on('close', () => {
  console.log('connection closed');
});
