import { useState, useEffect } from 'react';
import { Brain, Menu, X, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'API Config', href: '#api-config' },
  { label: 'Status', href: '#status' },
  { label: 'Generate', href: '#generate' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Training', href: '#training' },
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    element?.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-slate-950/90 backdrop-blur-md border-b border-slate-800'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a 
              href="#" 
              className="flex items-center gap-2"
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-semibold hidden sm:block">NeuroForge</span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  onClick={() => scrollToSection(item.href)}
                  className="text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  {item.label === 'API Config' && <Key className="w-4 h-4 mr-1" />}
                  {item.label}
                </Button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/95 backdrop-blur-md md:hidden pt-16">
          <div className="flex flex-col items-center justify-center h-full gap-4">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                size="lg"
                onClick={() => scrollToSection(item.href)}
                className="text-xl text-slate-300 hover:text-white"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
