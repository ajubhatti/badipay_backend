const crypto = require("crypto");

const algorithm = "aes-256-cbc";

var secret = "your-secret-key";
const key = crypto.scryptSync(secret, "salt", 24); //create key
// const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

const salt = "foobar";
const hash = crypto.createHash("sha1");

hash.update(salt);

var text = "this is the text to be encrypted"; //text to be encrypted

function encrypt(text) {
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return {
    iv: iv.toString("hex"),
    encryptedData: encrypted.toString("hex"),
    key: key.toString("hex"),
  };
}

// var encrypted = encrypt("Hello World!");

function decrypt(text) {
  let iv = Buffer.from(text.iv, "hex");
  let encryptedText = Buffer.from(text.encryptedData, "hex");

  let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);

  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

function encrypt2(text) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  //   var encrypted = cipher.update(text, "utf8", "hex") + cipher.final("hex"); // encrypted text
  //   return encrypted;

  var crypted = cipher.update(text, "utf8", "hex");
  crypted += cipher.final("hex");
  return crypted;
}

function decrypt2(text) {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);

  let decryptedData = decipher.update(text, "hex", "utf-8");

  decryptedData += decipher.final("utf8");

  var dec = decipher.update(text, "hex", "utf8");
  dec += decipher.final("utf8");
  return dec;

  //   var decrypted = decipher.update(text, "hex", "utf8") + decipher.final("utf8"); //deciphered text
  //   return decrypted;
}

function encrypt3(text) {
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString("hex");
}

function decrypt3(text) {
  let encryptedText = Buffer.from(text, "hex");
  let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

function encrypt4(text) {
  var cipher = crypto.createCipher("aes-256-cbc", key);
  var crypted = cipher.update(text, "utf8", "hex");
  crypted += cipher.final("hex");
  return crypted; //94grt976c099df25794bf9ccb85bea72
}

function decrypt4(text) {
  var decipher = crypto.createDecipher("aes-256-cbc", key);
  var dec = decipher.update(text, "hex", "utf8");
  dec += decipher.final("utf8");
  return dec; //myPlainText
}

module.exports = {
  encrypt,
  decrypt,
  encrypt2,
  decrypt2,
  encrypt3,
  decrypt3,
  encrypt4,
  decrypt4,
};

// const crypto = require("crypto");
// const algorithm = "aes-128-cbc";
// const salt = "foobar";
// const hash = crypto.createHash("sha1");

// hash.update(salt);

// // `hash.digest()` returns a Buffer by default when no encoding is given
// let key = hash.digest().slice(0, 16);
// crypto
//   .createHash("sha256")
//   .update(String(secret))
//   .digest("base64")
//   .substr(0, 32);
// const iv = crypto.randomBytes(16);

// exports.encrypt = function (text) {
//   let cipher = crypto.createCipheriv(algorithm, key, iv);
//   let encrypted = cipher.update(text);
//   encrypted = Buffer.concat([encrypted, cipher.final()]);
//   return { iv: iv.toString("hex"), encryptedData: encrypted.toString("hex") };
// };

// exports.decrypt = function (text) {
//   let iv = Buffer.from(text.iv, "hex");
//   let encryptedText = Buffer.from(text.encryptedData, "hex");

//   let decipher = crypto.createDecipheriv(algorithm, key, iv);
//   let decrypted = decipher.update(encryptedText);
//   decrypted = Buffer.concat([decrypted, decipher.final()]);

//   return decrypted.toString();
// };
