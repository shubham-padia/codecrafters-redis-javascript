export const set = (key, value, object) => {
    return {...object, [key]: value};
}

export const get = (key, object) => {
    if (key in object) return object[key]
    else return '$-1\r\n';
}