import { useEffect } from 'react';
import { ERROR_TOAST_DURATION } from '../utils/constants';

/**
 * Error notification toast component
 * Displays error messages with auto-dismiss functionality
 */
export default function ErrorToast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, ERROR_TOAST_DURATION);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      left: '20px',
      zIndex: 9999,
      maxWidth: '400px',
      margin: '0 auto',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <div className="nes-container is-rounded is-dark" style={{
        backgroundColor: '#d95941',
        color: 'white',
        padding: '15px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div style={{ flex: 1, fontSize: '11px', lineHeight: '1.4' }}>
            <strong style={{ fontSize: '12px' }}>❌ Erreur</strong>
            <div style={{ marginTop: '5px' }}>{message}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer',
              marginLeft: '10px'
            }}
          >
            ✕
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
