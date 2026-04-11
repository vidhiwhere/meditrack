const QRCode = require('qrcode');

module.exports = {
  generateQRCode: async (data) => {
    try {
      const qrCode = await QRCode.toDataURL(JSON.stringify(data));
      return qrCode;
    } catch (error) {
      throw new Error('Failed to generate QR code: ' + error.message);
    }
  },

  generatePrescriptionQR: async (prescriptionId, verificationToken) => {
    const data = {
      prescriptionId,
      verificationToken,
      timestamp: new Date().toISOString(),
    };
    return module.exports.generateQRCode(data);
  },
};
