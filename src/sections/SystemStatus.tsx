import { useEffect, useState } from 'react';
import { Activity, Box, Layers, Brain, TrendingUp, Zap, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface SystemStatus {
  total_params: string;
  games_generated: number;
  assets_created: number;
  scenes_composed: number;
  training_iterations: number;
  avg_quality_score: number;
}

const initialStatus: SystemStatus = {
  total_params: '133.6M',
  games_generated: 0,
  assets_created: 0,
  scenes_composed: 0,
  training_iterations: 3,
  avg_quality_score: 0.838
};

export function SystemStatusSection() {
  const [status, setStatus] = useState<SystemStatus>(initialStatus);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    // Load games from localStorage to calculate stats
    try {
      const stored = localStorage.getItem('neuroforge_games');
      if (stored) {
        const games = JSON.parse(stored);
        let totalAssets = 0;
        let totalScenes = 0;
        
        for (const game of games) {
          totalAssets += game.assets?.length || 0;
          totalScenes += game.scenes?.length || 0;
        }
        
        setStatus(prev => ({
          ...prev,
          games_generated: games.length,
          assets_created: totalAssets,
          scenes_composed: totalScenes
        }));
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }

    // Animate the quality score
    const timer = setTimeout(() => {
      setAnimatedScore(initialStatus.avg_quality_score * 100);
    }, 500);

    // Check backend
    checkBackend();

    return () => clearTimeout(timer);
  }, []);

  const checkBackend = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${API_URL}/api/status`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      setBackendAvailable(response.ok);
    } catch {
      setBackendAvailable(false);
    }
  };

  const stats = [
    {
      icon: Brain,
      label: 'Model Parameters',
      value: status.total_params,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      icon: Activity,
      label: 'Games Generated',
      value: status.games_generated.toString(),
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10'
    },
    {
      icon: Box,
      label: '3D Assets Created',
      value: status.assets_created.toString(),
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      icon: Layers,
      label: 'Scenes Composed',
      value: status.scenes_composed.toString(),
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10'
    }
  ];

  const architecture = [
    { name: 'VQ-VAE Tokenizer', params: '12.5M', percent: 9 },
    { name: 'Latent Action Model', params: '8.3M', percent: 6 },
    { name: 'ST-Transformer', params: '45.2M', percent: 34 },
    { name: 'Semantic Encoder', params: '15.8M', percent: 12 },
    { name: 'Asset Generator', params: '28.4M', percent: 21 },
    { name: 'Scene Generator', params: '18.2M', percent: 14 },
    { name: 'Logic Generator', params: '5.2M', percent: 4 }
  ];

  return (
    <section id="status" className="py-20 px-4 bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            System Status
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Real-time overview of the NeuroForge Game Agency architecture and performance metrics
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <Badge className={backendAvailable ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}>
              {backendAvailable === null ? (
                'Checking...'
              ) : backendAvailable ? (
                <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> Backend Connected</span>
              ) : (
                <span className="flex items-center gap-1"><WifiOff className="w-3 h-3" /> Client-Side Mode</span>
              )}
            </Badge>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center mb-4`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Architecture Breakdown */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Model Architecture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {architecture.map((component, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">{component.name}</span>
                    <span className="text-slate-400">{component.params}</span>
                  </div>
                  <Progress value={component.percent} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quality Score */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Training Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400 mb-2">
                  {animatedScore.toFixed(1)}%
                </div>
                <div className="text-slate-400">Average Quality Score</div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-slate-300">Training Iterations</span>
                  <span className="text-white font-semibold">{status.training_iterations}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-slate-300">Self-Play Games</span>
                  <span className="text-white font-semibold">15</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-slate-300">Status</span>
                  <span className="text-green-400 font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Operational
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
