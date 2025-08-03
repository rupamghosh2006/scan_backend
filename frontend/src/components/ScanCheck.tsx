import axios from "axios";
import { useState } from "react";

const ScanCheck = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setError(null); // Clear previous errors
    setResult(null); // Clear previous results
  };

  const pdfConvert = async () => {
    if (!selectedFile) {
      setError("Please select a PDF file first");
      return;
    }

    // Validate file type
    if (selectedFile.type !== 'application/pdf') {
      setError("Please select a valid PDF file");
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      setError("File size must be less than 10MB");
      return;
    }

    const formData = new FormData();
    formData.append('pdf', selectedFile);

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post('http://localhost:4000/api/v1/scan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setResult(response.data);
      } else {
        setError(response.data.message || 'Conversion failed');
      }
      
    } catch (error: any) {
      console.error('Error converting PDF:', error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        setError(error.response.data?.message || 'Server error occurred');
      } else if (error.request) {
        // Request was made but no response received
        setError('No response from server. Please check your connection.');
      } else {
        // Something else happened
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Upload PDF:
        </label>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          disabled={isLoading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {selectedFile && (
          <p className="mt-2 text-sm text-gray-600">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      <button 
        onClick={pdfConvert} 
        disabled={isLoading || !selectedFile}
        className={`w-full py-2 px-4 rounded-md font-medium ${
          isLoading || !selectedFile
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isLoading ? 'CONVERTING...' : 'CONVERT PDF'}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Success Result */}
      {result && result.success && (
        <div className="mt-4">
          <div className="p-3 bg-green-100 border border-green-300 rounded-md mb-3">
            <p className="text-green-700 font-medium">{result.message}</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Conversion Result:</h3>
            <div className="bg-gray-100 p-3 rounded-md">
              <pre className="text-sm overflow-auto max-h-96">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
            
            {result.fileInfo && (
              <div className="text-sm text-gray-600">
                <p><strong>File:</strong> {result.fileInfo.filename}</p>
                <p><strong>Size:</strong> {(result.fileInfo.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}
          </div>

          <button 
            onClick={resetForm}
            className="mt-3 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Convert Another PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default ScanCheck;