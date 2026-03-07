import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

type KPICardProps = {
  title: string;
  value: string | number;
  trend?: string;
  trendPositive?: boolean;
};

export function KPICard({ title, value, trend, trendPositive }: KPICardProps) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
      {trend && (
        <div className={`mt-2 flex items-center text-sm font-medium ${trendPositive ? 'text-green-600' : 'text-red-600'}`}>
          {trendPositive ? <ArrowUpIcon className="w-4 h-4 mr-1" /> : <ArrowDownIcon className="w-4 h-4 mr-1" />}
          {trend}
        </div>
      )}
    </div>
  );
}
