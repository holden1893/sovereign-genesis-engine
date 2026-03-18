import { useEffect, useState } from 'react';
import { TrendingUp, Activity, Target, Zap, RotateCcw, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface TrainingIteration {
  iteration: number;
  avg_score: number;
  num_games: number;
  asset_diversity: number;
  scene_complexity: number;
  mechanics_score: number;
}

const trainingHistory: TrainingIteration[] = [
  {
    iteration: 1,
    avg_score: 0.808,
    num_games: 5,
    asset_diversity: 0.82,
    scene_complexity: 0.78,
    mechanics_score: 0.83
  },
  {
    iteration: 2,
    avg_score: 0.838,
    num_games: 5,
    asset_diversity: 0.85,
    scene_complexity: 0.81,
    mechanics_score: 0.86
  },
  {
    iteration: 3,
    avg_score: 0.838,
    num_games: 5,
    asset_diversity: 0.85,
    scene_complexity: 0.82,
    mechanics_score: 0.84
  }
];

export function TrainingMetrics() {
  const [isTraining, setIsTraining] = useState(false);
  const [currentIteration, setCurrentIteration] = useState(3);
  const [progress, setProgress] = useState(0);
  const [animatedScores, setAnimatedScores] = useState<number[]>([]);

  useEffect(() => {
    // Animate scores on mount
    const timer = setTimeout(() => {
      setAnimatedScores(trainingHistory.map(t => t.avg_score * 100));
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleStartTraining = async () => {
    setIsTraining(true);
    setProgress(0);

    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setCurrentIteration(prev => prev + 1);
    setIsTraining(false);
    setProgress(0);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.85) return 'text-green-400';
    if (score >= 0.80) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <section id="training" className="py-20 px-4 bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Self-Evolution Training
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            The system continuously improves through self-play, generating games and learning from quality metrics
          </p>
        </div>

        {/* Training Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{currentIteration}</div>
                  <div className="text-sm text-slate-400">Iterations</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">15</div>
                  <div className="text-sm text-slate-400">Self-Play Games</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">83.8%</div>
                  <div className="text-sm text-slate-400">Avg Quality Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Training History */}
        <Card className="bg-slate-900/50 border-slate-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Training History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {trainingHistory.map((iteration, index) => (
                <div key={iteration.iteration} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-mono">
                        Iteration {iteration.iteration}
                      </span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-400 text-sm">
                        {iteration.num_games} games
                      </span>
                    </div>
                    <div className={`text-lg font-bold ${getScoreColor(iteration.avg_score)}`}>
                      {(animatedScores[index] || 0).toFixed(1)}%
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Asset Diversity</span>
                        <span className="text-slate-300">{(iteration.asset_diversity * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={iteration.asset_diversity * 100} className="h-1.5" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Scene Complexity</span>
                        <span className="text-slate-300">{(iteration.scene_complexity * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={iteration.scene_complexity * 100} className="h-1.5" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Mechanics</span>
                        <span className="text-slate-300">{(iteration.mechanics_score * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={iteration.mechanics_score * 100} className="h-1.5" />
                    </div>
                  </div>

                  {index < trainingHistory.length - 1 && (
                    <div className="border-b border-slate-800" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quality Metrics Breakdown */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Asset Diversity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">85%</div>
              <p className="text-slate-400 text-sm">
                Variety of asset types generated per game (characters, props, weapons, etc.)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Scene Complexity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">82%</div>
              <p className="text-slate-400 text-sm">
                Level of detail in scene composition, lighting, and physics configuration
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-green-400" />
                Mechanics Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">84%</div>
              <p className="text-slate-400 text-sm">
                Appropriateness of gameplay mechanics for the selected genre
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Training Control */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-semibold mb-1">Continue Training</h4>
                <p className="text-slate-400 text-sm">
                  Run another self-play iteration to improve generation quality
                </p>
              </div>
              <Button
                onClick={handleStartTraining}
                disabled={isTraining}
                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
              >
                {isTraining ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Training... {progress}%
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Iteration {currentIteration + 1}
                  </>
                )}
              </Button>
            </div>
            
            {isTraining && (
              <div className="mt-4">
                <Progress value={progress} className="h-2" />
                <div className="mt-2 text-sm text-slate-400">
                  Generating self-play games and computing quality metrics...
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
