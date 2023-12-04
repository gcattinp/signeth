import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const PDFViewer = ({ pdfBlob, onStamp, signDocument }) => {
  const containerRef = useRef(null);
  const [stamps, setStamps] = useState([]);

  const handleCanvasClick = async (e, canvas, pageNumber) => {
    const context = canvas.getContext('2d');
    const x = e.offsetX;
    const y = e.offsetY;

    try {
      const signatureData = await signDocument(pdfBlob);
      if (signatureData) {
        const stampText = `Signed by: ${signatureData.signer}\nSignature: ${signatureData.signature}\nTimestamp: ${signatureData.timestamp}`;
        const newStamp = { text: stampText, x, y, page: pageNumber };
        setStamps(currentStamps => [...currentStamps, newStamp]);
        context.fillText(stampText, x, y);

      } else {
        console.error('Signature data is undefined');
      }
    } catch (error) {
      console.error('Error in handleCanvasClick:', error);
    }
  };

  const redrawStamps = (canvas, pageNumber, context) => {
    const pageStamps = stamps.filter(stamp => stamp.page === pageNumber);
    pageStamps.forEach(stamp => {
      context.fillText(stamp.text, stamp.x, stamp.y);
    });
  };

  useEffect(() => {
    const renderPageOnCanvas = async (pdf, pageNumber, container) => {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = document.createElement('canvas');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const context = canvas.getContext('2d');

      container.appendChild(canvas);

      await page.render({ canvasContext: context, viewport }).promise;
      redrawStamps(canvas, pageNumber, context);

      canvas.addEventListener('click', (e) => handleCanvasClick(e, canvas, pageNumber));
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
  }, [pdfBlob, stamps]); // re-render when pdfBlob or stamps change

  return (
    <div ref={containerRef} className="pdf-container">
      {/* Canvases will be appended here */}
    </div>
  );
};

export default PDFViewer;
