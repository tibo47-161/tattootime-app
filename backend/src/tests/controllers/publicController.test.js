const { expect } = require('chai');
const sinon = require('sinon');
const { 
  getUserPublicProfile,
  getAvailableSlots,
  createBooking,
  confirmBooking,
  cancelBooking,
  getBookingByToken
} = require('../../controllers/publicController');
const User = require('../../models/User');
const Appointment = require('../../models/Appointment');
const WorkingHours = require('../../models/WorkingHours');
const BlockedTime = require('../../models/BlockedTime');
const mongoose = require('mongoose');
const crypto = require('crypto');

describe('Public Controller', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = {
      params: {},
      body: {},
      query: {}
    };
    
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    
    next = sinon.stub();
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('getUserPublicProfile', () => {
    it('should return public profile for a user', async () => {
      const user = { 
        _id: '60d0fe4f5311236168a109ca',
        name: 'Test User',
        email: 'test@example.com',
        businessName: 'Test Tattoo Studio',
        address: '123 Main St',
        phone: '123-456-7890',
        profileImage: 'profile.jpg'
      };
      
      req.params.userId = '60d0fe4f5311236168a109ca';
      
      sinon.stub(User, 'findById').resolves(user);
      
      await getUserPublicProfile(req, res, next);
      
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({
        id: user._id,
        name: user.name,
        businessName: user.businessName,
        address: user.address,
        phone: user.phone,
        profileImage: user.profileImage
      })).to.be.true;
    });
    
    it('should return 404 if user not found', async () => {
      req.params.userId = '60d0fe4f5311236168a109ca';
      
      sinon.stub(User, 'findById').resolves(null);
      
      await getUserPublicProfile(req, res, next);
      
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Benutzer nicht gefunden' })).to.be.true;
    });
  });
  
  describe('getAvailableSlots', () => {
    it('should return available time slots for a user', async () => {
      const userId = '60d0fe4f5311236168a109ca';
      const start = '2025-06-01T00:00:00.000Z';
      const end = '2025-06-07T23:59:59.999Z';
      
      req.params.userId = userId;
      req.query = { start, end };
      
      // Mock working hours
      const workingHours = [
        { day: 1, start: '09:00', end: '17:00' }, // Monday
        { day: 2, start: '09:00', end: '17:00' }, // Tuesday
        { day: 3, start: '09:00', end: '17:00' }, // Wednesday
        { day: 4, start: '09:00', end: '17:00' }, // Thursday
        { day: 5, start: '09:00', end: '17:00' }  // Friday
      ];
      
      sinon.stub(WorkingHours, 'find').resolves(workingHours);
      
      // Mock existing appointments
      const appointments = [
        { 
          start: new Date('2025-06-02T10:00:00'), // Monday 10:00
          end: new Date('2025-06-02T11:00:00')    // Monday 11:00
        }
      ];
      
      sinon.stub(Appointment, 'find').resolves(appointments);
      
      // Mock blocked times
      const blockedTimes = [
        {
          start: new Date('2025-06-03T14:00:00'), // Tuesday 14:00
          end: new Date('2025-06-03T17:00:00')    // Tuesday 17:00
        }
      ];
      
      sinon.stub(BlockedTime, 'find').resolves(blockedTimes);
      
      await getAvailableSlots(req, res, next);
      
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      // The response should be an array of available slots
      const slots = res.json.firstCall.args[0];
      expect(Array.isArray(slots)).to.be.true;
    });
  });
  
  describe('createBooking', () => {
    it('should create a new booking', async () => {
      const bookingData = {
        name: 'Test Customer',
        email: 'customer@example.com',
        phone: '123-456-7890',
        tattooMotif: 'Dragon',
        tattooBodyPart: 'Arm',
        tattooSize: '10x15cm',
        notes: 'First tattoo',
        start: '2025-06-10T10:00:00.000Z',
        end: '2025-06-10T12:00:00.000Z',
        userId: '60d0fe4f5311236168a109ca'
      };
      
      req.body = bookingData;
      
      // Mock crypto.randomBytes
      sinon.stub(crypto, 'randomBytes').returns({
        toString: sinon.stub().returns('random-token')
      });
      
      // Mock appointment save
      const savedAppointment = { 
        _id: '60d0fe4f5311236168a109cb',
        ...bookingData,
        confirmationToken: 'random-token',
        cancellationToken: 'random-token',
        isConfirmed: false
      };
      
      sinon.stub(Appointment.prototype, 'save').resolves(savedAppointment);
      
      // Mock sendMail function
      const sendMailStub = sinon.stub().resolves();
      sinon.stub(require('../../utils/email'), 'sendMail').value(sendMailStub);
      
      await createBooking(req, res, next);
      
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith(expect.objectContaining({
        name: bookingData.name,
        email: bookingData.email
      }))).to.be.true;
      
      // Check if email was sent
      expect(sendMailStub.calledOnce).to.be.true;
    });
  });
  
  describe('confirmBooking', () => {
    it('should confirm a booking with valid token', async () => {
      const token = 'valid-confirmation-token';
      req.params.token = token;
      
      const appointment = {
        _id: '60d0fe4f5311236168a109cb',
        name: 'Test Customer',
        email: 'customer@example.com',
        isConfirmed: false,
        save: sinon.stub().resolves()
      };
      
      sinon.stub(Appointment, 'findOne').resolves(appointment);
      
      // Mock sendMail function
      const sendMailStub = sinon.stub().resolves();
      sinon.stub(require('../../utils/email'), 'sendMail').value(sendMailStub);
      
      await confirmBooking(req, res, next);
      
      expect(appointment.isConfirmed).to.be.true;
      expect(appointment.save.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ message: 'Termin erfolgreich bestätigt' })).to.be.true;
      
      // Check if email was sent
      expect(sendMailStub.calledOnce).to.be.true;
    });
    
    it('should return 404 if booking not found', async () => {
      req.params.token = 'invalid-token';
      
      sinon.stub(Appointment, 'findOne').resolves(null);
      
      await confirmBooking(req, res, next);
      
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Termin nicht gefunden oder Token ungültig' })).to.be.true;
    });
  });
  
  describe('cancelBooking', () => {
    it('should cancel a booking with valid token', async () => {
      const token = 'valid-cancellation-token';
      req.params.token = token;
      
      const appointment = {
        _id: '60d0fe4f5311236168a109cb',
        name: 'Test Customer',
        email: 'customer@example.com',
        isCancelled: false,
        save: sinon.stub().resolves()
      };
      
      sinon.stub(Appointment, 'findOne').resolves(appointment);
      
      // Mock sendMail function
      const sendMailStub = sinon.stub().resolves();
      sinon.stub(require('../../utils/email'), 'sendMail').value(sendMailStub);
      
      await cancelBooking(req, res, next);
      
      expect(appointment.isCancelled).to.be.true;
      expect(appointment.save.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ message: 'Termin erfolgreich storniert' })).to.be.true;
      
      // Check if email was sent
      expect(sendMailStub.calledOnce).to.be.true;
    });
    
    it('should return 404 if booking not found', async () => {
      req.params.token = 'invalid-token';
      
      sinon.stub(Appointment, 'findOne').resolves(null);
      
      await cancelBooking(req, res, next);
      
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Termin nicht gefunden oder Token ungültig' })).to.be.true;
    });
  });
  
  describe('getBookingByToken', () => {
    it('should return booking details for a valid token', async () => {
      const token = 'valid-token';
      req.params.token = token;
      
      const appointment = {
        _id: '60d0fe4f5311236168a109cb',
        name: 'Test Customer',
        email: 'customer@example.com',
        start: new Date('2025-06-10T10:00:00'),
        end: new Date('2025-06-10T12:00:00'),
        tattooMotif: 'Dragon',
        isConfirmed: true,
        isCancelled: false
      };
      
      sinon.stub(Appointment, 'findOne').returns({
        populate: sinon.stub().resolves(appointment)
      });
      
      await getBookingByToken(req, res, next);
      
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(appointment)).to.be.true;
    });
    
    it('should return 404 if booking not found', async () => {
      req.params.token = 'invalid-token';
      
      sinon.stub(Appointment, 'findOne').returns({
        populate: sinon.stub().resolves(null)
      });
      
      await getBookingByToken(req, res, next);
      
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Termin nicht gefunden oder Token ungültig' })).to.be.true;
    });
  });
});

