// Backend Test Automation - Time Entry Controller
//
// Summary:
// - Framework: Mocha
// - Assertions: Chai
// - Mocking/Stubbing: Sinon
// - Tested scenarios:
//   1) startTimer: creates entry when no running timer exists
//   2) startTimer: returns 400 when a timer is already running
//   3) stopTimer: stops running entry and calculates duration
//   4) stopTimer: returns 400 when timer is already stopped
//   5) getTimeEntries: queries by user and sorts by createdAt desc
//   6) updateTimeEntry: updates fields and recalculates duration
//   7) updateTimeEntry: returns 404 when entry is not found
//   8) deleteTimeEntry: deletes user-owned entry successfully
//
// This suite unit-tests timeEntry controller logic by mocking model/database calls.
// It follows the Tutorial 4 pattern: imports/setup, describe blocks, mock req/res,
// assertions, and restore cleanup after each test.

const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');

const TimeEntry = require('../models/TimeEntry');
const {
  startTimer,
  stopTimer,
  getTimeEntries,
  updateTimeEntry,
  deleteTimeEntry,
} = require('../controllers/timeEntryController');

const { expect } = chai;

// Mock Express response object so we can assert status/json calls.
const createMockRes = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
};

describe('timeEntryController', () => {
  // Reset all stubs/spies between tests to avoid cross-test side effects.
  afterEach(() => {
    sinon.restore();
  });

  describe('startTimer', () => {
    it('should create a new time entry when no timer is running', async () => {
      // Mock request data (authenticated user).
      const req = {
        user: { id: new mongoose.Types.ObjectId().toString() },
      };
      // Mock response object.
      const res = createMockRes();

      // Stub model calls: no active timer, then successful create.
      sinon.stub(TimeEntry, 'findOne').resolves(null);
      const createStub = sinon.stub(TimeEntry, 'create').resolves({
        _id: new mongoose.Types.ObjectId(),
        createBy: req.user.id,
        endTime: null,
        duration: 0,
        description: '',
      });

      // Call controller under test.
      await startTimer(req, res);

      // Assertions.
      expect(createStub.calledOnce).to.equal(true);
      expect(
        createStub.calledWithMatch({
          createBy: req.user.id,
          endTime: null,
          duration: 0,
          description: '',
        }),
      ).to.equal(true);
      expect(res.status.calledWith(201)).to.equal(true);
    });

    it('should return 400 when a timer is already running', async () => {
      const req = {
        user: { id: new mongoose.Types.ObjectId().toString() },
      };
      const res = createMockRes();

      // Simulate an existing running entry.
      sinon.stub(TimeEntry, 'findOne').resolves({ _id: 'existing-running' });

      await startTimer(req, res);

      expect(res.status.calledWith(400)).to.equal(true);
      expect(
        res.json.calledWithMatch({ message: 'A timer is already running' }),
      ).to.equal(true);
    });
  });

  describe('stopTimer', () => {
    it('should stop a running timer and set duration', async () => {
      // Freeze current time so duration assertion is deterministic.
      const clock = sinon.useFakeTimers(new Date('2026-04-04T10:00:10.000Z'));
      const req = {
        user: { id: new mongoose.Types.ObjectId().toString() },
        params: { id: new mongoose.Types.ObjectId().toString() },
      };
      const res = createMockRes();

      const entry = {
        _id: req.params.id,
        startTime: new Date('2026-04-04T10:00:00.000Z'),
        endTime: null,
        duration: 0,
        save: sinon.stub().resolvesThis(),
      };

      sinon.stub(TimeEntry, 'findOne').resolves(entry);

      await stopTimer(req, res);

      // Duration should be 10 seconds from 10:00:00 to 10:00:10.
      expect(entry.save.calledOnce).to.equal(true);
      expect(entry.duration).to.equal(10);
      expect(res.status.calledWith(200)).to.equal(true);

      clock.restore();
    });

    it('should return 400 when timer is already stopped', async () => {
      const req = {
        user: { id: new mongoose.Types.ObjectId().toString() },
        params: { id: new mongoose.Types.ObjectId().toString() },
      };
      const res = createMockRes();

      sinon.stub(TimeEntry, 'findOne').resolves({
        _id: req.params.id,
        endTime: new Date('2026-04-04T10:00:10.000Z'),
      });

      await stopTimer(req, res);

      expect(res.status.calledWith(400)).to.equal(true);
      expect(
        res.json.calledWithMatch({ message: 'Timer already stopped' }),
      ).to.equal(true);
    });
  });

  describe('getTimeEntries', () => {
    it('should return user time entries sorted by createdAt desc', async () => {
      const req = {
        user: { id: new mongoose.Types.ObjectId().toString() },
      };
      const res = createMockRes();

      const entries = [{ _id: '1' }, { _id: '2' }];
      const sortStub = sinon.stub().resolves(entries);
      const findStub = sinon
        .stub(TimeEntry, 'find')
        .returns({ sort: sortStub });

      // Call controller and verify query + sort contract.
      await getTimeEntries(req, res);

      expect(findStub.calledWith({ createBy: req.user.id })).to.equal(true);
      expect(sortStub.calledWith({ createdAt: -1 })).to.equal(true);
      expect(res.status.calledWith(200)).to.equal(true);
      expect(res.json.calledWith(entries)).to.equal(true);
    });
  });

  describe('updateTimeEntry', () => {
    it('should update editable fields and recalculate duration when endTime exists', async () => {
      const req = {
        user: { id: new mongoose.Types.ObjectId().toString() },
        params: { id: new mongoose.Types.ObjectId().toString() },
        body: {
          startTime: '2026-04-04T10:00:00.000Z',
          endTime: '2026-04-04T10:00:30.000Z',
          date: '2026-04-04T00:00:00.000Z',
          description: 'Updated description',
        },
      };
      const res = createMockRes();

      const entry = {
        _id: req.params.id,
        startTime: '2026-04-04T09:00:00.000Z',
        endTime: null,
        date: '2026-04-04T00:00:00.000Z',
        description: '',
        duration: 0,
        save: sinon.stub().resolvesThis(),
      };

      sinon.stub(TimeEntry, 'findOne').resolves(entry);

      await updateTimeEntry(req, res);

      // Ensure field updates and derived duration recalculation are applied.
      expect(entry.startTime).to.equal(req.body.startTime);
      expect(entry.endTime).to.equal(req.body.endTime);
      expect(entry.description).to.equal(req.body.description);
      expect(entry.duration).to.equal(30);
      expect(entry.save.calledOnce).to.equal(true);
      expect(res.status.calledWith(200)).to.equal(true);
    });

    it('should return 404 when entry does not exist', async () => {
      const req = {
        user: { id: new mongoose.Types.ObjectId().toString() },
        params: { id: new mongoose.Types.ObjectId().toString() },
        body: { description: 'irrelevant' },
      };
      const res = createMockRes();

      sinon.stub(TimeEntry, 'findOne').resolves(null);

      await updateTimeEntry(req, res);

      expect(res.status.calledWith(404)).to.equal(true);
      expect(
        res.json.calledWithMatch({ message: 'Time entry not found' }),
      ).to.equal(true);
    });
  });

  describe('deleteTimeEntry', () => {
    it('should delete an existing user time entry', async () => {
      const req = {
        user: { id: new mongoose.Types.ObjectId().toString() },
        params: { id: new mongoose.Types.ObjectId().toString() },
      };
      const res = createMockRes();

      const entry = { _id: req.params.id };
      sinon.stub(TimeEntry, 'findOne').resolves(entry);
      const deleteStub = sinon
        .stub(TimeEntry, 'deleteOne')
        .resolves({ deletedCount: 1 });

      await deleteTimeEntry(req, res);

      // Verify deletion query and success response.
      expect(deleteStub.calledWith({ _id: entry._id })).to.equal(true);
      expect(res.status.calledWith(200)).to.equal(true);
      expect(
        res.json.calledWithMatch({
          message: 'Time entry deleted successfully',
        }),
      ).to.equal(true);
    });
  });
});
