var timeSocket

function startup() {
  writeMessage("Attempting connection to set server time if needed...")
  openTimeSocket()
}

function openTimeSocket() {
  timeSocket = new WebSocket('ws://192.168.240.1:8082/')
  timeSocket.onopen = function() {
    writeMessage("Connected! Updating Time and starting WebSocket Server at 192.168.240.1/g77")
    var myDate = new Date()
    var dateString = myDate.getFullYear() + "-" + (myDate.getMonth() + 1) + "-" + myDate.getDate() + " " + myDate.getHours() + ":" + myDate.getMinutes() + ":" + myDate.getSeconds()
    timeSocket.send("T~" + dateString)
  }
  timeSocket.onmessage = function(evt) {
    if (evt.data=="ns") {
      writeMessage("Updating System Time. Starting g77 Server...Click the Endlas logo.")
    }
    if (evt.data=="as") {
      writeMessage("Time Allready Set. Redirecting to WebSocket...Click the Endlas logo.")
    }
    timeSocket.close()
  }
  timeSocket.onerror = function() {
    writeMessage("Click the Endlas logo to goto g77 page")
    console.log("Click the Endlas logo to goto g77 page")
  }
  timeSocket.onclose = function() {
    writeMessage("Click the Endlas logo to goto g77 page")
    console.log("Click the Endlas logo to goto g77 page")

  }
  window.onbeforeunload = function(event) {
    timeSocket.close()
  }
}

function writeMessage(str) {
  document.getElementById("message").innerHTML = str;
}
