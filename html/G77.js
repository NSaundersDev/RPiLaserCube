var Socket
//var graphDataSet = [[1,2,3,4],[1,2,3,4],[10,12,13,14]]
var graphDataSet = []
var dataStrings = []
var dataPlot
var paused = false
var recording = 0
var reconAttempts = 0

function startup() {
  openWebSocket()
}

function openWebSocket() {
    Socket = new WebSocket("ws://192.168.1.9:8080");
    Socket.onopen = function() {
    reconAttempts = 0
    writeMessage("WebSocket OPEN")
    Socket.send("go")
    startPlots()
  }
  Socket.onmessage = function(evt) {
    console.log("event data:")
    console.log(evt.data);
    processIncomingData(evt.data)
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
  console.log(data.toString());
  dataStrings = data.split(",")
  let dateStr = dataStrings[0]; // get datetime for runtime's now
  let datetime = new Date();
  graphDataSet.push([datetime, parseFloat(dataStrings[1]), parseFloat(dataStrings[2]), parseFloat(dataStrings[3]), parseFloat(dataStrings[4]), parseFloat(dataStrings[5]), parseFloat(dataStrings[6]), parseFloat(dataStrings[7]), parseFloat(dataStrings[8])])
  if (document.getElementById('dynamicPlot').checked == true) {
    updatePlots()
  }
  updateHeaderDisplay()
}

function updateHeaderDisplay() {
  document.getElementById('thermo1Value').innerHTML = dataStrings[1]
  document.getElementById('thermo2Value').innerHTML = dataStrings[2]
  document.getElementById('thermo3Value').innerHTML = dataStrings[3]
  document.getElementById('thermo4Value').innerHTML = dataStrings[4]
  document.getElementById('thermo5Value').innerHTML = dataStrings[5]
  document.getElementById('thermo6Value').innerHTML = dataStrings[6]
  document.getElementById('thermo7Value').innerHTML = dataStrings[7]
  document.getElementById('thermo8Value').innerHTML = dataStrings[8]
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
  writeMessage("into record stop");
  if(recording == null) {
    recording = 0;
  }
  changeRecordButton(recording);
  if (recording) {
    writeMessage("sending X");
    Socket.send("X"); // stop
    recording = !recording;
  }
  else {
    writeMessage("sending R~");
    Socket.send("R~," + document.getElementById('csvFileName').value + ".csv") // start with file name
    recording = !recording;
  }
}

function changeRecordButton(recordState) {
  writeMessage("into change record button");
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
          return myDate.getHours() + ":" + myDate.getMinutes()
        }
      },
      y: {
        drawGrid: true,
        independentTicks: true,
        includeZero: true
      },
    }
  })
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
  if (sampleRate < 250) {
    document.getElementById('sampleRate').value = 250
    sampleRate = 250
  }
  Socket.send("d" + sampleRate + '\n')
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
