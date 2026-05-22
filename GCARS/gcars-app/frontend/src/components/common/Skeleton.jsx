import React from 'react';

export const Skeleton = ({ className, style }) => (
  <div className={`skeleton ${className || ''}`} style={style} />
);

export const CardSkeleton = () => (
  <div className="card" style={{ padding: '24px' }}>
    <Skeleton className="skeleton-title" />
    <Skeleton className="skeleton-text" />
    <Skeleton className="skeleton-text" style={{ width: '80%' }} />
    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
      <Skeleton style={{ height: '32px', width: '100px' }} />
      <Skeleton style={{ height: '32px', width: '100px' }} />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 6 }) => (
  <div className="card" style={{ padding: 0 }}>
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}><Skeleton style={{ height: '12px', width: '60px' }} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j}><Skeleton className="skeleton-text" style={{ marginBottom: 0 }} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const StatSkeleton = () => (
  <div className="stat-card">
    <Skeleton className="skeleton-circle" style={{ width: '38px', height: '38px', marginBottom: '14px' }} />
    <Skeleton className="skeleton-title" style={{ width: '40%', height: '30px' }} />
    <Skeleton className="skeleton-text" style={{ width: '60%' }} />
  </div>
);
