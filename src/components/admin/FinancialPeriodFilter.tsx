import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Filter, X } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";

export type PeriodType = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'last-week' | 'last-month' | 'custom';

interface PeriodOption {
  value: PeriodType;
  label: string;
  description: string;
}

interface FinancialPeriodFilterProps {
  onPeriodChange: (startDate: Date, endDate: Date, periodType: PeriodType) => void;
  currentPeriod?: PeriodType;
}

const periodOptions: PeriodOption[] = [
  { value: 'today', label: 'Hoje', description: 'Apenas hoje' },
  { value: 'week', label: 'Esta Semana', description: 'Semana atual' },
  { value: 'month', label: 'Este Mês', description: 'Mês atual' },
  { value: 'quarter', label: 'Este Trimestre', description: 'Trimestre atual' },
  { value: 'year', label: 'Este Ano', description: 'Ano atual' },
  { value: 'last-week', label: 'Semana Passada', description: '7 dias atrás' },
  { value: 'last-month', label: 'Mês Passado', description: '30 dias atrás' },
  { value: 'custom', label: 'Período Personalizado', description: 'Escolha as datas' },
];

export const FinancialPeriodFilter = ({ onPeriodChange, currentPeriod = 'month' }: FinancialPeriodFilterProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>(currentPeriod);
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const calculatePeriodDates = (period: PeriodType): { start: Date; end: Date } => {
    const now = new Date();
    
    switch (period) {
      case 'today':
        return { start: now, end: now };
      
      case 'week':
        return { 
          start: startOfWeek(now, { weekStartsOn: 0 }), 
          end: endOfWeek(now, { weekStartsOn: 0 }) 
        };
      
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      
      case 'quarter':
        return { start: startOfQuarter(now), end: endOfQuarter(now) };
      
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
      
      case 'last-week':
        const lastWeek = subWeeks(now, 1);
        return { 
          start: startOfWeek(lastWeek, { weekStartsOn: 0 }), 
          end: endOfWeek(lastWeek, { weekStartsOn: 0 }) 
        };
      
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      
      case 'custom':
        return {
          start: customStartDate || startOfMonth(now),
          end: customEndDate || endOfMonth(now)
        };
      
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const handlePeriodSelect = (period: PeriodType) => {
    if (period === 'custom') {
      setShowCustomPicker(true);
      setSelectedPeriod(period);
      return;
    }

    setSelectedPeriod(period);
    const { start, end } = calculatePeriodDates(period);
    onPeriodChange(start, end, period);
  };

  const handleCustomPeriodApply = () => {
    if (customStartDate && customEndDate) {
      setShowCustomPicker(false);
      onPeriodChange(customStartDate, customEndDate, 'custom');
    }
  };

  const getCurrentPeriodLabel = () => {
    const option = periodOptions.find(opt => opt.value === selectedPeriod);
    if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
      return `${format(customStartDate, 'dd/MM', { locale: ptBR })} - ${format(customEndDate, 'dd/MM/yyyy', { locale: ptBR })}`;
    }
    return option?.label || 'Este Mês';
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Período:</span>
          <Badge variant="secondary" className="text-sm">
            {getCurrentPeriodLabel()}
          </Badge>
        </div>

        <div className="flex gap-2 flex-wrap">
          {periodOptions.filter(opt => opt.value !== 'custom').map((option) => (
            <Button
              key={option.value}
              variant={selectedPeriod === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodSelect(option.value)}
              className="text-xs"
            >
              {option.label}
            </Button>
          ))}

          <Popover open={showCustomPicker} onOpenChange={setShowCustomPicker}>
            <PopoverTrigger asChild>
              <Button
                variant={selectedPeriod === 'custom' ? "default" : "outline"}
                size="sm"
                className="text-xs"
              >
                <CalendarIcon className="h-3 w-3 mr-1" />
                Personalizado
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Data Inicial:</p>
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    locale={ptBR}
                    className="rounded-md border"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Data Final:</p>
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    locale={ptBR}
                    className="rounded-md border"
                    disabled={(date) => customStartDate ? date < customStartDate : false}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCustomPeriodApply}
                    disabled={!customStartDate || !customEndDate}
                    className="flex-1"
                  >
                    Aplicar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomPicker(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </Card>
  );
};

