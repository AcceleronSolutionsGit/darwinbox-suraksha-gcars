import React from 'react';
import Select from 'react-select';

export const SearchableSelect = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = 'Select...', 
  isClearable = true, 
  isDisabled = false,
  required = false,
  className = '',
  name,
  id
}) => {
  // Find the currently selected object based on value
  const selectedOption = options.find(opt => opt.value === value) || null;

  const handleChange = (selected) => {
    // If cleared, selected is null
    onChange(selected ? selected.value : '');
  };

  const customStyles = {
    control: (base, state) => ({
      ...base,
      background: 'var(--bg-main)',
      borderColor: state.isFocused ? 'var(--primary)' : 'var(--border-2)',
      borderRadius: '12px',
      minHeight: '48px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(255, 107, 0, 0.15)' : 'none',
      transition: 'all 0.2s ease',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      '&:hover': {
        borderColor: state.isFocused ? 'var(--primary)' : 'var(--border)'
      }
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0 16px',
    }),
    singleValue: (base) => ({
      ...base,
      color: 'var(--text-main)',
      fontWeight: 500,
    }),
    placeholder: (base) => ({
      ...base,
      color: 'var(--text-faint)',
    }),
    menu: (base) => ({
      ...base,
      background: 'var(--bg-card)',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      border: '1px solid var(--border-2)',
      zIndex: 100,
      marginTop: '4px'
    }),
    menuList: (base) => ({
      ...base,
      padding: '4px',
    }),
    option: (base, state) => ({
      ...base,
      background: state.isSelected 
        ? 'var(--primary)' 
        : state.isFocused 
          ? 'var(--bg-hover)' 
          : 'transparent',
      color: state.isSelected 
        ? '#ffffff' 
        : 'var(--text-main)',
      cursor: 'pointer',
      borderRadius: '8px',
      padding: '10px 16px',
      transition: 'all 0.1s ease',
      ':active': {
        background: 'var(--primary)',
        color: '#fff'
      }
    }),
    input: (base) => ({
      ...base,
      color: 'var(--text-main)',
    }),
    indicatorSeparator: () => ({
      display: 'none'
    }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: state.isFocused ? 'var(--primary)' : 'var(--text-muted)',
      transition: 'all 0.2s ease',
      '&:hover': {
        color: 'var(--primary)'
      }
    }),
    clearIndicator: (base) => ({
      ...base,
      color: 'var(--text-muted)',
      '&:hover': {
        color: 'var(--coral)'
      }
    })
  };

  return (
    <div style={{ position: 'relative', flex: 1 }} className={className}>
      <Select
        id={id}
        name={name}
        value={selectedOption}
        onChange={handleChange}
        options={options}
        placeholder={placeholder}
        isClearable={isClearable}
        isDisabled={isDisabled}
        styles={customStyles}
        classNamePrefix="react-select"
        theme={(theme) => ({
          ...theme,
          colors: {
            ...theme.colors,
            primary: 'var(--primary)',
          },
        })}
      />
      {/* Hidden input for native required validation */}
      {required && (
        <input
          tabIndex={-1}
          autoComplete="off"
          style={{
            opacity: 0,
            width: '100%',
            height: '100%',
            position: 'absolute',
            zIndex: -1,
            top: 0,
            left: 0
          }}
          value={value || ''}
          onChange={() => {}}
          required={required}
        />
      )}
    </div>
  );
};
