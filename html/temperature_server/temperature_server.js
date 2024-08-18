const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const { exec } = require('child_process');
const app = express();
const server = http.createServer(app);
const ws_server = new WebSocket.Server({ server });

const READ_SCRIPT = '/var/www/html/temperature_server/read_all_temperatures.sh';
const LOG_SCRIPT = 'sudo ./log_temperatures.sh ';
const INIT_LOG_SCRIPT = 'sudo python ./init_log_temperatures.py ';

const port = 8080;
const clients = new Map();

let currentScript = READ_SCRIPT;
let isFahrenheit = false;
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
  clients.set(ws, { id: generateUniqueId(), name: 'Unknown' });

  sendHeaderTitles(ws);
  sendTemperatureScale(ws);
  sendSamplingInterval(ws);

  ws.on('message', function incoming(message) {
    clearInterval(interval);
    processCommand(message, ws);
  });

  ws.on('close', function close() {
    console.log('Client disconnected');
    clients.delete(ws);
  });
});

function sendSamplingInterval(ws) {
  let str = "interval," + sampleInterval.toString();
  ws.send(JSON.stringify(str));
}


function generateUniqueId() {
    const timestamp = Date.now().toString(36); // Convert timestamp to base 36
    const random = Math.random().toString(36).substr(2, 5); // 5 random characters
    return `${timestamp}${random}`;
}

//
// ** Function to convert celcius to fahrenheit
//
function celciusToFahrenheit(celciusTemp) {
  return celciusTemp * 9 / 5 + 32;
}

function sendTemperatureScale(ws) {
  let str = "f,";
  if(isFahrenheit) {
    str += "F";
  } else {
    str += "C";
  }
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

function clearInterval(interval) {
  interval = null;
}

//
// ** Method to make decisions which code logic should be executed based on input commands
//
function processCommand(message, ws) {
  let commands = message.toString().split(",");
  // the first index is the command
  let command = commands[0];
  let name = null;
  clearInterval(interval);
  switch(command) {
   // initial command to begin sending data at a set interval
   case "go":
     let outgo = "";
     interval = setInterval(() => {
       exec(READ_SCRIPT, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        if(isFahrenheit == true) {
          let str = JSON.stringify(stdout).split(",");
          let d = str[0] + ",";
          let t1 = (celciusToFahrenheit(parseFloat(str[1]))).toString() + ",";
          let t2 = (celciusToFahrenheit(parseFloat(str[2]))).toString() + ",";
          let t3 = (celciusToFahrenheit(parseFloat(str[3]))).toString() + ",";
          let t4 = (celciusToFahrenheit(parseFloat(str[4]))).toString() + ",";
          let t5 = (celciusToFahrenheit(parseFloat(str[5]))).toString() + ",";
          let t6 = (celciusToFahrenheit(parseFloat(str[6]))).toString() + ",";
          let t7 = (celciusToFahrenheit(parseFloat(str[7]))).toString() + ",";
          let t8 = (celciusToFahrenheit(parseFloat(str[8]))).toString() + ",";
          outgo = d + t1 + t2 + t3 + t4 + t5 + t6 + t7 + t8;
        }
        else {
          outgo = stdout;
        }
      });
      clients.forEach((client) => {
        console.log('sending to client: ' + client.id);
        ws.send(JSON.stringify(outgo));
    });}, sampleInterval);
    console.log('Starting temperature data interval');
    return;
    case "R~":
      let outR = "";
      // set record state to on
      recordState = 1;
      if(currentDate == null) {
        currentDate = new Date();
        currentFileName = commands[1];
      }
      initTemperatureLog();
      interval = setInterval(() => {
        if(currentDate == null) {
          currentDate = new Date();
          currentFileName = commands[1];
        }
        exec(LOG_SCRIPT + currentDate.toLocaleTimeString() + "_" + commands[1], (error, stdout, stderr) => {
          if(error) {
            console.error(`exec error: ${error}`);
          }
          if(isFahrenheit == true) {
            let str = JSON.stringify(stdout).split(",");
            let d = str[0] + ",";
            let t1 = (celciusToFahrenheit(parseFloat(str[1]))).toString() + ",";
            let t2 = (celciusToFahrenheit(parseFloat(str[2]))).toString() + ",";
            let t3 = (celciusToFahrenheit(parseFloat(str[3]))).toString() + ",";
            let t4 = (celciusToFahrenheit(parseFloat(str[4]))).toString() + ",";
            let t5 = (celciusToFahrenheit(parseFloat(str[5]))).toString() + ",";
            let t6 = (celciusToFahrenheit(parseFloat(str[6]))).toString() + ",";
            let t7 = (celciusToFahrenheit(parseFloat(str[7]))).toString() + ",";
            let t8 = (celciusToFahrenheit(parseFloat(str[8]))).toString() + ",";
            outR = d + t1 + t2 + t3 + t4 + t5 + t6 + t7 + t8;
          }
          else {
            outR = stdout;
          }
        clients.forEach((client) => {
          ws.send(JSON.stringify(outR));
        });
      });}, sampleInterval);
      console.log('Starting recording temperature data interval');
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
        let outX = "";
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
            outX = d + t1 + t2 + t3 + t4 + t5 + t6 + t7 + t8;
          }
          else {
            outX = stdout;
          }
        });
        clients.forEach((client) => {
          ws.send(JSON.stringify(outX));
      });}, sampleInterval);

      console.log('Stopping recording temperature data interval; starting temperature data interval.');
      return;

    case "stop":
      exec("./stop_logging_temperatures.sh", (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
      });
      clearInterval(interval);
      interval = setInterval(() => {
        let outStop = "";
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
            outStop = d + t1 + t2 + t3 + t4 + t5 + t6 + t7 + t8;
          }
          else {
            outStop = stdout;
          }
        });
        clients.forEach((client) => {
          ws.send(JSON.stringify(outStop));
      });}, sampleInterval);
      recordState = 0;
      console.log("processing stop command");
      break;
    case "d":
      clearInterval(interval);
      let val = parseFloat(commands[1]);
      sampleInterval = parseFloat(commands[1]);
      interval = setInterval(() => {
        let dOut = "";
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
            dOut = d+t1+t2+t3+t4+t5+t6+t7+t8;
          }
          else {
            dOut = stdout;
          }
        clients.forEach((client) => {
	  ws.send(JSON.stringify(dOut));
        });
      });}, sampleInterval);
      break;
    case "f":
      outF = "";
      isFahrenheit = !isFahrenheit;
      clearInterval(interval);
      interval = setInterval(() => {
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
            outF = d+t1+t2+t3+t4+t5+t6+t7+t8;
          }
          else {
            outF = stdout;
          }
        clients.forEach((client) => {
          ws.send(JSON.stringify(outF));
        });
      });}, sampleInterval);
      console.log("processing scale change command");
      break;
    case "headings":
      sendHeaderTitles(ws);
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
          outF = d+t1+t2+t3+t4+t5+t6+t7+t8;
        }
        else {
          outF = stdout;
        }
        clients.forEach((client) => {
          ws.send(JSON.stringify(outF));
        });
      });
      console.log("header titles: " + headerTitles.toString());
      return;
    case "temperature":
      sendTemperatureScale(ws);
    case "update_headers":
      let updateOut = "";
      let index = parseInt(commands[1]);
      let text = commands[2];
      headerTitles[index] = text;
      clearInterval(interval);
      interval = setInterval(() => {
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
            updateOut = d+t1+t2+t3+t4+t5+t6+t7+t8;
          }
          else {
            updateOut = stdout;
          }
        clients.forEach((client) => {
          ws.send(JSON.stringify(updateOut));
        });
      });}, sampleInterval);
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
