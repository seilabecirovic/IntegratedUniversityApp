import React, { useState } from 'react';
import QRCode from 'qrcode.react';
import axios from 'axios';

const QRCodeGenerator = () => {
  const [courseName, setCourseName] = useState('');
  const [courseCredit, setCourseCredit] = useState('');
  const [courseSemester, setCourseSemester] = useState('');
  const [courseGrade, setCourseGrade] = useState('');
  const [userDid, setUserDid] = useState('');
  const [name, setName] = useState('');
  const [credential, setCredential] = useState(null);

  const generateCredential = async () => {

    const issuerDid = localStorage.getItem('did');
    try {
      const response = await axios.post('http://localhost:3010/generate-vc', {
        courseName,
        courseCredit,
        courseSemester,
        courseGrade,
        userDid,
        issuerDid,
        name
      });
      const vc = response.data;
      console.log(vc)
      setCredential(vc);
    } catch (error) {
      console.error('Error generating credential:', error);
    }
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById('qrcode');
    const pngUrl = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');
    let downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = 'credential_qrcode.png';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>University Diploma QR Code Generator</h1>
      <div>
        <input
          type="text"
          placeholder="Course Name"
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          style={{ margin: '10px' }}
        />
        <input
          type="text"
          placeholder="Course Credit"
          value={courseCredit}
          onChange={(e) => setCourseCredit(e.target.value)}
          style={{ margin: '10px' }}
        />
        <input
          type="text"
          placeholder="Course Semester"
          value={courseSemester}
          onChange={(e) => setCourseSemester(e.target.value)}
          style={{ margin: '10px' }}
        />
        <input
          type="text"
          placeholder="Course Grade"
          value={courseGrade}
          onChange={(e) => setCourseGrade(e.target.value)}
          style={{ margin: '10px' }}
        />
        </div>
        <div>
        <input
          type="text"
          placeholder="User DID"
          value={userDid}
          onChange={(e) => setUserDid(e.target.value)}
          style={{ margin: '10px' }}
        />
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ margin: '10px' }}
        />
      </div>
      <button onClick={generateCredential} style={{ margin: '20px' }}>Generate Credential</button>
      {credential && (
        <div>
          <QRCode
            id="qrcode"
            value={JSON.stringify(credential)}
            size={1024}
            level={"H"}
            includeMargin={true}
          />
          <button onClick={downloadQRCode} style={{ margin: '20px' }}>Download QR Code</button>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;
