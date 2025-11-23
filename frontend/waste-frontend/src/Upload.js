import React, { useState } from "react";

function Upload() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [result, setResult] = useState(null);

  const handleFileChange = (event) => {
    setSelectedImage(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      alert("Please select an image first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedImage);

    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);

    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Waste Classification</h2>
      
      <input type="file" accept="image/*" onChange={handleFileChange} />

      <button onClick={handleUpload}>Upload</button>

      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>Prediction Result:</h3>
          <p><strong>Class:</strong> {result.class}</p>
          <p><strong>Confidence:</strong> {(result.confidence * 100).toFixed(2)}%</p>
        </div>
      )}
    </div>
  );
}

export default Upload;
