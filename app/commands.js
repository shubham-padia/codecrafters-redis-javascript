import net from "net";

import {
  OK_RESP_STRING,
  NULL_BULK_STRING,
  COMMANDS,
  SERVER_ROLES,
} from "./constants.js";
import { getValue, setValue } from "./store.js";
import { encodeBulkString, encodeArray } from "./RespParser.js";

export const handlePing = (socket) => socket.write("+PONG\r\n");

export const handleEcho = (socket, value) => {
  if (!value)
    throw new Error(
      "Missing argument. Echo command needs an argument to echo back.",
    );
  socket.write(`+${value}\r\n`);
};

export const handleSet = (socket, value, store) => {
  if (!value) throw new Error("Missing argument.");

  let expiresInMilliseconds = null;
  if (value.length === 4 && value[2].toUpperCase() === "PX") {
    expiresInMilliseconds = Number(value[3]);
  }

  store.keyValueStore = setValue(
    value[0],
    value[1],
    store.keyValueStore,
    expiresInMilliseconds,
  );

  if (store.serverInfo.role === SERVER_ROLES.MASTER)
    socket.write(OK_RESP_STRING);

  return store;
};

export const handleGet = (socket, value, globalObject) => {
  if (!value) throw new Error("Missing argument.");

  const result = getValue(value[0], globalObject);
  if (result === NULL_BULK_STRING) {
    socket.write(result);
  } else {
    socket.write(encodeBulkString(result));
  }
};

export const handleInfo = (socket, value, serverInfo) => {
  if (!value) throw new Error("Missing argument.");

  if (value[0].toUpperCase() === "REPLICATION") {
    socket.write(
      encodeBulkString(`role:${serverInfo.role}
master_replid:8371b4fb1155b71f4a04d3e1bc3e18c4a990aeeb
master_repl_offset:0`),
    );
  }
};

export const handleReplconf = (socket) => {
  socket.write(OK_RESP_STRING);
};

export const handlePsync = (socket, store) => {
  socket.write("+FULLRESYNC 8371b4fb1155b71f4a04d3e1bc3e18c4a990aeeb 0\r\n");
  const RDB_FILE_BINARY = Buffer.from(
    "UkVESVMwMDEx+glyZWRpcy12ZXIFNy4yLjD6CnJlZGlzLWJpdHPAQPoFY3RpbWXCbQi8ZfoIdXNlZC1tZW3CsMQQAPoIYW9mLWJhc2XAAP/wbjv+wP9aog==",
    "base64",
  );
  socket.write(
    Buffer.concat([
      Buffer.from(`$${RDB_FILE_BINARY.length}\r\n`),
      RDB_FILE_BINARY,
    ]),
  );
  store.serverInfo.replicas.push(socket);

  return store;
};

export const handleCommand = (parsedCommand, socket, store, data) => {
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
      store = handleSet(socket, value, store);
      if (store.serverInfo.replicas.length > 0) {
        store.serverInfo.replicas.forEach((replica) => {
          replica.write(encodeArray(data));
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
      store = handlePsync(socket, store);
      break;
  }
  return store;
};
