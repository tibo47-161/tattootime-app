const { expect } = require('chai');
const sinon = require('sinon');
const { 
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentsByDate
} = require('../../controllers/appointmentController');
const Appointment = require('../../models/Appointment');
const mongoose = require('mongoose');

describe('Appointment Controller', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = {
      params: {},
      body: {},
      query: {},
      user: { id: '60d0fe4f5311236168a109ca' }
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
  
  describe('getAppointments', () => {
    it('should return all appointments for a user', async () => {
      const appointments = [
        { 
          _id: '60d0fe4f5311236168a109cb',
          title: 'Test Appointment 1',
          start: new Date(),
          end: new Date(),
          userId: '60d0fe4f5311236168a109ca'
        },
        { 
          _id: '60d0fe4f5311236168a109cc',
          title: 'Test Appointment 2',
          start: new Date(),
          end: new Date(),
          userId: '60d0fe4f5311236168a109ca'
        }
      ];
      
      sinon.stub(Appointment, 'find').returns({
        populate: sinon.stub().returnsThis(),
        sort: sinon.stub().resolves(appointments)
      });
      
      await getAppointments(req, res, next);
      
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(appointments)).to.be.true;
    });
    
    it('should handle errors', async () => {
      const error = new Error('Database error');
      sinon.stub(Appointment, 'find').throws(error);
      
      await getAppointments(req, res, next);
      
      expect(next.calledWith(error)).to.be.true;
    });
  });
  
  describe('getAppointment', () => {
    it('should return a specific appointment', async () => {
      const appointment = { 
        _id: '60d0fe4f5311236168a109cb',
        title: 'Test Appointment',
        start: new Date(),
        end: new Date(),
        userId: '60d0fe4f5311236168a109ca'
      };
      
      req.params.id = '60d0fe4f5311236168a109cb';
      
      sinon.stub(Appointment, 'findById').returns({
        populate: sinon.stub().resolves(appointment)
      });
      
      await getAppointment(req, res, next);
      
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(appointment)).to.be.true;
    });
    
    it('should return 404 if appointment not found', async () => {
      req.params.id = '60d0fe4f5311236168a109cb';
      
      sinon.stub(Appointment, 'findById').returns({
        populate: sinon.stub().resolves(null)
      });
      
      await getAppointment(req, res, next);
      
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Termin nicht gefunden' })).to.be.true;
    });
  });
  
  describe('createAppointment', () => {
    it('should create a new appointment', async () => {
      const newAppointment = { 
        title: 'New Appointment',
        start: new Date(),
        end: new Date(),
        userId: '60d0fe4f5311236168a109ca'
      };
      
      req.body = newAppointment;
      
      const savedAppointment = { 
        _id: '60d0fe4f5311236168a109cb',
        ...newAppointment
      };
      
      sinon.stub(Appointment.prototype, 'save').resolves(savedAppointment);
      
      await createAppointment(req, res, next);
      
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith(savedAppointment)).to.be.true;
    });
  });
  
  describe('updateAppointment', () => {
    it('should update an existing appointment', async () => {
      const updatedAppointment = { 
        _id: '60d0fe4f5311236168a109cb',
        title: 'Updated Appointment',
        start: new Date(),
        end: new Date(),
        userId: '60d0fe4f5311236168a109ca'
      };
      
      req.params.id = '60d0fe4f5311236168a109cb';
      req.body = { title: 'Updated Appointment' };
      
      sinon.stub(Appointment, 'findByIdAndUpdate').resolves(updatedAppointment);
      
      await updateAppointment(req, res, next);
      
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(updatedAppointment)).to.be.true;
    });
    
    it('should return 404 if appointment not found', async () => {
      req.params.id = '60d0fe4f5311236168a109cb';
      req.body = { title: 'Updated Appointment' };
      
      sinon.stub(Appointment, 'findByIdAndUpdate').resolves(null);
      
      await updateAppointment(req, res, next);
      
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Termin nicht gefunden' })).to.be.true;
    });
  });
  
  describe('deleteAppointment', () => {
    it('should delete an existing appointment', async () => {
      const deletedAppointment = { 
        _id: '60d0fe4f5311236168a109cb',
        title: 'Deleted Appointment',
        userId: '60d0fe4f5311236168a109ca'
      };
      
      req.params.id = '60d0fe4f5311236168a109cb';
      
      sinon.stub(Appointment, 'findByIdAndDelete').resolves(deletedAppointment);
      
      await deleteAppointment(req, res, next);
      
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ message: 'Termin erfolgreich gelöscht' })).to.be.true;
    });
    
    it('should return 404 if appointment not found', async () => {
      req.params.id = '60d0fe4f5311236168a109cb';
      
      sinon.stub(Appointment, 'findByIdAndDelete').resolves(null);
      
      await deleteAppointment(req, res, next);
      
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Termin nicht gefunden' })).to.be.true;
    });
  });
  
  describe('getAppointmentsByDate', () => {
    it('should return appointments for a specific date range', async () => {
      const appointments = [
        { 
          _id: '60d0fe4f5311236168a109cb',
          title: 'Test Appointment 1',
          start: new Date('2025-06-01T10:00:00'),
          end: new Date('2025-06-01T11:00:00'),
          userId: '60d0fe4f5311236168a109ca'
        },
        { 
          _id: '60d0fe4f5311236168a109cc',
          title: 'Test Appointment 2',
          start: new Date('2025-06-02T14:00:00'),
          end: new Date('2025-06-02T15:00:00'),
          userId: '60d0fe4f5311236168a109ca'
        }
      ];
      
      req.query = {
        start: '2025-06-01T00:00:00.000Z',
        end: '2025-06-07T23:59:59.999Z'
      };
      
      sinon.stub(Appointment, 'find').returns({
        populate: sinon.stub().returnsThis(),
        sort: sinon.stub().resolves(appointments)
      });
      
      await getAppointmentsByDate(req, res, next);
      
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(appointments)).to.be.true;
    });
  });
});

