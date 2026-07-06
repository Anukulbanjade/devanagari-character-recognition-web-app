import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { toast, Toaster } from 'react-hot-toast';
import { Upload, LogOut, Copy, Volume2, CheckCircle } from 'lucide-react';

const BASE_URL = 'http://localhost:5000/api';

const processingStates = [
  { message: "Preparing image for analysis...", duration: 1500 },
  { message: "Processing Devanagari characters...", duration: 2000 },
  { message: "Analyzing text structure...", duration: 1500 },
  { message: "Generating predictions...", duration: 1000 },
  { message: "Finalizing results...", duration: 800 }
];

const containerVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.3 }
  }
};

const formVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  },
  exit: { 
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 }
  }
};

const Dashboard = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState(-1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [predictionResult, setPredictionResult] = useState(null);
  const navigate = useNavigate();

  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    setFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    simulateUploadProgress();
  }, []);

  const simulateUploadProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 50);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxSize: 10485760,
    maxFiles: 1
  });

  const processImage = async () => {
    if (!file) {
      toast.error("Please select an image first");
      return;
    }

    setLoading(true);
    setProcessingStep(0);

    for (let i = 0; i < processingStates.length; i++) {
      setProcessingStep(i);
      await new Promise(resolve => setTimeout(resolve, processingStates[i].duration));
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`${BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (!data?.data?.text) {
        throw new Error("Invalid response");
      }

      setProcessingStep(processingStates.length);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setPredictionResult({
        text: data.data.text,
        id: data.data.characters[0].id
      });
      
      toast.success("Detection completed successfully!");
    } catch (error) {
      toast.error("Detection failed! Please try again.");
    } finally {
      setLoading(false);
      setProcessingStep(-1);
      setFile(null);
      setPreview(null);
      setUploadProgress(0);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate("/auth");
  };

  const handleCopyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Text copied!");
    } catch (err) {
      toast.error("Failed to copy text");
    }
  };

  const handleListen = async (text) => {
    try {
      const response = await fetch(`${BASE_URL}/generate-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
  
      if (!response.ok) throw new Error('Audio generation failed');
  
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
      toast.success("Playing audio");
    } catch (error) {
      console.error('Audio error:', error);
      toast.error("Failed to play audio");
    }
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 py-8 px-4">
      <Toaster position="top-center" />
      
      <motion.div
        className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{ duration: 8, repeat: Infinity, delay: 2 }}
      />

      <motion.div 
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full max-w-md"
      >
        <div className="bg-gray-800/90 backdrop-blur-lg rounded-3xl border border-gray-700/50 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-700/50 flex justify-between items-center">
            <h1 className="text-xl font-bold text-white">
              Devanagari Text Detection
            </h1>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <motion.div
              variants={formVariants}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragActive 
                  ? 'border-purple-500 bg-purple-500/10' 
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              {...getRootProps()}
            >
              <input {...getInputProps()} />
              <AnimatePresence mode="wait">
                {preview ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative w-48 h-48 mx-auto"
                  >
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="w-full h-full object-cover rounded-xl"
                    />
                    {uploadProgress < 100 && (
                      <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                        <div className="bg-white/90 px-4 py-2 rounded-lg">
                          <span className="text-sm font-medium text-gray-900">
                            Uploading... {uploadProgress}%
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-purple-500/10">
                      <Upload className="w-8 h-8 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-base font-medium text-gray-300">
                        {isDragActive ? 'Drop your image here' : 'Drop image here'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.button
              onClick={processImage}
              disabled={!file || loading}
              className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
                file && !loading
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Process Image
            </motion.button>

            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm flex items-center justify-center"
                >
                  <div className="text-center p-8">
                    {processingStep === processingStates.length ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                      >
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <p className="text-lg font-medium text-white">
                          Detection Complete!
                        </p>
                      </motion.div>
                    ) : (
                      <>
                        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                        <p className="text-lg font-medium text-white mb-2">
                          {processingStates[processingStep]?.message || "Processing..."}
                        </p>
                        <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-purple-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${((processingStep + 1) / processingStates.length) * 100}%` 
                            }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {predictionResult && (
                <motion.div
                  variants={formVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-2"
                >
                  <h2 className="text-lg font-semibold text-white">
                    Detection Result
                  </h2>
                  <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 flex items-center justify-between">
                    <p className="text-xl text-white">
                      {predictionResult.text}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyText(predictionResult.text)}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                      >
                        <Copy className="w-5 h-5 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleListen(predictionResult.text)}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                      >
                        <Volume2 className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;