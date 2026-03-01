// lib/dataStore.js
// Simple in-memory data store with file-based fallback
// In production, this would be replaced with a database (e.g., Vercel KV, Supabase)

let cachedData = null;
let lastScrapeTime = null;

// Default/fallback data used when no scrape has been done yet
const FALLBACK_DATA = {
  timestamp: null,
  status: 'fallback',
  message: 'Henüz veri çekilmedi. "Verileri Güncelle" butonuna basın.',
};

export function getData() {
  if (cachedData) {
    return {
      ...cachedData,
      status: 'live',
      lastScrapeTime,
    };
  }
  return FALLBACK_DATA;
}

export function setData(data) {
  cachedData = data;
  lastScrapeTime = new Date().toISOString();
  return { success: true, lastScrapeTime };
}

export function getLastScrapeTime() {
  return lastScrapeTime;
}
