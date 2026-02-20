import { useDashboardStats } from "@/hooks/use-products";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { MousePointerClick, TrendingUp, Link as LinkIcon, DollarSign } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Loading stats...</div>
        </div>
      </div>
    );
  }

  // Transform linkStats for chart
  const chartData = stats?.linkStats.slice(0, 10).map(stat => ({
    name: stat.slug,
    clicks: stat.totalClicks
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold font-heading text-gray-900">Affiliate Overview</h1>
          <div className="text-sm text-gray-500">Last 30 Days</div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Clicks</CardTitle>
              <MousePointerClick className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalClicks}</div>
              <p className="text-xs text-green-600 font-medium flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" /> +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Today's Clicks</CardTitle>
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.todayClicks}</div>
              <p className="text-xs text-gray-400 mt-1">Real-time updates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Active Links</CardTitle>
              <LinkIcon className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeLinks}</div>
              <p className="text-xs text-gray-400 mt-1">Across 4 categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Est. Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.estimatedRevenue}</div>
              <p className="text-xs text-gray-400 mt-1">Based on avg EPC</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart Section */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Top Performing Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        cursor={{ fill: '#f3f4f6' }}
                      />
                      <Bar dataKey="clicks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* List Section */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.linkStats.slice(0, 6).map((stat, i) => (
                    <div key={stat.slug} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-gray-400 w-4">{i + 1}</div>
                        <div>
                          <div className="font-medium text-sm text-gray-900 capitalize">{stat.slug}</div>
                          <div className="text-xs text-gray-500">{stat.todayClicks} clicks today</div>
                        </div>
                      </div>
                      <div className="font-bold text-sm text-gray-900">{stat.totalClicks}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
