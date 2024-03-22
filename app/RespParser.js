// I had used regex for decodign bulk strings in the initial implementation, but the challenge I faced with that
// is that I would have to escape the string to do a match and that would modify the original string
// inside which is just a bunch of bytes basically

import { findFirstInteger } from "./utils.js";
import {
  PROTOCOL_TERMINATOR,
  SIMPLE_STRING_PREFIX,
  ARRAY_PREFIX,
  BULK_STRING_REGEX,
  RDB_FILE_REGEX,
} from "./constants.js";

const escapeRegExp = (str) => {
  str = str.replace(/\r\n/g, "\\r\\n");
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
};

const regexExactMatch = (regex, str) => {
  str = escapeRegExp(str);
  const match = str.match(regex);
  return match && str === match[0];
};

const isSimpleString = (str) => str.startsWith(SIMPLE_STRING_PREFIX);

const decodeSimpleString = (str) => {
  const lineBreakIndex = str.indexOf("\r\n");
  return {
    result: str.slice(1, lineBreakIndex),
    leftoverStr: str.slice(lineBreakIndex + 2),
  };
};

const isBulkString = (str) => regexExactMatch(BULK_STRING_REGEX, str);
const decodeBulkString = (str) => {
  const bulkStringLength = findFirstInteger(str);
  // if bulkString is $3\r\nhey\r\n, then we're trying to find the length of $3\r\n,
  // need to calculate when the string length can be double, triple digits or more.
  const prefixLength = Math.ceil(Math.log10(bulkStringLength + 1)) + 5;
  return {
    result: str.slice(prefixLength, prefixLength + bulkStringLength),
    leftoverStr: str.slice(prefixLength + bulkStringLength + 2),
  };
};

const decodeRDBFile = (str) => {
  const bulkStringLength = findFirstInteger(str);
  // if bulkString is $3\r\nhey\r\n, then we're trying to find the length of $3\r\n,
  // need to calculate when the string length can be double, triple digits or more.
  const prefixLength = Math.ceil(Math.log10(bulkStringLength + 1)) + 5;
  return {
    result: "",
    leftoverStr: str.slice(prefixLength + bulkStringLength - 3),
  };
};

const isArray = (str) =>
  str.startsWith(ARRAY_PREFIX) &&
  str.toLowerCase().endsWith(PROTOCOL_TERMINATOR);
const decodeArray = (str) => {
  const arrayLength = findFirstInteger(str);
  // Remove array prefix and length and its corresponding terminator
  let arrayItemsStr = str.slice(Math.ceil(Math.log10(arrayLength + 1)) + 3);
  const array = [];

  // We can just split by $ sign even though we are only accepting bulk strings for now,
  // since bulk strings can contain anything including $ sign and that's why there's a length
  // at the beginning
  for (let i = 0; i < arrayLength; i++) {
    // need to duplicate the code since we need bulkStringLength and prefixLength to remove
    // each item
    const bulkStringLength = findFirstInteger(arrayItemsStr);
    // if bulkString is $3\r\nhey\r\n, then we're trying to find the length of $3\r\n,
    // need to calculate when the string length can be double, triple digits or more.
    const prefixLength = Math.ceil(Math.log10(bulkStringLength + 1)) + 3;

    array.push(
      arrayItemsStr.slice(prefixLength, prefixLength + bulkStringLength),
    );

    arrayItemsStr = arrayItemsStr.slice(prefixLength + bulkStringLength + 2);
  }

  return {
    result: array,
    leftoverStr: arrayItemsStr,
  };
};

export const decode = (str, resultArray = []) => {
  if (isSimpleString(str)) {
    const decodedSimpleString = decodeSimpleString(str);
    resultArray.push([decodedSimpleString.result]);
    if (decodedSimpleString.leftoverStr !== "") {
      resultArray = decode(decodedSimpleString.leftoverStr, resultArray);
    }
  }

  if (isBulkString(str)) {
    const decodedBulkString = decodeBulkString(str);
    resultArray.push([decodedBulkString.result]);
    if (decodedBulkString.leftoverStr !== "") {
      resultArray = decode(decodedBulkString.leftoverStr, resultArray);
    }
  }

  if (str.startsWith("$")) {
    const decodedRDBFile = decodeRDBFile(str);
    if (decodedRDBFile.leftoverStr !== "") {
      resultArray = decode(decodedRDBFile.leftoverStr, resultArray);
    }
  }

  if (isArray(str)) {
    const decodedArray = decodeArray(str);
    resultArray.push(decodedArray.result);
    if (decodedArray.leftoverStr !== "") {
      resultArray = decode(decodedArray.leftoverStr, resultArray);
    }
  }
  return resultArray;
};

export const encodeBulkString = (str) => {
  return `$${str.length}${PROTOCOL_TERMINATOR}${str}${PROTOCOL_TERMINATOR}`;
};

export const encodeArray = (stringArray) => {
  let result = `*${stringArray.length}\r\n`;
  stringArray.forEach((element) => {
    result += encodeBulkString(element);
  });
  return result;
};
