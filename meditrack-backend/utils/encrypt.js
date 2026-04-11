const crypto = require('crypto');
const env = require('../config/env');

const algorithm = 'aes-256-cbc';

module.exports = {
  encrypt: (text) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(env.ENCRYPTION_KEY || 'default_key_32bytes_long_key'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  },

  decrypt: (text) => {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(env.ENCRYPTION_KEY || 'default_key_32bytes_long_key'), iv);
    let decrypted = decipher.update(Buffer.from(parts.join(':'), 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  },
};
