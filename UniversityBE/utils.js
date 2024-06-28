import loadBls from "bls-signatures";
import fs from 'fs';
import crypto from 'crypto';
import { MerkleTree } from 'merkletreejs';
import sha256 from 'crypto-js/sha256.js';
import axios from 'axios';

import { v4 as uuidv4 } from "uuid";

// Function to generate and save keys
export async function generateAndSaveKeys(issuerName) {
    var bls = await loadBls();
    const privateKey = bls.AugSchemeMPL.key_gen(crypto.randomBytes(32));
    const publicKey = privateKey.get_g1();

    const privateKeyHex = bls.Util.hex_str(privateKey.serialize());
    const publicKeyHex = bls.Util.hex_str(publicKey.serialize());
    const did = `did:example:${uuidv4()}`; // Generate a UUID as DID
    const publicKeyObj = { issuerName: issuerName, issuerDid:did, publicKey:publicKeyHex };
    const privateKeyObj = { issuerName: issuerName, issuerDid:did, privateKey:privateKeyHex};
  
    const privateKeyFilename = `./keys/${did}_privateKey.json`;
    const publicKeyFilename = `./keys/${did}_publicKey.json`;

    fs.writeFileSync(privateKeyFilename, JSON.stringify(privateKeyObj, null, 2), 'utf8');
    fs.writeFileSync(publicKeyFilename, JSON.stringify(publicKeyObj, null, 2), 'utf8');

    return { did, publicKey: publicKeyHex };
}

// Function to create and sign a credential
export async function createAndSignCredential(claims, privateKeyHex) {
    var bls = await loadBls();
    const leaves = Object.entries(claims).map(([key, value]) => sha256(`${value}`));

    const tree = new MerkleTree(leaves, sha256, { sortPairs: true });
    const root = tree.getRoot().toString('hex');
    console.log(privateKeyHex)
    const privateKey = bls.PrivateKey.fromBytes(Buffer.from(privateKeyHex, 'hex'), false);
    const signature = bls.AugSchemeMPL.sign(privateKey, root);
    const signatureHex = bls.Util.hex_str(signature.serialize());
    const id = uuidv4()
    return { merkleRoot: root, signature: signatureHex, id:id };
}

// Function to verify aggregated claims and signature
export async function verifyAggregatedClaimsAndSignature(presentation)  {
    const bls = await loadBls();
  
    const { issuers, id: credentialIds, claims, proof } = presentation;
    const { aggregatedSignature } = proof;
    const aggregatedSignatureBytes = Buffer.from(aggregatedSignature, 'hex');
    const aggregatedSignatures = bls.G2Element.from_bytes(aggregatedSignatureBytes);
  
    const publicKeyPromises = issuers.map(issuerDid =>
      axios.get(`http://localhost:3001/user/${issuerDid}`)
    );
  
    const credentialPromises = credentialIds.map(credentialId =>
      axios.get(`http://localhost:3001/credential/${credentialId}`)
    );
  
    const publicKeys = await Promise.all(publicKeyPromises);
    const credentials = await Promise.all(credentialPromises);
  
    let valid = true;
    for (let i = 0; i < credentials.length; i++) {
      const { rootHash, signature } = credentials[i].data;
      const publicKeyData = publicKeys[i].data;
      const publicKeyHex = publicKeyData.userPublicKey;
      const publicKey = bls.G1Element.from_bytes(Buffer.from(publicKeyHex,'hex'));
   
      
      const credentialClaims = claims[i];
     const tree = new MerkleTree([], sha256, { sortPairs: true }); // Dummy tree for verification
      const isValidClaims =  Object.entries(credentialClaims).every(([key, { value, proof }]) => {
        const leaf = sha256(`${value}`);
        const proofObjects = proof.map(p => ({ position: p.position, data: Buffer.from(p.data, 'hex') }));
        return tree.verify(proofObjects, leaf, rootHash);
      });
      if (!isValidClaims) {
        valid = false;
        break;
      }
      const isValidSignature = bls.AugSchemeMPL.verify(publicKey,
        rootHash,
        bls.G2Element.from_bytes(Buffer.from(signature, 'hex'))
      );
      if (!isValidSignature) {
        valid = false;
        break;
      }
    }
  
    if (valid) {
      const publicKeysArray = publicKeys.map(pubKeyData => bls.G1Element.from_bytes(Buffer.from(pubKeyData.data.userPublicKey, 'hex')));
      const rootsArray = credentials.map(cred => cred.data.rootHash);
  
      valid = bls.AugSchemeMPL.aggregate_verify(publicKeysArray, rootsArray, aggregatedSignatures);
    }
  
    return valid;
  };

export default { generateAndSaveKeys, createAndSignCredential, verifyAggregatedClaimsAndSignature };
