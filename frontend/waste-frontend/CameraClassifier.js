import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";

const videoConstraints = {
  width: 300,
  height: 300,
  facingMode: "environment", 
};

function CameraClassifier() {
  const webcamRef = useRef(null);
  const [prediction, setPrediction] = useState("");
  const [confidence, setConfidence] = useState("");
  const [loading, setLoading] = useState(false);

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;

    setLoading(true);

    const imageSrc = webcamRef.current.getScreenshot();

    // Convert base64 to blob
    const byteString = atob(imageSrc.split(",")[1]);
    const mimeString = "image/jpeg";
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([ab], { type: mimeString });
    const file = new File([blob], "capture.jpg", { type: mimeString });

    const formData = new FormData();
    formData.append("file", file);

    // API endpoint - use environment variable if provided
    const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

    // Send to backend
    try {
      const res = await axios.post(`${API_URL}/predict`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPrediction(res.data.class);
      setConfidence((res.data.confidence * 100).toFixed(2) + "%");
    } catch (error) {
      console.log(error);
      setPrediction("Error in prediction");
    }

    setLoading(false);
  }, [webcamRef]);

  // Auto-run detection every 1.5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      capture();
    }, 1500);

    return () => clearInterval(interval);
  }, [capture]);

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h2>Real-Time Waste Detection</h2>

      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        style={{ width: "300px", borderRadius: "12px" }}
      />

      <div style={{ marginTop: "20px", padding: "10px" }}>
        <h3>Prediction: {prediction || "Detecting..."}</h3>
        <p>Confidence: {confidence}</p>
        {loading && <p>Processing...</p>}
      </div>
    </div>
  );
}

export default CameraClassifier;
