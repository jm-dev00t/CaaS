import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { WeeklyExecution, CategoryExecution } from "../types/dashboard";

interface ChartsSectionProps {
  weeklyData: WeeklyExecution[];
  categoryData: CategoryExecution[];
}

export function ChartsSection({ weeklyData, categoryData }: ChartsSectionProps) {
  return (
    <div id="charts-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-sm border border-[#d2d2d7] bg-white rounded-[24px] overflow-hidden">
        <CardHeader className="p-7 pb-3 border-none flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-[12px] font-semibold text-[#86868b] uppercase tracking-wide mb-1">주간 흐름</CardTitle>
            <CardTitle className="text-[19px] font-semibold text-[#1d1d1f] tracking-tight">주간 집행 추이</CardTitle>
          </div>
          <div className="flex gap-2 p-1.5 bg-[#f5f5f7] rounded-full">
            <div className="w-2.5 h-2.5 bg-[#0066cc] rounded-full shadow-sm"></div>
            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d2d2d7" opacity={0.3} />
                <XAxis 
                  dataKey="week" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#86868b', fontSize: 11, fontWeight: 500 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#86868b', fontSize: 11, fontWeight: 500 }} 
                  tickFormatter={(value) => `${(value / 10000)}0k`} 
                />
                <Tooltip 
                  cursor={{ fill: '#f5f5f7', radius: 4 }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid #d2d2d7',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    color: '#1d1d1f',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                    fontSize: '13px',
                    fontWeight: '600',
                    padding: '12px 16px'
                  }}
                  itemStyle={{ padding: '0px', color: '#0066cc' }}
                  formatter={(value: number) => [`${value.toLocaleString()} 원`, "금액"]}
                />
                <Bar 
                  dataKey="amount" 
                  fill="#0066cc" 
                  radius={[12, 12, 12, 12]} 
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border border-[#d2d2d7] bg-white rounded-[24px] overflow-hidden">
        <CardHeader className="p-7 pb-3">
          <CardTitle className="text-[12px] font-semibold text-[#86868b] uppercase tracking-wide mb-1">예산 배분</CardTitle>
          <CardTitle className="text-[19px] font-semibold text-[#1d1d1f] tracking-tight">항목별 예산 배분</CardTitle>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                   data={categoryData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={90}
                   paddingAngle={4}
                   dataKey="value"
                   strokeWidth={0}
                 >
                   {categoryData.map((entry, index) => {
                     const appleColors = ['#0066cc', '#34c759', '#af52de', '#ff3b30', '#ffcc00', '#5856d6'];
                     return <Cell key={`cell-${index}`} fill={appleColors[index % appleColors.length]} />;
                   })}
                 </Pie>
                 <Tooltip 
                   contentStyle={{ 
                     borderRadius: '16px', 
                     border: '1px solid #d2d2d7',
                     backgroundColor: 'rgba(255, 255, 255, 0.95)',
                     backdropFilter: 'blur(10px)',
                     color: '#1d1d1f',
                     boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                     fontSize: '13px',
                     fontWeight: '600',
                     padding: '12px 16px'
                   }}
                   formatter={(value: number) => `${value.toLocaleString()} 원`}
                 />
                 <Legend 
                   layout="horizontal" 
                   align="center" 
                   verticalAlign="bottom"
                   iconType="circle"
                   iconSize={8}
                   wrapperStyle={{ paddingTop: '20px' }}
                   formatter={(value) => <span className="text-[11px] font-medium text-[#424245] ml-1 tracking-tight">{value}</span>}
                 />
               </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
