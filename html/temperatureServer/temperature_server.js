const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const { exec } = require('child_process');
const app = express();

const port = 8080;
const server = http.createServer(app);

const ws_server = new WebSocket.Server({ server });

const READ_SCRIPT = '/var/www/html/temperatureServer/read_all_temperatures.sh';
const LOG_SCRIPT = 'sudo ./log_temperatures.sh ';
let currentScript = READ_SCRIPT;
let isFahrenheit = false;
let currentDate = null;

let recordState = 0;
let currentFileName = null;
let sampleInterval = 1000; // default one sample per second
let interval = null;

ws_server.on('connection', function connection(ws) {

  ws.on('message', function incoming(message) {
    let strings = message.toString().split(",");
    // console.log(strings);
    clearInterval(interval);
    processCommand(strings, ws);
  });

  ws.on('close', function close() {
    clearInterval(interval);
  });
});

function processCommand(commands, ws) {
  clearInterval(interval);
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
          exec(READ_SCRIPT, (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          if(isFahrenheit == true) {
            let str = JSON.stringify(stdout).split(",");
            let d = str[0] + ",";
            let t1 = (parseFloat(str[1]) * 9 / 5 + 32).toString()+",";
            let t2 = (parseFloat(str[2]) * 9 / 5 + 32).toString()+",";
            let t3 = (parseFloat(str[3]) * 9 / 5 + 32).toString()+",";
            let t4 = (parseFloat(str[4]) * 9 / 5 + 32).toString()+",";
            let t5 = (parseFloat(str[5]) * 9 / 5 + 32).toString()+",";
            let t6 = (parseFloat(str[6]) * 9 / 5 + 32).toString()+",";
            let t7 = (parseFloat(str[7]) * 9 / 5 + 32).toString()+",";
            let t8 = (parseFloat(str[8]) * 9 / 5 + 32).toString()+",";
            ws.send(JSON.stringify(d+t1+t2+t3+t4+t5+t6+t7+t8));
          }
          else {
            ws.send(JSON.stringify(stdout));
          }
        });
      });}, sampleInterval);
      console.log("processing go command");
      return;
    case "R~":
      recordState = 1;
      interval = setInterval(() => {
        ws_server.clients.forEach((client) => {
          if(currentDate == null) {
            currentDate = new Date();
            currentFileName = commands[1];
          }
          exec(LOG_SCRIPT + currentDate.toLocaleTimeString() + "_" + commands[1], (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          if(isFahrenheit == true) {
            let str = JSON.stringify(stdout).split(",");
            let d = str[0] + ",";
            let t1 = (parseFloat(str[1]) * 9 / 5 + 32).toString()+",";
            let t2 = (parseFloat(str[2]) * 9 / 5 + 32).toString()+",";
            let t3 = (parseFloat(str[3]) * 9 / 5 + 32).toString()+",";
            let t4 = (parseFloat(str[4]) * 9 / 5 + 32).toString()+",";
            let t5 = (parseFloat(str[5]) * 9 / 5 + 32).toString()+",";
            let t6 = (parseFloat(str[6]) * 9 / 5 + 32).toString()+",";
            let t7 = (parseFloat(str[7]) * 9 / 5 + 32).toString()+",";
            let t8 = (parseFloat(str[8]) * 9 / 5 + 32).toString()+",";
            ws.send(JSON.stringify(d+t1+t2+t3+t4+t5+t6+t7+t8));
          }
          else {
            ws.send(JSON.stringify(stdout));
          }
        });
      });}, sampleInterval);
      console.log("processing start recording command");
      return;
    case "X":
      recordState = 0;
      exec("./stop_logging_temperatures.sh " + currentDate.toLocaleTimeString() + "_" + currentFileName, (error, stdout, stderr) => {
        if(error) {
          console.error(`exec error: ${error}`);
          return;
        }
      });
      currentFileName = null;
      currentDate = null;
      interval = setInterval(() => {
        ws_server.clients.forEach((client) => {
          exec(READ_SCRIPT, (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          if(isFahrenheit == true) {
            let str = JSON.stringify(stdout).split(",");
            let d = str[0] + ",";
            let t1 = (parseFloat(str[1]) * 9 / 5 + 32).toString()+",";
            let t2 = (parseFloat(str[2]) * 9 / 5 + 32).toString()+",";
            let t3 = (parseFloat(str[3]) * 9 / 5 + 32).toString()+",";
            let t4 = (parseFloat(str[4]) * 9 / 5 + 32).toString()+",";
            let t5 = (parseFloat(str[5]) * 9 / 5 + 32).toString()+",";
            let t6 = (parseFloat(str[6]) * 9 / 5 + 32).toString()+",";
            let t7 = (parseFloat(str[7]) * 9 / 5 + 32).toString()+",";
            let t8 = (parseFloat(str[8]) * 9 / 5 + 32).toString()+",";
            ws.send(JSON.stringify(d+t1+t2+t3+t4+t5+t6+t7+t8));
          }
          else {
            ws.send(JSON.stringify(stdout));
          }
        });
      });}, sampleInterval);
      console.log("processing stop recording command");
      return;
    case "stop":
      exec("./stop_logging_temperatures.sh", (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        console.log("stopped logging temperatures.");
      });
      interval = setInterval(() => {
        ws_server.clients.forEach((client) => {
          exec(READ_SCRIPT, (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          if(isFahrenheit == true) {
            let str = JSON.stringify(stdout).split(",");
            let d = str[0] + ",";
            let t1 = (parseFloat(str[1]) * 9 / 5 + 32).toString()+",";
            let t2 = (parseFloat(str[2]) * 9 / 5 + 32).toString()+",";
            let t3 = (parseFloat(str[3]) * 9 / 5 + 32).toString()+",";
            let t4 = (parseFloat(str[4]) * 9 / 5 + 32).toString()+",";
            let t5 = (parseFloat(str[5]) * 9 / 5 + 32).toString()+",";
            let t6 = (parseFloat(str[6]) * 9 / 5 + 32).toString()+",";
            let t7 = (parseFloat(str[7]) * 9 / 5 + 32).toString()+",";
            let t8 = (parseFloat(str[8]) * 9 / 5 + 32).toString()+",";
            ws.send(JSON.stringify(d+t1+t2+t3+t4+t5+t6+t7+t8));
          }
          else {
            ws.send(JSON.stringify(stdout));
          }
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
          if(isFahrenheit == true) {
            let str = JSON.stringify(stdout).split(",");
            let d = str[0] + ",";
            let t1 = (parseFloat(str[1]) * 9 / 5 + 32).toString()+",";
            let t2 = (parseFloat(str[2]) * 9 / 5 + 32).toString()+",";
            let t3 = (parseFloat(str[3]) * 9 / 5 + 32).toString()+",";
            let t4 = (parseFloat(str[4]) * 9 / 5 + 32).toString()+",";
            let t5 = (parseFloat(str[5]) * 9 / 5 + 32).toString()+",";
            let t6 = (parseFloat(str[6]) * 9 / 5 + 32).toString()+",";
            let t7 = (parseFloat(str[7]) * 9 / 5 + 32).toString()+",";
            let t8 = (parseFloat(str[8]) * 9 / 5 + 32).toString()+",";
            ws.send(JSON.stringify(d+t1+t2+t3+t4+t5+t6+t7+t8));
          }
          else {
            ws.send(JSON.stringify(stdout));
          }
        });
      });}, sampleInterval);
      break;
    case "f":
      isFahrenheit = !isFahrenheit;
      interval = setInterval(() => {
        ws_server.clients.forEach((client) => {
          exec(READ_SCRIPT, (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          if(isFahrenheit == true) {
            let str = JSON.stringify(stdout).split(",");
            let d = str[0] + ",";
            let t1 = (parseFloat(str[1]) * 9 / 5 + 32).toString()+",";
            let t2 = (parseFloat(str[2]) * 9 / 5 + 32).toString()+",";
            let t3 = (parseFloat(str[3]) * 9 / 5 + 32).toString()+",";
            let t4 = (parseFloat(str[4]) * 9 / 5 + 32).toString()+",";
            let t5 = (parseFloat(str[5]) * 9 / 5 + 32).toString()+",";
            let t6 = (parseFloat(str[6]) * 9 / 5 + 32).toString()+",";
            let t7 = (parseFloat(str[7]) * 9 / 5 + 32).toString()+",";
            let t8 = (parseFloat(str[8]) * 9 / 5 + 32).toString()+",";
            ws.send(JSON.stringify(d+t1+t2+t3+t4+t5+t6+t7+t8));
          }
          else {
            ws.send(JSON.stringify(stdout));
          }
        });
      });}, sampleInterval);
      recordState = 0;
      console.log("processing stop command");
      return;

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
