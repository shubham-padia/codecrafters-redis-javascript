export const findFirstInteger = (str) => {
    let result = "";
    let foundDigit = false;
  
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
  
      if (char >= "0" && char <= "9") {
        result += char;
        foundDigit = true;
      } else if (foundDigit) {
        // Stop once we've found the first integer
        break;
      }
    }
  
    return Number(result);
};