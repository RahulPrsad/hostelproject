const QRCode = require('qrcode');

const generateQRDataURL = async (payload) => {
  return await QRCode.toDataURL(String(payload), { type: 'image/png', margin: 2, width: 256 });
};

module.exports = { generateQRDataURL };
