import React, { useState } from 'react';

const SimpleScrapeTest = () => {
  const [url, setUrl] = useState('https://fourhands.com/product/248067-003');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScrape = async () => {
    setLoading(true);
    setResult(null);

    try {
      const backendUrl = '${process.env.REACT_APP_BACKEND_URL || window.location.origin}';
      
      const response = await fetch(`${backendUrl}/api/scrape-product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        setResult({ error: 'Failed to scrape' });
      }
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl mb-4">Simple Scrape Test</h1>
      
      <div className="mb-4">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full p-2 bg-gray-700 text-white rounded"
          placeholder="Enter URL to scrape..."
        />
      </div>
      
      <button
        onClick={handleScrape}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Scraping...' : 'Scrape'}
      </button>
      
      {result && (
        <div className="mt-4 p-4 bg-gray-800 rounded">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default SimpleScrapeTest;