import { OK_RESP_STRING, NULL_BULK_STRING } from "./constants.js";
import { get, set } from "./getSet.js";
import { encodeBulkString } from "./RespParser.js";

export const handlePing = (socket) => socket.write("+PONG\r\n");

export const handleEcho = (socket, value) => {
    if (!value) throw new Error('Missing argument. Echo command needs an argument to echo back.')
    socket.write(`+${value}\r\n`);
}

export const handleSet = (socket, value, globalObject) => {
    if (!value) throw new Error('Missing argument.')

    let expiresInMilliseconds = null;
    if (value.length === 4 && value[2].toUpperCase() === 'PX') {
        expiresInMilliseconds = Number(value[3]);
    }

    globalObject = set(value[0], value[1], globalObject, expiresInMilliseconds);
    
    socket.write(OK_RESP_STRING);

    return globalObject;
}

export const handleGet = (socket, value, globalObject) => {
    if (!value) throw new Error('Missing argument.')

    const result = get(value[0], globalObject);
    if (result === NULL_BULK_STRING) {
      socket.write(result);
    } else {
      socket.write(encodeBulkString(result));
    }
}

export const handleInfo = (socket, value, serverInfo) => {
    if (!value) throw new Error('Missing argument.')

    if (value[0].toUpperCase() === 'REPLICATION') {
        socket.write(encodeBulkString(`role:${serverInfo.role}
master_replid:8371b4fb1155b71f4a04d3e1bc3e18c4a990aeeb
master_repl_offset:0`));
    }
}