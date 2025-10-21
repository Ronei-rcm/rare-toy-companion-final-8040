import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminMobileHeaderProps {
  onMenuClick: () => void;
  title: string;
  subtitle?: string;
}

export function AdminMobileHeader({ onMenuClick, title, subtitle }: AdminMobileHeaderProps) {
  return (
    <div className="md:hidden">
      {/* Botão do menu com visual melhorado */}
      <Button 
        variant="ghost" 
        size="icon"
        onClick={onMenuClick}
        className="fixed top-4 left-4 z-50 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      {/* Header com título e subtítulo */}
      <div className="pt-20 px-4 pb-6 bg-gradient-to-b from-white via-white/95 to-transparent">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{subtitle}</p>
          )}
        </div>
      </div>
      
      {/* Separador sutil */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
    </div>
  );
}
