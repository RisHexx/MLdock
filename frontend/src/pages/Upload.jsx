import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { uploadModel, resetUploadStatus } from '../store/slices/modelsSlice';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { UploadCloud, File, AlertCircle, CheckCircle2 } from 'lucide-react';

const SUPPORTED_MODEL_EXTENSIONS = ['.pkl', '.joblib', '.pt', '.h5', '.keras', '.onnx'];
const SUPPORTED_MODEL_EXTENSIONS_LABEL = SUPPORTED_MODEL_EXTENSIONS.join(', ');

const Upload = () => {
  const [modelFile, setModelFile] = useState(null);
  const [metadataFile, setMetadataFile] = useState(null);
  const modelInputRef = useRef(null);
  const metadataInputRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { uploadStatus, error } = useSelector((state) => state.models);

  useEffect(() => {
    dispatch(resetUploadStatus());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!modelFile || !metadataFile) return;

    const resultAction = await dispatch(uploadModel({ modelFile, metadataFile }));
    if (uploadModel.fulfilled.match(resultAction)) {
      setTimeout(() => navigate('/models'), 1500);
    }
  };

  const handleFileChange = (e, setFile) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Upload Model</h1>
          <p className="text-sm text-gray-500 mt-1">Deploy a new model to MlDock</p>
        </div>
      </div>

      {uploadStatus === 'failed' && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-card text-sm flex items-start border border-red-100">
          <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Upload Failed</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {uploadStatus === 'succeeded' && (
        <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-card text-sm flex items-center border border-green-100 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 mr-3" />
          Model deployed successfully! Redirecting...
        </div>
      )}

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Model File Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Model File ({SUPPORTED_MODEL_EXTENSIONS_LABEL})
            </label>
            <div 
              onClick={() => modelInputRef.current?.click()}
              className={`border-2 border-dashed rounded-card p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                modelFile ? 'border-primary bg-primary/5' : 'border-border hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <input 
                type="file" 
                ref={modelInputRef} 
                className="hidden" 
                accept={SUPPORTED_MODEL_EXTENSIONS.join(',')}
                onChange={(e) => handleFileChange(e, setModelFile)}
              />
              {modelFile ? (
                <>
                  <File className="w-8 h-8 text-primary mb-2" />
                  <p className="text-sm font-medium text-gray-900">{modelFile.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{(modelFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">Supported model files: {SUPPORTED_MODEL_EXTENSIONS_LABEL}</p>
                </>
              )}
            </div>
          </div>

          {/* Metadata File Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Metadata File (metadata.json)</label>
            <div 
              onClick={() => metadataInputRef.current?.click()}
              className={`border-2 border-dashed rounded-card p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                metadataFile ? 'border-primary bg-primary/5' : 'border-border hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <input 
                type="file" 
                ref={metadataInputRef} 
                className="hidden" 
                accept=".json"
                onChange={(e) => handleFileChange(e, setMetadataFile)}
              />
              {metadataFile ? (
                <>
                  <File className="w-8 h-8 text-primary mb-2" />
                  <p className="text-sm font-medium text-gray-900">{metadataFile.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{(metadataFile.size / 1024).toFixed(2)} KB</p>
                </>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">JSON configuration file</p>
                </>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => navigate('/models')}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={!modelFile || !metadataFile || uploadStatus === 'loading' || uploadStatus === 'succeeded'}
            >
              {uploadStatus === 'loading' ? 'Deploying...' : 'Deploy Model'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Upload;
