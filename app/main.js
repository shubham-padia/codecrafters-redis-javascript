import net from 'net';

import { COMMANDS, RESPONSES, SERVER_ROLES } from './constants.js';
import { decode, encodeArray } from "./RespParser.js";
import { parse as argumentParse, getArgumentValue, parse } from './ArgParser.js';
import { parse as commmandParse, responseParse } from './CommandParser.js';
import { handleEcho, handlePing, handleSet, handleGet, handleInfo } from './commands.js';

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const serverInfo = {
  role: SERVER_ROLES.MASTER,
}
const argumentValueObject = argumentParse(process.argv.slice(2));
const PORT = getArgumentValue('port', argumentValueObject, 6379);
const replicaOfValue = getArgumentValue('replicaof', argumentValueObject);

if (replicaOfValue && replicaOfValue.split(' ').length === 2) {
  const replicaOfValueArray = replicaOfValue.split(' ');

  const handshakeSequence = [
    {
      send: encodeArray([COMMANDS.PING]),
      expectedResponse: RESPONSES.PONG, 
    },
    {
      send: encodeArray([COMMANDS.REPLCONF, 'listening-port', PORT.toString()]),
      expectedResponse: RESPONSES.OK,
    },
    {
      send: encodeArray([COMMANDS.REPLCONF, 'capa', 'psync2']),
      expectedResponse: RESPONSES.OK,
    }
  ]

  serverInfo.role = SERVER_ROLES.SLAVE;

  let i = 0;

  const client = new net.Socket();

  client.connect(Number(replicaOfValueArray[1]), replicaOfValueArray[0], () => {
    console.log('Connected to master instance!');
    client.write(handshakeSequence[i].send);
  });

  client.on("data", (data) => {
    const decodedData = decode(data.toString());
    const parsedResponse = responseParse(decodedData);

    if (parsedResponse) {
      if (parsedResponse.response === handshakeSequence[i].expectedResponse && i < 3) {
        i = i + 1;
        if (i < 3) {
          client.write(handshakeSequence[i].send);
        }
      } 
    }
    if (i === 3) {
      console.log('HANDSHAKE COMPLETED');
    }
  })
}

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
          handleInfo(socket, value, serverInfo);
          break;
      }
    }
  });
});

server.listen(PORT, "127.0.0.1");
