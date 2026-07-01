import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats } from '../store/slices/dashboardSlice';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import { Database, Key, Activity, MemoryStick, Box } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <Card className="p-6 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  </Card>
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const { stats, status, error } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-card border border-red-100">
        Error loading dashboard: {error}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your model serving infrastructure</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total Models" 
          value={stats.total_models} 
          icon={Database} 
          colorClass="bg-blue-100 text-blue-600" 
        />
        <StatCard 
          title="Active Models" 
          value={stats.active_models} 
          icon={Box} 
          colorClass="bg-green-100 text-green-600" 
        />
        <StatCard 
          title="Loaded in Memory" 
          value={stats.loaded_models} 
          icon={MemoryStick} 
          colorClass="bg-purple-100 text-purple-600" 
        />
        <StatCard 
          title="Total API Keys" 
          value={stats.total_api_keys} 
          icon={Key} 
          colorClass="bg-yellow-100 text-yellow-600" 
        />
        <StatCard 
          title="Total Predictions" 
          value={stats.total_predictions} 
          icon={Activity} 
          colorClass="bg-indigo-100 text-indigo-600" 
        />
        <StatCard 
          title="Memory Usage" 
          value={`${stats.memory_usage_mb} MB`} 
          icon={MemoryStick} 
          colorClass="bg-gray-100 text-gray-600" 
        />
      </div>
    </div>
  );
};

export default Dashboard;
