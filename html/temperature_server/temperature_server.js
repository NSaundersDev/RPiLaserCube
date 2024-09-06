const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const { exec } = require('child_process');
const app = express();
const server = http.createServer(app);
const ws_server = new WebSocket.Server({ server });

const READ_SCRIPT = './var/www/html/temperature_server/read_all_temperatures.sh';
const LOG_SCRIPT = 'cd /var/www/html/temperature_server && sudo ./log_temperatures.sh ';
const INIT_LOG_SCRIPT = 'cd /var/www/html/temperature_server && sudo python /var/www/html/temperature_server/init_log_temperatures.py ';

const port = 8080;
const clients = new Set();

let currentScript = READ_SCRIPT;
let currentDate = null;
let recordState = 0;
let currentFileName = null;
let sampleInterval = 1000; // default one sample per second
let interval = null;

// default header titles
let headerTitles = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"];

// define the server behavior
ws_server.on('connection', function connection(ws) {

  console.log('Client connected');
  clients.add(ws);
  //clients.set(ws, { id: generateUniqueId(), name: 'Unknown' });
  sendHeaderTitles(ws);
  sendRecordingState(ws);
  sendSamplingInterval(ws);
  if(currentFileName != null) {
    sendFileName(ws);
  }
  ws.on('message', function incoming(message) {
    processCommand(message, ws);
  });

  ws.on('close', function close() { 
    console.log('Client disconnected');
    clients.delete(ws);
  });
});

function sendFileName(ws) {
  let str = "file," + currentFileName;
  ws.send(JSON.stringify(str));
}

function sendSamplingInterval(ws) {
  let str = "interval," + sampleInterval.toString();
  ws.send(JSON.stringify(str));
}

function sendHeaderTitles(ws) {
  let str = "headings,";
  for(let i = 0; i < headerTitles.length; i++) {
    if(i != 7) {
      str += headerTitles[i] + ",";
    } else {
     str += headerTitles[i];
    }
  }
  ws.send(JSON.stringify(str));
}

function sendRecordingState(ws) {
  let str = "isRecording," + recordState.toString();
  ws.send(JSON.stringify(str));
}


function startInterval(ws, script) {
  clearInterval(interval);
  let out = "";
  interval = setInterval(() => {
    exec(script, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      out = stdout;
    });
    clients.forEach((client) => {
      client.send(JSON.stringify(out));
    });
  }, sampleInterval);
}

//
// ** Method to make decisions which code logic should be executed based on input commands
//
function processCommand(message, ws) {
  let commands = message.toString().split(",");
  // the first index is the command
  let command = commands[0];
  let name = null;
  switch(command) {
   // initial command to begin sending data at a set interval
   case "go":
    startInterval(ws, READ_SCRIPT);
    console.log('Starting temperature data interval');
    return;

    case "R~":
      // set record state to on
      if(recordState == 0) {
        recordState = 1;
        if(currentDate == null) {
          currentDate = new Date();
          currentFileName = commands[1];
        }
        initTemperatureLog();
        startInterval(ws, LOG_SCRIPT + currentDate.toLocaleTimeString() + "_" + commands[1]);
        console.log('Starting recording temperature data interval');
      }
      return;
    case "X":
      if(recordState == 1) {
        recordState = 0;
        exec("cd /var/www/html/temperature_server && sudo ./stop_logging_temperatures.sh " + currentDate.toLocaleTimeString() + "_" + currentFileName, (error, stdout, stderr) => {
          if(error) {
            console.error(`exec error: ${error}`);
            return;
          }
        });
        currentFileName = null;
        currentDate = null;
        startInterval(ws, READ_SCRIPT);
        console.log('Stopping recording temperature data interval; starting temperature data interval.');
      }
      return;
    case "stop":
      exec("cd /var/www/html/temperature_server && sudo ./stop_logging_temperatures.sh", (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
      });
      startInterval(ws, READ_SCRIPT);
      recordState = 0;
      console.log("processing stop command");
      return;
    case "d":  /// change sampling interval
      let val = parseFloat(commands[1]);
      sampleInterval = parseFloat(commands[1]);
      startInterval(ws, READ_SCRIPT);
      return;
    case "headings": // change the headings
      sendHeaderTitles(ws);
      // startInterval(ws, READ_SCRIPT);
      console.log("header titles: " + headerTitles.toString());
      return;
    case "update_headers":
      let index = parseInt(commands[1]);
      headerTitles[index] = commands[2];
      console.log("updated header titles: " + headerTitles);
  //Socket.send("update_headers," + index.toString() + "," + text);      
    }
}

function initTemperatureLog() {
  console.log("init temperature log");
  let args = headerTitles[0];
  for(let i = 1; i < headerTitles.length; i++) {
    args = args + " " + headerTitles[i];
  }
  console.log("args: " + args);
  exec(INIT_LOG_SCRIPT + currentDate.toLocaleTimeString() + "_" + currentFileName + " " + args, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
  });
}

server.listen(port, function(err) {
    if (err) {
        throw err;
    }
    console.log(`listening on port ${port}!`);
});
