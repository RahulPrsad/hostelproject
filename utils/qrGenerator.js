const QRCode = require('qrcode');

const generateQRDataURL = async (payload) => {
  return await QRCode.toDataURL(String(payload), { type: 'image/png', margin: 2, width: 256 });
};

const generateQRBuffer = async (payload) => {
  return await QRCode.toBuffer(String(payload), { type: 'png', margin: 2, width: 256 });
};

module.exports = { generateQRDataURL, generateQRBuffer };
