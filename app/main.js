import net from 'net';

import { NULL_BULK_STRING, OK_RESP_STRING } from './constants.js';
import { decode, encodeBulkString } from "./RespParser.js";
import { set, get } from "./getSet.js"

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");



const server = net.createServer((connection) => {
  // Handle connection
});

let globalObject = {};

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

      if (decodedData.length === 3 || decodedData.length === 5 && decodedData[0].toUpperCase() === 'SET') {
        let expiresInMilliseconds = null;
        if (decodedData.length === 5 && decodedData[3].toUpperCase() === 'PX') {
          expiresInMilliseconds = Number(decodedData[4])
        }

        globalObject = set(decodedData[1], decodedData[2], globalObject, expiresInMilliseconds);
        
        socket.write(OK_RESP_STRING);
      }

      if (decodedData.length === 2 && decodedData[0].toUpperCase() === 'GET') {
        const value = get(decodedData[1], globalObject);
        if (value === NULL_BULK_STRING) {
          socket.write(value);
        } else {
          socket.write(encodeBulkString(value));
        }
      }
    }
  });
});

const PORT = process.argv[2] === "--port" ? Number(process.argv[3]) : 6379;
server.listen(PORT, "127.0.0.1");
