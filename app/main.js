import net from 'net';
import { decode } from "./RespParser.js";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const server = net.createServer((connection) => {
  // Handle connection
});
server.on("connection", (socket) => {
  socket.on("data", (data) => {
    const decodedData = decode(data.toString());
    
    if (
      typeof decodedData === "string" ||
      (decodedData instanceof String && decodedData.toUpperCase() === "PING")
    )
      socket.write("+PONG\r\n");

    if (Array.isArray(decodedData)) {
      if (decodedData.length === 1 && decodedData[0].toUpperCase() === 'PING') {
        socket.write("+PONG\r\n");
      }
      if (decodedData.length === 2 && decodedData[0].toUpperCase() === 'ECHO') {
        socket.write(`+${decodedData[1]}\r\n`);
      }
    }
  });
});

server.listen(6379, "127.0.0.1");
