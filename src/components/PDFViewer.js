// PDFViewr.js
import React, { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const PDFViewer = ({ pdfBlob, onStamp, signDocument }) => {
  const containerRef = useRef(null);

  const handleCanvasClick = async (e, canvas, pageNumber) => {
    const context = canvas.getContext('2d');
    const x = e.offsetX;
    const y = e.offsetY;

    try {
        // Generate the signature data
        const signatureData = await signDocument(pdfBlob);

        if (signatureData) {
            // Create the stamp text
            const stampText = `Signed by: ${signatureData.signer}\nSignature: ${signatureData.signature}\nTimestamp: ${signatureData.timestamp}`;
            context.fillText(stampText, x, y);

            // Pass the stamp data to the App component
            onStamp({ text: stampText, x, y, page: pageNumber });
        } else {
            console.error('Signature data is undefined');
        }
    } catch (error) {
        console.error('Error in handleCanvasClick:', error);
    }
};



    useEffect(() => {
        const renderPageOnCanvas = async (pdf, pageNumber, container) => {
            const page = await pdf.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 1.2 });
            const canvas = document.createElement('canvas');
            canvas.addEventListener('click', (e) => handleCanvasClick(e, canvas, pageNumber));
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            container.appendChild(canvas);

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };
            await page.render(renderContext).promise;
        };

        if (pdfBlob) {
            const loadingTask = pdfjsLib.getDocument(URL.createObjectURL(pdfBlob));
            loadingTask.promise.then(async (pdf) => {
                const container = containerRef.current;
                container.innerHTML = '';

                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    await renderPageOnCanvas(pdf, pageNum, container);
                }
            });
        }
    }, [pdfBlob, signDocument]);

    return (
        <div ref={containerRef} className="pdf-container">
            {/* Canvases will be appended here */}
        </div>
    );
};

export default PDFViewer;
