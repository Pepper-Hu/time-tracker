// Time entry routes for timer-based CRUD operations.
// All endpoints in this router require JWT authentication.
const express = require('express');
const {
  startTimer,
  stopTimer,
  getTimeEntries,
  updateTimeEntry,
  deleteTimeEntry,
} = require('../controllers/timeEntryController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Starts a timer and creates a new time entry for the authenticated user.
router.post('/start', protect, startTimer);

// Stops a running timer entry by id and finalizes its duration.
router.put('/:id/stop', protect, stopTimer);

// Returns all time entries for the authenticated user.
router.get('/', protect, getTimeEntries);

// Updates a user-owned time entry (description/time fields).
router.put('/:id', protect, updateTimeEntry);

// Deletes a user-owned time entry by id.
router.delete('/:id', protect, deleteTimeEntry);

module.exports = router;
