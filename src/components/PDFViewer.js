import React, { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const PDFViewer = ({ pdfBlob, onStamp }) => {
    const containerRef = useRef(null);

    const handleCanvasClick = (e, canvas, pageNumber) => {
        const context = canvas.getContext('2d');
        const x = e.offsetX;
        const y = e.offsetY;

        // Draw a simple text stamp
        context.font = '20px Arial';
        context.fillStyle = 'red';
        context.fillText(`Stamped on page ${pageNumber}`, x, y);

        onStamp({
          text: `Stamped on page ${pageNumber}`,
          x: x,
          y: y,
          page: pageNumber
      });
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
    }, [pdfBlob]);

    return (
        <div ref={containerRef} className="pdf-container">
            {/* Canvases will be appended here */}
        </div>
    );
};

export default PDFViewer;
