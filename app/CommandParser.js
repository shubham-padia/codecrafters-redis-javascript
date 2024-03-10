import {COMMANDS} from "./constants.js";

const VALID_COMMANDS = Object.values(COMMANDS);

export const parse = (decodedData) => {
    if (decodedData.length === 0) return null;

    if (VALID_COMMANDS.includes(decodedData[0].toUpperCase())) {
        return {
            command: decodedData[0].toUpperCase(),
            value: decodedData.slice(1),
        }
    }
}