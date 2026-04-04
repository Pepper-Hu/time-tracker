// Backend Test Automation - Authentication Controller
//
// Summary:
// - Framework: Mocha
// - Assertions: Chai
// - Mocking/Stubbing: Sinon
// - Tested scenarios:
//   1) registerUser: creates account successfully and returns token payload
//   2) registerUser: returns 400 when email already exists
//   3) registerUser: returns 500 on model/create failure
//   4) loginUser: returns user payload when credentials are valid
//   5) loginUser: returns 401 when credentials are invalid
//   6) loginUser: returns 500 on model lookup failure
//
// This suite follows Tutorial 4 style by mocking DB/auth dependencies so tests
// run quickly without requiring live MongoDB calls.

const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { registerUser, loginUser } = require('../controllers/authController');

const { expect } = chai;

// Mock Express response object so assertions can inspect status/json calls.
const createMockRes = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
};

describe('authController', () => {
  // Restore all stubs/spies after each test to avoid bleed across test cases.
  afterEach(() => {
    sinon.restore();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      // Mock incoming request data.
      const req = {
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
        },
      };
      const res = createMockRes();

      // Mock DB + token operations.
      sinon.stub(User, 'findOne').resolves(null);
      const createdUser = {
        id: new mongoose.Types.ObjectId().toString(),
        name: req.body.name,
        email: req.body.email,
      };
      const createStub = sinon.stub(User, 'create').resolves(createdUser);
      const signStub = sinon.stub(jwt, 'sign').returns('mocked-jwt-token');

      // Call controller.
      await registerUser(req, res);

      // Assertions.
      expect(createStub.calledOnceWith(req.body)).to.equal(true);
      expect(signStub.calledOnce).to.equal(true);
      expect(res.status.calledWith(201)).to.equal(true);
      expect(
        res.json.calledWithMatch({
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          token: 'mocked-jwt-token',
        }),
      ).to.equal(true);
    });

    it('should return 400 when user already exists', async () => {
      const req = {
        body: {
          name: 'Existing User',
          email: 'existing@example.com',
          password: 'Password123!',
        },
      };
      const res = createMockRes();

      // Simulate duplicate email in DB.
      sinon.stub(User, 'findOne').resolves({ _id: 'existing-user-id' });

      await registerUser(req, res);

      expect(res.status.calledWith(400)).to.equal(true);
      expect(
        res.json.calledWithMatch({ message: 'User already exists' }),
      ).to.equal(true);
    });

    it('should return 500 when registration throws an error', async () => {
      const req = {
        body: {
          name: 'Error User',
          email: 'error@example.com',
          password: 'Password123!',
        },
      };
      const res = createMockRes();

      sinon.stub(User, 'findOne').resolves(null);
      sinon.stub(User, 'create').rejects(new Error('DB create failed'));

      await registerUser(req, res);

      expect(res.status.calledWith(500)).to.equal(true);
      expect(
        res.json.calledWithMatch({ message: 'DB create failed' }),
      ).to.equal(true);
    });
  });

  describe('loginUser', () => {
    it('should login successfully with valid credentials', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'Password123!',
        },
      };
      const res = createMockRes();

      const foundUser = {
        id: new mongoose.Types.ObjectId().toString(),
        name: 'Test User',
        email: req.body.email,
        password: 'hashed-password',
      };

      sinon.stub(User, 'findOne').resolves(foundUser);
      sinon.stub(bcrypt, 'compare').resolves(true);
      sinon.stub(jwt, 'sign').returns('mocked-login-token');

      await loginUser(req, res);

      expect(
        res.json.calledWithMatch({
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          token: 'mocked-login-token',
        }),
      ).to.equal(true);
    });

    it('should return 401 when credentials are invalid', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'WrongPassword',
        },
      };
      const res = createMockRes();

      const foundUser = {
        id: new mongoose.Types.ObjectId().toString(),
        name: 'Test User',
        email: req.body.email,
        password: 'hashed-password',
      };

      sinon.stub(User, 'findOne').resolves(foundUser);
      sinon.stub(bcrypt, 'compare').resolves(false);

      await loginUser(req, res);

      expect(res.status.calledWith(401)).to.equal(true);
      expect(
        res.json.calledWithMatch({ message: 'Invalid email or password' }),
      ).to.equal(true);
    });

    it('should return 500 when login throws an error', async () => {
      const req = {
        body: {
          email: 'broken@example.com',
          password: 'Password123!',
        },
      };
      const res = createMockRes();

      sinon.stub(User, 'findOne').rejects(new Error('DB lookup failed'));

      await loginUser(req, res);

      expect(res.status.calledWith(500)).to.equal(true);
      expect(
        res.json.calledWithMatch({ message: 'DB lookup failed' }),
      ).to.equal(true);
    });
  });
});
