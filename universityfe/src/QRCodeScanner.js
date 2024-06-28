import React, { useState } from 'react';
import QrScanner from 'qr-scanner';
import axios from 'axios';
import JSONPretty from 'react-json-pretty';
import 'react-json-pretty/themes/monikai.css';

const QRCodeScanner = () => {
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState(null);
  const [isValid, setIsValid] = useState(false);

  const handleFileChange = async (event) => {
    setError(null);
    setIsValid(false);
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    try {
      const result = await QrScanner.scanImage(file);
      const presentation = JSON.parse(result);
      setScannedData(presentation);
      await verifyPresentation(presentation);
    } catch (err) {
      setError('Failed to scan QR code. Please try again with a valid QR code image.');
      console.error(err);
    }
  };

  const verifyPresentation = async (presentation) => {
    try {
      const response = await axios.post('http://localhost:3010/verify-VP', presentation);
       console.log(response)
      setIsValid(response.data.isValid);
    } catch (err) {
      setError('Verification failed. Please try again.');
      console.error(err);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Scan Verifiable Presentation QR Code</h1>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {scannedData && (
        <div style={{ marginTop: '20px' }}>
            {isValid ? <p style={{ color: 'green' }}>Credential is valid</p> : <p style={{ color: 'red' }}>Credential is invalid</p>}
          <h2>Scanned Verifiable Presentation</h2>
          <pre>  
          <JSONPretty id="json-pretty" data={scannedData} ></JSONPretty>
          </pre>
        </div>
      )}
    </div>
  );
};

export default QRCodeScanner;
