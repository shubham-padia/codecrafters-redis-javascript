export const NULL_BULK_STRING = "$-1\r\n";
export const OK_RESP_STRING = "+OK\r\n";
export const SIMPLE_STRING_PREFIX = "+";
export const ARRAY_PREFIX = "*";
export const BULK_STRING_REGEX = /^\$[0-9]+\\r\\n(.+)\\r\\n/gi;
export const RDB_FILE_REGEX = /^\$[0-9]+\X+/;
export const PROTOCOL_TERMINATOR = "\r\n";
export const COMMANDS = {
  PING: "PING",
  INFO: "INFO",
  GET: "GET",
  SET: "SET",
  ECHO: "ECHO",
  REPLCONF: "REPLCONF",
  PSYNC: "PSYNC",
  WAIT: "WAIT",
};
export const RESPONSES = {
  PONG: "PONG",
  OK: "OK",
};
export const SERVER_ROLES = {
  MASTER: "master",
  SLAVE: "slave",
};
