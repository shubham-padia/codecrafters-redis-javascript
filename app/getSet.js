import { NULL_BULK_STRING } from "./constants.js";

export const set = (key, value, object, expiresInMilliseconds = null) => {
  return {
    ...object,
    [key]: { value, createdAt: new Date(), expiresInMilliseconds },
  };
};

export const get = (key, object) => {
  if (key in object) {
    const expiresInMilliseconds = object[key]['expiresInMilliseconds'];
    
    if (
      expiresInMilliseconds &&
      new Date().getTime() >=
        object[key]["createdAt"].getTime() + expiresInMilliseconds
    ) {
      delete object[key];
      return NULL_BULK_STRING;
    } else return object[key]["value"];
  } else return NULL_BULK_STRING;
};
