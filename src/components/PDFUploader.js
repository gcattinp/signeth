import React from 'react';

const PDFUploader = ({ onFileSelect }) => {
    const handleFileInput = (e) => {
        const file = e.target.files[0];
        if (file) {
            onFileSelect(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            onFileSelect(file);
        }
    };

    return (
      <div>
          <button className="button" onClick={() => document.getElementById('file-input').click()}>
              Upload
          </button>
          <input
              type="file"
              id="file-input"
              accept="application/pdf"
              onChange={handleFileInput}
              className="file-input"
          />
          <div className="drop-zone" onDragOver={handleDragOver} onDrop={handleDrop}>
              Drag & Drop
          </div>
      </div>
  );
};

export default PDFUploader;
