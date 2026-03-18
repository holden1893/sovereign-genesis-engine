import { useState, useEffect } from 'react';
import { Gamepad2, Box, Layers, Download, Cpu, Target, Mountain, Car, Puzzle, RefreshCw, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { downloadGame, convertToOBJ } from '@/lib/gameGenerator';
import type { GamePackage } from '@/types/game';

interface GameSummary {
  id: string;
  title: string;
  genre: string;
  setting: string;
  platform: string;
  style: string;
  complexity: string;
  assets: number;
  scenes: number;
  generated_at: string;
}

const genreIcons: Record<string, any> = {
  fps: Target,
  rpg: Cpu,
  platformer: Gamepad2,
  survival: Mountain,
  racing: Car,
  puzzle: Puzzle
};

const genreLabels: Record<string, string> = {
  fps: 'FPS',
  rpg: 'RPG',
  platformer: 'Platformer',
  survival: 'Survival',
  racing: 'Racing',
  puzzle: 'Puzzle'
};

const settingLabels: Record<string, string> = {
  'sci-fi': 'Sci-Fi',
  fantasy: 'Fantasy',
  modern: 'Modern',
  'post-apocalyptic': 'Post-Apocalyptic',
  historical: 'Historical'
};

const platformLabels: Record<string, string> = {
  pc: 'PC',
  console: 'Console',
  mobile: 'Mobile',
  web: 'Web'
};

const STORAGE_KEY = 'neuroforge_games';

export function GameGallery() {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [selectedGame, setSelectedGame] = useState<GamePackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendGames, setBackendGames] = useState<GameSummary[]>([]);
  const [backendAvailable, setBackendAvailable] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    loadGames();
    checkBackend();
  }, []);

  const loadGames = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setGames(parsed.map((g: GamePackage) => ({
          id: g.id,
          title: g.spec.title,
          genre: g.spec.genre,
          setting: g.spec.setting,
          platform: g.spec.target_platform,
          style: g.spec.style,
          complexity: g.spec.complexity,
          assets: g.assets.length,
          scenes: g.scenes.length,
          generated_at: g.generated_at
        })));
      }
    } catch (err) {
      console.error('Failed to load games:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkBackend = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${API_URL}/api/games`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setBackendGames(data.games || []);
        setBackendAvailable(true);
      }
    } catch {
      setBackendAvailable(false);
    }
  };

  const getGameDetails = (id: string): GamePackage | null => {
    // First check localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const games: GamePackage[] = JSON.parse(stored);
        const game = games.find(g => g.id === id);
        if (game) return game;
      }
    } catch (err) {
      console.error('Failed to get game from storage:', err);
    }
    return null;
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const games: GamePackage[] = JSON.parse(stored);
        const filtered = games.filter(g => g.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        loadGames();
      }
    } catch (err) {
      console.error('Failed to delete game:', err);
    }
  };

  const handleDownloadFull = (game: GamePackage) => {
    downloadGame(game);
  };

  const handleDownloadOBJ = (game: GamePackage) => {
    // Download all assets as OBJ files in a zip-like manner (JSON for now)
    const objFiles: Record<string, string> = {};
    for (const asset of game.assets) {
      objFiles[`${asset.name}.obj`] = convertToOBJ(asset);
    }
    
    const blob = new Blob([JSON.stringify(objFiles, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${game.spec.title.replace(/\s+/g, '_')}_assets.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getColorForGame = (genre: string) => {
    const colors: Record<string, string> = {
      fps: 'from-purple-500 to-cyan-500',
      rpg: 'from-orange-500 to-red-500',
      platformer: 'from-green-500 to-emerald-500',
      survival: 'from-yellow-600 to-orange-600',
      racing: 'from-blue-500 to-indigo-500',
      puzzle: 'from-pink-500 to-rose-500'
    };
    return colors[genre] || 'from-slate-500 to-slate-600';
  };

  // Combine local and backend games
  const allGames = [...games, ...backendGames.filter(bg => !games.find(g => g.id === bg.id))];

  if (loading) {
    return (
      <section id="gallery" className="py-20 px-4 bg-slate-900">
        <div className="max-w-6xl mx-auto text-center">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading games...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="gallery" className="py-20 px-4 bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Generated Games
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Browse the collection of AI-generated games with complete 3D assets, scenes, and gameplay logic
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <Badge variant="secondary" className="bg-slate-800 text-slate-400">
              {allGames.length} Games
            </Badge>
            {backendAvailable && (
              <Badge className="bg-green-500/20 text-green-400">
                Backend Connected
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { loadGames(); checkBackend(); }}
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {allGames.length === 0 ? (
          <div className="text-center py-12">
            <Gamepad2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">No games generated yet</p>
            <p className="text-slate-500 text-sm">Generate your first game using the form above!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {allGames.map((game) => {
              const GenreIcon = genreIcons[game.genre] || Gamepad2;
              const color = getColorForGame(game.genre);
              const isLocal = games.find(g => g.id === game.id);
              
              return (
                <Dialog key={game.id}>
                  <DialogTrigger asChild>
                    <Card 
                      className="bg-slate-950 border-slate-800 cursor-pointer hover:border-slate-600 transition-all group overflow-hidden relative"
                      onClick={() => setSelectedGame(getGameDetails(game.id))}
                    >
                      <div className={`h-2 bg-gradient-to-r ${color}`} />
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                              <GenreIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-white text-lg group-hover:text-purple-400 transition-colors">
                                {game.title}
                              </CardTitle>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
                                  {genreLabels[game.genre]}
                                </Badge>
                                <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
                                  {settingLabels[game.setting]}
                                </Badge>
                                {isLocal && (
                                  <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                                    Local
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {isLocal && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-500 hover:text-red-400"
                              onClick={(e) => handleDelete(game.id, e)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div className="text-center p-3 bg-slate-900 rounded-lg">
                            <Box className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                            <div className="text-lg font-semibold text-white">{game.assets}</div>
                            <div className="text-xs text-slate-400">Assets</div>
                          </div>
                          <div className="text-center p-3 bg-slate-900 rounded-lg">
                            <Layers className="w-5 h-5 text-green-400 mx-auto mb-1" />
                            <div className="text-lg font-semibold text-white">{game.scenes}</div>
                            <div className="text-xs text-slate-400">Scenes</div>
                          </div>
                          <div className="text-center p-3 bg-slate-900 rounded-lg">
                            <Gamepad2 className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                            <div className="text-lg font-semibold text-white">{platformLabels[game.platform]}</div>
                            <div className="text-xs text-slate-400">Platform</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  
                  <DialogContent className="bg-slate-950 border-slate-800 max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-white text-2xl flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                          <GenreIcon className="w-5 h-5 text-white" />
                        </div>
                        {game.title}
                      </DialogTitle>
                    </DialogHeader>
                    
                    {selectedGame ? (
                      <div className="space-y-6 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-slate-400 text-sm">Genre</span>
                            <div className="text-white">{genreLabels[selectedGame.spec.genre]}</div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 text-sm">Setting</span>
                            <div className="text-white">{settingLabels[selectedGame.spec.setting]}</div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 text-sm">Art Style</span>
                            <div className="text-white capitalize">{selectedGame.spec.style}</div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 text-sm">Platform</span>
                            <div className="text-white">{platformLabels[selectedGame.spec.target_platform]}</div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 text-sm">Complexity</span>
                            <div className="text-white capitalize">{selectedGame.spec.complexity}</div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 text-sm">Generated</span>
                            <div className="text-white">{new Date(selectedGame.generated_at).toLocaleDateString()}</div>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-900 rounded-lg">
                          <h4 className="text-white font-semibold mb-3">Game Design</h4>
                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="text-slate-400">Core Mechanics:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedGame.design.core_mechanics.map((m, i) => (
                                  <Badge key={i} variant="secondary" className="bg-slate-800 text-slate-300">
                                    {m}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-400">Art Direction:</span>
                              <div className="text-white mt-1">{selectedGame.design.art_direction}</div>
                            </div>
                            <div>
                              <span className="text-slate-400">Narrative:</span>
                              <div className="text-white mt-1">{selectedGame.design.narrative_outline}</div>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-900 rounded-lg">
                          <h4 className="text-white font-semibold mb-3">Generated Content</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-400">3D Assets (OBJ format)</span>
                              <span className="text-white">{selectedGame.assets.length} files</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Scene Files (JSON)</span>
                              <span className="text-white">{selectedGame.scenes.length} level(s)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Design Document</span>
                              <span className="text-green-400">Generated</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Gameplay Logic</span>
                              <span className="text-green-400">Generated</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Export Configuration</span>
                              <span className="text-green-400">Ready</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button 
                            className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                            onClick={() => handleDownloadFull(selectedGame)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Full Package
                          </Button>
                          <Button 
                            variant="outline" 
                            className="border-slate-700 text-slate-300 hover:bg-slate-800"
                            onClick={() => handleDownloadOBJ(selectedGame)}
                          >
                            <Box className="w-4 h-4 mr-2" />
                            OBJ Files
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
