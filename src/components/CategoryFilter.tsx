// Category filter component for filtering research areas by department, term, and type
import React, { useState } from 'react';
import { getDepartmentColor } from '../utils/mapUtils';

interface FilterState {
  departments: string[];
  terms: string[];
  types: string[];
}

interface CategoryFilterProps {
  departments: string[];
  terms: string[];
  types: string[];
  selectedFilters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  matchingAreasCount: number;
  totalAreasCount: number;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  departments, 
  terms, 
  types, 
  selectedFilters, 
  onFiltersChange,
  matchingAreasCount,
  totalAreasCount
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDepartmentToggle = (department: string) => {
    const newDepartments = selectedFilters.departments.includes(department)
      ? selectedFilters.departments.filter(d => d !== department)
      : [...selectedFilters.departments, department];
    
    onFiltersChange({
      ...selectedFilters,
      departments: newDepartments
    });
  };

  const handleTermToggle = (term: string) => {
    const newTerms = selectedFilters.terms.includes(term)
      ? selectedFilters.terms.filter(t => t !== term)
      : [...selectedFilters.terms, term];
    
    onFiltersChange({
      ...selectedFilters,
      terms: newTerms
    });
  };

  const handleTypeToggle = (type: string) => {
    const newTypes = selectedFilters.types.includes(type)
      ? selectedFilters.types.filter(t => t !== type)
      : [...selectedFilters.types, type];
    
    onFiltersChange({
      ...selectedFilters,
      types: newTypes
    });
  };

  const handleSelectAllDepartments = () => {
    const newDepartments = selectedFilters.departments.length === departments.length ? [] : [...departments];
    onFiltersChange({
      ...selectedFilters,
      departments: newDepartments
    });
  };

  const handleSelectAllTerms = () => {
    const newTerms = selectedFilters.terms.length === terms.length ? [] : [...terms];
    onFiltersChange({
      ...selectedFilters,
      terms: newTerms
    });
  };

  const handleSelectAllTypes = () => {
    const newTypes = selectedFilters.types.length === types.length ? [] : [...types];
    onFiltersChange({
      ...selectedFilters,
      types: newTypes
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      departments: [],
      terms: [],
      types: []
    });
  };

  const renderFilterSection = (
    title: string,
    items: string[],
    selectedItems: string[],
    onToggle: (item: string) => void,
    onSelectAll: () => void,
    emoji: string,
    colorType: 'department' | 'default' = 'default'
  ) => (
    <div style={{ marginBottom: '28px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        paddingBottom: '8px',
        borderBottom: '1px solid #1a1a1a20'
      }}>
        <h4 style={{ 
          margin: '0', 
          fontSize: '16px', 
          fontWeight: '600',
          color: '#1a1a1a',
          fontFamily: 'Sora, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {title}
          <span style={{
            backgroundColor: '#1a1a1a10',
            color: '#1a1a1a',
            fontSize: '11px',
            fontWeight: '400',
            padding: '2px 8px',
            borderRadius: '2px',
            marginLeft: '4px',
            textTransform: 'none',
            letterSpacing: 'normal'
          }}>
            {selectedItems.length}/{items.length}
          </span>
        </h4>
        
        <button
          onClick={onSelectAll}
          style={{
            padding: '6px 12px',
            border: '1px solid #1a1a1a',
            backgroundColor: selectedItems.length === items.length ? '#1a1a1a' : 'transparent',
            color: selectedItems.length === items.length ? '#f9f6ef' : '#1a1a1a',
            borderRadius: '2px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: '600',
            fontFamily: 'Sora, sans-serif',
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
          onMouseEnter={(e) => {
            if (selectedItems.length === items.length) {
              e.currentTarget.style.opacity = '0.8';
            } else {
              e.currentTarget.style.backgroundColor = '#1a1a1a10';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedItems.length === items.length) {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.backgroundColor = '#1a1a1a';
            } else {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {selectedItems.length === items.length ? 'Clear' : 'All'}
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '8px',
        maxHeight: '180px',
        overflowY: 'auto',
        padding: '4px'
      }}>
        {items.map(item => {
          const isSelected = selectedItems.includes(item);
          const baseColor = colorType === 'department' ? getDepartmentColor(item) : '#4299e1';
          
          return (
            <button
              key={item}
              onClick={() => onToggle(item)}
              style={{
                padding: '10px 12px',
                border: isSelected ? `2px solid ${baseColor}` : '1px solid #1a1a1a20',
                backgroundColor: isSelected ? baseColor : '#f9f6ef',
                color: isSelected ? '#f9f6ef' : '#1a1a1a',
                borderRadius: '2px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: isSelected ? '600' : '400',
                fontFamily: 'Sora, sans-serif',
                transition: 'all 0.2s ease',
                textAlign: 'center',
                boxShadow: isSelected ? `0 2px 8px ${baseColor}40` : 'none',
                minHeight: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#1a1a1a10';
                  e.currentTarget.style.borderColor = '#1a1a1a40';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#f9f6ef';
                  e.currentTarget.style.borderColor = '#1a1a1a20';
                }
              }}
            >
              <span style={{ 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}>
                {item}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const totalSelected = selectedFilters.departments.length + selectedFilters.terms.length + selectedFilters.types.length;

  return (
    <div style={{
      position: 'absolute',
      top: '80px',
      left: '20px',
      zIndex: 1000,
      backgroundColor: 'rgba(249, 246, 239, 0.3)',
      padding: isExpanded ? '24px' : '16px',
      borderRadius: '0',
      boxShadow: '0 4px 20px rgba(26,26,26,0.15)',
      minWidth: isExpanded ? '360px' : 'auto',
      maxWidth: isExpanded ? '420px' : 'auto',
      maxHeight: isExpanded ? '85vh' : 'auto',
      overflowY: isExpanded ? 'auto' : 'visible',
      fontFamily: 'Sora, -apple-system, BlinkMacSystemFont, sans-serif',
      border: '1px solid #1a1a1a20',
      cursor: isExpanded ? 'default' : 'pointer',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(10px)'
    }}
    onClick={!isExpanded ? () => setIsExpanded(true) : undefined}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: isExpanded ? '24px' : '0',
        paddingBottom: isExpanded ? '16px' : '0',
        borderBottom: isExpanded ? '3px solid #1a1a1a' : 'none'
      }}>
        <div>
          <h3 style={{ 
            margin: '0 0 4px 0', 
            fontSize: isExpanded ? '20px' : '16px', 
            fontWeight: '600',
            color: '#1a1a1a',
            fontFamily: 'Sora, sans-serif',
            letterSpacing: '-0.01em'
          }}>
            Filters
          </h3>
          {isExpanded && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <p style={{
                margin: '0',
                fontSize: '13px',
                color: '#1a1a1a',
                fontWeight: '400',
                opacity: 0.7
              }}>
                {totalSelected > 0 ? `${totalSelected} filters active` : 'No filters applied'}
              </p>
              <p style={{
                margin: '0',
                fontSize: '13px',
                color: totalSelected > 0 ? '#dd3b00' : '#1a1a1a',
                fontWeight: '600'
              }}>
                {matchingAreasCount} of {totalAreasCount} projects
              </p>
            </div>
          )}
          {!isExpanded && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {totalSelected > 0 && (
                <>
                  <span style={{
                    backgroundColor: '#dd3b00',
                    color: '#f9f6ef',
                    fontSize: '10px',
                    fontWeight: '600',
                    padding: '2px 6px',
                    borderRadius: '2px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {totalSelected}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: '#dd3b00',
                    fontWeight: '600'
                  }}>
                    {matchingAreasCount}/{totalAreasCount} projects
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        
        {isExpanded && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {totalSelected > 0 && (
              <button
                onClick={clearAllFilters}
                style={{
                  padding: '8px 16px',
                  border: '2px solid #1a1a1a',
                  backgroundColor: 'transparent',
                  color: '#1a1a1a',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  fontFamily: 'Sora, sans-serif',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a1a1a';
                  e.currentTarget.style.color = '#f9f6ef';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#1a1a1a';
                }}
              >
                Clear All
              </button>
            )}
            
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#1a1a1a',
                padding: '4px',
                borderRadius: '2px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a1a1a10';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ×
            </button>
          </div>
        )}
        
        {!isExpanded && (
          <div style={{
            fontSize: '16px',
            color: '#1a1a1a',
            opacity: 0.3
          }}>
            ▲
          </div>
        )}
      </div>
      
      {isExpanded && (
        <>
          {renderFilterSection(
            'Departments',
            departments,
            selectedFilters.departments,
            handleDepartmentToggle,
            handleSelectAllDepartments,
            '',
            'department'
          )}

          {renderFilterSection(
            'Terms',
            terms,
            selectedFilters.terms,
            handleTermToggle,
            handleSelectAllTerms,
            ''
          )}

          {renderFilterSection(
            'Types',
            types,
            selectedFilters.types,
            handleTypeToggle,
            handleSelectAllTypes,
            ''
          )}
        </>
      )}
    </div>
  );
};

export default CategoryFilter; 