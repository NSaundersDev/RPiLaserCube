// Client-side constants
const SERVER_IP = "ws://192.168.1.9:8080";
const DEGREES_F = "degreesF";
const DEGREES_C = "degreesC";
const DEGREES_F_SYMBOL = "°F";
const DEGREES_C_SYMBOL = "°C";

var Socket // the web socket instance
var graphDataSet = [] // stores the current set of data for the dygraph
var dataStrings = []  // input data array for parsed event data
var dataPlot // the dygraph object variable

// state variables
var data;
var paused = false
var recording = 0
var reconAttempts = 0
var isPlotting = false;
var temps = []

// default the temperature scale to celcius
var currentTemperatureScale = DEGREES_C;
var currentTemperatureSymbol = DEGREES_C_SYMBOL;

// array holding the current header titles to display in the UI
var headerTitles = ["", "", "", "", "", "", "", ""]; // initially empty so temperature server can fill the array

// **
// ** Main entry point for setting up the client side NodeJS widgets
// **
function startup() {
  openWebSocket();
}

//
// ** Function for defining the websocket for data communication,
// ** defines handlers on open, message receive, and close.
//
function openWebSocket() {
  // Define websocket for data communiction
  Socket = new WebSocket(SERVER_IP);
  // Define behavior on socket open
  Socket.onopen = function() {
    // attempt counter reset
    reconAttempts = 0;
    writeMessage("WebSocket OPEN");
    // get the temp column names
    Socket.send("go");
  }
  // Define behavior when receiving a message over the socket
  Socket.onmessage = function(evt) {
    // process the socket data
    processIncomingData(evt.data);
    initPlotting();
  }
  // Define behavior on socket error
  Socket.onerror = function() {
    writeMessage("WebSocket ERROR")
    console.log("WebSocket ERROR")
  }
  // Define behavior on socket close
  Socket.onclose = function() {
  }

}

function initPlotting() {
  // if not plotting, start
  if(isPlotting == false) {
    startPlots();
    isPlotting = true;
  }
}


function closeSocket() {
  Socket.close()
}

//
// ** Function to decide what to do with the incoming data from the temperature server.
//
function processIncomingData(data) {
  dataStrings = data.split(",");
  // clean up hanging " character...
  let initIndex = dataStrings[0].substring(1);
  // check initIndex for specific commands: headings, recording, interval, and file
  if(dataStrings[1] != null && (initIndex == 'headings' || initIndex == 'isRecording' || initIndex == "interval" || initIndex == "file")) {

    let secondIndex = dataStrings[1].replace('"', '');

    if(initIndex == 'headings') {  // heading title update
      processHeadingTitleData(dataStrings);
    } else if(initIndex == 'isRecording') {  // set the recording state according to the server
      processRecordingData(dataStrings);
    } else if(initIndex == "interval") {  // set the sample rate according to the server
      document.getElementById('sampleRate').value = secondIndex;
    } else if(initIndex == "file") {  // set the file name in the input form according to the server
      document.getElementById('csvFileName').value = secondIndex.replace('.csv','');
    }
  } else {  // temperature data
    processTemperatureData(dataStrings);
  }
}

function processRecordingData(dataStrings) {
  let isRecording = parseInt(dataStrings[1].slice(0, -1));
  recording = isRecording;
  updateRecordButton(recording);
}

function processHeadingTitleData(datStrings) {
  for(let i = 0; i < 8; i++) {
    if(i != 7) {
     if(dataStrings[i+1] != "") {
       headerTitles[i] = dataStrings[i+1];
     }
    } else {
      // clean up another hanging " character...
      if(dataStrings[i+1].slice(0, -1) != "") {
        headerTitles[i] = dataStrings[i+1].slice(0, -1);
      }
    }
  }
  updateHeaderTitles();
}

function processTemperatureData(dataStrings) {
  let dateStr = dataStrings[0]; // get datetime for runtime's now
  let datetime = new Date();
  if(currentTemperatureScale == DEGREES_F) {
    temps = getTemperaturesInFahrenheit(dataStrings);
    graphDataSet.push(temps);
  } else if (currentTemperatureScale == DEGREES_C) {
    temps = getTemperaturesInCelcius(dataStrings);
    graphDataSet.push(temps);
  }
  if(graphDataSet.length > 1) {
    updateHeaderDisplay();
    if(document.getElementById('dynamicPlot').checked == true) {
      updatePlots()
    }
  }
}

function getTemperaturesInCelcius(dataStrings) {
  let datetime = new Date();
  let t1 = parseFloat(dataStrings[1]);
  let t2 = parseFloat(dataStrings[2]);
  let t3 = parseFloat(dataStrings[3]);
  let t4 = parseFloat(dataStrings[4]);
  let t5 = parseFloat(dataStrings[5]);
  let t6 = parseFloat(dataStrings[6]);
  let t7 = parseFloat(dataStrings[7]);
  let t8 = parseFloat(dataStrings[8]);
  return [datetime, t1, t2, t3, t4, t5, t6, t7, t8];
}

function getTemperaturesInFahrenheit(dataStrings) {
  let datetime = new Date();
  let t1 = parseFloat(dataStrings[1]) * 9 / 5 + 32;
  let t2 = parseFloat(dataStrings[2]) * 9 / 5 + 32;
  let t3 = parseFloat(dataStrings[3]) * 9 / 5 + 32;
  let t4 = parseFloat(dataStrings[4]) * 9 / 5 + 32;
  let t5 = parseFloat(dataStrings[5]) * 9 / 5 + 32;
  let t6 = parseFloat(dataStrings[6]) * 9 / 5 + 32;
  let t7 = parseFloat(dataStrings[7]) * 9 / 5 + 32;
  let t8 = parseFloat(dataStrings[8]) * 9 / 5 + 32;
  return [datetime, t1, t2, t3, t4, t5, t6, t7, t8];
}

//
// ** Function to handle updating all the temperature heading labels with the current set of titles.
//
function updateHeaderTitles() {
  document.getElementById('editable-heading1').innerHTML = headerTitles[0];
  document.getElementById('editable-heading2').innerHTML = headerTitles[1];
  document.getElementById('editable-heading3').innerHTML = headerTitles[2];
  document.getElementById('editable-heading4').innerHTML = headerTitles[3];
  document.getElementById('editable-heading5').innerHTML = headerTitles[4];
  document.getElementById('editable-heading6').innerHTML = headerTitles[5];
  document.getElementById('editable-heading7').innerHTML = headerTitles[6];
  document.getElementById('editable-heading8').innerHTML = headerTitles[7];
  
  document.getElementById('plotTempLabel1').innerHTML = headerTitles[0];
  document.getElementById('plotTempLabel2').innerHTML = headerTitles[1];
  document.getElementById('plotTempLabel3').innerHTML = headerTitles[2];
  document.getElementById('plotTempLabel4').innerHTML = headerTitles[3];
  document.getElementById('plotTempLabel5').innerHTML = headerTitles[4];
  document.getElementById('plotTempLabel6').innerHTML = headerTitles[5];
  document.getElementById('plotTempLabel7').innerHTML = headerTitles[6];
  document.getElementById('plotTempLabel8').innerHTML = headerTitles[7];

}


//
// ** Function to handle updating the header display when new data is received
//
function updateHeaderDisplay() {
  //let thermo8Value = dataStrings[8].substring(0,dataStrings[8].length - 1);
  // let thermo1 = parseFloat(temps[1]);
  document.getElementById('thermo1Value').innerHTML = temps[1].toFixed(1);
  document.getElementById('thermo1Scale').innerHTML = currentTemperatureSymbol;
  let thermo2 = parseFloat(dataStrings[2]);
  document.getElementById('thermo2Value').innerHTML = temps[2].toFixed(1);
  document.getElementById('thermo2Scale').innerHTML = currentTemperatureSymbol;
  let thermo3 = parseFloat(dataStrings[3]);
  document.getElementById('thermo3Value').innerHTML = temps[3].toFixed(1);
  document.getElementById('thermo3Scale').innerHTML = currentTemperatureSymbol;
  let thermo4 = parseFloat(dataStrings[4]);
  document.getElementById('thermo4Value').innerHTML = temps[4].toFixed(1);
  document.getElementById('thermo4Scale').innerHTML = currentTemperatureSymbol;
  let thermo5 = parseFloat(dataStrings[5]);
  document.getElementById('thermo5Value').innerHTML = temps[5].toFixed(1);
  document.getElementById('thermo5Scale').innerHTML = currentTemperatureSymbol;
  let thermo6 = parseFloat(dataStrings[6]);
  document.getElementById('thermo6Value').innerHTML = temps[6].toFixed(1);
  document.getElementById('thermo6Scale').innerHTML = currentTemperatureSymbol;
  let thermo7 = parseFloat(dataStrings[7]);
  document.getElementById('thermo7Value').innerHTML = temps[7].toFixed(1);
  document.getElementById('thermo7Scale').innerHTML = currentTemperatureSymbol;
  let thermo8 = parseFloat(thermo8Value);
  document.getElementById('thermo8Value').innerHTML = temps[8].toFixed(1);
  document.getElementById('thermo8Scale').innerHTML = currentTemperatureSymbol;
}
//
// ** Function to write a message to the UI
//
function writeMessage(str) {
  document.getElementById("message").innerHTML = str;
}

//
// ** Function to handle pausing the app
//
function pause() {
  pausebtn = document.getElementById('pauseBtnElem')
  if (paused) {
    console.log("paused: " + paused.toString());
    paused = false
    Socket.send("go")
    pausebtn.src = 'img/PauseNormal.png'
    pausebtn.onmouseover = function() {
      this.src = 'img/PausePressed.png'
      writeMessage('PAUSE Measurements')
    }
    pausebtn.onmouseout = function() {
      this.src = 'img/PauseNormal.png'
      writeMessage('')

    }
  } else {
    console.log("paused: " + paused.toString());
    paused = true
    Socket.send("stop")
    pausebtn.src = 'img/PausePressed.png'
    pausebtn.onmouseover = function() {
      this.src = 'img/PauseNormal.png'
      writeMessage('CONTINUE Taking Measurements')
    }
    pausebtn.onmouseout = function() {
      this.src = 'img/PausePressed.png';
      writeMessage('PAUSED. NO MEASUREMENTS Being Taken.')
    }
  }
}

//
// ** Handler method for toggling the record and record stop functionality from the UI
//
function recordStop() {
  console.log('record stop: ' + recording);
  writeMessage("into record stop: " + recording.toString());
  if (recording) {
    writeMessage("Stopped recording");
    Socket.send("X"); // stop
    recording = !recording;
    updateRecordButton(recording);
  }
  else {
    clearDatasets();
    writeMessage("Began recording");
    Socket.send("R~," + document.getElementById('csvFileName').value + ".csv") // start with file name
    recording = !recording;
    updateRecordButton(recording);
  }
}

//
// ** Function to handle changing the record button to the stop button when the
// ** app is recording (and vice-versa).
//
function updateRecordButton(recordState) {
  recordbtn = document.getElementById('recordStopBtnElem')
  if (!recordState) { // Runs to stop recording
    recordbtn.src = 'img/RecordNormal.png'
    recordbtn.onmouseover = function() {
      this.src = 'img/RecordPressed.png';
      writeMessage('START Recording Data to Base File Name')
    }
    recordbtn.onmouseout = function() {
      this.src = 'img/RecordNormal.png';
      writeMessage('')
    }
  } else { // Runs to start recording
    recordbtn.src = 'img/StopNormal.png'
    recordbtn.onmouseover = function() {
      this.src = 'img/StopNormal.png'
      writeMessage('STOP Recording Data')
    }
    recordbtn.onmouseout = function() {
      this.src = 'img/StopNormal.png';
      writeMessage('')
    }
  }
}


//
// ** Function to initialize the dygraph plots.
//
function startPlots() {
  if(graphDataSet.length > 1) {
    dataPlot = new Dygraph(document.getElementById("chartDiv"), graphDataSet, {
      drawPoints: false,
      legend: "always",
      animatedZooms: true,
      ylabel: "Temperature (°C)",
      labels: ["Time", "T1", "T2", "T3", "T4","T5","T6","T7","T8"],
      colors: ['#82B528', '#9E2538', '#162C51', '#3A0D6F', '#F09A02', '#F0D702', '#F002D7', '#000000'],
      series: {
        "Time": {
          axis: 'x'
        },
        "T1": {
          axis: 'y'
        },
        "T2": {
          axis: 'y'
        },
        "T3": {
          axis: 'y'
        },
        "T4": {
          axis: 'y'
        },
        "T5": {
          axis: 'y'
        },
        "T6": {
          axis: 'y'
        },
        "T7": {
          axis: 'y'
        },
        "T8": {
          axis: 'y'
        }
      },
      axes: {
        x: {
          valueFormatter: function(ms) {
            var myDate = new Date(ms)
            myDate.getHours() + ":" + myDate.getMinutes() + ":" + myDate.getSeconds()
            return myDate.getHours() + ":" + myDate.getMinutes();
          }
        },
        y: {
          drawGrid: true,
          independentTicks: true,
          includeZero: true
        },
      }
    });
  }
}

//
// ** Function to clear the current dygraph data set
//
function clearDatasets() {
  graphDataSet = []
  updatePlots()
}

//
// ** Function that toggles the dygraph visiblility
//
function changeVisibility(el, num) {
  dataPlot.setVisibility(num, el.checked);
}

//
// ** Function to handle setting the sample rate of the thermocouple hat.
// ** The units are in milliseconds.
//
function sampleRate() {
  var sampleRate = document.getElementById('sampleRate').value
  if (sampleRate < 100) {
    document.getElementById('sampleRate').vupdatalue = 100
    sampleRate = 100
  }
  Socket.send("d," + sampleRate)
}

//
// ** Function to handle updating the dygraph plot. Takes the newest set of graph data
// ** and plots it to the dygraph UI.
//
function updatePlots() {
  if(dataPlot != null) {
    if (document.getElementById('dynamicPlot').checked == true) {
      var startDataIndex = 0;
      var lastDataIndex = graphDataSet.length - 1;
      var historySize = document.getElementById('historySize').value
      if (historySize > 2400) {
        document.getElementById('historySize').value = 2400
        historySize = 2400
      }
      if (lastDataIndex > historySize) {
        startDataIndex = lastDataIndex - historySize
      }
      if(graphDataSet.length > 0) {
        dataPlot.updateOptions({
          'file': graphDataSet,
          dateWindow: [graphDataSet[startDataIndex][0], graphDataSet[lastDataIndex][0]]
        });
      }
    } else {
      dataPlot.updateOptions({
        'file': graphDataSet,
        dateWindow: ""
      });
    }
  } else {
    startPlots();
  }
}

function changeHeaderText(index, text) {
  headerTitles[index] = text;
  updateHeaderTitles();
  console.log("sending titles: " + headerTitles);
  Socket.send("update_headers," + index.toString() + "," + text);
}

//
// ** Function handling the toggling of the temperature scale from C to F, and vice-versa
//
function toggleTemperatureScale() {
  // if C, convert to F
  if(currentTemperatureScale == DEGREES_C) {
    currentTemperatureScale = DEGREES_F;
    currentTemperatureSymbol = DEGREES_F_SYMBOL;
  }
  // if F, convert to C
  else if(currentTemperatureScale == DEGREES_F) {
    currentTemperatureScale = DEGREES_C;
    currentTemperatureSymbol = DEGREES_C_SYMBOL;
  }
  // clear the dygraph for the new temperature scale
  clearDatasets();
  // update the header with the new values
  updateHeaderDisplay();
  updatePlots();
}
