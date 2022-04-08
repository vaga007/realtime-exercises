import http from "http";
import handler from "serve-handler";
import nanobuffer from "nanobuffer";

// these are helpers to help you deal with the binary data that websockets use
import objToResponse from "./obj-to-response.js";
import generateAcceptValue from "./generate-accept-value.js";
import parseMessage from "./parse-message.js";

let connections = [];
const msg = new nanobuffer(50);
const getMsgs = () => Array.from(msg).reverse();

msg.push({
  user: "brian",
  text: "hi",
  time: Date.now(),
});

// serve static assets
// can also be http2
const server = http.createServer((request, response) => {
  return handler(request, response, {
    public: "./frontend",
  });
});

server.on("upgrade", (req, socket) => {
  if (req.headers["upgrade"] !== "websocket") {
    socket.end("HTTP/1.1 400 Bad Request");
    return;
  }
  console.log("Upgrade requested");

  const acceptKey = req.headers["sec-websocket-key"];
  const acceptValue = generateAcceptValue(acceptKey);

  const headers = [
    "HTTP/1.1 101 Web Socket Protocol Handshake",
    "Upgrade: WebSocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${acceptValue}`,
    "Sec-WebSocket-Protocol: json",
    "\r\n",
  ];

  socket.write(headers.join("\r\n"));

  socket.write(objToResponse({ msg: getMsgs() }));
  connections.push(socket);

  socket.on("data", (buffer) => {
    console.log("[server]", buffer, socket.id);
    const parsedMessage = parseMessage(buffer);

    if(parseMessage === null){
      socket.end();
    }

    if (parsedMessage) {
      // const { user, text } = parsedMessage;
      msg.push({
        user: parsedMessage.user,
        text: parsedMessage.text,
        time: Date.now(),
      });

      connections.forEach(socket => {
        socket.write(objToResponse({ msg: getMsgs() }));
      })
    }
  });

  socket.on('end', ()=>{
    connections = connections.filter(s => s !== socket);
    console.log('Disconnected');
  })
});

/*
 *
 * your code goes here
 *
 */

const port = process.env.PORT || 8080;
server.listen(port, () =>
  console.log(`Server running at http://localhost:${port}`)
);
