/**
 * Bottom-left control panel with action buttons
 * Contains "Add Restaurant" and "Random Picker" buttons
 */
export default function ControlPanel({ isMobile, onAddClick, onRandomClick }) {
  return (
    <div className="ui-overlay" style={{
      top: 'auto',
      bottom: isMobile ? '10px' : '20px',
      left: isMobile ? '10px' : '20px',
      right: isMobile ? '10px' : 'auto',
      zIndex: 900
    }}>
      <div className="nes-container is-rounded is-dark" style={{
        padding: isMobile ? '10px' : '16px',
        position: 'relative'
      }}>
        <p style={{
          fontSize: isMobile ? '10px' : '12px',
          marginBottom: isMobile ? '8px' : '12px',
          textAlign: 'center',
          margin: '0 0 ' + (isMobile ? '8px' : '12px') + ' 0',
          padding: isMobile ? '4px 8px' : '6px 12px'
        }}>🌾 Les Dejeunuistes 🌾</p>
        <div style={{
          display: 'flex',
          gap: isMobile ? '5px' : '10px',
          flexDirection: isMobile ? 'column' : 'row',
          width: '100%'
        }}>
          <button
            className="nes-btn is-primary"
            onClick={onAddClick}
            style={{
              fontSize: isMobile ? '10px' : '11px',
              padding: isMobile ? '8px 12px' : '10px 16px',
              flex: 1
            }}
          >
            + Ajouter
          </button>
          <button
            className="nes-btn is-warning"
            onClick={onRandomClick}
            style={{
              fontSize: isMobile ? '10px' : '11px',
              padding: isMobile ? '8px 12px' : '10px 16px',
              flex: 1
            }}
          >
            🎲 Au hasard
          </button>
        </div>
      </div>
    </div>
  );
}
