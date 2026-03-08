
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const StreakChart: React.FC = () => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1c1917',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 13 },
        cornerRadius: 8,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f5f5f4' },
        ticks: { stepSize: 1, precision: 0 }
      },
      x: {
        grid: { display: false }
      }
    },
    elements: {
      line: { tension: 0.4 },
      point: { radius: 4, hoverRadius: 6, backgroundColor: '#10b981' }
    }
  };

  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Initialize with zeros for new account state
  const data = {
    labels,
    datasets: [
      {
        fill: true,
        label: 'Sessions',
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
      },
    ],
  };

  return (
    <div className="h-full w-full">
      <Line options={options} data={data} />
    </div>
  );
};

export default StreakChart;
