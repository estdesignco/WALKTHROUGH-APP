import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const CanvaCallbackHandler = () => {
  const [status, setStatus] = useState('Processing authorization...');
  const navigate = useNavigate();
  const location = useLocation();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const error = params.get('error');

        if (error) {
          setStatus(`❌ Authorization failed: ${error}`);
          setTimeout(() => {
            if (window.opener) {
              window.close();
            } else {
              navigate('/');
            }
          }, 3000);
          return;
        }

        if (!code) {
          setStatus('❌ No authorization code received');
          setTimeout(() => {
            if (window.opener) {
              window.close();
            } else {
              navigate('/');
            }
          }, 3000);
          return;
        }

        const state = params.get('state');
        if (!state) {
          setStatus('❌ No state parameter received');
          setTimeout(() => {
            if (window.opener) {
              window.close();
            } else {
              navigate('/');
            }
          }, 3000);
          return;
        }

        setStatus('✅ Authorization successful! Saving connection...');

        // Send code AND state to backend to store (backend will exchange token)
        const response = await fetch(`${BACKEND_URL}/api/canva/store-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state })
        });
        
        if (response.ok) {
          setStatus('✅ Connected to Canva successfully!');
          
          // Notify opener window if this is a popup
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'CANVA_AUTH_SUCCESS' }, window.location.origin);
          }
          
          setTimeout(() => {
            if (window.opener) {
              window.close();
            } else {
              navigate('/');
            }
          }, 2000);
        } else {
          const errorText = await response.text();
          setStatus(`❌ Failed to connect: ${errorText}`);
          setTimeout(() => {
            if (window.opener) {
              window.close();
            } else {
              navigate('/');
            }
          }, 5000);
        }
      } catch (error) {
        console.error('Callback error:', error);
        setStatus(`❌ Error: ${error.message}`);
        setTimeout(() => {
          if (window.opener) {
            window.close();
          } else {
            navigate('/');
          }
        }, 5000);
      }
    };

    handleCallback();
  }, [location, navigate, BACKEND_URL]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-stone-100 to-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <svg className="w-16 h-16 text-blue-600 mx-auto" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7.7 8.2c0-1.1.9-2 2-2h5.6c1.1 0 2 .9 2 2v7.6c0 1.1-.9 2-2 2H9.7c-1.1 0-2-.9-2-2V8.2zm10.6 0c0-1.1.9-2 2-2h.4c1.1 0 2 .9 2 2v7.6c0 1.1-.9 2-2 2h-.4c-1.1 0-2-.9-2-2V8.2zM1.3 8.2c0-1.1.9-2 2-2h.4c1.1 0 2 .9 2 2v7.6c0 1.1-.9 2-2 2h-.4c-1.1 0-2-.9-2-2V8.2z"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Canva Integration</h2>
        <p className="text-gray-600 mb-6">{status}</p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  );
};

export default CanvaCallbackHandler;