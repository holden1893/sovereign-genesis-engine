import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Check, Download, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { generateGame, downloadGame } from '@/lib/gameGenerator';
import type { GamePackage, GameSpec } from '@/types/game';

const genres = [
  { value: 'fps', label: 'First-Person Shooter (FPS)' },
  { value: 'rpg', label: 'Role-Playing Game (RPG)' },
  { value: 'platformer', label: 'Platformer' },
  { value: 'survival', label: 'Survival' },
  { value: 'racing', label: 'Racing' },
  { value: 'puzzle', label: 'Puzzle' },
];

const styles = [
  { value: 'realistic', label: 'Realistic' },
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'pixel', label: 'Pixel Art' },
  { value: 'lowpoly', label: 'Low Poly' },
  { value: 'stylized', label: 'Stylized' },
];

const settings = [
  { value: 'sci-fi', label: 'Sci-Fi' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'modern', label: 'Modern' },
  { value: 'post-apocalyptic', label: 'Post-Apocalyptic' },
  { value: 'historical', label: 'Historical' },
];

const platforms = [
  { value: 'pc', label: 'PC (Windows/Mac/Linux)' },
  { value: 'console', label: 'Console (PS5/Xbox)' },
  { value: 'mobile', label: 'Mobile (iOS/Android)' },
  { value: 'web', label: 'Web (Browser)' },
];

const complexities = [
  { value: 'simple', label: 'Simple (1 level, ~10 min)' },
  { value: 'medium', label: 'Medium (1-3 levels, ~30 min)' },
  { value: 'complex', label: 'Complex (3+ levels, 1+ hours)' },
];

export function GameGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [generatedGame, setGeneratedGame] = useState<GamePackage | null>(null);
  const [error, setError] = useState('');
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    style: '',
    setting: '',
    target_platform: '',
    complexity: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Check backend availability on mount
  useEffect(() => {
    checkBackend();
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

  const handleGenerate = async () => {
    if (!formData.title || !formData.genre || !formData.style || !formData.setting || !formData.target_platform) {
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setGeneratedGame(null);
    setError('');

    const spec: GameSpec = {
      ...formData,
      player_count: 1
    };

    // Animate progress
    const steps = [
      { name: 'Analyzing specifications...', progress: 10 },
      { name: 'Generating game design document...', progress: 25 },
      { name: 'Creating 3D assets (meshes, textures)...', progress: 50 },
      { name: 'Composing game scenes...', progress: 70 },
      { name: 'Generating gameplay logic...', progress: 85 },
      { name: 'Building export package...', progress: 95 },
      { name: 'Finalizing...', progress: 100 }
    ];

    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        setCurrentStep(steps[stepIndex].name);
        setProgress(steps[stepIndex].progress);
        stepIndex++;
      }
    }, 400);

    try {
      let game: GamePackage;

      // Try backend first if available
      if (backendAvailable) {
        try {
          const response = await fetch(`${API_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(spec)
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              game = data.game;
            } else {
              throw new Error(data.error || 'Backend generation failed');
            }
          } else {
            throw new Error('Backend request failed');
          }
        } catch (err) {
          // Fallback to client-side generation
          console.log('Backend failed, using client-side generation');
          game = generateGame(spec);
        }
      } else {
        // Use client-side generation directly
        game = generateGame(spec);
      }

      // Save to localStorage
      try {
        const existing = localStorage.getItem('neuroforge_games');
        const games = existing ? JSON.parse(existing) : [];
        games.unshift(game);
        localStorage.setItem('neuroforge_games', JSON.stringify(games));
      } catch (err) {
        console.error('Failed to save game:', err);
      }

      clearInterval(stepInterval);
      setProgress(100);
      setCurrentStep('Complete!');
      setGeneratedGame(game);
    } catch (err) {
      clearInterval(stepInterval);
      setError('Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedGame) {
      downloadGame(generatedGame);
    }
  };

  return (
    <section id="generate" className="py-20 px-4 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Generate a New Game
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Configure your game specifications and let the AI generate a complete 3D game with assets, scenes, and gameplay logic
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <Badge className={backendAvailable ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}>
              {backendAvailable === null ? (
                <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Checking...</span>
              ) : backendAvailable ? (
                <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> Backend Connected</span>
              ) : (
                <span className="flex items-center gap-1"><WifiOff className="w-3 h-3" /> Client-Side Mode</span>
              )}
            </Badge>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-500/10 border-red-500/30">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Game Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-300">Game Title</Label>
              <Input
                id="title"
                placeholder="Enter your game title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                disabled={isGenerating}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Genre</Label>
                <Select 
                  onValueChange={(value) => setFormData({ ...formData, genre: value })}
                  disabled={isGenerating}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {genres.map((g) => (
                      <SelectItem key={g.value} value={g.value} className="text-white">
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Art Style</Label>
                <Select 
                  onValueChange={(value) => setFormData({ ...formData, style: value })}
                  disabled={isGenerating}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {styles.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-white">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Setting</Label>
                <Select 
                  onValueChange={(value) => setFormData({ ...formData, setting: value })}
                  disabled={isGenerating}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select setting" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {settings.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-white">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Target Platform</Label>
                <Select 
                  onValueChange={(value) => setFormData({ ...formData, target_platform: value })}
                  disabled={isGenerating}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {platforms.map((p) => (
                      <SelectItem key={p.value} value={p.value} className="text-white">
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Complexity</Label>
              <Select 
                onValueChange={(value) => setFormData({ ...formData, complexity: value })}
                disabled={isGenerating}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select complexity" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {complexities.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="text-white">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isGenerating && (
              <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                  <span className="text-slate-300">{currentStep}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="text-right text-sm text-slate-400">{Math.round(progress)}%</div>
              </div>
            )}

            {generatedGame && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg space-y-4">
                <div className="flex items-center gap-2 text-green-400">
                  <Check className="w-5 h-5" />
                  <span className="font-semibold">Game Generated Successfully!</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-slate-400">Core Mechanics:</span>
                    <div className="text-white">{generatedGame.design.core_mechanics.slice(0, 3).join(', ')}...</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400">Assets Created:</span>
                    <div className="text-white">{generatedGame.assets.length} 3D models</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400">Scenes:</span>
                    <div className="text-white">{generatedGame.scenes.length} level(s)</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400">Export Format:</span>
                    <div className="text-white">{generatedGame.export_config.format}</div>
                  </div>
                </div>

                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Game Package
                </Button>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !formData.title || !formData.genre || !formData.style || !formData.setting || !formData.target_platform}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Game
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
