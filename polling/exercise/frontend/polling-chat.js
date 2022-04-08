const chat = document.getElementById("chat");
const msgs = document.getElementById("msgs");

// let's store all current messages here
let allChat = [];

// the interval to poll at in milliseconds
const INTERVAL = 3000;

const BACKOFF = 5000;

let failedTries = 0;


let time = 0;
let timeToMakeNextRequest = 0;
// a submit listener on the form in the HTML
chat.addEventListener("submit", function (e) {
  e.preventDefault();
  postNewMsg(chat.elements.user.value, chat.elements.text.value);
  chat.elements.text.value = "";
});

async function postNewMsg(user, text) {
  // post to /poll a new message
  // write code here
  const data = {
    user,
    text,
  };

  const options = {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = await fetch("/poll", options);
  const json = await res.json();
}

async function getNewMsgs() {
  // poll the server
  // write code here
  let json;
  let timer;
  try {
    const res = await fetch("/poll");
    json = await res.json();
    if (res.status >= 400)
      throw new Error("Request did not succeed", res.status);
    allChat = json.msg;
    render();
    failedTries = 0;
  } catch (e) {
    console.error("Polling error ", e);
    failedTries++;
  }

  // if (!timer) timer = setTimeout(getNewMsgs, time);
  // else {
  //   clearTimeout(timer);
  //   timer = setTimeout(getNewMsgs, INTERVAL);
  // }
}

function render() {
  // as long as allChat is holding all current messages, this will render them
  // into the ui. yes, it's inefficent. yes, it's fine for this example
  const html = allChat.map(({ user, text, time, id }) =>
    template(user, text, time, id)
  );
  msgs.innerHTML = html.join("\n");
}

// given a user and a msg, it returns an HTML string to render to the UI
const template = (user, msg) =>
  `<li class="collection-item"><span class="badge">${user}</span>${msg}</li>`;


async function rafTimer(time) {
  
  if (timeToMakeNextRequest <= time) {
    console.log('time ', time, timeToMakeNextRequest);
    await getNewMsgs();
    console.log('failed tries ', failedTries, BACKOFF)
    timeToMakeNextRequest = time + INTERVAL + (failedTries * BACKOFF);
  }

  requestAnimationFrame(rafTimer);
}

requestAnimationFrame(rafTimer);
