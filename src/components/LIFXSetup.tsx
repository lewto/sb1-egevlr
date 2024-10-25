import React, { useState } from 'react';
import { useLIFX } from '../hooks/useLIFX';

const LIFXSetup = () => {
  const [token, setToken] = useState('');
  const { initialize, isConnected, error } = useLIFX();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initialize(token);
  };

  if (isConnected) {
    return (
      <div className="text-green-500 font-medium">
        LIFX Connected Successfully
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="lifx-token" className="block text-sm font-medium text-gray-300">
          LIFX API Token
        </label>
        <input
          type="password"
          id="lifx-token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-race-blue-500 focus:ring-race-blue-500"
          placeholder="Enter your LIFX API token"
        />
        <p className="mt-1 text-sm text-gray-400">
          Get your token from{' '}
          <a
            href="https://cloud.lifx.com/settings"
            target="_blank"
            rel="noopener noreferrer"
            className="text-race-blue-500 hover:text-race-blue-400"
          >
            LIFX Cloud Settings
          </a>
        </p>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-race-blue-500 hover:bg-race-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-race-blue-500"
      >
        Connect LIFX
      </button>
    </form>
  );
};

export default LIFXSetup;