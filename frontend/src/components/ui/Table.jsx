import React from 'react';

export const Table = ({ children, className = '', containerClassName = 'overflow-x-auto' }) => (
  <div className={containerClassName}>
    <table className={`min-w-full divide-y divide-border ${className}`}>
      {children}
    </table>
  </div>
);

export const Thead = ({ children }) => (
  <thead className="bg-gray-50">
    {children}
  </thead>
);

export const Tbody = ({ children }) => (
  <tbody className="bg-white divide-y divide-border">
    {children}
  </tbody>
);

export const Tr = ({ children, className = '' }) => (
  <tr className={className}>
    {children}
  </tr>
);

export const Th = ({ children, className = '' }) => (
  <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
    {children}
  </th>
);

export const Td = ({ children, className = '' }) => (
  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}>
    {children}
  </td>
);
