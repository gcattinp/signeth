import React, { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const PDFViewer = ({ pdfBlob, signDocument, stamps, onStamp }) => {
    const containerRef = useRef(null);

    const chunkSignature = (signature, label, chunkSize) => {
      const chunks = [];
      for (let i = 0; i < signature.length; i += chunkSize) {
          const chunk = signature.substring(i, Math.min(i + chunkSize, signature.length));
          if (i === 0) {
              chunks.push(`${label}${chunk}`);
          } else {
              chunks.push(chunk);
          }
      }
      return chunks.join('\n');
  };

    const handleCanvasClick = async (e, canvas, pageNumber) => {
        const rect = canvas.getBoundingClientRect();
        const scale = canvas.width / rect.width;
        const x = (e.clientX - rect.left) * scale;
        const y = (e.clientY - rect.top) * scale;

        try {
          const signatureData = await signDocument(pdfBlob);
          if (signatureData) {
              const label = "signature: ";
              const wrappedSignature = chunkSignature(signatureData.signature, label, 66);
              const stampText = `address: ${signatureData.signer}\nhash: ${signatureData.pdfHash}\n${wrappedSignature}\nTimestamp: ${signatureData.timestamp}`;
              onStamp([...stamps, { text: stampText, x, y, page: pageNumber }]);
          } else {
              console.error('Signature data is undefined');
          }
        } catch (error) {
            console.error('Error in handleCanvasClick:', error);
        }
    };

    useEffect(() => {
      const renderPageOnCanvas = async (pdf, pageNum) => {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1 });
        const canvas = document.createElement('canvas');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const context = canvas.getContext('2d');
        const renderContext = { canvasContext: context, viewport: viewport };

        const wrapperDiv = document.createElement('div');
        wrapperDiv.style.marginBottom = "2px";
        wrapperDiv.style.padding = "10px";
        wrapperDiv.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";

        wrapperDiv.appendChild(canvas);

        containerRef.current.appendChild(wrapperDiv);

        await page.render(renderContext).promise;

        stamps.filter(stamp => stamp.page === pageNum).forEach(stamp => {
            const lines = stamp.text.split('\n');
            let currentY = stamp.y;
            lines.forEach(line => {
                context.font = "10px Helvetica";
                context.fillText(line, stamp.x, currentY);
                currentY += 12;
            });
        });

        canvas.addEventListener('click', (e) => handleCanvasClick(e, canvas, pageNum));
    };


        if (pdfBlob) {
            const loadingTask = pdfjsLib.getDocument(URL.createObjectURL(pdfBlob));
            loadingTask.promise.then(async (pdf) => {
                // Clear existing content
                while (containerRef.current.firstChild) {
                    containerRef.current.removeChild(containerRef.current.firstChild);
                }

                // Render each page
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    await renderPageOnCanvas(pdf, pageNum);
                }
            });
        }
    }, [pdfBlob, signDocument, stamps, onStamp]);

    return <div ref={containerRef} className="pdf-container" style={{ position: 'relative' }}></div>;
};

export default PDFViewer;
