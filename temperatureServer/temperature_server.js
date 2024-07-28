const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const { exec } = require('child_process');
const app = express();

const port = 8080;
const server = http.createServer(app);

const ws_server = new WebSocket.Server({ server });

let recordState = 0;
let sampleRate = 1000; // default one sample per second

ws_server.on('connection', function connection(ws) {
  ws.on('connection', function connection(ws) {
    ws.isAlive = true;
  });

  ws.on('message', function incoming(message) {
    let strings = message.toString().split(",");
    console.log(strings);
    if(strings[0] == 'go'){
      let interval = setInterval(() => {
        ws_server.clients.forEach((client) => {
          exec('./read_all_temperatures.sh', (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          console.log(`${stdout}`);
          ws.send(JSON.stringify(stdout));
        });
      });}, sampleRate);

      // on msg, respond with a timestamp and the thermocouple data
      // console.log('received msg!');
      console.log("command: " + message.toString());
    }
    processCommand(strings[0]);
  });

  ws.on('close', function close() {
    clearInterval(interval);
  });
});

function processCommand(command) {
  switch(command.toString()){
    case "go":
      console.log("processing go command");
      return;
    case "R~":
      // stop recording
      recordState = 1;
      console.log("processing start recording command");
      return;
    case "X":
      recordState = 0;
      // start recording
      console.log("processing stop recording command");
      return;
    case "stop":
      recordState = 0;
      console.log("processing stop command");
      return;
    default:
      console.log("command not recognized: " + command.toString());
      return;
  }
}

server.listen(port, function(err) {
    if (err) {
        throw err;
    }
    console.log(`listening on port ${port}!`);
});
