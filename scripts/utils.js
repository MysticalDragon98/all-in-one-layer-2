exports.getSubstringProperty = function getSubstringProperty (text, match, length = match.length) {
    if (text.includes(match)) return text.substring(text.indexOf(match) + length);
}

exports.wait = milis => new Promise(d => setTimeout(d, milis));
exports.ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

exports.getSigner = (text, signature) => {
    const msgBuffer = Buffer.from(text);
    const msgHash = hashPersonalMessage(msgBuffer);
    const signatureParams = fromRpcSig(signature);
    const pubKey = ecrecover(msgHash, signatureParams.v, signatureParams.r, signatureParams.s);
    const addressBuffer = publicToAddress(pubKey);
    
    return bufferToHex(addressBuffer);
}

exports.ok = (d, m) => { if(!d) throw new Error(m); return d; };