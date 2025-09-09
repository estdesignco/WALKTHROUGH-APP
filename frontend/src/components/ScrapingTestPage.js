import React, { useState } from 'react';

const ScrapingTestPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    vendor: '',
    cost: '',
    link: '',
    finish_color: '',
    image_url: '',
    size: '',
    remarks: ''
  });
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState('');
  const [lastScrapeResult, setLastScrapeResult] = useState(null);

  const handleLinkScraping = async () => {
    if (!formData.link || !formData.link.startsWith('http')) {
      setScrapeError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setIsScraping(true);
    setScrapeError('');

    try {
      const backendUrl = 'https://intdesign-pro.preview.emergentagent.com';
      
      console.log('🔗 SCRAPING START - Backend URL:', backendUrl);
      console.log('🔗 SCRAPING START - Target URL:', formData.link);
      
      const response = await fetch(`${backendUrl}/api/scrape-product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: formData.link })
      });
      
      console.log('🔗 SCRAPING - Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('🔗 SCRAPING ERROR - Response:', errorData);
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const responseData = await response.json();
      console.log('🔗 SCRAPING SUCCESS - Raw response:', responseData);
      
      // Handle the response format: {success: true, data: {...}}
      const data = responseData.success ? responseData.data : responseData;
      console.log('🔗 SCRAPING SUCCESS - Extracted data:', data);
      
      if (!data || (!data.name && !data.vendor && !data.price && !data.cost)) {
        throw new Error('No product data could be extracted from this URL');
      }
      
      // Update form fields with scraped data
      const updatedData = {
        ...formData,
        name: data.name || data.product_name || data.title || formData.name,
        vendor: data.vendor || data.brand || data.manufacturer || formData.vendor, 
        cost: data.price ? parseFloat(data.price.toString().replace(/[$,]/g, '')) : (data.cost ? parseFloat(data.cost.toString().replace(/[$,]/g, '')) : formData.cost),
        finish_color: data.color || data.finish || data.finish_color || formData.finish_color,
        image_url: data.image_url || data.image || data.thumbnail || formData.image_url,
        size: data.size || data.dimensions || data.specs || formData.size,
        remarks: data.description ? data.description.substring(0, 200) : formData.remarks
      };
      
      console.log('🔗 UPDATING FORM DATA:', updatedData);
      setFormData(updatedData);
      setLastScrapeResult(data);
      setScrapeError('');
      
    } catch (error) {
      console.error('🔗 SCRAPING ERROR:', error);
      setScrapeError('SCRAPING FAILED: ' + error.message);
      setLastScrapeResult(null);
    } finally {
      setIsScraping(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const testUrls = [
    'https://fourhands.com/product/248067-003',
    'https://uttermost.com/product/27644-1',
    'https://reginaandrew.com/collections/furniture/products/lacquer-desk-natural',
    'https://bernhardt.com/product/chair/369-541'
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-green-600 p-6 rounded-lg mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            🔗 SCRAPING TEST PAGE
          </h1>
          <p className="text-green-100 text-lg">
            Test the "Fill" button functionality for wholesale product scraping
          </p>
        </div>

        {/* Quick Test URLs */}
        <div className="bg-neutral-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold text-custom-gold mb-4">🚀 Quick Test URLs:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testUrls.map((url, index) => (
              <button
                key={index}
                onClick={() => handleInputChange('link', url)}
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded text-sm text-left"
              >
                <div className="font-bold">{url.includes('fourhands') ? 'Four Hands (Fenn Chair)' : 
                                              url.includes('uttermost') ? 'Uttermost' :
                                              url.includes('reginaandrew') ? 'Regina Andrew' : 'Bernhardt'}</div>
                <div className="text-blue-200 text-xs">{url}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-neutral-900 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-custom-gold mb-6">Product Information Form</h2>
          
          {/* Link Input & Fill Button */}
          <div className="mb-6 p-4 bg-neutral-800 rounded-lg">
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Product Link (URL)
            </label>
            <div className="flex gap-4">
              <input
                type="url"
                value={formData.link}
                onChange={(e) => handleInputChange('link', e.target.value)}
                placeholder="https://fourhands.com/product/248067-003"
                className="flex-1 bg-neutral-700 border border-neutral-600 rounded px-3 py-2 text-white"
              />
              <button
                onClick={handleLinkScraping}
                disabled={isScraping || !formData.link}
                className={`px-6 py-2 rounded font-bold ${
                  isScraping 
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {isScraping ? '⏳ SCRAPING...' : '🔗 FILL'}
              </button>
            </div>
            
            {scrapeError && (
              <div className="mt-3 p-3 bg-red-600 rounded text-white text-sm">
                ❌ {scrapeError}
              </div>
            )}
            
            {lastScrapeResult && (
              <div className="mt-3 p-3 bg-green-600 rounded text-white text-sm">
                ✅ SUCCESS! Extracted: {lastScrapeResult.name} from {lastScrapeResult.vendor}
              </div>
            )}
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Item Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full bg-neutral-700 border border-neutral-600 rounded px-3 py-2 text-white"
                placeholder="e.g., Fenn Chair"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Vendor</label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => handleInputChange('vendor', e.target.value)}
                className="w-full bg-neutral-700 border border-neutral-600 rounded px-3 py-2 text-white"
                placeholder="e.g., Four Hands"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Cost</label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => handleInputChange('cost', e.target.value)}
                className="w-full bg-neutral-700 border border-neutral-600 rounded px-3 py-2 text-white"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Finish/Color</label>
              <input
                type="text"
                value={formData.finish_color}
                onChange={(e) => handleInputChange('finish_color', e.target.value)}
                className="w-full bg-neutral-700 border border-neutral-600 rounded px-3 py-2 text-white"
                placeholder="e.g., Champagne Mongolian Fur"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Size</label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => handleInputChange('size', e.target.value)}
                className="w-full bg-neutral-700 border border-neutral-600 rounded px-3 py-2 text-white"
                placeholder="e.g., 24W x 30H x 28D"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Image URL</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => handleInputChange('image_url', e.target.value)}
                className="w-full bg-neutral-700 border border-neutral-600 rounded px-3 py-2 text-white"
                placeholder="Auto-filled from scraping"
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-neutral-300 mb-2">Remarks/Description</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => handleInputChange('remarks', e.target.value)}
              rows={4}
              className="w-full bg-neutral-700 border border-neutral-600 rounded px-3 py-2 text-white"
              placeholder="Product description will be auto-filled from scraping"
            />
          </div>

          {/* Image Preview */}
          {formData.image_url && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-neutral-300 mb-2">Image Preview</label>
              <img
                src={formData.image_url}
                alt={formData.name}
                className="w-32 h-32 object-cover rounded border border-neutral-600"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => alert(`Form Data:\n${JSON.stringify(formData, null, 2)}`)}
              className="bg-custom-gold hover:bg-yellow-600 text-black px-8 py-3 rounded font-bold"
            >
              📋 VIEW FORM DATA
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-neutral-800 p-6 rounded-lg">
          <h3 className="text-lg font-bold text-custom-gold mb-3">🔧 Testing Instructions:</h3>
          <ol className="text-neutral-300 space-y-2">
            <li>1. Click one of the "Quick Test URLs" above to auto-fill the link field</li>
            <li>2. Click the green "🔗 FILL" button to test scraping</li>
            <li>3. Watch the form fields get automatically populated</li>
            <li>4. Check the "Image Preview" section to see if images load</li>
            <li>5. Click "📋 VIEW FORM DATA" to see all extracted data</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ScrapingTestPage;