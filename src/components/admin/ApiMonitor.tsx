import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Database,
  Server,
  Globe,
  Loader2
} from 'lucide-react';
import { useApiMonitor } from '@/hooks/useApiMonitor';
import type { ApiStatus } from '@/hooks/useApiMonitor';

const ApiMonitor: React.FC = () => {
  const { apiStatuses, checkAllApis, overallStatus, averageResponseTime, lastUpdated } = useApiMonitor();

  const getStatusIcon = (status: ApiStatus['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'checking':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getStatusBadge = (status: ApiStatus['status']) => {
    switch (status) {
      case 'online':
        return <Badge variant="default" className="bg-green-500">Online</Badge>;
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>;
      case 'error':
        return <Badge variant="secondary" className="bg-yellow-500">Error</Badge>;
      case 'checking':
        return <Badge variant="outline">Checking...</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getServiceIcon = (serviceName: string) => {
    if (serviceName.includes('Supabase')) {
      return <Database className="w-5 h-5 text-emerald-500" />;
    } else if (serviceName.includes('Backend') || serviceName.includes('Quran')) {
      return <Server className="w-5 h-5 text-blue-600" />;
    } else {
      return <Globe className="w-5 h-5 text-purple-600" />;
    }
  };

  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case 'healthy':
        return 'text-green-500 bg-green-600/10 border-green-500/30';
      case 'warning':
        return 'text-yellow-500 bg-yellow-600/10 border-yellow-500/30';
      case 'critical':
        return 'text-red-500 bg-red-600/10 border-red-500/30';
      default:
        return 'text-zinc-400 bg-zinc-600/10 border-zinc-500/30';
    }
  };

  const formatLastChecked = (date: Date | null) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Overall Status Card */}
      <Card className={`border-2 ${getOverallStatusColor()}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="w-5 h-5" />
              Status Sistem API
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={checkAllApis}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {apiStatuses.filter(api => api.status === 'online').length}/
                {apiStatuses.length}
              </div>
              <p className="text-sm text-muted-foreground">Services Online</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {averageResponseTime ? `${averageResponseTime}ms` : 'N/A'}
              </div>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold capitalize">
                {overallStatus}
              </div>
              <p className="text-sm text-muted-foreground">Overall Status</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual API Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {apiStatuses.map((api, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getServiceIcon(api.name)}
                  <CardTitle className="text-base">{api.name}</CardTitle>
                </div>
                {getStatusIcon(api.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  {getStatusBadge(api.status)}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">URL:</span>
                  <span className="text-sm font-mono text-right truncate max-w-[200px]" title={api.url}>
                    {api.url}
                  </span>
                </div>

                {api.responseTime !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Response Time:</span>
                    <span className="text-sm font-semibold">
                      {api.responseTime}ms
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Checked:</span>
                  <span className="text-sm">
                    {formatLastChecked(api.lastChecked)}
                  </span>
                </div>

                {api.errorMessage && (
                  <div className="mt-2 p-2 bg-red-600/10 border border-red-500/30 rounded">
                    <p className="text-xs text-red-400">
                      <strong>Error:</strong> {api.errorMessage}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Monitoring diperbarui setiap 5 menit • Last Update: {' '}
          {new Intl.DateTimeFormat('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }).format(lastUpdated)}
        </p>
      </div>
    </div>
  );
};

export default ApiMonitor; 