import React, { useState, useRef } from "react";
import axios from "axios";
import "./App.css";
import "./cameraClassifier.css";

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState("");
  const [confidence, setConfidence] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [cameraMode, setCameraMode] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const wasteInfo = {
    battery: {
      carbon: "High – hazardous chemicals",
      dispose: "Drop at e-waste collection center",
      recycle: "Batteries are recyclable at e-waste facilities"
    },
    biological: {
      carbon: "Moderate – decomposes naturally",
      dispose: "Use compost bin",
      recycle: "Can be turned into manure"
    },
    cardboard: {
      carbon: "Low",
      dispose: "Dry waste bin",
      recycle: "Easily recyclable—reuse boxes"
    },
    clothes: {
      carbon: "High",
      dispose: "Donate or drop at textile recycling",
      recycle: "Upcycle into bags, mats, rags"
    },
    glass: {
      carbon: "Medium",
      dispose: "Dry waste bin",
      recycle: "100% recyclable infinitely"
    },
    metal: {
      carbon: "Medium to high",
      dispose: "Scrap dealer or recycling center",
      recycle: "Fully recyclable"
    },
    paper: {
      carbon: "Low",
      dispose: "Dry waste bin",
      recycle: "Easily recyclable—reuse sheets"
    },
    plastic: {
      carbon: "Very high",
      dispose: "Plastic collection center",
      recycle: "Can be recycled into fibers"
    },
    shoes: {
      carbon: "High",
      dispose: "Donate if usable",
      recycle: "Upcycle into mats or holders"
    },
    trash: {
      carbon: "Variable",
      dispose: "General waste bin",
      recycle: "Sort into recyclable categories"
    }
  };

  // API endpoint - use environment variable if provided
  const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

  // -------------------- IMAGE UPLOAD --------------------
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setPrediction("");
      setConfidence("");
      setErrorMsg("");
    }
  };

  const handleUpload = async () => {
    if (!image) {
      alert("Please upload an image first!");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", image);

    try {
      const response = await axios.post(`${API_URL}/predict`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      let cls = response.data.class?.toString().trim().toLowerCase();
      setPrediction(cls);
      setConfidence(response.data.confidence);
    } catch (err) {
      setErrorMsg("Prediction Error - Please try again");
    }

    setLoading(false);
  };

  // -------------------- CAMERA MODE --------------------
  const startCamera = async () => {
    setCameraMode(true);
    setPrediction("");
    setConfidence("");
    setErrorMsg("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setErrorMsg("Camera access blocked - Please enable camera permissions");
    }
  };

  const stopCamera = () => {
    let stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setCameraMode(false);
  };

  const captureFromCamera = async () => {
    setLoading(true);
    setErrorMsg("");

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("file", blob, "frame.jpg");

      try {
        const response = await axios.post(`${API_URL}/predict`, formData);

        let cls = response.data.class?.toString().trim().toLowerCase();
        setPrediction(cls);
        setConfidence(response.data.confidence);
      } catch (err) {
        setErrorMsg("Camera Prediction Error - Please try again");
      }

      setLoading(false);
    }, "image/jpeg");
  };

  return (
    <div className="app-container">
      {/* Main Content */}
      <div className="main-content">
        <h1 className="title">
          <span>♻️</span> Smart Waste Detection
        </h1>

        {/* Mode Toggle Buttons */}
        <div className="mode-buttons">
          <button
            className={`btn ${!cameraMode ? 'btn-primary' : ''}`}
            onClick={() => { setCameraMode(false); stopCamera(); }}
          >
            📤 Upload Mode
          </button>
          <button
            className={`btn ${cameraMode ? 'btn-primary' : ''}`}
            onClick={startCamera}
          >
            📷 Camera Mode
          </button>
        </div>

        {/* ========== IMAGE UPLOAD MODE ========== */}
        {!cameraMode && (
          <>
            <div className="upload-box">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                id="file-upload"
              />
            </div>

            {preview && (
              <div className="image-preview">
                <img src={preview} alt="Preview" />
              </div>
            )}

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleUpload}
                disabled={loading || !image}
                className="btn btn-primary"
                style={{ marginTop: '20px' }}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Analyzing...
                  </>
                ) : (
                  "🔍 Detect Waste"
                )}
              </button>
            </div>
          </>
        )}

        {/* ========== CAMERA MODE ========== */}
        {cameraMode && (
          <div className="camera-container">
            <video ref={videoRef} autoPlay className="video-feed" />
            <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

            <div className="camera-btns">
              <button className="btn btn-primary" onClick={captureFromCamera} disabled={loading}>
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Analyzing...
                  </>
                ) : (
                  "📸 Capture & Detect"
                )}
              </button>

              <button className="btn stop-btn" onClick={stopCamera}>
                ✕ Stop Camera
              </button>
            </div>
          </div>
        )}

        {/* ERROR */}
        {errorMsg && <p className="error">{errorMsg}</p>}

        {/* ========== RESULT CARD ========== */}
        {prediction && wasteInfo[prediction] && (
          <div className="result-card">
            <h2>
              Detected: <span className="highlight">{prediction}</span>
            </h2>
            <p>
              <strong>Confidence:</strong> {(confidence * 100).toFixed(2)}%
            </p>
            <hr />

            <h3>🌍 Environmental Impact</h3>
            <div className="info-item">
              <p>{wasteInfo[prediction].carbon}</p>
            </div>

            <h3>🗑️ Proper Disposal</h3>
            <div className="info-item">
              <p>{wasteInfo[prediction].dispose}</p>
            </div>

            <h3>♻️ Reuse / Recycle Tips</h3>
            <div className="info-item">
              <p>{wasteInfo[prediction].recycle}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span>♻️</span> Smart Waste Detection
          </div>
          <div className="footer-links">
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
          <p className="footer-copyright">
            © {new Date().getFullYear()} Smart Waste Detection System from RG04. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
