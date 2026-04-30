import React from 'react';
import { ChevronLeft, ChevronRight, ListFilter } from 'lucide-react';

export default function Pagination({ currentPage, totalItems, pageSize, onPageChange, onPageSizeChange }) {
  const totalPages = Math.ceil(totalItems / pageSize);
  
  // Always show pagination info even if only 1 page, but hide controls if only 1 page
  // Actually, user said "show only 1 in pagination filter then after click to next to show 2 or onward"
  // I'll make it more flexible.
  
  const getPages = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="pagination-container animate-fade-up">
      <div className="pagination-left">
        <div className="pagination-info">
          Showing <span>{totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to <span>{Math.min(currentPage * pageSize, totalItems)}</span> of <span>{totalItems}</span> results
        </div>
        
        {onPageSizeChange && (
          <div className="pagination-size-selector">
            <ListFilter size={14} className="size-icon" />
            <select 
              value={pageSize} 
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="size-select"
            >
              {[5, 10, 20, 50].map(size => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination-controls">
          <button 
            className="btn-pagination" 
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>
          
          {getPages().map(page => (
            <button
              key={page}
              className={`btn-pagination ${currentPage === page ? 'active' : ''}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}
          
          <button 
            className="btn-pagination" 
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
