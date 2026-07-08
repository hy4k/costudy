import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  soft?: boolean;
  as?: 'div' | 'section' | 'article';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  soft = false,
  as: Tag = 'div',
}) => {
  return (
    <Tag className={`${soft ? 'os-panel-soft' : 'os-panel'} p-5 sm:p-6 ${className}`}>
      {children}
    </Tag>
  );
};

export default Card;
