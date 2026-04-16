import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Film, Tv, GripVertical, Trash2, Copy, Sparkles } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

export function SortableCatalogItem({ catalog, isActive, onSelect, onDelete, onDuplicate }) {
  const isMobile = useIsMobile(1200);
  const getCatalogKey = (cat) => String(cat?._id || cat?.id || cat?.name);
  const id = getCatalogKey(catalog);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`catalog-item ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      <div
        className="catalog-item-main"
        onClick={() => onSelect(catalog)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onSelect(catalog);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="catalog-item-icon">
          {catalog.type === 'anime' ? (
            <Sparkles size={16} />
          ) : catalog.type === 'series' ? (
            <Tv size={16} />
          ) : (
            <Film size={16} />
          )}
        </div>
        <div className="catalog-item-info">
          <div className="catalog-item-name">{catalog.name}</div>
          <div className="catalog-item-type">
            <span>
              {catalog.type === 'anime'
                ? 'Anime'
                : catalog.type === 'series'
                  ? 'TV Shows'
                  : 'Movies'}
            </span>
            <span className={`catalog-item-badge catalog-item-badge--${catalog.source || 'tmdb'}`}>
              {{
                tmdb: 'TMDB',
                imdb: 'IMDb',
                anilist: 'AniList',
                mal: 'MAL',
                simkl: 'Simkl',
                trakt: 'Trakt',
              }[catalog.source || 'tmdb'] ||
                catalog.source ||
                'tmdb'}
            </span>
            {catalog.filters?.listType && catalog.filters.listType !== 'discover' && (
              <span className="catalog-item-badge">Preset</span>
            )}
          </div>
        </div>
        <div className="catalog-item-actions">
          <button
            className="btn btn-ghost btn-icon catalog-drag-handle"
            type="button"
            title="Drag to reorder"
            aria-label="Drag to reorder"
            onClick={(e) => e.stopPropagation()}
            {...attributes}
            {...listeners}
            style={!isMobile ? { marginRight: '4px' } : undefined}
          >
            <GripVertical size={16} />
          </button>
          {!isMobile && (
            <>
              <button
                className="btn btn-ghost btn-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(catalog._id);
                }}
                title="Duplicate catalog"
                type="button"
              >
                <Copy size={16} />
              </button>
              <button
                className="btn btn-ghost btn-icon text-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(catalog._id);
                }}
                title="Delete catalog"
                type="button"
                style={{ color: '#ef4444' }}
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      {isMobile && isActive && (
        <div className="catalog-item-expanded">
          <button
            className="btn-action-minimal"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(catalog._id);
            }}
            title="Duplicate catalog"
            type="button"
          >
            <Copy size={12} /> Duplicate
          </button>
          <div className="action-divider" />
          <button
            className="btn-action-minimal text-danger-hover"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(catalog._id);
            }}
            title="Delete catalog"
            type="button"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
