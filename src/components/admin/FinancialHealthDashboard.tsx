import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Heart,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Target,
    Clock,
    AlertTriangle,
    CheckCircle,
    Info
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Transaction {
    id: number;
    tipo: 'entrada' | 'saida';
    valor: number;
    data: string;
    status: 'Pago' | 'Pendente' | 'Atrasado';
    categoria: string;
    observacoes?: string;
}

interface Budget {
    id: number;
    categoria: string;
    limite: number;
    gasto: number;
}

interface FinancialHealthProps {
    transactions: Transaction[];
    budgets?: Budget[];
}

interface HealthAlert {
    type: 'critical' | 'warning' | 'info';
    message: string;
    icon: React.ReactNode;
}

interface HealthBreakdown {
    balance: number;
    spending: number;
    budget: number;
    bills: number;
    trend: number;
}

interface HealthScore {
    total: number;
    breakdown: HealthBreakdown;
    status: 'healthy' | 'warning' | 'critical';
    alerts: HealthAlert[];
}

export default function FinancialHealthDashboard({ transactions, budgets = [] }: FinancialHealthProps) {
    const healthScore = useMemo((): HealthScore => {
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

        // Filtrar transações dos últimos 3 meses
        const recentTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.data);
            return transactionDate >= threeMonthsAgo;
        });

        const currentMonthTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.data);
            return transactionDate >= oneMonthAgo;
        });

        // 1. Saldo Positivo (20 pontos)
        const totalEntradas = recentTransactions
            .filter(t => t.tipo === 'entrada')
            .reduce((sum, t) => sum + Number(t.valor), 0);

        const totalSaidas = recentTransactions
            .filter(t => t.tipo === 'saida')
            .reduce((sum, t) => sum + Number(t.valor), 0);

        const saldo = totalEntradas - totalSaidas;
        const saldoPercentual = totalEntradas > 0 ? (saldo / totalEntradas) * 100 : 0;

        let balanceScore = 0;
        if (saldo > 0) balanceScore = 20;
        else if (saldoPercentual >= -10) balanceScore = 10;
        else balanceScore = 0;

        // 2. Controle de Gastos (25 pontos)
        const gastosAtual = currentMonthTransactions
            .filter(t => t.tipo === 'saida')
            .reduce((sum, t) => sum + Number(t.valor), 0);

        // Calcular média dos últimos 3 meses
        const monthlySpending: { [key: string]: number } = {};
        recentTransactions.forEach(t => {
            if (t.tipo === 'saida') {
                const monthKey = new Date(t.data).toISOString().slice(0, 7);
                monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + Number(t.valor);
            }
        });

        const avgSpending = Object.values(monthlySpending).length > 0
            ? Object.values(monthlySpending).reduce((a, b) => a + b, 0) / Object.values(monthlySpending).length
            : 0;

        const spendingRatio = avgSpending > 0 ? (gastosAtual / avgSpending) * 100 : 100;

        let spendingScore = 0;
        if (spendingRatio < 80) spendingScore = 25;
        else if (spendingRatio <= 100) spendingScore = 15;
        else if (spendingRatio <= 120) spendingScore = 5;
        else spendingScore = 0;

        // 3. Orçamento (20 pontos)
        let budgetScore = 20; // Default se não houver orçamentos
        let budgetUsagePercent = 0;

        if (budgets.length > 0) {
            const totalBudget = budgets.reduce((sum, b) => sum + b.limite, 0);
            const totalSpent = budgets.reduce((sum, b) => sum + b.gasto, 0);
            budgetUsagePercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

            if (budgetUsagePercent < 90) budgetScore = 20;
            else if (budgetUsagePercent <= 100) budgetScore = 10;
            else budgetScore = 0;
        }

        // 4. Contas em Dia (20 pontos)
        const contasAtrasadas = transactions.filter(t => t.status === 'Atrasado').length;

        let billsScore = 0;
        if (contasAtrasadas === 0) billsScore = 20;
        else if (contasAtrasadas <= 2) billsScore = 10;
        else billsScore = 0;

        // 5. Tendência (15 pontos)
        const months = Object.keys(monthlySpending).sort();
        let trendScore = 7; // Neutro por padrão

        if (months.length >= 3) {
            const lastThreeMonths = months.slice(-3);
            const balances = lastThreeMonths.map(month => {
                const monthEntradas = recentTransactions
                    .filter(t => t.tipo === 'entrada' && t.data.startsWith(month))
                    .reduce((sum, t) => sum + Number(t.valor), 0);
                const monthSaidas = monthlySpending[month] || 0;
                return monthEntradas - monthSaidas;
            });

            const isGrowing = balances[2] > balances[1] && balances[1] > balances[0];
            const isStable = Math.abs(balances[2] - balances[0]) < (balances[0] * 0.1);

            if (isGrowing) trendScore = 15;
            else if (isStable) trendScore = 7;
            else trendScore = 0;
        }

        // Calcular score total
        const totalScore = balanceScore + spendingScore + budgetScore + billsScore + trendScore;

        // Determinar status
        let status: 'healthy' | 'warning' | 'critical';
        if (totalScore >= 80) status = 'healthy';
        else if (totalScore >= 50) status = 'warning';
        else status = 'critical';

        // Gerar alertas
        const alerts: HealthAlert[] = [];

        if (saldo < 0) {
            alerts.push({
                type: 'critical',
                message: `Saldo negativo: ${saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
                icon: <AlertTriangle className="h-4 w-4" />
            });
        }

        if (contasAtrasadas > 0) {
            alerts.push({
                type: 'critical',
                message: `${contasAtrasadas} conta(s) atrasada(s)`,
                icon: <Clock className="h-4 w-4" />
            });
        }

        if (budgetUsagePercent >= 90 && budgetUsagePercent < 100) {
            alerts.push({
                type: 'warning',
                message: `Orçamento em ${budgetUsagePercent.toFixed(1)}% - Atenção!`,
                icon: <Target className="h-4 w-4" />
            });
        } else if (budgetUsagePercent >= 100) {
            alerts.push({
                type: 'critical',
                message: `Orçamento estourado em ${(budgetUsagePercent - 100).toFixed(1)}%`,
                icon: <AlertTriangle className="h-4 w-4" />
            });
        }

        if (spendingRatio > 120) {
            alerts.push({
                type: 'warning',
                message: `Gastos ${(spendingRatio - 100).toFixed(0)}% acima da média`,
                icon: <TrendingUp className="h-4 w-4" />
            });
        }

        // Contas a vencer nos próximos 3 dias
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const contasAVencer = transactions.filter(t => {
            const transactionDate = new Date(t.data);
            return t.status === 'Pendente' && transactionDate <= threeDaysFromNow && transactionDate >= now;
        }).length;

        if (contasAVencer > 0) {
            alerts.push({
                type: 'info',
                message: `${contasAVencer} conta(s) vencem em até 3 dias`,
                icon: <Info className="h-4 w-4" />
            });
        }

        return {
            total: totalScore,
            breakdown: {
                balance: balanceScore,
                spending: spendingScore,
                budget: budgetScore,
                bills: billsScore,
                trend: trendScore
            },
            status,
            alerts
        };
    }, [transactions, budgets]);

    const getStatusConfig = () => {
        switch (healthScore.status) {
            case 'healthy':
                return {
                    emoji: '🟢',
                    label: 'Saudável',
                    color: 'text-green-600',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    progressColor: 'bg-green-500'
                };
            case 'warning':
                return {
                    emoji: '🟡',
                    label: 'Atenção',
                    color: 'text-yellow-600',
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200',
                    progressColor: 'bg-yellow-500'
                };
            case 'critical':
                return {
                    emoji: '🔴',
                    label: 'Crítico',
                    color: 'text-red-600',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                    progressColor: 'bg-red-500'
                };
        }
    };

    const statusConfig = getStatusConfig();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className={`border-l-4 ${statusConfig.borderColor} hover:shadow-lg transition-all`}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-pink-500" />
                        Saúde Financeira
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Score Principal */}
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`text-5xl font-bold ${statusConfig.color}`}>
                                    {healthScore.total}
                                </div>
                                <div>
                                    <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                                        {statusConfig.emoji} {statusConfig.label}
                                    </Badge>
                                </div>
                            </div>
                            <Progress value={healthScore.total} className="h-3" />
                            <p className="text-xs text-gray-500 mt-1">Score de 0 a 100</p>
                        </div>
                    </div>

                    {/* Detalhamento */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Detalhamento:</h4>

                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                {healthScore.breakdown.balance === 20 ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                )}
                                <span>Saldo Positivo</span>
                            </div>
                            <span className="font-medium">{healthScore.breakdown.balance}/20</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                {healthScore.breakdown.spending >= 15 ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                )}
                                <span>Controle de Gastos</span>
                            </div>
                            <span className="font-medium">{healthScore.breakdown.spending}/25</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                {healthScore.breakdown.budget >= 10 ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                )}
                                <span>Orçamento</span>
                            </div>
                            <span className="font-medium">{healthScore.breakdown.budget}/20</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                {healthScore.breakdown.bills === 20 ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                )}
                                <span>Contas em Dia</span>
                            </div>
                            <span className="font-medium">{healthScore.breakdown.bills}/20</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                {healthScore.breakdown.trend >= 10 ? (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                ) : healthScore.breakdown.trend >= 5 ? (
                                    <DollarSign className="h-4 w-4 text-yellow-600" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                )}
                                <span>Tendência</span>
                            </div>
                            <span className="font-medium">{healthScore.breakdown.trend}/15</span>
                        </div>
                    </div>

                    {/* Alertas */}
                    {healthScore.alerts.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-700">Alertas:</h4>
                            {healthScore.alerts.map((alert, index) => (
                                <Alert
                                    key={index}
                                    className={`py-2 ${alert.type === 'critical'
                                            ? 'border-red-200 bg-red-50'
                                            : alert.type === 'warning'
                                                ? 'border-yellow-200 bg-yellow-50'
                                                : 'border-blue-200 bg-blue-50'
                                        }`}
                                >
                                    <AlertDescription className="flex items-center gap-2 text-sm">
                                        {alert.icon}
                                        {alert.message}
                                    </AlertDescription>
                                </Alert>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
