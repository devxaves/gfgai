"use client";

import { ArrowDownIcon, ArrowUpIcon, TrendingUp, DollarSign, Users, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";

type KPICardProps = {
  title: string;
  value: string | number;
  trend?: string;
  trendPositive?: boolean;
  icon?: string;
  index?: number;
};

const ICONS = [DollarSign, TrendingUp, Users, ShoppingCart];
const GRADIENTS = [
  "from-blue-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
];

export function KPICard({ title, value, trend, trendPositive, index = 0 }: KPICardProps) {
  const Icon = ICONS[index % ICONS.length];
  const gradient = GRADIENTS[index % GRADIENTS.length];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">{value}</div>
      {trend && (
        <div className={`mt-2 flex items-center text-xs font-medium ${trendPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {trendPositive ? <ArrowUpIcon className="w-3.5 h-3.5 mr-1" /> : <ArrowDownIcon className="w-3.5 h-3.5 mr-1" />}
          {trend}
        </div>
      )}
    </motion.div>
  );
}
