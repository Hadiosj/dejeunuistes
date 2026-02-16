import { getPriceDisplay } from '../../utils/helpers';

/**
 * Preview modal showing restaurant info before adding to database
 */
export default function PreviewModal({ previewData, isMobile, onConfirm, onClose }) {
  if (!previewData) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content nes-container is-rounded" style={{
        maxWidth: isMobile ? '95vw' : '500px',
        padding: isMobile ? '12px' : '20px'
      }}>
        <h3 style={{
          textAlign: 'center',
          fontSize: isMobile ? '16px' : '18px',
          marginBottom: '15px'
        }}>
          Info Restaurant
        </h3>

        <div className="nes-container is-rounded" style={{
          marginTop: '15px',
          backgroundColor: '#f7f7f7',
          padding: isMobile ? '12px' : '15px'
        }}>
          <h4 style={{
            fontSize: isMobile ? '12px' : '14px',
            marginBottom: '12px',
            fontWeight: 'bold'
          }}>
            {previewData.name}
          </h4>

          {previewData.rating && (
            <div style={{
              marginBottom: '8px',
              fontSize: isMobile ? '10px' : '11px'
            }}>
              <strong>⭐ Note Google:</strong> {previewData.rating.toFixed(1)}/5 ({previewData.ratingCount} avis)
            </div>
          )}

          {previewData.priceLevel && (
            <div style={{
              marginBottom: '8px',
              fontSize: isMobile ? '10px' : '11px'
            }}>
              <strong>💰 Prix:</strong> {getPriceDisplay(previewData.priceLevel)}
            </div>
          )}

          {previewData.cuisine && (
            <div style={{
              marginBottom: '8px',
              fontSize: isMobile ? '10px' : '11px'
            }}>
              <strong>🍴 Type:</strong> {previewData.cuisine}
            </div>
          )}

          <div style={{
            marginBottom: '8px',
            fontSize: isMobile ? '9px' : '10px',
            lineHeight: '1.4'
          }}>
            <strong>📍 Adresse:</strong> {previewData.address}
          </div>

          {previewData.phone && (
            <div style={{
              marginBottom: '8px',
              fontSize: isMobile ? '10px' : '11px'
            }}>
              <strong>📞 Téléphone:</strong> {previewData.phone}
            </div>
          )}

          {previewData.website && (
            <div style={{
              marginBottom: '8px',
              fontSize: isMobile ? '10px' : '11px'
            }}>
              <strong>🌐 Site web:</strong>{' '}
              <a href={previewData.website} target="_blank" rel="noopener noreferrer">
                Visiter
              </a>
            </div>
          )}

          <div style={{ marginTop: '12px' }}>
            <a
              href={previewData.gmapsUri || `https://www.google.com/maps?q=${previewData.lat},${previewData.lon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="nes-btn is-primary is-small"
              style={{ fontSize: isMobile ? '9px' : '10px' }}
            >
              Voir sur Google Maps
            </a>
          </div>
        </div>

        <div style={{
          marginTop: '15px',
          display: 'flex',
          gap: isMobile ? '5px' : '10px',
          justifyContent: 'center',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <button
            className="nes-btn is-success"
            onClick={onConfirm}
            style={{
              fontSize: isMobile ? '10px' : '11px',
              flex: 1
            }}
          >
            ✓ Ajouter ce resto
          </button>
          <button
            className="nes-btn is-error"
            onClick={onClose}
            style={{
              fontSize: isMobile ? '10px' : '11px',
              flex: 1
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
