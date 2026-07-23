const { ImageKit } = require('@imagekit/nodejs');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'mock_public_key',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'mock_private_key',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/mock'
});

module.exports = imagekit;
