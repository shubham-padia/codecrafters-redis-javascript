export const parse = (argumentArray) => {
    return getArgumentValuePairsRecursive(argumentArray);
}

const getArgumentValuePairsRecursive = (argumentArray, i = 0, result = []) => {
    const argumentArrayLength = argumentArray.length;
    if (i === argumentArrayLength) {
        return result;
    }

    if(!argumentArray[i].startsWith('--')) {
        throw new Error ('Invalid inline arguments.');
    }

    const argument = argumentArray[i];
    i = i + 1;
    let value = ''

    while(i < argumentArrayLength && !argumentArray[i].startsWith('--')) {
        value = value + ' ' + argumentArray[i];
        i = i + 1;
    }
    result.push({
        argument,
        value,
    })

    return getArgumentValuePairsRecursive(argumentArray, i, result);
}
