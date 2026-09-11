'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const revenueData = [
  { month: 'Apr', revenue: 45000, store: 12000 },
  { month: 'May', revenue: 52000, store: 18000 },
  { month: 'Jun', revenue: 48000, store: 25000 },
  { month: 'Jul', revenue: 61000, store: 31000 },
  { month: 'Aug', revenue: 74000, store: 42000 },
  { month: 'Sep', revenue: 82000, store: 39000 }
];

const categoryData = [
  { name: 'Tractor', value: 32 },
  { name: 'Seeds', value: 24 },
  { name: 'Fertilizer', value: 18 },
  { name: 'Dairy', value: 14 },
  { name: 'Tools', value: 12 }
];

const leadData = [
  { stage: 'Hot', count: 8 },
  { stage: 'Warm', count: 14 },
  { stage: 'Cold', count: 22 }
];

const COLORS = ['#16a34a', '#3b82f6', '#f97316', '#ef4444', '#8b5cf6'];

export default function ChartsSection() {
  return (
    <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
      <div className='rounded-2xl bg-white p-5 shadow-sm border border-gray-100 lg:col-span-2'>
        <h3 className='mb-4 text-sm font-semibold text-gray-700'>Revenue Trend</h3>
        <div className='h-64 w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray='3 3' vertical={false} />
              <XAxis dataKey='month' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type='monotone' dataKey='revenue' name='Marketplace Sales' stroke='#16a34a' strokeWidth={2} dot={false} />
              <Line type='monotone' dataKey='store' name='KisanPatrika Store' stroke='#3b82f6' strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className='rounded-2xl bg-white p-5 shadow-sm border border-gray-100'>
        <h3 className='mb-4 text-sm font-semibold text-gray-700'>Sales by Category</h3>
        <div className='h-64 w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie data={categoryData} cx='50%' cy='50%' innerRadius={55} outerRadius={85} paddingAngle={4} dataKey='value'>
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign='bottom' height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className='rounded-2xl bg-white p-5 shadow-sm border border-gray-100'>
        <h3 className='mb-4 text-sm font-semibold text-gray-700'>Lead Stages</h3>
        <div className='h-64 w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={leadData}>
              <CartesianGrid strokeDasharray='3 3' vertical={false} />
              <XAxis dataKey='stage' />
              <YAxis />
              <Tooltip />
              <Bar dataKey='count' fill='#16a34a' radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className='rounded-2xl bg-white p-5 shadow-sm border border-gray-100 lg:col-span-2'>
        <h3 className='mb-4 text-sm font-semibold text-gray-700'>Monthly Sales (Units)</h3>
        <div className='h-64 w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray='3 3' vertical={false} />
              <XAxis dataKey='month' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey='revenue' name='Marketplace' fill='#16a34a' radius={[6, 6, 0, 0]} />
              <Bar dataKey='store' name='KisanPatrika Store' fill='#3b82f6' radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
