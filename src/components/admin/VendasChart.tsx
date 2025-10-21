
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const VendasChart = () => {
  const data = [
    { name: 'Jan', vendas: 0 },
    { name: 'Fev', vendas: 0 },
    { name: 'Mar', vendas: 0 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="vendas" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default VendasChart;
