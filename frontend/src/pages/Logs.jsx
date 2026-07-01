import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLogs } from '../store/slices/logsSlice';
import { fetchModels } from '../store/slices/modelsSlice';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';
import { Settings } from 'lucide-react';

const Logs = () => {
  const dispatch = useDispatch();
  const { items: logs, status, total } = useSelector((state) => state.logs);
  const { items: models } = useSelector((state) => state.models);
  
  const [selectedModel, setSelectedModel] = useState('');
  const [page, setPage] = useState(1);
  const limit = 50;

  useEffect(() => {
    dispatch(fetchModels());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchLogs({ page, limit, model_name: selectedModel || null }));
  }, [dispatch, page, selectedModel]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Request Logs</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor prediction requests and latency</p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Filter by Model:</label>
          <select
            value={selectedModel}
            onChange={(e) => {
              setSelectedModel(e.target.value);
              setPage(1);
            }}
            className="border border-border rounded-input px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">All Models</option>
            {models.map(m => (
              <option key={m.id} value={m.name}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {status === 'loading' && logs.length === 0 ? (
        <div className="flex justify-center p-12"><Spinner /></div>
      ) : logs.length === 0 ? (
        <EmptyState 
          icon={Settings}
          title="No logs found"
          description={selectedModel ? `No requests have been made to ${selectedModel} yet.` : "No prediction requests have been made yet."}
        />
      ) : (
        <Card>
          <Table>
            <Thead>
              <Tr>
                <Th>Timestamp</Th>
                <Th>Model</Th>
                <Th>Status</Th>
                <Th className="text-right">Latency</Th>
              </Tr>
            </Thead>
            <Tbody>
              {logs.map((log) => (
                <Tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <Td className="text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </Td>
                  <Td className="font-medium text-gray-900">
                    {log.model_name}
                  </Td>
                  <Td>
                    <Badge variant={log.status_code === 200 ? 'green' : 'red'}>
                      {log.status_code}
                    </Badge>
                  </Td>
                  <Td className="text-right font-mono text-gray-600">
                    {log.latency_ms} ms
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 border border-border rounded-btn text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 border border-border rounded-btn text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default Logs;
