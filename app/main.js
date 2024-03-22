import net from "net";

import { COMMANDS, RESPONSES, SERVER_ROLES } from "./constants.js";
import { decode, encodeArray } from "./RespParser.js";
import { parse as argumentParse, getArgumentValue } from "./ArgParser.js";
import { parse as commmandParse, responseParse } from "./CommandParser.js";
import {
  handleEcho,
  handlePing,
  handleSet,
  handleGet,
  handleInfo,
  handleReplconf,
  handlePsync,
} from "./commands.js";
import { addToCommandHistory } from "./store.js";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const store = {
  serverInfo: {
    role: SERVER_ROLES.MASTER,
    replicas: [],
  },
  commandHistory: [],
  keyValueStore: {},
};

const argumentValueObject = argumentParse(process.argv.slice(2));
const PORT = getArgumentValue("port", argumentValueObject, 6379);
const replicaOfValue = getArgumentValue("replicaof", argumentValueObject);

if (replicaOfValue && replicaOfValue.split(" ").length === 2) {
  const replicaOfValueArray = replicaOfValue.split(" ");

  const replicationId = "?";
  const replicationOffset = "-1";
  const handshakeSequence = [
    {
      send: encodeArray([COMMANDS.PING]),
      expectedResponse: RESPONSES.PONG,
    },
    {
      send: encodeArray([COMMANDS.REPLCONF, "listening-port", PORT.toString()]),
      expectedResponse: RESPONSES.OK,
    },
    {
      send: encodeArray([COMMANDS.REPLCONF, "capa", "eof", "capa", "psync2"]),
      expectedResponse: RESPONSES.OK,
    },
    {
      send: encodeArray([COMMANDS.PSYNC, replicationId, replicationOffset]),
      expectedResponse: `FULLRESYNC ? 0`,
    },
  ];
  const handshakeSequenceLength = handshakeSequence.length;

  store.serverInfo.role = SERVER_ROLES.SLAVE;

  let i = 0;

  const client = new net.Socket();

  client.connect(Number(replicaOfValueArray[1]), replicaOfValueArray[0], () => {
    console.log("Connected to master instance!");
    client.write(handshakeSequence[i].send);
  });

  client.on("data", (data) => {
    const decodedData = decode(data.toString());
    const parsedResponse = responseParse(decodedData);

    if (parsedResponse) {
      if (
        parsedResponse.response === handshakeSequence[i].expectedResponse &&
        i < handshakeSequenceLength
      ) {
        i = i + 1;
        if (i < handshakeSequenceLength) {
          client.write(handshakeSequence[i].send);
        }
      }
    }
    if (i === handshakeSequenceLength) {
      console.log("HANDSHAKE COMPLETED");
    }
  });
}

const server = net.createServer((connection) => {
  // Handle connection
});

server.on("connection", (socket) => {
  socket.on("data", (data) => {
    const decodedData = decode(data.toString());
    const parsedCommand = commmandParse(decodedData);
    store.commandHistory = addToCommandHistory(
      store.commandHistory,
      parsedCommand,
    );

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
          store.keyValueStore = handleSet(socket, value, store.keyValueStore);
          if (store.serverInfo.replicas.length > 0) {
            store.serverInfo.replicas.forEach((replica) => {
              replica.write(encodeArray(decodedData));
            });
          }
          break;
        case COMMANDS.GET:
          handleGet(socket, value, store.keyValueStore);
          break;
        case COMMANDS.INFO:
          handleInfo(socket, value, store.serverInfo);
          break;
        case COMMANDS.REPLCONF:
          handleReplconf(socket);
          break;
        case COMMANDS.PSYNC:
          handlePsync(socket, store);
          break;
      }
    }
  });
});

server.listen(PORT, "127.0.0.1");
