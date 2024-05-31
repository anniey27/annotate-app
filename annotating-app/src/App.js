import React, { useState } from 'react';
import { ReactReader } from 'react-reader';
import { storage } from './firebase'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const App = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedBookUrl, setSelectedBookUrl] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'application/epub+zip') {
      setFile(selectedFile);
    } else {
      setError('Please select a valid EPUB file.');
    }
  };

  const handleUpload = async () => {
    if (file) {
      setUploading(true);
      setError('');
      try {
        // Creates reference to file location in firebase storage
        const storageRef = ref(storage, `books/${file.name}`);

        // Uploads to firebase storage
        const snapshot = await uploadBytes(storageRef, file);
        console.log('File uploaded successfully', snapshot);

        // Gets download URL of uploaded file
        const url = await getDownloadURL(storageRef);
        setSelectedBookUrl(url);
        console.log('Download URL:', url);


      } catch (error) {
        console.error('Error during file upload or URL retrieval:', error);
        if (error.code) {
          console.error('Firebase Storage Error Code:', error.code);
        }
        setError('Failed to upload file or get download URL' + error.message);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div>
      <h1>Book Reader</h1>
      <h3>Upload your EPUB file</h3>
      <div>
        <input type="file" accept=".epub" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? 'Uploading...' : 'Upload and Read'}
        </button>
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </div>
      {selectedBookUrl && (
        <div style={{ height: '100vh' }}>
          <ReactReader url={selectedBookUrl} title={`${file.name}`} />
        </div>
      )}
    </div>
  );
};

export default App;