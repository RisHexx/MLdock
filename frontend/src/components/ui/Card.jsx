import React from 'react';

const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-card shadow-soft border border-border ${className}`}>
      {children}
    </div>
  );
};

export default Card;
