// TODO: Take them away and put them into helpers.
const preprocessName = (name = '') => name.toLowerCase().replace(/[^\p{L}0-9-_+.\s]/gui, '').split(' ').join('-');

// Tranform strings with quantity post-fixed (e.g. K, M, G) into actual numbers.
// TODO: Can only deal with K for now because, time.
const quantityPostfixToNumber = (numberString) => {
  // TODO: Check for malformed input.
  const numberPortion = numberString.split(/[K,M,B,T]/i)[0];

  if (isNaN(+numberPortion)) {
    return NaN;
  }

  return +numberPortion * 1000;
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));

module.exports = {
  preprocessName,
  quantityPostfixToNumber,
  delay
};
