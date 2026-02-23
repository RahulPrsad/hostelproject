const mongoose = require('mongoose');

const fruitDistributionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date: { type: Date, required: true, default: Date.now },
  quantity: { type: Number, required: true, default: 1 },
}, { timestamps: true });

fruitDistributionSchema.index({ studentId: 1, date: -1 });

module.exports = mongoose.model('FruitDistribution', fruitDistributionSchema);
