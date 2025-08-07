// Example with React
import { useState } from "react";
import axios from "axios";

const BACKEND  = "http://localhost:4000/api/v2";
export default function UploadPDF() {
  const [file, setFile] = useState(null);

  const handleChange = (e: any) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a PDF file.");

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const response = await axios.post(`${BACKEND}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log(response.data);
      

    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  return (
    <div>
      <input type="file" accept="application/pdf" onChange={handleChange} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}
