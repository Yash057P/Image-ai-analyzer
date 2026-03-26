import React, { useState } from "react";

function App() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL =
    "https://0pelfoja45.execute-api.ap-south-1.amazonaws.com/process-image";

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
    setResults([]);
  };

  const sendImages = async () => {
    if (files.length === 0) return alert("Upload image first");

    setLoading(true);
    const tempResults = [];

    for (let file of files) {
      const base64 = await convertToBase64(file);

      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: base64 }),
        });

        const data = await res.json();

        tempResults.push({
          name: file.name,
          labels: data.labels || [],
          preview: base64,
        });
      } catch (err) {
        console.error(err);
      }
    }

    setResults(tempResults);
    setLoading(false);
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  };

  return(
  <div
    style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea, #764ba2)",
      padding: "30px",
      fontFamily: "Arial",
      color: "white",
    }}
  >
    <h1 style={{ textAlign: "center" }}>🧠 Image AI Analyzer</h1>

    {/* Upload Section */}
    <div
      style={{
        textAlign: "center",
        marginBottom: "30px",
      }}
    >
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        style={{
          padding: "10px",
          borderRadius: "8px",
          background: "white",
          color: "black",
        }}
      />

      <br />
      <br />

      <button
        onClick={sendImages}
        style={{
          padding: "12px 25px",
          background: "#00c6ff",
          border: "none",
          borderRadius: "8px",
          color: "white",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Analyze Images
      </button>
    </div>

    {loading && <p style={{ textAlign: "center" }}>Processing...</p>}

    {/* GRID LAYOUT */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "20px",
      }}
    >
      {results.map((res, index) => (
        <div
          key={index}
          style={{
            backdropFilter: "blur(10px)",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "15px",
            padding: "20px",
            textAlign: "center",
            boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
          }}
        >
          <h3>{res.name}</h3>

          <img
            src={res.preview}
            alt="preview"
            style={{
              width: "100%",
              borderRadius: "10px",
              marginBottom: "10px",
            }}
          />

          <h4>Detected Labels:</h4>

          <div>
            {res.labels.map((label, i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  margin: "5px",
                  padding: "6px 10px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "6px",
                }}
              >
                {label.name} ({label.confidence}%)
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);
}

export default App;