import React, { useState } from 'react';
import PDFUploader from './components/PDFUploader';
import PDFViewer from './components/PDFViewer';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import Web3 from 'web3';
import './App.css';

const App = () => {
  console.log("App Component Rendered");

  const [pdfBlob, setPdfBlob] = useState(null);
  const [stamps, setStamps] = useState([]);
  const [originalPdfBytes, setOriginalPdfBytes] = useState(null);
  const [pdfHash, setPdfHash] = useState('');
  const [signature, setSignature] = useState('');
  const [signerAddress, setSignerAddress] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [mode, setMode] = useState('');

  const handleFileSelect = async (file) => {
    console.log("File Selected");
    const fileReader = new FileReader();
    fileReader.onload = async (event) => {
        console.log("File Reader Loaded");
        const pdfBytes = new Uint8Array(event.target.result);

        if (mode === 'verify') {
            const web3 = new Web3();
            const pdfBytesHex = '0x' + [...pdfBytes]
                .map((byte) => byte.toString(16).padStart(2, '0'))
                .join('');
            const pdfHash = web3.utils.sha3(pdfBytesHex);
            setPdfHash(pdfHash);
        } else {
            setOriginalPdfBytes(pdfBytes);
            setPdfBlob(new Blob([pdfBytes], { type: "application/pdf" }));
        }
    };
    fileReader.readAsArrayBuffer(file);
};

  const signDocument = async (pdfBlob) => {
      if (typeof window.ethereum === 'undefined') {
          alert('MetaMask is not installed.');
          return;
      }

      const web3 = new Web3(window.ethereum);

      try {
          await window.ethereum.enable();
          const accounts = await web3.eth.getAccounts();
          const account = accounts[0];

          const pdfData = await new Response(pdfBlob).arrayBuffer();
          const pdfBytesHex = '0x' + [...new Uint8Array(pdfData)]
              .map((byte) => byte.toString(16).padStart(2, '0'))
              .join('');
          const pdfHash = web3.utils.sha3(pdfBytesHex);

          const signature = await web3.eth.personal.sign(pdfHash, account, '');
          return {
              signer: account,
              signature,
              timestamp: Math.floor(Date.now() / 1000),
              pdfHash: pdfHash
          };
      } catch (error) {
          console.error('Error signing document:', error);
      }
  };

  const downloadStampedPDF = async () => {
    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    stamps.forEach(async (stamp) => {
      const page = pdfDoc.getPages()[stamp.page - 1];
      const lines = stamp.text.split('\n');
      let currentY = stamp.y;


      lines.forEach((line) => {
          page.drawText(line, {
              x: stamp.x,
              y: page.getHeight() - currentY,
              size: 10,
              font: helveticaFont,
          });

          currentY += 12;
      });
    });

    const stampedPdfBytes = await pdfDoc.save();
    const url = URL.createObjectURL(new Blob([stampedPdfBytes], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "signed_pdf.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const verifySignature = async () => {
    try {
        const web3 = new Web3(window.ethereum);
        const recoveredAddress = await web3.eth.personal.ecRecover(pdfHash, signature);
        const isValid = recoveredAddress.toLowerCase() === signerAddress.toLowerCase();
        setVerificationResult(isValid ? "Valid Signature" : "Invalid Signature");
    } catch (error) {
        console.error('Error verifying signature:', error);
        setVerificationResult("Verification failed");
    }
};

  return (
    <>
    {(!pdfBlob || !mode) && <h1 className="title">SignETH</h1>}
      {!mode && (
        <div className="container">
          <div className="mode-selection">
            <button className="button" onClick={() => setMode('sign')}>Sign</button>
            <button className="button" onClick={() => setMode('verify')}>Verify</button>
          </div>
        </div>
      )}


      {mode === 'sign' && (
        <div className="container">
          {!pdfBlob ? (
            <PDFUploader onFileSelect={handleFileSelect} />
          ) : (
            <>
              <PDFViewer pdfBlob={pdfBlob} onStamp={setStamps} signDocument={signDocument} stamps={stamps} />
              <button className="button" onClick={downloadStampedPDF}>
                Download
              </button>
            </>
          )}
        </div>
      )}

      {mode === 'verify' && (
        <div className="container">
          <div className="verification-section">
            <div className="input-wrapper">
              <label htmlFor="pdf-hash">Hash:</label>
              <input
                id="pdf-hash"
                className="input-field"
                type="text"
                placeholder="Enter PDF Hash"
                value={pdfHash}
                onChange={(e) => setPdfHash(e.target.value.replace(/\s/g, ''))}
              />
              <button
                className="upload-icon"
                onClick={() => document.getElementById('pdf-upload').click()}
                title="Upload PDF to extract hash"
              />
              <input
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                className="file-input"
              />
            </div>

            <div className="input-wrapper">
              <label htmlFor="signature">Signature:</label>
              <input
                id="signature"
                className="input-field"
                type="text"
                placeholder="Enter Signature"
                value={signature}
                onChange={(e) => setSignature(e.target.value.replace(/\s/g, ''))}
              />
            </div>

            <div className="input-wrapper">
              <label htmlFor="address">Address:</label>
              <input
                id="address"
                className="input-field"
                type="text"
                placeholder="Enter Signer Address"
                value={signerAddress}
                onChange={(e) => setSignerAddress(e.target.value.replace(/\s/g, ''))}
              />
            </div>

            <button className="button" onClick={verifySignature}>Verify</button>
            {verificationResult && <p className="verification-result">{verificationResult}</p>}
          </div>
        </div>
      )}

      {mode && (
        <button className="back-button" onClick={() => setMode('')}>- Back -</button>
      )}
    </>
  );
};

export default App;
