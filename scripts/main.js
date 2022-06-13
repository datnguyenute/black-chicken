var loaSound = new Audio("../assets/loa.mp3");
var gentleSound = new Audio("../assets/gentle.mp2");
var sound = loaSound;

var isOnScreen = true;
var socket = io();
var nickName = prompt("Nhập nick ku");
var messages = document.getElementById("messages");
var form = document.getElementById("form");
var input = document.getElementById("message-input");
var typingElement = document.getElementById("typing");
var chatboxElement = document.getElementById("chat-box");
var titleElement = document.getElementById("title");
var typing = false;
var timeoutTyping = undefined;
var socketTypeing = [];
var textContent = "";

// Greetings
let greetings = '';
if (nickName) {
  greetings = `Task "${nickName}" has created`;
} else {
  nickName = '👽'
  greetings = "A task has created but it doesn't have a fucking name!";
}
socket.emit('sub-chat-message', greetings);
socket.emit('status-count');

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
  // Check keypress Enter
  if(e.which!=13 && e.keyCode!=13) {
    onKeyDownNotEnter();
  } else {
    typing = false;
    socket.emit('typing', {nickName, typingEnd: true});
  }
});


socket.on("chat-message", function (msg, count) {
  if (textContent) {
    var item = document.createElement("li");
    item.textContent = `Reply: ${textContent}`;
    item.classList.add('sub-reply');
    messages.appendChild(item);
    textContent = "";
  }

  var item = document.createElement("li");
  item.classList.add("message");
  item.textContent = msg;
  messages.appendChild(item);

  messages.scrollTop = messages.scrollHeight;

  // Handle click event
  item.addEventListener("click", reply);

  securityCheck(count);
});

socket.on("sub-chat-message", function (msg, count) {
  var item = document.createElement("li");
  item.textContent = msg;
  item.classList.add('sub-message');
  messages.appendChild(item);

  // Scroll to bottom
  messages.scrollTop = messages.scrollHeight;

  securityCheck(count);
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
  if (isOnScreen) return;
  // Will explain in next section.
  var notify = new Notification("Work Note", {
    body: messageUser,
    icon: "http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png",
  });
});

function updateTypingElement() {
  if (socketTypeing.length == 0) {
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
    timeoutTyping = setTimeout(timeoutFunction, 5000);
  } else {
    clearTimeout(timeoutTyping);
    timeoutTyping = setTimeout(timeoutFunction, 5000);
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

// Security warning anonymous
function securityCheck(count) {
  if (count) {
    if (count == 3) {
      // Warning
      titleElement.style.color = 'orange';
    } else if (count > 3) {
      titleElement.style.color = 'red';
      // Danger
    } else {
      // Normal 2 kimmy
      titleElement.style.color = 'black';
    }
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

/**
 * It sets the value of the input to the text content of the clicked element, then sets the focus to
 * the input, then stores the value of the input, then clears the value of the input, then sets the
 * value of the input to the stored value.
 * @param event - The event object is a JavaScript object that contains useful information about an
 * event.
 */
function reply(event) {
  const val = event.target.textContent || "";
  const nicknameIdx = nickName.length + 2; // 2 stands for "- "

  if (!val) {
    return;
  }

  textContent = val.substring(nicknameIdx);
  const doubleGreaterIdx = textContent.indexOf(">> ");
  textContent = doubleGreaterIdx < 0 ? val.substring(nicknameIdx) : textContent.substring(doubleGreaterIdx + 3); // 3 stands for ">> "

  input.value = `>> `;
  input.focus(); //sets focus to element
  const _val = input.value; //store the value of the element
  input.value = ''; //clear the value of the element
  input.value = _val; //set that value back.
}
