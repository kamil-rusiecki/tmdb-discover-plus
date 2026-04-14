import { useState, useRef, useEffect, useId, memo, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export const SearchableSelect = memo(function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No options found',
  labelKey = 'name',
  valueKey = 'code',
  allowClear = true,
  groupKey = null,
  menuPlacement = 'bottom',
  'aria-label': ariaLabel,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const optionsRef = useRef(null);
  const listboxId = useId();

  const safeOptions = Array.isArray(options) ? options : [];
  const selectedOption = safeOptions.find((opt) => opt[valueKey] === value);
  const displayValue = selectedOption ? selectedOption[labelKey] : '';

  const filteredOptions = safeOptions.filter((opt) =>
    opt[labelKey]?.toLowerCase().includes(search.toLowerCase())
  );

  // Build grouped render items when groupKey is set
  const { renderItems, selectableOptions } = useMemo(() => {
    if (!groupKey) {
      return { renderItems: null, selectableOptions: filteredOptions };
    }
    const items = [];
    const selectable = [];
    const seenGroups = new Set();
    for (const opt of filteredOptions) {
      const group = opt[groupKey];
      if (group && !seenGroups.has(group)) {
        seenGroups.add(group);
        items.push({ _type: 'header', group });
      }
      const navIndex = selectable.length;
      items.push({ _type: 'option', option: opt, navIndex });
      selectable.push(opt);
    }
    return { renderItems: items, selectableOptions: selectable };
  }, [filteredOptions, groupKey]);

  const allNavOptions = allowClear ? [{ isClear: true }, ...selectableOptions] : selectableOptions;

  const handleOpenToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen) {
      setHighlightedIndex(-1);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setHighlightedIndex(-1);
  };

  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current) {
      const highlightedEl = optionsRef.current.querySelector(
        `[data-nav-index="${highlightedIndex}"]`
      );
      if (highlightedEl) {
        highlightedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < allNavOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0) {
        const option = allNavOptions[highlightedIndex];
        if (option.isClear) {
          handleSelect('');
        } else {
          handleSelect(option[valueKey]);
        }
      } else if (selectableOptions.length === 1) {
        handleSelect(selectableOptions[0][valueKey]);
      }
    }
  };

  const handleTriggerKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpenToggle();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) => (prev < allNavOptions.length - 1 ? prev + 1 : prev));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(allNavOptions.length - 1);
      } else {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
    }
  };

  const renderOptionItem = (option, navIndex) => {
    const adjustedIndex = allowClear ? navIndex + 1 : navIndex;
    return (
      <div
        key={option[valueKey]}
        data-nav-index={adjustedIndex}
        id={`${listboxId}-option-${adjustedIndex}`}
        className={`searchable-select-option ${value === option[valueKey] ? 'selected' : ''} ${highlightedIndex === adjustedIndex ? 'highlighted' : ''}`}
        onClick={() => handleSelect(option[valueKey])}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleSelect(option[valueKey]);
        }}
        onMouseMove={() => setHighlightedIndex(adjustedIndex)}
        role="option"
        aria-selected={value === option[valueKey]}
        tabIndex={0}
      >
        {option[labelKey]}
      </div>
    );
  };

  return (
    <div className={`searchable-select ${isOpen ? 'open' : ''}`} ref={containerRef}>
      <div
        className={`searchable-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={handleOpenToggle}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={
          isOpen && highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined
        }
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={displayValue ? '' : 'placeholder'}>{displayValue || placeholder}</span>
        <div className="searchable-select-icons">
          {allowClear && value && (
            <button
              className="searchable-select-clear"
              onClick={handleClear}
              type="button"
              aria-label="Clear selection"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} className={`chevron ${isOpen ? 'rotate' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className={`searchable-select-dropdown dropdown-${menuPlacement}`}>
          <div className="searchable-select-search">
            <Search size={14} />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="searchable-select-input"
            />
          </div>
          <div className="searchable-select-options" ref={optionsRef} role="listbox" id={listboxId}>
            {allowClear && (
              <div
                data-nav-index={0}
                className={`searchable-select-option ${!value ? 'selected' : ''} ${highlightedIndex === 0 ? 'highlighted' : ''}`}
                id={`${listboxId}-option-0`}
                onClick={() => handleSelect('')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleSelect('');
                }}
                onMouseMove={() => setHighlightedIndex(0)}
                role="option"
                aria-selected={!value}
                tabIndex={0}
              >
                {placeholder}
              </div>
            )}
            {groupKey && renderItems ? (
              renderItems.length > 0 ? (
                renderItems.map((item) =>
                  item._type === 'header' ? (
                    <div key={`group-${item.group}`} className="searchable-select-group-header">
                      {item.group}
                    </div>
                  ) : (
                    renderOptionItem(item.option, item.navIndex)
                  )
                )
              ) : (
                <div className="searchable-select-empty">{emptyMessage}</div>
              )
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => renderOptionItem(option, index))
            ) : (
              <div className="searchable-select-empty">{emptyMessage}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
