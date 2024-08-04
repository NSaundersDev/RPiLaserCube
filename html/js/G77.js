var Socket
//var graphDataSet = [[1,2,3,4],[1,2,3,4],[10,12,13,14]]
var graphDataSet = []
var dataStrings = []
var dataPlot
var paused = false
var recording = 0
var reconAttempts = 0
var isPlotting = false;

var headerTitles = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"];

const DEGREES_F = "degreesF";
const DEGREES_C = "degreesC";
const DEGREES_F_SYMBOL = "°F";
const DEGREES_C_SYMBOL = "°C";

var currentTemperatureScale = DEGREES_C;
var currentTemperatureSymbol = DEGREES_C_SYMBOL;

function startup() {
  openWebSocket()
}

function openWebSocket() {
    Socket = new WebSocket("ws://192.168.1.9:8080");
    Socket.onopen = function() {
    reconAttempts = 0
    writeMessage("WebSocket OPEN")
    Socket.send("go")
  }
  Socket.onmessage = function(evt) {
    if(evt.data.length > 7) {
      if(isPlotting == false) {
        startPlots();
        isPlotting = true;
      }
      processIncomingData(evt.data)
    }
  }
  Socket.onerror = function() {
    writeMessage("WebSocket ERROR")
    console.log("WebSocket ERROR")
  }
  Socket.onclose = function() {
    writeMessage("WebSocket CLOSED")
    console.log("WebSocket CLOSED")
    if (reconAttempts < 2){
      reconAttempts++
      writeMessage("Reconnecting...")
      openWebSocket()
    }
  }
  window.onbeforeunload = function(event) {
    closeSocket();
  }
}
function closeSocket() {
  Socket.close()
}

function processIncomingData(data) {
  // parse out the comma separated data list to a list
  dataStrings = data.split(",")
  let dateStr = dataStrings[0]; // get datetime for runtime's now
  console.log("dateStr: " + dateStr)
  let datetime = new Date();

  graphDataSet.push([datetime, parseFloat(dataStrings[1]), parseFloat(dataStrings[2]), parseFloat(dataStrings[3]), parseFloat(dataStrings[4]), parseFloat(dataStrings[5]), parseFloat(dataStrings[6]), parseFloat(dataStrings[7]), parseFloat(dataStrings[8])])

  if (document.getElementById('dynamicPlot').checked == true) {
    updatePlots()
  }
  updateHeaderDisplay()
}

function convertTemperatureScale(degreesC) {
  return degreesC * 9 / 5 + 32; // return degrees F
}

function updateHeaderDisplay() {
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

function writeMessage(str) {
  document.getElementById("message").innerHTML = str;
}

function calibrate(weight) {
  var sendStr
  if (weight) {
    sendStr = 'c' + document.getElementById('CalibrationWeight').value
  } else {
    sendStr = 'c0'
  }
  //writeMessage(sendStr)
  Socket.send(sendStr + '\n')
}

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

function recordStop() {
  writeMessage("into record stop: " + recording.toString());
  if (recording) {
    writeMessage("sending X");
    Socket.send("X"); // stop
    recording = !recording;
    updateRecordButton(recording);
  }
  else {
    writeMessage("sending R~");
    Socket.send("R~," + document.getElementById('csvFileName').value + ".csv") // start with file name
    recording = !recording;
    updateRecordButton(recording);
  }
}

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

function startPlots() {
  dataPlot = new Dygraph(document.getElementById("chartDiv"), graphDataSet, {
    drawPoints: false,
    legend: "always",
    animatedZooms: true,
    ylabel: "Temperature (°C)",
    labels: ["Time", "T1", "T2", "T3", "T4","T5","T6","T7","T8"],
    //colors: ['#FFC013','#FE664F','#028AF8'],
    //colors: ['#F1C177','#CC2A35','#115B74'],
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

function resetShaftCounter() {
  Socket.send("resetCount")
}

function clearDatasets() {
  graphDataSet = []
  updatePlots()
}

function changeVisibility(el, num) {
  dataPlot.setVisibility(num, el.checked);
}

function sampleRate() {
  var sampleRate = document.getElementById('sampleRate').value
  if (sampleRate < 100) {
    document.getElementById('sampleRate').vupdatalue = 100
    sampleRate = 100
  }
  Socket.send("d," + sampleRate)
}

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

function changeHeaderText(index, text) {
  headerTitles[index] = text;
  console.log("header titles: " + headerTitles.toString());
  let str = "update_headers, ";
  for(let i = 0; i < headerTitles.length; i++) {
    if(i != headerTitles.length - 1) {
      str += headerTitles[i] + ", ";
    } else {
      str += headerTitles[i];
    }
    document.getElementById('plotTempLabel'+ (i + 1).toString()).innerHTML = headerTitles[i];
//    console.log(document.getElementById('plotTempLabel' + (i+1).toString()).innt
  }
  Socket.send(str);
}

function toggleTemperatureScale() {
  if(currentTemperatureScale == DEGREES_C) {
    currentTemperatureScale = DEGREES_F;
    currentTemperatureSymbol = DEGREES_F_SYMBOL;
  }
  else if(currentTemperatureScale == DEGREES_F) {
    currentTemperatureScale = DEGREES_C;
    currentTemperatureSymbol = DEGREES_C_SYMBOL;
  }
  Socket.send("f");
  clearDatasets();
  updateHeaderDisplay();
  updatePlots();
}
