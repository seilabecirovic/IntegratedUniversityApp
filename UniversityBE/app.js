import express from 'express';
import fs from 'fs';
import axios from 'axios';
import cors  from 'cors';

import { generateAndSaveKeys,createAndSignCredential, verifyAggregatedClaimsAndSignature } from './utils.js';


// Enable CORS for all routes and allow all headers


const app = express();
app.use(express.json());
app.use(cors());

// Endpoint to generate DID and keys
app.post('/generate-did', async (req, res) => {
    const { name } = req.body;

    // Generate DID and keys
    const { did, publicKey } = await generateAndSaveKeys(name);
    console.log(did,publicKey)
    // Send public key and DID to another service
    await axios.post('http://localhost:3001/user', { userName:name, userDid:did, userPublicKey:publicKey });

    res.json({ did });
});

// Endpoint to generate verifiable credential
app.post('/generate-vc', async (req, res) => {
    const { courseName, courseCredit, courseSemester, courseGrade, userDid, issuerDid, name } = req.body;

    const claims = { courseName, courseCredit, courseSemester, courseGrade };
    console.log(issuerDid)
    // Load the issuer's private key
    const privateKeyJsonFilePath = `./keys/${issuerDid}_privateKey.json`;
    const privateKeyData = JSON.parse(fs.readFileSync(privateKeyJsonFilePath, 'utf8'));
    const privateKeyHex = privateKeyData.privateKey;

    // Create and sign the credential
    const { merkleRoot, signature, id } = await createAndSignCredential(claims, privateKeyHex);

    // Construct the VC
    const vc = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential", "AttendedCourseCredential"],
        issuer: issuerDid,
        issuanceDate: new Date().toISOString(),
        id: id,
        credentialSubject: {
            id: userDid,
            name:name
        },
        claims: {
            courseName: courseName,
            courseCredit: courseCredit,
            courseSemester: courseSemester,
            courseGrade: courseGrade
        },
        proof: {
            type: "BlsSignature2024",
            created: new Date().toISOString(),
            proofPurpose: "assertionMethod",
            verificationMethod: `${issuerDid}#keys-1`,
            root: merkleRoot,
            signature: signature
        }
    };

    // Record issuance
    await axios.post('http://localhost:3001/credential', {
        credentialId:id,
        issuerDid:issuerDid, credentialType:"AttendedCourseCredential", 
        rootHash:merkleRoot, signature:signature, dateOfIssuance:  new Date().toISOString()});

    res.json(vc);
});

// Endpoint to verify verifiable presentation
app.post('/verify-vp', async (req, res) => {
    const presentation = req.body;

    try {
      const isValid = await verifyAggregatedClaimsAndSignature(presentation);
      res.json({ isValid });
    } catch (error) {
      console.error('Error verifying VP:', error);
      res.status(500).json({ isValid: false });
    }
});

app.listen(3010, () => {
    console.log('Backend running on port 3010');
});
