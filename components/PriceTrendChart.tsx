
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PriceTrendDataPoint } from '../types';

interface PriceTrendChartProps {
  data: PriceTrendDataPoint[];
}

export const PriceTrendChart: React.FC<PriceTrendChartProps> = ({ data }) => {
  const formatYAxis = (tickItem: number) => {
    if (tickItem >= 100000000) {
      return `${(tickItem / 100000000).toFixed(1)} 億`;
    }
    if (tickItem >= 10000) {
      return `${Math.round(tickItem / 10000)} 萬`;
    }
    return tickItem.toString();
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="label" stroke="#64748b" />
        <YAxis tickFormatter={formatYAxis} stroke="#64748b" domain={['dataMin - 1000000', 'dataMax + 1000000']} />
        <Tooltip
          formatter={(value: number) => [new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(value), '平均總價']}
          labelStyle={{ color: '#334155' }}
          itemStyle={{ color: '#0971f1' }}
        />
        <Legend />
        <Line type="monotone" dataKey="price" name="平均總價 (萬)" stroke="#2563eb" strokeWidth={2} activeDot={{ r: 8 }} dot={{ r: 4, fill: '#2563eb' }} />
      </LineChart>
    </ResponsiveContainer>
  );
};