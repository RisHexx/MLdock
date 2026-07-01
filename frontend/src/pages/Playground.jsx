import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchModels } from '../store/slices/modelsSlice';
import api from '../api/axios';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import CodeBlock from '../components/ui/CodeBlock';
import { Activity, Play, AlertCircle } from 'lucide-react';

const Playground = () => {
  const dispatch = useDispatch();
  const { items: models, status: modelsStatus } = useSelector((state) => state.models);
  const { items: apiKeys } = useSelector((state) => state.apiKeys);

  const [selectedModelName, setSelectedModelName] = useState('');
  const [selectedApiKey, setSelectedApiKey] = useState(''); // Just for the UI hint
  const [manualApiKey, setManualApiKey] = useState('');
  const [jsonInput, setJsonInput] = useState('{\n  "input": {\n    \n  }\n}');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    dispatch(fetchModels());
    // Assume apiKeys are fetched globally or fetch them here if needed
  }, [dispatch]);

  const selectedModel = models.find(m => m.name === selectedModelName);

  // Pre-fill JSON when model changes
  useEffect(() => {
    if (selectedModel) {
      const example = {};
      Object.entries(selectedModel.input_schema).forEach(([key, type]) => {
        example[key] = type === 'integer' ? 0 : type === 'float' ? 0.0 : type === 'boolean' ? false : "";
      });
      setJsonInput(JSON.stringify({ input: example }, null, 2));
    }
  }, [selectedModel]);

  const handlePredict = async () => {
    if (!selectedModelName) {
      setError("Please select a model");
      return;
    }
    if (!manualApiKey) {
      setError("Please provide an API Key. Generate one in the API Keys tab.");
      return;
    }

    try {
      const payload = JSON.parse(jsonInput);
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await api.post(`/predict/${selectedModelName}`, payload, {
        headers: {
          'X-API-Key': manualApiKey
        }
      });
      
      setResult(response.data);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError("Invalid JSON format");
      } else {
        setError(err.response?.data?.detail || err.message || "Prediction failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Playground</h1>
        <p className="text-sm text-gray-500 mt-1">Test your deployed models directly from the browser</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Input */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Model</label>
                <select
                  value={selectedModelName}
                  onChange={(e) => setSelectedModelName(e.target.value)}
                  className="w-full border border-border rounded-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">-- Choose a model --</option>
                  {models.map(m => (
                    <option key={m.id} value={m.name}>{m.name} {m.status !== 'active' ? '(Disabled)' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="password"
                  placeholder="mld_..."
                  value={manualApiKey}
                  onChange={(e) => setManualApiKey(e.target.value)}
                  className="w-full border border-border rounded-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <p className="text-xs text-gray-500 mt-1">Required to authenticate the prediction request</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">JSON Payload</label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full h-64 border border-border rounded-input px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50"
                  spellCheck={false}
                />
              </div>

              <Button 
                variant="primary" 
                className="w-full"
                onClick={handlePredict}
                disabled={loading || !selectedModelName || !manualApiKey}
              >
                {loading ? <Spinner className="text-white w-5 h-5 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                Run Prediction
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Output */}
        <div className="space-y-6">
          <Card className="p-6 min-h-[400px] flex flex-col">
            <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-gray-500" />
              Response
            </h3>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-card text-sm flex items-start border border-red-100 mb-4">
                <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-900">Request Failed</p>
                  <pre className="mt-1 whitespace-pre-wrap font-mono text-xs">
                    {typeof error === 'object' ? JSON.stringify(error, null, 2) : error}
                  </pre>
                </div>
              </div>
            )}

            {result ? (
              <div className="flex-1 flex flex-col">
                <div className="mb-4 flex items-center justify-between bg-green-50 text-green-700 px-3 py-2 rounded-btn border border-green-100">
                  <span className="text-sm font-medium">Status: 200 OK</span>
                  <span className="text-sm font-mono">{result.latency_ms} ms</span>
                </div>
                <div className="flex-1">
                  <CodeBlock 
                    code={JSON.stringify(result, null, 2)} 
                    className="h-full"
                  />
                </div>
              </div>
            ) : !error ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <Activity className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">Run a prediction to see the response here</p>
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Playground;
