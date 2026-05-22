import React from 'react';
import Dashboard from './components/Dashboard';
import './index.css';

function App() {
  return (
    <div className="app-container">
      {/* Main Content Area - Full Width */}
      <div className="main-content">
        <Dashboard />
      </div>
    </div>
  );
}

export default App;
