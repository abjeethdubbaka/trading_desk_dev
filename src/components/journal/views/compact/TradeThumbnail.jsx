import React from 'react';

export function TradeThumbnail({ index, url, status = 'loading', onView }) {
  if (status === 'error') return null;

  return (
    <button
      onClick={() => url && onView(url)}
      className="w-8 h-8 rounded overflow-hidden border border-white/10 flex-shrink-0 hover:border-white/25 transition-colors relative"
    >
      {status === 'loading' && (
        <div className="absolute inset-0 bg-white/5 animate-pulse" />
      )}
      {url && (
        <img
          src={url}
          alt={`Screenshot ${index + 1}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}
    </button>
  );
}
