import { useState, useEffect } from 'react';
import { Key, Check, Eye, EyeOff, RefreshCw, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ApiConfigData {
  openai: string;
  stability: string;
  anthropic: string;
}

const STORAGE_KEY = 'neuroforge_api_keys';

export function ApiConfig() {
  const [openaiKey, setOpenaiKey] = useState('');
  const [stabilityKey, setStabilityKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [savedConfig, setSavedConfig] = useState<ApiConfigData | null>(null);
  const [showKeys, setShowKeys] = useState({ openai: false, stability: false, anthropic: false });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load saved keys on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const config: ApiConfigData = JSON.parse(stored);
        setSavedConfig(config);
      }
    } catch (err) {
      console.error('Failed to load API config:', err);
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const config: ApiConfigData = {
        openai: openaiKey || savedConfig?.openai || '',
        stability: stabilityKey || savedConfig?.stability || '',
        anthropic: anthropicKey || savedConfig?.anthropic || ''
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setSavedConfig(config);
      setSaveMessage('API keys saved to browser storage!');
      setOpenaiKey('');
      setStabilityKey('');
      setAnthropicKey('');
    } catch (err) {
      setSaveMessage('Failed to save API keys');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const clearKeys = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedConfig(null);
    setSaveMessage('API keys cleared');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const maskKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '****';
    return key.slice(0, 4) + '****' + key.slice(-4);
  };

  const hasAnyKey = savedConfig?.openai || savedConfig?.stability || savedConfig?.anthropic;

  return (
    <section id="api-config" className="py-20 px-4 bg-slate-950">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            API Configuration
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Add your API keys to enable AI-powered game generation when running the backend locally.
            Your keys are stored in your browser and never sent to any server.
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">Client-Side Mode Active</p>
            <p>The deployed website uses client-side generation. To use AI-powered generation with OpenAI/Anthropic, run the backend server locally with <code className="bg-blue-500/20 px-1 rounded">npm run server</code>.</p>
          </div>
        </div>

        {saveMessage && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${saveMessage.includes('Failed') ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-green-500/10 border border-green-500/30 text-green-400'}`}>
            <Check className="w-5 h-5" />
            <span>{saveMessage}</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* OpenAI */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-green-400" />
                  OpenAI API
                </span>
                {savedConfig?.openai ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Saved</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-slate-800 text-slate-400">Not Set</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-400">
                Used for AI game design generation, narratives, and content creation.
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline ml-1"
                >
                  Get API key →
                </a>
              </p>
              <div className="relative">
                <Input
                  type={showKeys.openai ? 'text' : 'password'}
                  placeholder={savedConfig?.openai ? maskKey(savedConfig.openai) : 'sk-...'}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white pr-10"
                />
                <button
                  onClick={() => setShowKeys({ ...showKeys, openai: !showKeys.openai })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Stability AI */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-purple-400" />
                  Stability AI
                </span>
                {savedConfig?.stability ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Saved</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-slate-800 text-slate-400">Optional</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-400">
                Used for AI texture generation. Falls back to procedural textures if not set.
                <a 
                  href="https://platform.stability.ai/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline ml-1"
                >
                  Get API key →
                </a>
              </p>
              <div className="relative">
                <Input
                  type={showKeys.stability ? 'text' : 'password'}
                  placeholder={savedConfig?.stability ? maskKey(savedConfig.stability) : 'sk-...'}
                  value={stabilityKey}
                  onChange={(e) => setStabilityKey(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white pr-10"
                />
                <button
                  onClick={() => setShowKeys({ ...showKeys, stability: !showKeys.stability })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showKeys.stability ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Anthropic */}
          <Card className="bg-slate-900/50 border-slate-800 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-orange-400" />
                  Anthropic Claude (Optional)
                </span>
                {savedConfig?.anthropic ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Saved</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-slate-800 text-slate-400">Alternative to OpenAI</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-400">
                Alternative AI provider for game design generation. Used as fallback if OpenAI is not available.
                <a 
                  href="https://console.anthropic.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline ml-1"
                >
                  Get API key →
                </a>
              </p>
              <div className="relative">
                <Input
                  type={showKeys.anthropic ? 'text' : 'password'}
                  placeholder={savedConfig?.anthropic ? maskKey(savedConfig.anthropic) : 'sk-ant-...'}
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white pr-10"
                />
                <button
                  onClick={() => setShowKeys({ ...showKeys, anthropic: !showKeys.anthropic })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showKeys.anthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={handleSave}
            disabled={isSaving || (!openaiKey && !stabilityKey && !anthropicKey)}
            className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
            size="lg"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Save API Keys
              </>
            )}
          </Button>
          {hasAnyKey && (
            <Button
              onClick={clearKeys}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Capabilities */}
        <Card className="mt-8 bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">System Capabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-300">Game Design</div>
                <Badge className={savedConfig?.openai || savedConfig?.anthropic ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}>
                  {savedConfig?.openai || savedConfig?.anthropic ? 'AI Ready (local backend)' : 'Client-Side Mode'}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-300">Texture Generation</div>
                <Badge className={savedConfig?.stability ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}>
                  {savedConfig?.stability ? 'AI Ready (local backend)' : 'Procedural'}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-300">3D Mesh Generation</div>
                <Badge className="bg-blue-500/20 text-blue-400">Procedural (Always Available)</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
