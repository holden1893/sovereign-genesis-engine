import { Brain, Github, Twitter, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="py-12 px-4 bg-slate-950 border-t border-slate-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold">NeuroForge</div>
              <div className="text-slate-400 text-sm">Game Agency</div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a 
              href="#" 
              className="text-slate-400 hover:text-white transition-colors"
              onClick={(e) => { e.preventDefault(); alert('GitHub link would open here'); }}
            >
              <Github className="w-5 h-5" />
            </a>
            <a 
              href="#" 
              className="text-slate-400 hover:text-white transition-colors"
              onClick={(e) => { e.preventDefault(); alert('Twitter link would open here'); }}
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a 
              href="#" 
              className="text-slate-400 hover:text-white transition-colors"
              onClick={(e) => { e.preventDefault(); alert('Email link would open here'); }}
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>

          <div className="text-slate-400 text-sm">
            Powered by Genie 3 + NeuroForge Engine
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
          <p>133.6M Parameters | Self-Evolving AI | 19 Games Generated | 85 3D Assets Created</p>
        </div>
      </div>
    </footer>
  );
}
