import React, { useState, useCallback } from 'react';
import PDFUploader from './components/PDFUploader';
import PDFViewer from './components/PDFViewer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import Web3 from 'web3';
import './App.css';

const App = () => {
    const [pdfBlob, setPdfBlob] = useState(null);
    const [stamps, setStamps] = useState([]);
    const [originalPdfBytes, setOriginalPdfBytes] = useState(null);

    const handleFileSelect = async (file) => {
        const fileReader = new FileReader();
        fileReader.onload = async (event) => {
            const pdfBytes = new Uint8Array(event.target.result);
            setOriginalPdfBytes(pdfBytes); // Save the original PDF bytes
            setPdfBlob(new Blob([pdfBytes], { type: "application/pdf" }));
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
          console.log('User account:', account);

          const pdfData = await new Response(pdfBlob).arrayBuffer();
          const pdfBytesHex = '0x' + [...new Uint8Array(pdfData)]
                  .map((byte) => byte.toString(16).padStart(2, '0'))
                  .join('');
          const pdfHash = web3.utils.sha3(pdfBytesHex);
          console.log('PDF Hash:', pdfHash);

          // Passing `null` or an empty string as the third argument
          const signature = await web3.eth.personal.sign(pdfHash, account, '');

          return {
              signer: account,
              signature,
              timestamp: Math.floor(Date.now() / 1000)
          };
      } catch (error) {
          console.error('Error signing document:', error);
      }
  };




    const handleStamp = useCallback((stampData) => {
        setStamps(currentStamps => [...currentStamps, stampData]);
    }, []);

    const downloadStampedPDF = async () => {
        const pdfDoc = await PDFDocument.load(originalPdfBytes);
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        stamps.forEach(async (stamp) => {
            const page = pdfDoc.getPages()[stamp.page - 1];
            page.drawText(`${stamp.text}\n${stamp.signer}\n${stamp.signature}\nTimestamp: ${stamp.timestamp}`, {
                x: stamp.x,
                y: page.getHeight() - stamp.y,
                size: 10,
                font: helveticaFont,
                color: rgb(0.95, 0.1, 0.1),
            });
        });

        const stampedPdfBytes = await pdfDoc.save();
        const url = URL.createObjectURL(new Blob([stampedPdfBytes], { type: "application/pdf" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = "stamped-pdf.pdf";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
      <div className="container">
          {!pdfBlob ? (
              <PDFUploader onFileSelect={handleFileSelect} />
          ) : (
              <>
                  <PDFViewer pdfBlob={pdfBlob} onStamp={handleStamp} signDocument={signDocument} />
                  <button className="button" onClick={downloadStampedPDF}>
                      Download Stamped PDF
                  </button>
              </>
          )}
      </div>
  );
};

export default App;
