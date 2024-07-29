const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const { exec } = require('child_process');
const app = express();

const port = 8080;
const server = http.createServer(app);

const ws_server = new WebSocket.Server({ server });

const READ_SCRIPT = './var/www/html/temperatureServer/read_all_temperatures.sh';
const LOG_SCRIPT = './var/www/html/temperatureServer/log_all_temperatures.sh';
let recordState = 0;
let sampleInterval = 1000; // default one sample per second
let interval = null;

ws_server.on('connection', function connection(ws) {

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
       sampleInterval = 1000;
       interval = setInterval(() => {
        ws_server.clients.forEach((client) => {
          exec(READ_SCRIPT, (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          console.log(`${stdout}`);
          ws.send(JSON.stringify(stdout));
        });
      });}, sampleInterval);
      console.log("processing go command");
      return;
    case "R~":
      // stop recording
      recordState = 1;
      interval = setInterval(() => {
        ws_server.clients.forEach((client) => {
          console.log(LOG_SCRIPT);
          exec(LOG_SCRIPT, (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          console.log(`${stdout}`);
          ws.send(JSON.stringify(stdout));
        });
      });}, sampleInterval);
      console.log("processing start recording command");
      return;
    case "X":
      recordState = 0;
      // start recording
      interval = setInterval(() => {
        ws_server.clients.forEach((client) => {
          exec(READ_SCRIPT, (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          console.log(`${stdout}`);
          ws.send(JSON.stringify(stdout));
        });
      });}, sampleInterval);
      console.log("processing stop recording command");
      return;
    case "stop":
      interval = setInterval(() => {
        ws_server.clients.forEach((client) => {
          exec(READ_SCRIPT, (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          console.log(`${stdout}`);
          ws.send(JSON.stringify(stdout));
        });
      });}, sampleInterval);
      recordState = 0;
      console.log("processing stop command");
      return;

    case "d":
      let val = parseFloat(commands[1]);
      console.log(val);
      sampleInterval = parseFloat(commands[1]);
      interval = setInterval(() => {
        ws_server.clients.forEach((client) => {
          exec(READ_SCRIPT, (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          console.log(`${stdout}`);
          ws.send(JSON.stringify(stdout));
        });
      });}, sampleInterval);
      break;
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