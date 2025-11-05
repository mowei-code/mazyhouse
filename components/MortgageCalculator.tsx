import React, { useState, useEffect, useMemo } from 'react';
import { CalculatorIcon } from './icons/CalculatorIcon';

interface MortgageCalculatorProps {
  estimatedPrice: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const MortgageCalculator: React.FC<MortgageCalculatorProps> = ({ estimatedPrice }) => {
  const [downPayment, setDownPayment] = useState(0);
  const [interestRate, setInterestRate] = useState(2.1);
  const [loanTerm, setLoanTerm] = useState(30);

  useEffect(() => {
    // Set default down payment to 20% of the estimated price when it changes
    if (estimatedPrice > 0) {
      setDownPayment(Math.round(estimatedPrice * 0.2));
    }
  }, [estimatedPrice]);

  const loanAmount = useMemo(() => {
    return Math.max(0, estimatedPrice - downPayment);
  }, [estimatedPrice, downPayment]);

  const monthlyPayment = useMemo(() => {
    if (loanAmount <= 0 || interestRate <= 0 || loanTerm <= 0) {
      return 0;
    }
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    const numerator = monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments);
    const denominator = Math.pow(1 + monthlyRate, numberOfPayments) - 1;
    if (denominator === 0) {
        return 0;
    }
    return Math.round((loanAmount * numerator) / denominator);
  }, [loanAmount, interestRate, loanTerm]);

  return (
    <div className="mb-8 p-5 bg-emerald-50 border border-slate-200/80 rounded-xl">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
        <CalculatorIcon className="h-6 w-6 text-blue-600" />
        房貸月付金試算
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
        {/* Loan Parameters */}
        <div>
          <label htmlFor="downPayment" className="block text-sm font-medium text-slate-600 mb-1">
            自備款 (元)
          </label>
          <input
            type="number"
            id="downPayment"
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            className="w-full pl-3 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            step="10000"
          />
        </div>
        <div>
          <label htmlFor="interestRate" className="block text-sm font-medium text-slate-600 mb-1">
            年利率 (%)
          </label>
          <input
            type="number"
            id="interestRate"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full pl-3 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            step="0.01"
          />
        </div>
        <div>
          <label htmlFor="loanTerm" className="block text-sm font-medium text-slate-600 mb-1">
            貸款年限 (年)
          </label>
          <input
            type="number"
            id="loanTerm"
            value={loanTerm}
            onChange={(e) => setLoanTerm(Number(e.target.value))}
            className="w-full pl-3 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            step="1"
          />
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Financial Summary */}
        <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500">房屋總價</span>
            <p className="text-lg font-semibold text-slate-800">{formatCurrency(estimatedPrice)}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500">貸款總額</span>
            <p className="text-lg font-semibold text-slate-800">{formatCurrency(loanAmount)}</p>
        </div>
      </div>

      {/* Result */}
      <div className="mt-4 bg-white p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center border-2 border-blue-200">
        <span className="text-base font-medium text-slate-600">預估每月還款</span>
        <p className="text-3xl font-bold text-blue-600">
          {formatCurrency(monthlyPayment)}
        </p>
      </div>

       <p className="text-xs text-slate-400 mt-3 text-center sm:text-left">
          * 此為本息平均攤還法估算結果，實際貸款條件與金額請以銀行公告為準。
        </p>
    </div>
  );
};