import React, { useState, useEffect } from 'react';
import { ReactReader } from 'react-reader';
import { storage, auth, db } from './firebase'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";

function App() {
  return (
    <Router>
        <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Home/>}/>
        </Routes>
        </div>
    </Router>
  );
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (e) {
      console.error('Login error: ', e);
      setError(e.message);
    }
  };

  return (
    <div className="LoginSignup">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <p>Email: </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="input-fields"
        />
        <p>Password: </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="input-fields"
        />
        <button type="submit" className="submit">
          Login
        </button>
        {error && <p className="login-error">{error}</p>}
      </form>
      <p>New user? Sign up <Link to="/signup" className="signup">here</Link></p>
    </div>
  );
}

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (e) {
      console.error('Error during sign up: ', e);
      setError(e.message);
    }
  };

  return (
    <div className="LoginSignup">
      <h2>Sign Up</h2>
      <form onSubmit={handleSignUp}>
        <p>Email: </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="input-fields"
        />
        <p>Password: </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="input-fields"
        />
        <button type="submit" className="submit">
          Sign Up
        </button>
        {error && <p className="login-error">{error}</p>}
      </form>
    </div>
  );
}

const Home = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedBookUrl, setSelectedBookUrl] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userId = user.uid;
          const userFilesSnapshot = await getDocs(collection(db, `users/${userId}/books`));
          const userFilesData = userFilesSnapshot.docs.map((file) => ({...file.data(), id: file.id}));
          setFile(userFilesData);
        } catch (error) {
          console.error('Error fetching user files:', error);
        }
      }
    };

    fetchUserData();
  }, [user]);

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
        // Create reference to file location in Firebase Storage
        const storageRef = ref(storage, `books/${file.name}`);
  
        // Upload file to Firebase Storage using authenticated user
        const snapshot = await uploadBytes(storageRef, file);
        console.log('File uploaded successfully', snapshot);
  
        // Get download URL of uploaded file
        const url = await getDownloadURL(storageRef);
        setSelectedBookUrl(url);
        console.log('Download URL:', url);
      } catch (error) {
        console.error('Error during file upload or URL retrieval:', error);
        if (error.code) {
          console.error('Firebase Storage Error Code:', error.code);
        }
        setError('Failed to upload file or get download URL: ' + error.message);
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