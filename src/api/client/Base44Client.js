// Base44 API Client Core
class Base44Client {
  constructor() {
    this.baseUrl = 'https://api.base44.com/v1';
    this.apiKey = process.env.NEXT_PUBLIC_BASE44_API_KEY;
  }

  // Helper method for API calls
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Local storage helpers for mock data
  static getFromLocalStorage(key, defaultValue = []) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = window.localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
      }
    } catch (e) {
      console.warn(`Failed to read ${key} from localStorage`, e);
    }
    return defaultValue;
  }

  static saveToLocalStorage(key, data) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(data));
      }
    } catch (e) {
      console.warn(`Failed to save ${key} to localStorage`, e);
    }
  }
}

export default Base44Client;
