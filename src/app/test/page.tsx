// src/app/test/page.tsx
'use client';

import { useState } from 'react';

export default function TestPage() {
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testGet = async () => {
    try {
      const response = await fetch('/api/test-cv');
      console.log('Response:', response);
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const testPost = async () => {
    try {
      const response = await fetch('/api/test-cv', {
        method: 'POST',
      });
      console.log('Response:', response);
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <p>Current URL: {typeof window !== 'undefined' ? window.location.href : ''}</p>
      </div>
      
      <div className="space-x-4">
        <button 
          onClick={testGet}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Test GET
        </button>

        <button 
          onClick={testPost}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Test POST
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {result && (
        <pre className="p-4 bg-gray-100 rounded">
          {result}
        </pre>
      )}
    </div>
  );
}