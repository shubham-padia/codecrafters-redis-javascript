import net from 'net';

import { COMMANDS } from './constants.js';
import { decode } from "./RespParser.js";
import { parse as argumentParse, getArgumentValue, parse } from './ArgParser.js';
import { parse as commmandParse } from './CommandParser.js';
import { handleEcho, handlePing, handleSet, handleGet, handleInfo } from './commands.js';

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const argumentValueObject = argumentParse(process.argv.slice(2));

const server = net.createServer((connection) => {
  // Handle connection
});

let globalObject = {};

server.on("connection", (socket) => {
  socket.on("data", (data) => {
    const decodedData = decode(data.toString());
    const parsedCommand = commmandParse(decodedData);
    
    if (parsedCommand) {
      const command = parsedCommand.command;
      const value = parsedCommand.value;

      switch (command) {
        case COMMANDS.PING:
          handlePing(socket);
          break;
        case COMMANDS.ECHO:
          handleEcho(socket, value);
          break;
        case COMMANDS.SET:
          globalObject = handleSet(socket, value, globalObject);
          break;
        case COMMANDS.GET:
          handleGet(socket, value, globalObject);
          break;
        case COMMANDS.INFO:
          handleInfo(socket, value);
          break;
      }
    }
  });
});

const PORT = getArgumentValue('port', argumentValueObject, 6379);
server.listen(PORT, "127.0.0.1");
