import React, { useState } from 'react';

const ScrapingTestPage = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleScrape = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const backendUrl = 'https://designflow-24.preview.emergentagent.com';
      
      console.log('🔗 Scraping URL:', url);
      console.log('🔗 Backend URL:', backendUrl);
      
      const response = await fetch(`${backendUrl}/api/scrape-product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url })
      });
      
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Scraping successful:', data);
        setResult(data);
      } else {
        const errorText = await response.text();
        console.error('❌ Scraping failed:', errorText);
        setError(`Scraping failed: ${response.status} ${errorText}`);
      }
    } catch (err) {
      console.error('❌ Scraping error:', err);
      setError('Scraping error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Scraping Test Page</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Product URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder="https://fourhands.com/product/248067-003"
            />
          </div>
          
          <button
            onClick={handleScrape}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            {loading ? 'Scraping...' : 'Scrape Product'}
          </button>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Scraping Results</h2>
            <pre className="text-green-400 text-sm overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScrapingTestPage;