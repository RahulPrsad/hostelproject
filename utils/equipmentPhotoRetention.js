const Equipment = require('../models/Equipment');

const PHOTO_RETENTION_MS = 24 * 60 * 60 * 1000;

function getPhotoExpiryDate(fromDate = new Date()) {
  return new Date(fromDate.getTime() + PHOTO_RETENTION_MS);
}

async function cleanupExpiredEquipmentPhotos(now = new Date()) {
  await Equipment.updateMany(
    {
      photosExpireAt: { $lte: now },
      $or: [{ issuePhoto: { $ne: '' } }, { returnPhoto: { $ne: '' } }],
    },
    {
      $set: { issuePhoto: '', returnPhoto: '' },
      $unset: { photosExpireAt: '' },
    }
  );
}

module.exports = {
  cleanupExpiredEquipmentPhotos,
  getPhotoExpiryDate,
};
