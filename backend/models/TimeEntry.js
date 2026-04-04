const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema(
  {
    startTime: { type: Date, required: true },
    endTime: { type: Date, default: null },
    date: { type: Date, required: true, default: Date.now },
    duration: { type: Number, required: true, default: 0, min: 0 },
    createBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: { type: String, default: '' },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('TimeEntry', timeEntrySchema);
