import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Eye,
    EyeOff,
    Building2,
    CreditCard,
    Banknote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Transaction {
    id: number;
    tipo: 'entrada' | 'saida';
    valor: number;
    data: string;
    conta_id?: number | null;
}

interface Account {
    id: number;
    nome: string;
    banco?: string;
    tipo?: string;
    numero_conta?: string;
    status?: string;
}

interface AccountBalanceWidgetProps {
    transactions: Transaction[];
    accounts: Account[];
    onFilterByAccount?: (accountId: number | null) => void;
    selectedAccountId?: number | null;
}

interface AccountBalance {
    account: Account;
    balance: number;
    entradas: number;
    saidas: number;
    transactionCount: number;
}

export default function AccountBalanceWidget({
    transactions,
    accounts,
    onFilterByAccount,
    selectedAccountId
}: AccountBalanceWidgetProps) {
    const [showBalances, setShowBalances] = useState(true);
    const [expandedAccountId, setExpandedAccountId] = useState<number | null>(null);

    const accountBalances = useMemo((): AccountBalance[] => {
        // Calcular saldo para cada conta
        const balances = accounts.map(account => {
            const accountTransactions = transactions.filter(t => t.conta_id === account.id);

            const entradas = accountTransactions
                .filter(t => t.tipo === 'entrada')
                .reduce((sum, t) => sum + Number(t.valor), 0);

            const saidas = accountTransactions
                .filter(t => t.tipo === 'saida')
                .reduce((sum, t) => sum + Number(t.valor), 0);

            const balance = entradas - saidas;

            return {
                account,
                balance,
                entradas,
                saidas,
                transactionCount: accountTransactions.length
            };
        });

        // Ordenar por saldo (maior primeiro)
        return balances.sort((a, b) => b.balance - a.balance);
    }, [transactions, accounts]);

    // Calcular saldo total de todas as contas
    const totalBalance = accountBalances.reduce((sum, ab) => sum + ab.balance, 0);

    // Transações sem conta associada
    const transactionsWithoutAccount = transactions.filter(t => !t.conta_id);
    const unassignedBalance = transactionsWithoutAccount.reduce((sum, t) => {
        return sum + (t.tipo === 'entrada' ? Number(t.valor) : -Number(t.valor));
    }, 0);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };

    const getAccountIcon = (tipo?: string) => {
        switch (tipo?.toLowerCase()) {
            case 'corrente':
                return <Wallet className="h-4 w-4" />;
            case 'poupanca':
            case 'poupança':
                return <Banknote className="h-4 w-4" />;
            case 'cartao':
            case 'cartão':
                return <CreditCard className="h-4 w-4" />;
            default:
                return <Building2 className="h-4 w-4" />;
        }
    };

    const handleAccountClick = (accountId: number) => {
        if (onFilterByAccount) {
            // Se já está selecionada, desseleciona
            if (selectedAccountId === accountId) {
                onFilterByAccount(null);
            } else {
                onFilterByAccount(accountId);
            }
        }
    };

    if (accounts.length === 0) {
        return null;
    }

    return (
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-blue-600" />
                        Saldo por Conta
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowBalances(!showBalances)}
                        className="h-8 w-8 p-0"
                    >
                        {showBalances ? (
                            <Eye className="h-4 w-4" />
                        ) : (
                            <EyeOff className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Saldo Total */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Saldo Total</span>
                        <div className="text-right">
                            {showBalances ? (
                                <div className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(totalBalance)}
                                </div>
                            ) : (
                                <div className="text-2xl font-bold text-gray-400">••••••</div>
                            )}
                            <div className="text-xs text-gray-500">
                                {accounts.length} conta{accounts.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lista de Contas */}
                <div className="space-y-2">
                    <AnimatePresence>
                        {accountBalances.map((ab, index) => {
                            const isSelected = selectedAccountId === ab.account.id;
                            const isExpanded = expandedAccountId === ab.account.id;

                            return (
                                <motion.div
                                    key={ab.account.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div
                                        className={`p-3 rounded-lg border transition-all cursor-pointer ${isSelected
                                                ? 'bg-blue-50 border-blue-300 shadow-sm'
                                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                            }`}
                                        onClick={() => handleAccountClick(ab.account.id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className={`p-2 rounded-full ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
                                                    }`}>
                                                    {getAccountIcon(ab.account.tipo)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm">{ab.account.nome}</span>
                                                        {isSelected && (
                                                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                                                                Filtrado
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {ab.account.banco && (
                                                        <div className="text-xs text-gray-500">{ab.account.banco}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {showBalances ? (
                                                    <>
                                                        <div className={`text-lg font-bold ${ab.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {formatCurrency(ab.balance)}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {ab.transactionCount} transaç{ab.transactionCount !== 1 ? 'ões' : 'ão'}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-lg font-bold text-gray-400">••••••</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Detalhes expandidos */}
                                        {showBalances && isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs"
                                            >
                                                <div className="flex items-center gap-1 text-green-600">
                                                    <TrendingUp className="h-3 w-3" />
                                                    <span>Entradas: {formatCurrency(ab.entradas)}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-red-600">
                                                    <TrendingDown className="h-3 w-3" />
                                                    <span>Saídas: {formatCurrency(ab.saidas)}</span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Transações sem conta */}
                    {transactionsWithoutAccount.length > 0 && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
                                        <Wallet className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <span className="font-medium text-sm text-yellow-900">Sem Conta</span>
                                        <div className="text-xs text-yellow-700">
                                            {transactionsWithoutAccount.length} transaç{transactionsWithoutAccount.length !== 1 ? 'ões' : 'ão'}
                                        </div>
                                    </div>
                                </div>
                                {showBalances && (
                                    <div className={`text-lg font-bold ${unassignedBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(unassignedBalance)}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Dica de uso */}
                {onFilterByAccount && (
                    <div className="text-xs text-gray-500 text-center pt-2 border-t">
                        💡 Clique em uma conta para filtrar transações
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
