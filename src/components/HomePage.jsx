import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate()

  const handleItemClick = () => {
    navigate('/item');
  };

  const handleBOMClick = () => {
    navigate('/bom');
  };

  return (
    <div  className="form" style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to the MasterList Management</h1>
      <button 
        onClick={handleItemClick} 
        style={{ padding: '10px 20px', margin: '10px', fontSize: '16px' }}
      >
        Item
      </button>
      <button 
        onClick={handleBOMClick} 
        style={{ padding: '10px 20px', margin: '10px', fontSize: '16px' }}
      >
        BOM
      </button>
    </div>
  );
};

export default HomePage;