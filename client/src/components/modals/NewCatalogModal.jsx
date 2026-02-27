import { useState } from 'react';
import { X, Film, Tv, Award } from 'lucide-react';
import { useModalA11y } from '../../hooks/useModalA11y';

export function NewCatalogModal({ isOpen, onClose, onAdd, imdbEnabled = false }) {
  const [name, setName] = useState('');
  const [source, setSource] = useState('tmdb');
  const [type, setType] = useState('movie'); // 'movie' or 'series'
  const modalRef = useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (source === 'imdb') {
      const filters = {
        listType: 'discover',
        genres: [],
        sortBy: 'POPULARITY',
        sortOrder: 'DESC',
      };
      onAdd({
        name: name.trim(),
        type,
        source: 'imdb',
        filters,
        enabled: true,
      });
    } else {
      onAdd({
        name: name.trim(),
        type,
        filters: {
          listType: 'discover',
          genres: [],
          sortBy: 'popularity.desc',
          voteCountMin: 0,
        },
        enabled: true,
      });
    }

    setName('');
    setSource('tmdb');
    setType('movie');
    onClose();
  };

  const isImdbListValid = true;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="presentation"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className="modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Create New Catalog"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ paddingBottom: '8px' }}>
          <div>
            <h3 className="modal-title">Create New Catalog</h3>
            <p className="text-secondary" style={{ fontSize: '13px', marginTop: '4px' }}>
              Choose a data source and content type to get started
            </p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="filter-group">
              <div className="catalog-type-grid">
                <button
                  type="button"
                  className={`type-card ${source === 'tmdb' && type === 'movie' ? 'active' : ''}`}
                  onClick={() => {
                    setSource('tmdb');
                    setType('movie');
                  }}
                >
                  <div className="type-card-icon tmdb">
                    <Film size={20} />
                  </div>
                  <div className="type-card-content">
                    <span className="type-title">TMDB Movie</span>
                    <span className="type-desc">Standard TMDB discovery</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`type-card ${source === 'tmdb' && type === 'series' ? 'active' : ''}`}
                  onClick={() => {
                    setSource('tmdb');
                    setType('series');
                  }}
                >
                  <div className="type-card-icon tmdb">
                    <Tv size={20} />
                  </div>
                  <div className="type-card-content">
                    <span className="type-title">TMDB Series</span>
                    <span className="type-desc">Standard TMDB discovery</span>
                  </div>
                </button>

                {imdbEnabled && (
                  <>
                    <button
                      type="button"
                      className={`type-card ${source === 'imdb' && type === 'movie' ? 'active' : ''}`}
                      onClick={() => {
                        setSource('imdb');
                        setType('movie');
                      }}
                    >
                      <div className="type-card-icon imdb">
                        <Award size={20} />
                      </div>
                      <div className="type-card-content">
                        <span className="type-title">IMDb Movie</span>
                        <span className="type-desc">IMDb metadata & lists</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`type-card ${source === 'imdb' && type === 'series' ? 'active' : ''}`}
                      onClick={() => {
                        setSource('imdb');
                        setType('series');
                      }}
                    >
                      <div className="type-card-icon imdb">
                        <Tv size={20} />
                      </div>
                      <div className="type-card-content">
                        <span className="type-title">IMDb Series</span>
                        <span className="type-desc">IMDb metadata & lists</span>
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="filter-group" style={{ marginTop: '20px' }}>
              <label className="filter-label" htmlFor="new-catalog-name">
                Catalog Name
              </label>
              <input
                id="new-catalog-name"
                type="text"
                className="input"
                style={{ height: '42px', fontSize: '15px' }}
                placeholder={
                  source === 'imdb'
                    ? 'e.g., Oscar Winners, IMDb Top Rated'
                    : 'e.g., My Sci-Fi Collection, Netflix Picks'
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>


          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!name.trim() || !isImdbListValid}
            >
              Create Catalog
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
