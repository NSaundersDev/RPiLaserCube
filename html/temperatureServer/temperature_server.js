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
let interval = null;

ws_server.on('connection', function connection(ws) {

  ws.on('connection', function connection(ws) {
    ws.isAlive = true;
  });

  ws.on('message', function incoming(message) {
    let strings = message.toString().split(",");
    console.log(strings);
    clearInterval(interval);
    processCommand(strings, ws);
  });

  ws.on('close', function close() {
    clearInterval(interval);
  });
});

function processCommand(commands, ws) {
  let command = commands[0];
  let name = null;

  if(commands.length > 1) {
    name = commands[1];
    console.log(commands[1]);
  }

  switch(command){
    case "go":
       interval = setInterval(() => {
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
      console.log("processing go command");
      return;
    case "R~":
      // stop recording
      recordState = 1;
      interval = setInterval(() => {
        ws_server.clients.forEach((client) => {
          exec('./log_all_temperatures.sh', (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          console.log(`${stdout}`);
          ws.send(JSON.stringify(stdout));
        });
      });}, sampleRate);
      console.log("processing start recording command");
      return;
    case "X":
      recordState = 0;
      // start recording
      interval = setInterval(() => {
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
      console.log("processing stop recording command");
      return;
    case "stop":
      interval = setInterval(() => {
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
