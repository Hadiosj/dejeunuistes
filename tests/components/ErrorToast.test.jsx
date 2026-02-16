import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorToast from '../../src/components/ErrorToast';

describe('ErrorToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render error message', () => {
    const mockOnClose = vi.fn();
    render(<ErrorToast message="Test error message" onClose={mockOnClose} />);

    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should display error icon and title', () => {
    const mockOnClose = vi.fn();
    render(<ErrorToast message="Test error" onClose={mockOnClose} />);

    expect(screen.getByText(/❌ Erreur/)).toBeInTheDocument();
  });

  it('should render close button', () => {
    const mockOnClose = vi.fn();
    render(<ErrorToast message="Test error" onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveTextContent('✕');
  });

  it('should call onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();

    render(<ErrorToast message="Test error" onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should auto-dismiss after ERROR_TOAST_DURATION', () => {
    const mockOnClose = vi.fn();
    render(<ErrorToast message="Test error" onClose={mockOnClose} />);

    expect(mockOnClose).not.toHaveBeenCalled();

    // Fast-forward time by ERROR_TOAST_DURATION (from constants.js, typically 5000ms)
    vi.advanceTimersByTime(5000);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should clear timeout on unmount', () => {
    const mockOnClose = vi.fn();
    const { unmount } = render(<ErrorToast message="Test error" onClose={mockOnClose} />);

    unmount();

    // Advance timers after unmount - onClose should not be called
    vi.advanceTimersByTime(5000);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should display long error messages', () => {
    const longMessage =
      'This is a very long error message that should still be displayed correctly in the toast component';
    const mockOnClose = vi.fn();

    render(<ErrorToast message={longMessage} onClose={mockOnClose} />);

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('should have correct styling classes', () => {
    const mockOnClose = vi.fn();
    const { container } = render(<ErrorToast message="Test" onClose={mockOnClose} />);

    const nesContainer = container.querySelector('.nes-container');
    expect(nesContainer).toBeInTheDocument();
    expect(nesContainer).toHaveClass('is-rounded');
    expect(nesContainer).toHaveClass('is-dark');
  });

  it('should be positioned fixed at top', () => {
    const mockOnClose = vi.fn();
    const { container } = render(<ErrorToast message="Test" onClose={mockOnClose} />);

    const wrapper = container.querySelector('div[style*="position"]');
    expect(wrapper).toHaveStyle({ position: 'fixed' });
  });
});
