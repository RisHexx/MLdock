import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchApiKeys, generateApiKey, revokeApiKey, clearNewKey } from '../store/slices/apiKeysSlice';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import Dialog from '../components/ui/Dialog';
import CodeBlock from '../components/ui/CodeBlock';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';
import { Plus, Key, Trash2, AlertCircle } from 'lucide-react';

const ApiKeys = () => {
  const dispatch = useDispatch();
  const { items, status, newKey } = useSelector((state) => state.apiKeys);
  
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [revokeConfirmId, setRevokeConfirmId] = useState(null);

  useEffect(() => {
    dispatch(fetchApiKeys());
  }, [dispatch]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (newKeyName.trim()) {
      await dispatch(generateApiKey(newKeyName.trim()));
      setIsGenerateOpen(false);
      setNewKeyName('');
    }
  };

  const handleRevoke = () => {
    if (revokeConfirmId) {
      dispatch(revokeApiKey(revokeConfirmId));
      setRevokeConfirmId(null);
    }
  };

  const handleCloseNewKey = () => {
    dispatch(clearNewKey());
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">API Keys</h1>
          <p className="text-sm text-gray-500 mt-1">Manage API keys to authenticate applications</p>
        </div>
        <Button variant="primary" onClick={() => setIsGenerateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Generate Key
        </Button>
      </div>

      {status === 'loading' ? (
        <div className="flex justify-center p-12">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState 
          icon={Key}
          title="No API keys"
          description="Generate an API key to securely access your deployed models from external applications."
          actionText="Generate Key"
          onAction={() => setIsGenerateOpen(true)}
        />
      ) : (
        <Card>
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Prefix</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((key) => (
                <Tr key={key.id} className="hover:bg-gray-50 transition-colors">
                  <Td className="font-medium text-gray-900">{key.name}</Td>
                  <Td className="font-mono text-gray-500 text-xs">{key.key_prefix}••••••••</Td>
                  <Td>
                    <Badge variant={key.is_active ? 'green' : 'red'}>
                      {key.is_active ? 'Active' : 'Revoked'}
                    </Badge>
                  </Td>
                  <Td className="text-gray-500">
                    {new Date(key.created_at).toLocaleDateString()}
                  </Td>
                  <Td className="text-right">
                    <button
                      onClick={() => setRevokeConfirmId(key.id)}
                      className="text-red-600 hover:text-red-800 p-2 rounded-btn hover:bg-red-50 focus:outline-none transition-colors"
                      title="Revoke Key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* Generate Key Dialog */}
      <Dialog
        isOpen={isGenerateOpen}
        onClose={() => {
          setIsGenerateOpen(false);
          setNewKeyName('');
        }}
        title="Generate New API Key"
      >
        <form id="generate-form" onSubmit={handleGenerate} className="space-y-4">
          <Input
            label="Key Name"
            placeholder="e.g. Production Web App"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            required
            maxLength={100}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsGenerateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!newKeyName.trim()}>
              Generate
            </Button>
          </div>
        </form>
      </Dialog>

      {/* New Key Result Dialog */}
      <Dialog
        isOpen={!!newKey}
        onClose={handleCloseNewKey}
        title="API Key Generated"
        footer={
          <Button variant="primary" onClick={handleCloseNewKey}>
            I have copied the key
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-card text-sm flex items-start border border-yellow-200">
            <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-yellow-900">Please copy this key now.</p>
              <p className="mt-1">For your security, it will never be shown again.</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Your new API key:</p>
            <CodeBlock code={newKey?.key || ''} language="text" />
          </div>
        </div>
      </Dialog>

      {/* Revoke Confirm Dialog */}
      <Dialog
        isOpen={!!revokeConfirmId}
        onClose={() => setRevokeConfirmId(null)}
        title="Revoke API Key"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRevokeConfirmId(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleRevoke}>Revoke Key</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to revoke this API key? Applications using this key will immediately lose access to your deployed models.
        </p>
      </Dialog>
    </div>
  );
};

export default ApiKeys;
