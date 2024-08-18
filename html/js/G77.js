// Client-side constants
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
  Socket = new WebSocket("ws://192.168.1.9:8080");
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
    // initialize the UI plotting
    initPlotting();
    // process the socket data
    processIncomingData(evt.data);
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
  
  if(dataStrings[1] != null && (initIndex == 'headings' || initIndex == 'f' || initIndex == "interval")) {
  let secondIndex = dataStrings[1].replace('"', '');
//  console.log("second index: " + secondIndex);
  if(initIndex == 'headings') {
    for(let i = 0; i < 8; i++) {
      if(i != 7) {
        headerTitles[i] = dataStrings[i+1];
      } else {
        // clean up another hanging " character...
        headerTitles[i] = dataStrings[i+1].slice(0, -1);
      }
    }
    console.log("for headings: " + secondIndex);
    updateHeaderTitles();
  } else if(initIndex == 'f') {
    console.log("initIndex: " + initIndex);
    console.log("secondIndex for f: " + secondIndex);
      if(secondIndex == "F") {
        currentTemperatureScale = DEGREES_F;
        currentTemperatureSymbol = DEGREES_F_SYMBOL;
        document.getElementById('degreesF').checked = true;
        document.getElementById('degreesC').checked = false;
      }
      else if(secondIndex == "C") {
        currentTemperatureScale = DEGREES_C;
        currentTemperatureSymbol = DEGREES_C_SYMBOL;
        document.getElementById('degreesF').checked = false;
        document.getElementById('degreesC').checked = true;
      }
      updateHeaderDisplay();
      if(document.getElementById('dynamicPlot').checked == true) {
        updatePlots();
      }
      // clear the dygraph for the new temperature scale
      clearDatasets();
    }
  else if(initIndex == "interval") {
    document.getElementById('sampleRate').value = secondIndex;
  }
  }
  else {
    let dateStr = dataStrings[0]; // get datetime for runtime's now
    let datetime = new Date();

    graphDataSet.push([datetime, parseFloat(dataStrings[1]), parseFloat(dataStrings[2]), parseFloat(dataStrings[3]), parseFloat(dataStrings[4]), parseFloat(dataStrings[5]), parseFloat(dataStrings[6]), parseFloat(dataStrings[7]), parseFloat(dataStrings[8])])

    if(document.getElementById('dynamicPlot').checked == true) {
      updatePlots()
    }
    updateHeaderDisplay();
  }

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
}


//
// ** Function to handle updating the header display when new data is received
//
function updateHeaderDisplay() {
  if(dataStrings.length > 7) {
    let thermo8Value = dataStrings[8].substring(0,dataStrings[8].length - 1);
    let thermo1 = parseFloat(dataStrings[1]);
    document.getElementById('thermo1Value').innerHTML = thermo1.toFixed(1);
    document.getElementById('thermo1Scale').innerHTML = currentTemperatureSymbol;
    let thermo2 = parseFloat(dataStrings[2]);
    document.getElementById('thermo2Value').innerHTML = thermo2.toFixed(1);
    document.getElementById('thermo2Scale').innerHTML = currentTemperatureSymbol;
    let thermo3 = parseFloat(dataStrings[3]);
    document.getElementById('thermo3Value').innerHTML = thermo3.toFixed(1);
    document.getElementById('thermo3Scale').innerHTML = currentTemperatureSymbol;
    let thermo4 = parseFloat(dataStrings[4]);
    document.getElementById('thermo4Value').innerHTML = thermo4.toFixed(1);
    document.getElementById('thermo4Scale').innerHTML = currentTemperatureSymbol;
    let thermo5 = parseFloat(dataStrings[5]);
    document.getElementById('thermo5Value').innerHTML = thermo5.toFixed(1);
    document.getElementById('thermo5Scale').innerHTML = currentTemperatureSymbol;
    let thermo6 = parseFloat(dataStrings[6]);
    document.getElementById('thermo6Value').innerHTML = thermo6.toFixed(1);
    document.getElementById('thermo6Scale').innerHTML = currentTemperatureSymbol;
    let thermo7 = parseFloat(dataStrings[7]);
    document.getElementById('thermo7Value').innerHTML = thermo7.toFixed(1);
    document.getElementById('thermo7Scale').innerHTML = currentTemperatureSymbol;
    let thermo8 = parseFloat(thermo8Value);
    document.getElementById('thermo8Value').innerHTML = thermo8.toFixed(1);
    document.getElementById('thermo8Scale').innerHTML = currentTemperatureSymbol;
  }
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
  writeMessage("into record stop: " + recording.toString());
  if (recording) {
    writeMessage("Stopped recording");
    Socket.send("X"); // stop
    recording = !recording;
    updateRecordButton(recording);
  }
  else {
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
    dataPlot.updateOptions({
      'file': graphDataSet,
      dateWindow: [graphDataSet[startDataIndex][0], graphDataSet[lastDataIndex][0]]
    });
  } else {
    dataPlot.updateOptions({
      'file': graphDataSet,
      dateWindow: ""
    });
  }
}

//
// ** Function to change the header text values in the UI. The index tells which text to update,
// ** and the text is the new text to set as the value.
//
function changeHeaderText(index, text) {
  headerTitles[index] = text;
  updateHeaderTitles();
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
  Socket.send("f");
  // update the header with the new values
  updateHeaderDisplay();
  updatePlots();
  // clear the dygraph for the new temperature scale
  clearDatasets();
}
