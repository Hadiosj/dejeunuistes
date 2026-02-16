import RestaurantSearch from '../RestaurantSearch';

/**
 * Modal for searching restaurants using Google Places API
 */
export default function SearchModal({ isMobile, onClose, setShowPreview, setPreviewData }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content nes-container is-rounded" style={{
        maxWidth: isMobile ? '95vw' : '600px',
        minHeight: isMobile ? 'auto' : '500px',
        maxHeight: '85vh',
        overflow: 'visible',
        margin: isMobile ? '10px' : '20px',
        padding: isMobile ? '12px' : '20px'
      }}>
        <h3 style={{
          textAlign: 'center',
          fontSize: isMobile ? '14px' : '16px',
          marginBottom: '15px'
        }}>
          🔍 Rechercher un restaurant
        </h3>

        <div style={{ marginBottom: '20px', minHeight: isMobile ? '250px' : '350px' }}>
          <RestaurantSearch
            setShowPreview={setShowPreview}
            setPreviewData={setPreviewData}
            inModal={true}
          />
        </div>

        <div style={{ textAlign: 'center', marginTop: 'auto' }}>
          <button
            className="nes-btn is-error"
            onClick={onClose}
            style={{ fontSize: isMobile ? '10px' : '11px' }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
