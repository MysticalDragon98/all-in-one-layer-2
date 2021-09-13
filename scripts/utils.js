exports.getSubstringProperty = function getSubstringProperty (text, match, length = match.length) {
    if (text.includes(match)) return text.substring(text.indexOf(match) + length);
}