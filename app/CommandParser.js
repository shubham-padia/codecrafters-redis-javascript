import { COMMANDS, RESPONSES } from "./constants.js";

const VALID_COMMANDS = Object.values(COMMANDS);

export const parse = (decodedData) => {
  if (!decodedData || decodedData.length === 0) return null;

  if (VALID_COMMANDS.includes(decodedData[0].toUpperCase())) {
    return {
      command: decodedData[0].toUpperCase(),
      value: decodedData.slice(1),
    };
  }
};

const VAILD_RESPONSE = Object.values(RESPONSES);

export const responseParse = (decodedData) => {
  if (!decodedData || decodedData.length === 0) return null;

  if (VAILD_RESPONSE.includes(decodedData[0].toUpperCase())) {
    return {
      response: decodedData[0].toUpperCase(),
      value: decodedData.slice(1),
    };
  }
};
