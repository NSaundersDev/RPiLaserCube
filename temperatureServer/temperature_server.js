const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const { exec } = require('child_process');
const app = express();

const port = 8080;
const server = http.createServer(app);

const ws_server = new WebSocket.Server({ server });

ws_server.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
      // on msg, respond with a timestamp and the thermocouple data
      // console.log('received msg!');
      console.log("command: " + message.toString());
      processCommand(message);
  });
  let out = "";
  setInterval(() => {
    ws_server.clients.forEach((client) => {
    exec('./read_all_temperatures.sh', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
    console.log(`${stdout}`);
    ws.send(JSON.stringify(stdout));
});
    });
  }, 500);

});

function processCommand(command) {
  switch(command.toString()){
    case "go":
      console.log("processing go command");
      break;
    case "~R":
      console.log("processing record command");
      break;
    case "stop":
      console.log("processing stop command");
      break;
    default:
      console.log("command not recognized: " + command.toString());
  }
}


server.listen(port, function(err) {
    if (err) {
        throw err;
    }
    console.log(`listening on port ${port}!`);
});


function getTemperatureData() {
  const childProcess = require('child_process').spawn('./read_all_temperatures.sh');

	  // Pipe the stdout of the child process to the WebSocket connection
  childProcess.stdout.on('data', (data) => {
    WebSocket.send(data);
  });
}
