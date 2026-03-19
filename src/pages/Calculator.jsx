import React from 'react';
import { useLocation } from 'react-router-dom';
import FloatPositionSizer from '@/components/calculator/FloatPositionSizer';

export default function Calculator() {
  const location = useLocation();
  const historyData = location.state?.historyItem || null;
  return <FloatPositionSizer historyData={historyData} />;
}