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

  const handleFileSelect = async (file) => {
      console.log("File Selected");
      const fileReader = new FileReader();
      fileReader.onload = async (event) => {
          console.log("File Reader Loaded");
          const pdfBytes = new Uint8Array(event.target.result);
          setOriginalPdfBytes(pdfBytes);
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
    const xOffset = 38;

    stamps.forEach(async (stamp) => {
      const page = pdfDoc.getPages()[stamp.page - 1];
      const lines = stamp.text.split('\n');
      let currentY = stamp.y;

      const yOffset = -79;

      lines.forEach((line) => {
          page.drawText(line, {
              x: stamp.x - xOffset,
              y: page.getHeight() - currentY - yOffset,
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

  return (
    <>
        {!pdfBlob && <h1 className="title">SignETH</h1>}
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
    </>
);
};


export default App;
