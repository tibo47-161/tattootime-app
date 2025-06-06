import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../api';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('API Service', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should create axios instance with base URL', () => {
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: expect.any(String),
      })
    );
  });

  it('should add authorization header when token exists', async () => {
    // Setup mock token
    localStorageMock.setItem('token', 'test-token');
    
    // Setup mock for axios request
    const mockResponse = { data: { success: true } };
    axios.request.mockResolvedValueOnce(mockResponse);
    
    // Make a request
    await api.get('/test');
    
    // Check if authorization header was added
    expect(axios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });

  it('should not add authorization header when token does not exist', async () => {
    // Setup mock for axios request
    const mockResponse = { data: { success: true } };
    axios.request.mockResolvedValueOnce(mockResponse);
    
    // Make a request
    await api.get('/test');
    
    // Check that authorization header was not added
    expect(axios.request).toHaveBeenCalledWith(
      expect.not.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.any(String),
        }),
      })
    );
  });

  it('should handle successful responses', async () => {
    // Setup mock for axios request
    const mockResponse = { data: { success: true, message: 'Success' } };
    axios.request.mockResolvedValueOnce(mockResponse);
    
    // Make a request
    const result = await api.get('/test');
    
    // Check response
    expect(result).toEqual(mockResponse.data);
  });

  it('should handle error responses', async () => {
    // Setup mock for axios request
    const mockError = {
      response: {
        data: { message: 'Error message' },
        status: 400,
      },
    };
    axios.request.mockRejectedValueOnce(mockError);
    
    // Make a request and expect it to throw
    await expect(api.get('/test')).rejects.toEqual(
      expect.objectContaining({
        message: 'Error message',
        status: 400,
      })
    );
  });

  it('should handle network errors', async () => {
    // Setup mock for axios request
    const mockError = new Error('Network Error');
    axios.request.mockRejectedValueOnce(mockError);
    
    // Make a request and expect it to throw
    await expect(api.get('/test')).rejects.toEqual(
      expect.objectContaining({
        message: 'Network Error',
      })
    );
  });
});

