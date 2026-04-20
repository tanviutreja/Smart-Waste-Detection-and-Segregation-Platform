import React, { useState, useRef } from "react";
import axios from "axios";
import "./App.css";
import "./cameraClassifier.css";

// 🔥 Firebase
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

// 📊 Dashboard
import Dashboard from "./Dashboard";

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState("");
  const [confidence, setConfidence] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [cameraMode, setCameraMode] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [showDashboard, setShowDashboard] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const wasteInfo = {
    battery: {
      carbon: "High – hazardous chemicals",
      dispose: "Drop at e-waste center",
      recycle: "Recyclable"
    },
    biological: {
      carbon: "Moderate",
      dispose: "Compost",
      recycle: "Turns to manure"
    },
    cardboard: {
      carbon: "Low",
      dispose: "Dry bin",
      recycle: "Reusable"
    },
    plastic: {
      carbon: "Very high",
      dispose: "Plastic center",
      recycle: "Reusable fibers"
    }
  };

  const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

  // ---------- IMAGE ----------
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
    if (!image) return alert("Upload image first");

    setLoading(true);
    const formData = new FormData();
    formData.append("file", image);

    try {
      const res = await axios.post(`${API_URL}/predict`, formData);
      const cls = res.data.class.toLowerCase();

      setPrediction(cls);
      setConfidence(res.data.confidence);

      await addDoc(collection(db, "predictions"), {
        class: cls,
        confidence: res.data.confidence,
        source: "upload",
        timestamp: new Date()
      });

    } catch {
      setErrorMsg("Prediction failed");
    }

    setLoading(false);
  };

  // ---------- CAMERA ----------
  const startCamera = async () => {
    setCameraMode(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  const stopCamera = () => {
    videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
    setCameraMode(false);
  };

  const captureFromCamera = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("file", blob);

      const res = await axios.post(`${API_URL}/predict`, formData);
      const cls = res.data.class.toLowerCase();

      setPrediction(cls);
      setConfidence(res.data.confidence);

      await addDoc(collection(db, "predictions"), {
        class: cls,
        confidence: res.data.confidence,
        source: "camera",
        timestamp: new Date()
      });

    });
  };

  // ---------- CHAT ----------
  const sendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg = { sender: "user", text: chatInput };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await axios.post(`${API_URL}/chat`, {
        message: chatInput
      });

      setMessages(prev => [
        ...prev,
        { sender: "bot", text: res.data.reply }
      ]);

      // save chat
      await addDoc(collection(db, "chat_history"), {
        message: chatInput,
        type: "user",
        timestamp: new Date()
      });

    } catch {
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: "AI unavailable" }
      ]);
    }

    setChatInput("");
  };

  return (
    <div className="app-container">

      {/* ---------- NAVBAR ---------- */}
      <div className="navbar">
        <div className="nav-left">♻️ Smart Waste</div>
        <div className="nav-right">
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </div>
      </div>

      {/* ---------- TITLE ---------- */}
      <h1 className="title">
        <span>♻️</span> Smart Waste Detection
      </h1>

      {/* ---------- DASHBOARD ---------- */}
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <button className="btn" onClick={() => setShowDashboard(!showDashboard)}>
          📊 View Dashboard
        </button>
      </div>

      {showDashboard && <Dashboard />}

      {/* ---------- MODE BUTTONS ---------- */}
      <div className="mode-buttons">
        <button className={`btn ${!cameraMode && "btn-primary"}`} onClick={() => setCameraMode(false)}>
          Upload
        </button>
        <button className={`btn ${cameraMode && "btn-primary"}`} onClick={startCamera}>
          Camera
        </button>
      </div>

      {/* ---------- UPLOAD ---------- */}
      {!cameraMode && (
        <>
          <div className="upload-box">
            <input type="file" onChange={handleImageChange} />
          </div>

          {preview && (
            <div className="image-preview">
              <img src={preview} alt="preview" />
            </div>
          )}

          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleUpload}
              disabled={loading}
              className="btn btn-primary detect-btn"
            >
              {loading ? "Processing..." : "Detect Waste"}
            </button>
          </div>
        </>
      )}

      {/* ---------- CAMERA ---------- */}
      {cameraMode && (
        <div className="camera-container">
          <video ref={videoRef} autoPlay />
          <canvas ref={canvasRef} style={{ display: "none" }} />

          <button className="btn btn-primary" onClick={captureFromCamera}>
            Capture
          </button>
          <button className="btn" onClick={stopCamera}>
            Stop
          </button>
        </div>
      )}

      {/* ---------- RESULT ---------- */}
      {prediction && (
        <div className="result-card">
          <h2>{prediction}</h2>
          <p>{(confidence * 100).toFixed(2)}%</p>
        </div>
      )}

      {/* ---------- CHAT ---------- */}
      {chatOpen && (
        <div className="chat-window">
          <div className="chat-header">
            🤖 Assistant
            <button onClick={() => setChatOpen(false)}>✖</button>
          </div>

          <div className="chat-body">
            {messages.map((m, i) => (
              <div key={i} className={`chat-message ${m.sender}`}>
                {m.text}
              </div>
            ))}
          </div>

          <div className="chat-input">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about waste..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}

      <div className="chatbot-button" onClick={() => setChatOpen(!chatOpen)}>
        💬
      </div>

      {/* ---------- ABOUT ---------- */}
      <section id="about" className="info-section">
        <h2>About</h2>
        <p>
          Smart Waste Detection is an AI-powered web application designed to simplify waste segregation and promote sustainable living. The platform uses advanced deep learning techniques to automatically classify waste into categories such as plastic, paper, metal, and more.

By leveraging a pre-trained MobileNetV2 model, the system provides fast and accurate predictions through image uploads or real-time camera detection. Along with classification, users receive practical disposal guidance, recycling tips, and insights into the environmental impact of each waste type.

The platform also features an interactive chatbot for instant assistance and an analytics dashboard to track usage patterns and waste trends. Built with a modern tech stack including FastAPI, React, and Firebase, the system is designed to be responsive, scalable, and user-friendly.

The goal of this project is to make waste management smarter, more accessible, and environmentally responsible through the power of AI.
        </p>
      </section>

      {/* ---------- CONTACT ---------- */}
      <section id="contact" className="info-section">
        <h2>Contact</h2>
        <p>Email: utreja.tanvi01@gmail.com</p>
        <p>https://github.com/tanviutreja</p>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="footer">
        © 2026 Smart Waste Detection | Built with AI ♻️
      </footer>

    </div>
  );
}

export default App;