import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchModels, deleteModel, toggleModelStatus } from '../store/slices/modelsSlice';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import Dialog from '../components/ui/Dialog';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';
import { Plus, Database, MoreVertical, Trash2, Power, PowerOff } from 'lucide-react';

const Models = () => {
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.models);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);

  useEffect(() => {
    dispatch(fetchModels());
  }, [dispatch]);

  const handleDelete = () => {
    if (deleteConfirmId) {
      dispatch(deleteModel(deleteConfirmId));
      setDeleteConfirmId(null);
      setActionMenuId(null);
    }
  };

  const handleToggle = (model) => {
    dispatch(toggleModelStatus({ 
      id: model.id, 
      status: model.status === 'active' ? 'inactive' : 'active' 
    }));
    setActionMenuId(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Model Registry</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your deployed models</p>
        </div>
        <Link to="/models/upload">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Deploy Model
          </Button>
        </Link>
      </div>

      {status === 'loading' ? (
        <div className="flex justify-center p-12">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState 
          icon={Database}
          title="No models deployed"
          description="Get started by deploying your first machine learning model to MlDock."
          actionText="Deploy Model"
          onAction={() => window.location.href = '/models/upload'}
        />
      ) : (
        <Card>
          <Table containerClassName="overflow-visible">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Framework</Th>
                <Th>Status</Th>
                <Th>Deployed</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((model) => (
                <Tr key={model.id} className="hover:bg-gray-50 transition-colors group">
                  <Td>
                    <Link to={`/models/${model.id}`} className="block">
                      <div className="font-medium text-gray-900">{model.display_name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{model.name}</div>
                    </Link>
                  </Td>
                  <Td>
                    <Badge variant="gray">{model.framework}</Badge>
                    {model.version && <span className="text-xs text-gray-500 ml-2">v{model.version}</span>}
                  </Td>
                  <Td>
                    <Badge variant={model.status === 'active' ? 'green' : 'gray'}>
                      {model.status}
                    </Badge>
                  </Td>
                  <Td className="text-gray-500">
                    {new Date(model.created_at).toLocaleDateString()}
                  </Td>
                  <Td className="text-right">
                    <div className="relative inline-block text-left">
                      <button 
                        onClick={() => setActionMenuId(actionMenuId === model.id ? null : model.id)}
                        className="p-2 rounded-btn hover:bg-gray-200 text-gray-500 focus:outline-none"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {actionMenuId === model.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setActionMenuId(null)}
                          />
                          <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-card shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 focus:outline-none py-1">
                            <Link
                              to={`/models/${model.id}`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              View Details
                            </Link>
                            <button
                              onClick={() => handleToggle(model)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              {model.status === 'active' ? (
                                <><PowerOff className="w-4 h-4 mr-2" /> Disable API</>
                              ) : (
                                <><Power className="w-4 h-4 mr-2" /> Enable API</>
                              )}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(model.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      <Dialog 
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Model"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete Model</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete this model? This action cannot be undone and will permanently remove the model file and its API endpoint.
        </p>
      </Dialog>
    </div>
  );
};

export default Models;
