import { useState } from 'react';
import { CUISINE_TYPES } from '../../utils/constants';

/**
 * Form modal to add a new restaurant with initial rating
 */
export default function AddRestaurantModal({ initialData, isMobile, onSubmit, onClose, loading }) {
  const [formData, setFormData] = useState(initialData || {
    name: "",
    type: "",
    customType: "",
    halal: "",
    customHalal: "",
    googleRating: null,
    googleRatingCount: 0,
    googleAddress: "",
    googlePhone: "",
    googleWebsite: "",
    googlePriceLevel: null,
    googleOpeningHours: null,
    userRatings: [],
    coords: null,
    gmaps: "",
    initialUserName: "",
    initialRating: "",
    initialRatingComment: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await onSubmit(formData);
    if (success) {
      // Reset form
      setFormData({
        name: "",
        type: "",
        customType: "",
        halal: "",
        customHalal: "",
        googleRating: null,
        googleRatingCount: 0,
        googleAddress: "",
        googlePhone: "",
        googleWebsite: "",
        googlePriceLevel: null,
        googleOpeningHours: null,
        userRatings: [],
        coords: null,
        gmaps: "",
        initialUserName: "",
        initialRating: "",
        initialRatingComment: ""
      });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content nes-container is-rounded" style={{
        maxHeight: '90vh',
        overflowY: 'auto',
        maxWidth: isMobile ? '95vw' : '500px',
        padding: isMobile ? '12px' : '20px'
      }}>
        <h3 style={{
          textAlign: 'center',
          fontSize: isMobile ? '14px' : '16px'
        }}>
          Nouveau Resto
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="nes-field">
            <label style={{ fontSize: isMobile ? '10px' : '11px' }}>
              Nom <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              className="nes-input"
              value={formData.name}
              required
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              style={{ fontSize: isMobile ? '11px' : '12px' }}
            />
          </div>

          <div className="nes-field">
            <label style={{ fontSize: isMobile ? '10px' : '11px' }}>
              Type de cuisine <span style={{ color: 'red' }}>*</span>
            </label>
            <div className="nes-select">
              <select
                value={formData.type}
                required
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                style={{ fontSize: isMobile ? '11px' : '12px' }}
              >
                <option value="">-- Sélectionner --</option>
                {CUISINE_TYPES.map(cuisine => (
                  <option key={cuisine} value={cuisine}>{cuisine}</option>
                ))}
              </select>
            </div>
            {formData.type === "Autre" && (
              <input
                type="text"
                className="nes-input"
                placeholder="Précisez le type de cuisine..."
                value={formData.customType}
                required
                onChange={e => setFormData({ ...formData, customType: e.target.value })}
                style={{
                  marginTop: '8px',
                  fontSize: isMobile ? '11px' : '12px'
                }}
              />
            )}
          </div>

          <div className="nes-field">
            <label style={{ fontSize: isMobile ? '10px' : '11px' }}>
              Certification Halal <span style={{ color: 'red' }}>*</span>
            </label>
            <div className="nes-select">
              <select
                value={formData.halal}
                required
                onChange={e => setFormData({ ...formData, halal: e.target.value })}
                style={{ fontSize: isMobile ? '11px' : '12px' }}
              >
                <option value="">-- Sélectionner --</option>
                <option value="AVS-Achahada..">Certif de confiance (AVS-Achahada..)</option>
                <option value="Autre certif">Autre certif</option>
                <option value="Musulmans">Musulmans</option>
                <option value="PAS Halal">PAS Halal</option>
                <option value="Autre">Autre (Préciser...)</option>
              </select>
            </div>
            {formData.halal === "Autre" && (
              <input
                type="text"
                className="nes-input"
                placeholder="Précisez ici..."
                value={formData.customHalal}
                required
                onChange={e => setFormData({ ...formData, customHalal: e.target.value })}
                style={{
                  marginTop: '8px',
                  fontSize: isMobile ? '11px' : '12px'
                }}
              />
            )}
          </div>

          <div className="nes-field">
            <label style={{ fontSize: isMobile ? '10px' : '11px' }}>Lien Google Maps</label>
            <input
              type="url"
              className="nes-input"
              placeholder="https://goo.gl/maps/..."
              value={formData.gmaps}
              onChange={e => setFormData({ ...formData, gmaps: e.target.value })}
              style={{ fontSize: isMobile ? '11px' : '12px' }}
            />
          </div>

          {/* Initial Rating Section - NOW REQUIRED */}
          <div style={{
            marginTop: '20px',
            padding: isMobile ? '12px' : '15px',
            backgroundColor: '#fff9e6',
            border: '3px solid #ffc107',
            borderRadius: '4px'
          }}>
            <h4 style={{
              fontSize: isMobile ? '11px' : '12px',
              marginBottom: '10px',
              fontWeight: 'bold',
              color: '#d95941'
            }}>
              ⭐ Ta note personnelle <span style={{ color: 'red' }}>*</span>
            </h4>
            <p style={{
              fontSize: isMobile ? '9px' : '10px',
              color: '#666',
              marginBottom: '10px',
              fontStyle: 'italic'
            }}>
              Une note initiale est obligatoire pour ajouter un restaurant
            </p>

            <div className="nes-field">
              <label style={{ fontSize: isMobile ? '10px' : '11px' }}>
                Ton nom <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                className="nes-input"
                placeholder="ex: John, Marie..."
                value={formData.initialUserName}
                required
                onChange={e => setFormData({ ...formData, initialUserName: e.target.value })}
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
                value={formData.initialRating}
                required
                onChange={e => {
                  const value = e.target.value;
                  // Allow any value during typing (including empty, partial numbers, decimals)
                  setFormData({ ...formData, initialRating: value });
                }}
                style={{ fontSize: isMobile ? '11px' : '12px' }}
              />
              <small style={{
                fontSize: isMobile ? '8px' : '9px',
                color: '#666'
              }}>
                Ex: 4.2, 3.7, 5.0
              </small>
            </div>

            <div className="nes-field">
              <label style={{ fontSize: isMobile ? '10px' : '11px' }}>
                Commentaire sur ta note
              </label>
              <textarea
                className="nes-textarea"
                placeholder="Qu'as-tu pensé de ce resto?"
                value={formData.initialRatingComment}
                onChange={e => setFormData({ ...formData, initialRatingComment: e.target.value })}
                style={{ fontSize: isMobile ? '10px' : '11px' }}
              ></textarea>
            </div>
          </div>

          <div style={{
            marginTop: '20px',
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
              Sauvegarder
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
