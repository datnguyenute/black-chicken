var loaSound = new Audio("../assets/loa.mp3");
var gentleSound = new Audio("../assets/gentle.mp2");
var sound = loaSound;

var isOnScreen = true;
var socket = io();
const nickName = prompt("Nhập nick ku");
var messages = document.getElementById("messages");
var form = document.getElementById("form");
var input = document.getElementById("message-input");
var typingElement = document.getElementById("typing");
var chatboxElement = document.getElementById("chat-box");
var typing = false;
var timeoutTyping = undefined;
var socketTypeing = [];

// Greetings
let greetings = '';
if (nickName) {
  greetings = `Task "${nickName}" has created`;
} else {
  greetings = "A task has created but it doesn't have a fucking name!";
}
socket.emit('sub-chat-message', greetings);

form.addEventListener("submit", function (e) {
  e.preventDefault();
  if (input.value) {
    const messageUser = `${nickName}- ${input.value}`;
    socket.emit("chat-message", messageUser);

    // Command setting
    const mainCommand = 'kimmy';
    const subCommand = {
      SOUND: 'sound',
      STATUS: 'status',
      RESET: 'reset'
    }
    const subCommandShort = {
      SOUND: 's',
      STATUS: 'st',
      RESET: 'rs'
    }
    switch (input.value) {
      case mainCommand + ' ' + subCommand.SOUND + ' ' + '-loa':
        sound = loaSound;
        break;
      case mainCommand + ' ' + subCommand.SOUND + ' ' + '-gentle':
        sound = gentleSound;
        break;
      case mainCommand + ' ' + subCommand.RESET:
        resetKimmy();
        break;
      case mainCommand + ' ' + subCommand.RESET + ' ' + '-a':
        resetKimmy(true);
        break;
      case '/rs':
        resetKimmy(true);
        break;
      case mainCommand + ' ' + subCommand.STATUS + ' ' + '-c':
        socket.emit('status-count');
        break;
      case '/count':
        socket.emit('status-count');
        break;
      default:
        break;
    }

    // Notify every one, emit event for client.
    socket.emit("notify-everyone", { message: input.value, messageUser });
    // Reset value input.
    input.value = "";
  }
});

input.addEventListener("keydown", function (e) {
  console.log('Keydown value: ', e.target.value);

  // Check keypress Enter
  if(e.which!=12 && e.keyCode!=13) {
    onKeyDownNotEnter();
  } else {
    typing = false;
    socket.emit('typing', {nickName, typingEnd: true});
  }
});


socket.on("chat-message", function (msg) {
  var item = document.createElement("li");
  item.textContent = msg;
  messages.appendChild(item);

  messages.scrollTop = messages.scrollHeight;
});

socket.on("sub-chat-message", function (msg) {
  var item = document.createElement("li");
  item.textContent = msg;
  item.classList.add('sub-message');
  messages.appendChild(item);

  // Scroll to bottom
  messages.scrollTop = messages.scrollHeight;
});

socket.on("typing", function ({nickName, typingEnd}) {
  // Add user to list
  if (!socketTypeing.includes(nickName)) {
    socketTypeing.push(nickName);
  }
  if (typingEnd) {
    socketTypeing = socketTypeing.filter(e => e != nickName);
  }

  updateTypingElement();
});

socket.on("typing-no-longer", function (user) {
  // remove user to list
  socketTypeing = socketTypeing.filter(e => e != user.nickName);

  updateTypingElement();
});

socket.on("notify-everyone", function ({ message, messageUser }) {
  // play sound
  var resp = sound.play();
  if (resp !== undefined) {
    resp
      .then((_) => {
        // autoplay starts!
      })
      .catch((error) => {
        //show error
      });
  }
  console.log("isOnScreen", isOnScreen);
  if (isOnScreen) return;
  // Will explain in next section.
  var notify = new Notification("Work Note", {
    body: messageUser,
    icon: "http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png",
  });
});

function updateTypingElement() {
  if (socketTypeing.length <= 0) {
    typingElement.style.visibility = 'hidden';
    return;
  }

  let typingUser = '';
  if (socketTypeing.length === 1) {
    typingUser = socketTypeing[0] + ' task';
  } else {
    typingUser = 'Some tasks'
  }
  const contentTyping = typingUser + ' progressing… ';


  typingElement.textContent = contentTyping;
  typingElement.style.visibility = 'visible';
}

function timeoutFunction(){
  typing = false;
  socket.emit('typing-no-longer', {nickName});
}

function onKeyDownNotEnter(){
  if(typing == false) {
    typing = true
    socket.emit('typing', {nickName, typingEnd: false});
    timeoutTyping = setTimeout(timeoutFunction, 4999);
  } else {
    clearTimeout(timeoutTyping);
    timeoutTyping = setTimeout(timeoutFunction, 4999);
  }

}

// Function: Reset kimmy
function resetKimmy(realReset = false) {
  if (!realReset) {
    var item = document.createElement("li");
    const scrollHeight = chatboxElement.clientHeight;
    item.style.height = scrollHeight + 'px';
    item.classList.add('sub-message');
    item.textContent = 'Kimmy fake reset';
    messages.appendChild(item);

    // Scroll to bottom
    messages.scrollTop = scrollHeight;
  } else {
    // Remove all content item
    messages.textContent = '';
  }
}

function notifyMe() {
  if (!window.Notification) {
    console.log(
      "Trình duyệt méo hỗ trợ hiện notification. Chọn cái trình duyệt khác đi bro!"
    );
  } else {
    // check if permission is already granted
    if (Notification.permission === "granted") {
      // show notification here
      var notify = new Notification("Work Note", {
        body: "Push notification đã được bật sẵn! Get go!",
        icon: "http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png",
      });
    } else {
      // request permission from user
      Notification.requestPermission()
        .then(function (p) {
          if (p === "granted") {
            // show notification here
            var notify = new Notification("Work Note", {
              body: "Ngon! Notification đã được bật",
              icon: "http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png",
            });
          } else {
            console.log("Người ấy không thích notification!");
          }
        })
        .catch(function (err) {
          console.error(err);
        });
    }
  }
}

// Set the name of the hidden property and the change event for visibility
var hidden, visibilityChange;
if (typeof document.hidden !== "undefined") {
  // Opera 11.10 and Firefox 18 and later support
  hidden = "hidden";
  visibilityChange = "visibilitychange";
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";
}

// If the page is hidden, pause the video;
// if the page is shown, play the video
function handleVisibilityChange() {
  if (document[hidden]) {
    isOnScreen = false;
  } else {
    isOnScreen = true;
  }
}

// Warn if the browser doesn't support addEventListener or the Page Visibility API
if (
  typeof document.addEventListener === "undefined" ||
  hidden === undefined
) {
  console.log(
    "This demo requires a browser, such as Google Chrome or Firefox, that supports the Page Visibility API."
  );
} else {
  // Handle page visibility change
  document.addEventListener(
    visibilityChange,
    handleVisibilityChange,
    false
  );
}
