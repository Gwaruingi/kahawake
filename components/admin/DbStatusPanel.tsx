import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CheckCircleIcon, XCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface DbStatus {
  connectionState: string;
  lastConnected: string | null;
  lastDisconnected: string | null;
  reconnectAttempts: number;
  errors: Array<{
    timestamp: string;
    message: string;
  }>;
  isHealthy: boolean;
  currentHealth: boolean;
  environment: string;
  timestamp: string;
}

const DbStatusPanel: React.FC = () => {
  const { data: session } = useSession();
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDbStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/system/db-status');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch database status: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDbStatus(data.data);
    } catch (err: any) {
      console.error('Error fetching database status:', err);
      setError(err.message || 'Failed to fetch database status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchDbStatus();
      
      // Set up polling every 30 seconds
      const intervalId = setInterval(fetchDbStatus, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [session]);

  if (!session || session.user.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Database Status</h2>
        <div className="flex items-center justify-center py-4">
          <ArrowPathIcon className="h-6 w-6 text-blue-500 animate-spin" />
          <span className="ml-2">Loading database status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Database Status</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error fetching database status</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={fetchDbStatus}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dbStatus) {
    return (
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Database Status</h2>
        <p>No database status information available.</p>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'disconnected':
        return 'text-red-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'connected':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'connecting':
        return <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />;
      case 'disconnected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ExclamationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Database Status</h2>
        <button
          onClick={fetchDbStatus}
          className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <ArrowPathIcon className="h-3 w-3 mr-1" />
          Refresh
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="border rounded-md p-3">
          <div className="flex items-center mb-2">
            {getStatusIcon(dbStatus.connectionState)}
            <span className={`ml-2 font-medium ${getStatusColor(dbStatus.connectionState)}`}>
              {dbStatus.connectionState.charAt(0).toUpperCase() + dbStatus.connectionState.slice(1)}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            <p>Environment: <span className="font-medium">{dbStatus.environment}</span></p>
            <p>Current Health Check: <span className={`font-medium ${dbStatus.currentHealth ? 'text-green-500' : 'text-red-500'}`}>
              {dbStatus.currentHealth ? 'Passed' : 'Failed'}
            </span></p>
            <p>Last Connected: <span className="font-medium">{formatDate(dbStatus.lastConnected)}</span></p>
            <p>Last Disconnected: <span className="font-medium">{formatDate(dbStatus.lastDisconnected)}</span></p>
            <p>Reconnect Attempts: <span className="font-medium">{dbStatus.reconnectAttempts}</span></p>
          </div>
        </div>
        
        <div className="border rounded-md p-3">
          <h3 className="font-medium mb-2">Recent Errors</h3>
          {dbStatus.errors && dbStatus.errors.length > 0 ? (
            <div className="max-h-32 overflow-y-auto">
              {dbStatus.errors.map((err, index) => (
                <div key={index} className="text-sm mb-2 pb-2 border-b border-gray-100 last:border-b-0">
                  <p className="text-xs text-gray-500">{formatDate(err.timestamp)}</p>
                  <p className="text-red-600">{err.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No recent errors</p>
          )}
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        Last updated: {formatDate(dbStatus.timestamp)}
      </div>
    </div>
  );
};

export default DbStatusPanel;
