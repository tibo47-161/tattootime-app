import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InstallPrompt from '../InstallPrompt';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('InstallPrompt', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should not render when app is in standalone mode', () => {
    // Mock standalone mode
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(<InstallPrompt />);
    
    // Prompt should not be visible
    expect(screen.queryByText(/Installiere TattooTime/i)).not.toBeInTheDocument();
  });

  it('should render iOS instructions when on iOS device', () => {
    // Mock iOS device
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true,
    });

    render(<InstallPrompt />);
    
    // iOS specific text should be visible
    expect(screen.getByText(/Tippe auf/i)).toBeInTheDocument();
    expect(screen.getByText(/Teilen/i)).toBeInTheDocument();
    expect(screen.getByText(/Zum Home-Bildschirm/i)).toBeInTheDocument();
    
    // Install button should not be visible for iOS
    expect(screen.queryByText(/Installieren/i)).not.toBeInTheDocument();
  });

  it('should render install button for non-iOS devices', () => {
    // Mock non-iOS device
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      configurable: true,
    });

    render(<InstallPrompt />);
    
    // Install button should be visible
    expect(screen.getByText(/Installieren/i)).toBeInTheDocument();
  });

  it('should close prompt when close button is clicked', () => {
    // Mock non-iOS device
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      configurable: true,
    });

    render(<InstallPrompt />);
    
    // Prompt should be visible initially
    expect(screen.getByText(/Installiere TattooTime/i)).toBeInTheDocument();
    
    // Click close button
    fireEvent.click(screen.getByLabelText(/Schließen/i));
    
    // Prompt should not be visible after closing
    expect(screen.queryByText(/Installiere TattooTime/i)).not.toBeInTheDocument();
  });

  it('should save to localStorage when iOS prompt is closed', () => {
    // Mock iOS device
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true,
    });

    render(<InstallPrompt />);
    
    // Click close button
    fireEvent.click(screen.getByLabelText(/Schließen/i));
    
    // Should save to localStorage
    expect(localStorageMock.getItem('iosPromptClosed')).toBe('true');
  });
});

