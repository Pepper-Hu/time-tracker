// Time entry controller for timer-based CRUD operations.
// It enforces one running timer per user and keeps duration in seconds.
const TimeEntry = require('../models/TimeEntry');

// Returns non-negative duration; invalid or reversed timestamps resolve to 0.
const calculateDurationInSeconds = (startTime, endTime) => {
  const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return 0;
  return Math.floor(diffMs / 1000);
};

// Starts a new timer entry for the authenticated user.
const startTimer = async (req, res) => {
  try {
    const existingRunningEntry = await TimeEntry.findOne({
      createBy: req.user.id,
      endTime: null,
    });

    if (existingRunningEntry) {
      return res.status(400).json({ message: 'A timer is already running' });
    }

    const now = new Date();

    const timeEntry = await TimeEntry.create({
      startTime: now,
      endTime: null,
      date: now,
      duration: 0,
      createBy: req.user.id,
      description: '',
    });

    return res.status(201).json(timeEntry);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Stops a specific running timer entry and finalises its duration.
const stopTimer = async (req, res) => {
  try {
    const timeEntry = await TimeEntry.findOne({
      _id: req.params.id,
      createBy: req.user.id,
    });

    if (!timeEntry) {
      return res.status(404).json({ message: 'Time entry not found' });
    }

    if (timeEntry.endTime) {
      return res.status(400).json({ message: 'Timer already stopped' });
    }

    const endTime = new Date();
    const duration = calculateDurationInSeconds(timeEntry.startTime, endTime);

    timeEntry.endTime = endTime;
    timeEntry.duration = duration;

    const updatedTimeEntry = await timeEntry.save();
    return res.status(200).json(updatedTimeEntry);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Lists all time entries created by the authenticated user.
const getTimeEntries = async (req, res) => {
  try {
    const timeEntries = await TimeEntry.find({ createBy: req.user.id }).sort({
      createdAt: -1,
    });

    return res.status(200).json(timeEntries);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Updates editable fields on a user-owned time entry.
const updateTimeEntry = async (req, res) => {
  try {
    const timeEntry = await TimeEntry.findOne({
      _id: req.params.id,
      createBy: req.user.id,
    });

    if (!timeEntry) {
      return res.status(404).json({ message: 'Time entry not found' });
    }

    const { startTime, endTime, date, description } = req.body;

    if (startTime !== undefined) timeEntry.startTime = startTime;
    if (endTime !== undefined) timeEntry.endTime = endTime;
    if (date !== undefined) timeEntry.date = date;
    if (description !== undefined) timeEntry.description = description;

    if (timeEntry.endTime) {
      timeEntry.duration = calculateDurationInSeconds(
        timeEntry.startTime,
        timeEntry.endTime,
      );
    }

    const updatedTimeEntry = await timeEntry.save();
    return res.status(200).json(updatedTimeEntry);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Deletes a user-owned time entry.
const deleteTimeEntry = async (req, res) => {
  try {
    const timeEntry = await TimeEntry.findOne({
      _id: req.params.id,
      createBy: req.user.id,
    });

    if (!timeEntry) {
      return res.status(404).json({ message: 'Time entry not found' });
    }

    await TimeEntry.deleteOne({ _id: timeEntry._id });
    return res.status(200).json({ message: 'Time entry deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  startTimer,
  stopTimer,
  getTimeEntries,
  updateTimeEntry,
  deleteTimeEntry,
};
