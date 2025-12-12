import React from 'react';
import { createRoot } from 'react-dom/client';
import ProfilePage from './components/ProfilePage';

const App: React.FC = () => {
  return (
    <React.StrictMode>
      <ProfilePage />
    </React.StrictMode>
  );
};

export default App;