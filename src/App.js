import React, { useState } from "react";

function App() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [gallery, setGallery] = useState([]);

  const API_URL =
    "https://0pelfoja45.execute-api.ap-south-1.amazonaws.com/process-image";

  const SEARCH_URL =
    "https://0pelfoja45.execute-api.ap-south-1.amazonaws.com/search";

  const GALLERY_URL =
    "https://0pelfoja45.execute-api.ap-south-1.amazonaws.com/images";

  // Upload
  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
    setResults([]);
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  };

  const sendImages = async () => {
    if (files.length === 0) return alert("Upload image first");

    setLoading(true);
    const temp = [];

    for (let file of files) {
      const base64 = await convertToBase64(file);

      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });

        const data = await res.json();

        temp.push({
          name: file.name,
          labels: data.labels || [],
          preview: base64,
        });
      } catch (err) {
        console.error(err);
        alert("Upload error");
      }
    }

    setResults(temp);
    setLoading(false);
  };

  // SEARCH
  const searchImages = async () => {
    if (!search) return alert("Enter search");

    try {
      const res = await fetch(SEARCH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: search }),
      });

      const data = await res.json();

      let parsed = [];

      if (typeof data.body === "string") {
        parsed = JSON.parse(data.body);
      } else if (Array.isArray(data)) {
        parsed = data;
      } else if (Array.isArray(data.body)) {
        parsed = data.body;
      }

      setSearchResults(Array.isArray(parsed) ? parsed : []);
    } catch (err) {
      console.error(err);
      alert("Search error");
    }
  };

  // VAULT
  const fetchGallery = async () => {
    try {
      const res = await fetch(GALLERY_URL);
      const data = await res.json();

      let parsed = [];

      if (typeof data.body === "string") {
        parsed = JSON.parse(data.body);
      } else if (Array.isArray(data)) {
        parsed = data;
      } else if (Array.isArray(data.body)) {
        parsed = data.body;
      }

      console.log("FINAL GALLERY:", parsed);

      setGallery(Array.isArray(parsed) ? parsed : []);
    } catch (err) {
      console.error("Vault error:", err);
      alert("Vault error");
    }
  };

  return (
    <div style={container}>
      <h1 style={title}>🧠 Image AI Vault</h1>

      {/* Upload */}
      <div style={glass}>
        <input type="file" multiple onChange={handleFileChange} />
        <br /><br />
        <button style={btnBlue} onClick={sendImages}>
          Analyze Images
        </button>
        {loading && <p style={{ color: "white" }}>Processing...</p>}
      </div>

      {/* Upload Results */}
      <div style={grid}>
        {results.map((r, i) => (
          <div key={i} style={card}>
            <h3>{r.name}</h3>
            <img src={r.preview} style={img} alt="" />

            <div>
              {r.labels.map((l, j) => (
                <span key={j} style={tag}>
                  {l.name} ({l.confidence})
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH */}
      <div style={glass}>
        <h2>🔍 Search</h2>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="dog / person"
          style={input}
        />

        <br /><br />

        <button style={btnGreen} onClick={searchImages}>
          Search
        </button>
      </div>

      <div style={grid}>
        {searchResults.map((r, i) => (
          <div key={i} style={card}>
            <h3>{r.image_name}</h3>

            {r.image_url && r.image_url.startsWith("http") ? (
              <img src={r.image_url} style={img} alt="search" />
            ) : (
              <div style={fallback}>❌ No Image</div>
            )}

            <div>
              {(r.labels || []).map((l, j) => (
                <span key={j} style={tag}>
                  {l.name} ({l.confidence})
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* VAULT */}
      <div style={glass}>
        <h2>📁 My Vault</h2>

        <button style={btnBlue} onClick={fetchGallery}>
          Load My Images
        </button>
      </div>

      <div style={grid}>
        {gallery.map((r, i) => (
          <div key={i} style={card}>
            <h3>{r.image_name}</h3>

            {r.image_url && r.image_url.startsWith("http") ? (
              <img src={r.image_url} style={img} alt="vault" />
            ) : (
              <div style={fallback}>❌ No Image</div>
            )}

            <div>
              {(r.labels || []).map((l, j) => (
                <span key={j} style={tag}>
                  {l.name} ({l.confidence})
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* UI */

const container = {
  minHeight: "100vh",
  padding: "30px",
  background: "linear-gradient(135deg, #667eea, #764ba2)",
  fontFamily: "Arial",
};

const title = { textAlign: "center", color: "white" };

const glass = {
  backdropFilter: "blur(10px)",
  background: "rgba(255,255,255,0.1)",
  padding: "20px",
  borderRadius: "12px",
  margin: "20px auto",
  width: "fit-content",
  textAlign: "center",
  color: "white",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "20px",
};

const card = {
  background: "rgba(255,255,255,0.15)",
  backdropFilter: "blur(10px)",
  borderRadius: "12px",
  padding: "15px",
  color: "white",
  textAlign: "center",
};

const img = { width: "100%", borderRadius: "10px" };

const fallback = {
  padding: "30px",
  color: "#ddd",
};

const tag = {
  display: "inline-block",
  margin: "5px",
  padding: "5px 10px",
  background: "rgba(255,255,255,0.3)",
  borderRadius: "6px",
};

const btnBlue = {
  padding: "10px 20px",
  background: "#3498db",
  color: "white",
  border: "none",
  borderRadius: "8px",
};

const btnGreen = {
  padding: "10px 20px",
  background: "#2ecc71",
  color: "white",
  border: "none",
  borderRadius: "8px",
};

const input = {
  padding: "10px",
  borderRadius: "8px",
  border: "none",
};

export default App;
