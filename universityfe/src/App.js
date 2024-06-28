import React, { useState, useEffect } from 'react';
import QRCodeGenerator from './QRCodeGenerator.js';
import QRCodeScanner from './QRCodeScanner.js';
import axios from 'axios';

function App() {
  const [page, setPage] = useState('generator');
  const [didGenerated, setDidGenerated] = useState(false);

  const name = 'ETF'; // Set your fixed name variable here

  useEffect(() => {
    const fetchDid = async () => {
      const storedDid = localStorage.getItem('did');
      if (!storedDid) {
        try {
           console.log(storedDid)
           console.log(name)
          const response = await axios.post('http://localhost:3010/generate-did', { name });
          const { did } = response.data;
          localStorage.setItem('did', did);
          console.log(response)
          setDidGenerated(true);
        } catch (error) {
          console.error('Error generating DID and keys:', error);
        }
      } else {
        setDidGenerated(true);
      }
    };

    fetchDid();
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>University Class Attendence QR Code</h1>
      <button onClick={() => setPage('generator')} style={{ margin: '10px' }}>Generate QR Code</button>
      <button onClick={() => setPage('scanner')} style={{ margin: '10px' }}>Scan QR Code</button>
      {didGenerated ? (
        page === 'generator' ? <QRCodeGenerator /> : <QRCodeScanner />
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default App;
