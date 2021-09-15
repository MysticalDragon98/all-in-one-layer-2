exports.getSubstringProperty = function getSubstringProperty (text, match, length = match.length) {
    if (text.includes(match)) return text.substring(text.indexOf(match) + length);
}

exports.wait = milis => new Promise(d => setTimeout(d, milis));
exports.ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";