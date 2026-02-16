import { getPriceDisplay } from '../utils/helpers';

/**
 * Side panel component showing restaurant details
 * Displays Google Maps info, user ratings, and actions
 */
export default function SidePanel({ restaurant, isMobile, onClose, onAddRating }) {
  if (!restaurant) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: isMobile ? '100vw' : '400px',
      maxWidth: '100vw',
      height: '100vh',
      backgroundColor: 'white',
      zIndex: 1000,
      boxShadow: '-4px 0 12px rgba(0,0,0,0.3)',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header with close button */}
      <div style={{
        padding: isMobile ? '10px 12px' : '12px 16px',
        borderBottom: '3px solid #212529',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f7f7f7',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <h2 style={{
          fontSize: isMobile ? '12px' : '14px',
          margin: 0,
          fontWeight: 'bold'
        }}>
          Détails du Restaurant
        </h2>
        <button
          onClick={onClose}
          className="nes-btn is-error"
          style={{
            fontSize: isMobile ? '9px' : '10px',
            padding: isMobile ? '3px 8px' : '4px 10px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: isMobile ? '12px' : '16px', flex: 1 }}>
        {/* Restaurant Name */}
        <h1 style={{
          fontSize: isMobile ? '16px' : '18px',
          marginBottom: '12px',
          fontWeight: 'bold',
          color: '#212529',
          lineHeight: '1.2'
        }}>
          {restaurant.name}
        </h1>

        {/* Google Maps Info Section */}
        {(restaurant.googleRating || restaurant.googleAddress || restaurant.googlePriceLevel) && (
          <div style={{
            marginBottom: '16px',
            padding: isMobile ? '10px' : '12px',
            backgroundColor: '#f0f8ff',
            border: '2px solid #4a90e2',
            borderRadius: '4px'
          }}>
            <div style={{
              fontSize: isMobile ? '8px' : '9px',
              color: '#666',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>
              📍 INFOS GOOGLE MAPS
            </div>

            {/* Google Rating */}
            {restaurant.googleRating && (
              <div style={{ marginBottom: '6px', fontSize: isMobile ? '10px' : '11px' }}>
                ⭐ <strong>{restaurant.googleRating.toFixed(1)}/5</strong>
                {restaurant.googleRatingCount > 0 && (
                  <span style={{ color: '#666', fontSize: isMobile ? '9px' : '10px' }}>
                    {' '}({restaurant.googleRatingCount} avis)
                  </span>
                )}
              </div>
            )}

            {/* Price Level */}
            {restaurant.googlePriceLevel && (
              <div style={{ marginBottom: '6px', fontSize: isMobile ? '10px' : '11px' }}>
                💰 <strong>{getPriceDisplay(restaurant.googlePriceLevel)}</strong>
              </div>
            )}

            {/* Address */}
            {restaurant.googleAddress && (
              <div style={{
                marginBottom: '6px',
                fontSize: isMobile ? '9px' : '10px',
                lineHeight: '1.3'
              }}>
                📍 {restaurant.googleAddress}
              </div>
            )}

            {/* Phone */}
            {restaurant.googlePhone && (
              <div style={{ marginBottom: '6px', fontSize: isMobile ? '9px' : '10px' }}>
                📞 {restaurant.googlePhone}
              </div>
            )}

            {/* Website */}
            {restaurant.googleWebsite && (
              <div style={{ marginBottom: '6px', fontSize: isMobile ? '9px' : '10px' }}>
                🌐 <a href={restaurant.googleWebsite} target="_blank" rel="noopener noreferrer">
                  Site web
                </a>
              </div>
            )}

            {/* Opening Hours */}
            {restaurant.googleOpeningHours && restaurant.googleOpeningHours.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <details style={{ fontSize: isMobile ? '9px' : '10px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                    🕒 Horaires d'ouverture
                  </summary>
                  <div style={{ marginTop: '4px', paddingLeft: '8px', lineHeight: '1.4' }}>
                    {restaurant.googleOpeningHours.map((hour, idx) => (
                      <div key={idx}>{hour}</div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>
        )}

        {/* User Ratings Section */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: isMobile ? '8px' : '9px',
            color: '#666',
            marginBottom: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 'bold'
          }}>
            <span>⭐ NOS NOTES ({restaurant.userRatings?.length || 0})</span>
            <button
              className="nes-btn is-success"
              style={{
                fontSize: isMobile ? '7px' : '8px',
                padding: isMobile ? '2px 6px' : '2px 8px'
              }}
              onClick={onAddRating}
            >
              + Ajouter
            </button>
          </div>

          {restaurant.userRatings && restaurant.userRatings.length > 0 ? (
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {restaurant.userRatings.map((rating, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: isMobile ? '6px' : '8px',
                    marginBottom: '6px',
                    backgroundColor: '#fff9e6',
                    border: '2px solid #e0e0e0',
                    borderRadius: '4px'
                  }}
                >
                  <div style={{
                    fontSize: isMobile ? '10px' : '11px',
                    fontWeight: 'bold',
                    marginBottom: '3px'
                  }}>
                    {rating.userName} - ⭐ {rating.rating}/5
                  </div>
                  {rating.comment && (
                    <div style={{
                      fontSize: isMobile ? '9px' : '10px',
                      fontStyle: 'italic',
                      color: '#555',
                      lineHeight: '1.3'
                    }}>
                      "{rating.comment}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              fontSize: isMobile ? '9px' : '10px',
              color: '#999',
              fontStyle: 'italic',
              padding: isMobile ? '6px' : '8px',
              textAlign: 'center',
              backgroundColor: '#f9f9f9',
              border: '2px dashed #ddd',
              borderRadius: '4px'
            }}>
              Aucune note ajoutée
            </div>
          )}
        </div>

        {/* Restaurant Info */}
        <div style={{
          marginBottom: '14px',
          padding: isMobile ? '8px' : '10px',
          backgroundColor: '#f7f7f7',
          border: '2px solid #e0e0e0',
          borderRadius: '4px'
        }}>
          <div style={{
            fontSize: isMobile ? '8px' : '9px',
            color: '#666',
            marginBottom: '8px',
            fontWeight: 'bold'
          }}>
            ℹ️ INFORMATIONS
          </div>

          {/* Type */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{
              fontSize: isMobile ? '8px' : '9px',
              color: '#666',
              marginBottom: '2px'
            }}>
              TYPE DE CUISINE
            </div>
            <div style={{ fontSize: isMobile ? '10px' : '11px' }}>
              🍴 {restaurant.type || 'Non spécifié'}
            </div>
          </div>

          {/* Halal Certification */}
          <div>
            <div style={{
              fontSize: isMobile ? '8px' : '9px',
              color: '#666',
              marginBottom: '2px'
            }}>
              CERTIFICATION HALAL
            </div>
            <div style={{ fontSize: isMobile ? '10px' : '11px' }}>
              ✅ {restaurant.halal}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: '16px' }}>
          <a
            href={restaurant.gmaps}
            target="_blank"
            rel="noopener noreferrer"
            className="nes-btn is-primary"
            style={{
              width: '100%',
              textAlign: 'center',
              display: 'block',
              fontSize: isMobile ? '9px' : '10px',
              padding: isMobile ? '6px' : '8px'
            }}
          >
            📍 Ouvrir dans Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
