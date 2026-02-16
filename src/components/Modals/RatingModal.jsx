import { useState } from 'react';

/**
 * Modal to add a new rating to an existing restaurant
 */
export default function RatingModal({ restaurant, isMobile, onSubmit, onClose, loading }) {
  const [ratingData, setRatingData] = useState({
    userName: "",
    rating: "",
    comment: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await onSubmit(ratingData);
    if (success) {
      setRatingData({ userName: "", rating: "", comment: "" });
    }
  };

  if (!restaurant) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content nes-container is-rounded" style={{
        maxWidth: isMobile ? '95vw' : '450px',
        padding: isMobile ? '12px' : '20px'
      }}>
        <h3 style={{
          textAlign: 'center',
          fontSize: isMobile ? '14px' : '16px',
          marginBottom: '12px'
        }}>
          Ajouter ta note pour {restaurant.name}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="nes-field">
            <label style={{ fontSize: isMobile ? '10px' : '11px' }}>
              Ton nom <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              className="nes-input"
              placeholder="ex: John, Marie..."
              value={ratingData.userName}
              required
              onChange={e => setRatingData({ ...ratingData, userName: e.target.value })}
              style={{ fontSize: isMobile ? '11px' : '12px' }}
            />
          </div>

          <div className="nes-field">
            <label style={{ fontSize: isMobile ? '10px' : '11px' }}>
              Ta note (1-5) <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              className="nes-input"
              placeholder="ex: 4.5"
              value={ratingData.rating}
              required
              onChange={e => {
                const value = e.target.value;
                // Allow any value during typing (including empty, partial numbers, decimals)
                setRatingData({ ...ratingData, rating: value });
              }}
              style={{ fontSize: isMobile ? '11px' : '12px' }}
            />
            <small style={{ fontSize: isMobile ? '8px' : '9px', color: '#666' }}>
              Ex: 4.2, 3.7, 5.0
            </small>
          </div>

          <div className="nes-field">
            <label style={{ fontSize: isMobile ? '10px' : '11px' }}>Ton avis</label>
            <textarea
              className="nes-textarea"
              placeholder="Qu'as-tu pensé de ce resto?"
              value={ratingData.comment}
              onChange={e => setRatingData({ ...ratingData, comment: e.target.value })}
              style={{ fontSize: isMobile ? '10px' : '11px' }}
            ></textarea>
          </div>

          <div style={{
            marginTop: '15px',
            display: 'flex',
            gap: isMobile ? '5px' : '10px',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <button
              type="submit"
              className={`nes-btn is-success ${loading ? 'is-disabled' : ''}`}
              style={{
                fontSize: isMobile ? '10px' : '11px',
                flex: 1
              }}
            >
              Ajouter ma note
            </button>
            <button
              type="button"
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
        </form>
      </div>
    </div>
  );
}
