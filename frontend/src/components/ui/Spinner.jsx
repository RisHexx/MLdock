import React from 'react';
import { Loader2 } from 'lucide-react';

const Spinner = ({ className = '', size = 24 }) => {
  return <Loader2 size={size} className={`animate-spin text-primary ${className}`} />;
};

export default Spinner;
