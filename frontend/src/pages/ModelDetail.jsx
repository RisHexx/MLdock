import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchModel, clearCurrentModel } from '../store/slices/modelsSlice';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import CodeBlock from '../components/ui/CodeBlock';
import { ArrowLeft, Box } from 'lucide-react';

const ModelDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentModel: model, status } = useSelector((state) => state.models);

  useEffect(() => {
    dispatch(fetchModel(id));
    return () => {
      dispatch(clearCurrentModel());
    };
  }, [dispatch, id]);

  if (status === 'loading' || !model) {
    return <div className="flex justify-center p-12"><Spinner /></div>;
  }

  const endpointUrl = `${window.location.origin}/api/predict/${model.name}`;

  // Generate example JSON from schema
  const exampleInput = {};
  Object.entries(model.input_schema).forEach(([key, type]) => {
    exampleInput[key] = type === 'integer' ? 2018 : 
                        type === 'float' ? 1.5 : 
                        type === 'boolean' ? true : 
                        "example_string";
  });

  const exampleResponse = {
    model: model.name,
    prediction: Object.keys(model.output_schema).reduce((acc, key) => {
      acc[key] = model.output_schema[key] === 'float' ? 25400.5 : 1;
      return acc;
    }, {}),
    latency_ms: 42.5
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <button 
        onClick={() => navigate('/models')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Registry
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Box className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-semibold text-gray-900">{model.display_name}</h1>
            <Badge variant={model.status === 'active' ? 'green' : 'gray'} className="ml-2">
              {model.status}
            </Badge>
          </div>
          <p className="text-gray-500 max-w-2xl">{model.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* API Documentation */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">API Documentation</h2>
            
            <Card className="overflow-hidden mb-6">
              <div className="p-4 border-b border-border bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3 font-mono text-sm">
                  <span className="font-bold text-green-600">POST</span>
                  <span className="text-gray-700 break-all">{endpointUrl}</span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-4">
                  Send a POST request with your API key in the <code className="bg-gray-100 px-1 rounded">X-API-Key</code> header.
                </p>
                <CodeBlock 
                  language="bash"
                  code={`curl -X POST ${endpointUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: mld_your_api_key_here" \\
  -d '${JSON.stringify({ input: exampleInput }, null, 2)}'`}
                />
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Example Request</h3>
                <CodeBlock code={JSON.stringify({ input: exampleInput }, null, 2)} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Example Response</h3>
                <CodeBlock code={JSON.stringify(exampleResponse, null, 2)} />
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Model Information</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs text-gray-500 mb-1">Model Name (ID)</dt>
                <dd className="text-sm font-medium text-gray-900">{model.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 mb-1">Framework</dt>
                <dd className="text-sm font-medium text-gray-900 capitalize">{model.framework}</dd>
              </div>
              {model.version && (
                <div>
                  <dt className="text-xs text-gray-500 mb-1">Version</dt>
                  <dd className="text-sm font-medium text-gray-900">{model.version}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-gray-500 mb-1">Deployed</dt>
                <dd className="text-sm font-medium text-gray-900">{new Date(model.created_at).toLocaleString()}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Input Schema</h3>
            <ul className="space-y-2">
              {Object.entries(model.input_schema).map(([key, type]) => (
                <li key={key} className="flex justify-between items-center text-sm">
                  <span className="font-mono text-gray-700">{key}</span>
                  <Badge variant="gray">{type}</Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Output Schema</h3>
            <ul className="space-y-2">
              {Object.entries(model.output_schema).map(([key, type]) => (
                <li key={key} className="flex justify-between items-center text-sm">
                  <span className="font-mono text-gray-700">{key}</span>
                  <Badge variant="blue">{type}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ModelDetail;
