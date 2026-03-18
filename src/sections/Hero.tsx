import { Brain, Gamepad2, Cpu, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Hero() {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="px-3 py-1 text-xs font-medium bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
            Genie 3 + NeuroForge
          </span>
          <span className="px-3 py-1 text-xs font-medium bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30">
            133.6M Parameters
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
          NeuroForge
          <br />
          <span className="text-4xl md:text-6xl">Game Agency</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          AI-powered game generation system that creates complete 3D games from text specifications. 
          Merge of Google's Genie 3 world model with NeuroForge LLM engine.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
            <Gamepad2 className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-slate-300">19 Games Generated</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-slate-300">85 3D Assets</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
            <Brain className="w-5 h-5 text-green-400" />
            <span className="text-sm text-slate-300">Self-Evolving</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <Button 
            size="lg" 
            onClick={() => scrollToSection('generate')}
            className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Generate Game
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            onClick={() => scrollToSection('gallery')}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <Gamepad2 className="w-5 h-5 mr-2" />
            View Games
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-slate-500 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-slate-500 rounded-full" />
        </div>
      </div>
    </section>
  );
}
