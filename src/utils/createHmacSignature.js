import crypto from 'crypto';

export default function createHmacSignature(data, secret) {
  return crypto
    .createHmac('sha512', secret)
    .update(Buffer.from(data, 'utf-8'))
    .digest('hex');
}
