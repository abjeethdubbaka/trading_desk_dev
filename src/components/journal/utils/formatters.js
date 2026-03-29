export const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit',
    year: '2-digit'
  });
};

export const formatTime = (timeString) => {
  if (!timeString) return '-';
  return new Date(timeString).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
};

export const formatCurrency = (value) => {
  if (value === undefined || value === null) return '-';
  return `$${Number(value).toFixed(2)}`;
};

export const formatPercent = (value) => {
  if (value === undefined || value === null) return '-';
  return `${Number(value).toFixed(2)}%`;
};

export const formatNumber = (value, decimals = 0) => {
  if (value === undefined || value === null) return '-';
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};


