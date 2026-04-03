/**
 * Converts local datetime string to UTC ISO string for storage
 * @param {string} localDateTime - Local datetime string (from input type="datetime-local")
 * @returns {string} UTC ISO string
 */
export const localToUTCISO = (localDateTime) => {
  if (!localDateTime) return null;
  
  // Create date object - this interprets the string as local time
  const date = new Date(localDateTime);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return null;
  }
  
  // Return ISO string (automatically converts to UTC)
  return date.toISOString();
};

/**
 * Converts UTC ISO string to local datetime string for display
 * @param {string} utcISO - UTC ISO string from database
 * @returns {string} Local datetime string (for input type="datetime-local")
 */
export const utcToLocalDateTime = (utcISO) => {
  if (!utcISO) {
    return '';
  }
  
  try {
    const date = new Date(utcISO);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Format to YYYY-MM-DDTHH:MM for datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    
    return '';
  }
};

/**
 * Gets current local datetime string
 * @returns {string} Current local datetime string
 */
export const getCurrentLocalDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Validates that exit time is after entry time
 * @param {string} entryTime - Local entry time
 * @param {string} exitTime - Local exit time
 * @returns {boolean} Whether exit time is valid
 */
export const isValidExitTime = (entryTime, exitTime) => {
  if (!entryTime || !exitTime) return true; // Exit time is optional
  
  const entry = new Date(entryTime);
  const exit = new Date(exitTime);
  
  return exit > entry;
};


