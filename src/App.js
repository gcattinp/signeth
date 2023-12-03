// App.js
import React, { useState, useCallback } from 'react';
import PDFUploader from './components/PDFUploader';
import PDFViewer from './components/PDFViewer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import './App.css';

const App = () => {
    const [pdfBlob, setPdfBlob] = useState(null);
    const [stamps, setStamps] = useState([]);
    const [originalPdfBytes, setOriginalPdfBytes] = useState(null);

    const handleFileSelect = async (file) => {
        const fileReader = new FileReader();
        fileReader.onload = async (event) => {
            const pdfBytes = new Uint8Array(event.target.result);
            setOriginalPdfBytes(pdfBytes); // Save the original PDF bytes for later
            setPdfBlob(new Blob([pdfBytes], { type: "application/pdf" }));
        };
        fileReader.readAsArrayBuffer(file);
    };

    const handleStamp = useCallback((stampData) => {
        setStamps(currentStamps => [...currentStamps, stampData]);
    }, []);

    const downloadStampedPDF = async () => {
        const pdfDoc = await PDFDocument.load(originalPdfBytes);

        // Embed the font for the stamp
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Apply each stamp to the corresponding page
        stamps.forEach(async (stamp) => {
            const page = pdfDoc.getPages()[stamp.page - 1];
            page.drawText(stamp.text, {
                x: stamp.x,
                y: page.getHeight() - stamp.y,
                size: 20,
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
                    <PDFViewer pdfBlob={pdfBlob} onStamp={handleStamp} />
                    <button className="button" onClick={downloadStampedPDF}>
                        Download Stamped PDF
                    </button>
                </>
            )}
        </div>
    );
};

export default App;
