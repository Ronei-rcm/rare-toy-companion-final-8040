import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Zap, FileEdit, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuickAddProduct } from './QuickAddProduct';
import { ProductTemplates } from './ProductTemplates';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export function MobileQuickAddFAB() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleTemplateSelect = (template: any) => {
    // Implementar lógica de aplicar template
    setShowTemplates(false);
    setShowQuickAdd(true);
    // TODO: Pre-preencher form com dados do template
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-20 right-0 space-y-3 min-w-[200px]"
            >
              {/* Quick Add */}
              <Button
                onClick={() => {
                  setShowQuickAdd(true);
                  setIsOpen(false);
                }}
                className="w-full justify-start gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg"
              >
                <Zap className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-semibold">Cadastro Rápido</p>
                  <p className="text-xs text-white/80">Foto + Nome + Preço</p>
                </div>
              </Button>

              {/* Templates */}
              <Button
                onClick={() => {
                  setShowTemplates(true);
                  setIsOpen(false);
                }}
                variant="secondary"
                className="w-full justify-start gap-3 shadow-lg"
              >
                <Copy className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-semibold">Usar Template</p>
                  <p className="text-xs text-muted-foreground">Pré-configurado</p>
                </div>
              </Button>

              {/* Ver Rascunhos */}
              <Button
                onClick={() => {
                  window.location.href = '/admin/produtos?tab=rascunhos';
                  setIsOpen(false);
                }}
                variant="outline"
                className="w-full justify-start gap-3 shadow-lg"
              >
                <FileEdit className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-semibold">Rascunhos</p>
                  <p className="text-xs text-muted-foreground">Completar depois</p>
                </div>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-2xl flex items-center justify-center hover:shadow-purple-500/50 transition-shadow"
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? <X className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
          </motion.div>
        </motion.button>

        {/* Badge de indicação (pulsa 3x quando carrega) */}
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="absolute -top-1 -right-1 bg-red-500 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
          >
            !
          </motion.div>
        )}
      </motion.div>

      {/* Quick Add Modal */}
      <AnimatePresence>
        {showQuickAdd && (
          <QuickAddProduct
            onSuccess={() => {
              setShowQuickAdd(false);
              toast({
                title: 'Sucesso!',
                description: 'Produto cadastrado',
              });
            }}
            onCancel={() => setShowQuickAdd(false)}
          />
        )}
      </AnimatePresence>

      {/* Templates Sheet */}
      <Sheet open={showTemplates} onOpenChange={setShowTemplates}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Templates de Produtos</SheetTitle>
            <SheetDescription>
              Selecione um template para começar rapidamente
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <ProductTemplates onSelectTemplate={handleTemplateSelect} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

