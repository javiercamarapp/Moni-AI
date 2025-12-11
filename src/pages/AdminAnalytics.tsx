import { useState } from "react";
import { Users, Target, PiggyBank, TrendingUp, Brain, UsersIcon, Mail, MessageCircle, UserPlus, Clock, Database, ThumbsUp } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mock data
const kpiData = {
  total_users: 12847,
  active_goals: 8934,
  total_saved: 145000000,
  avg_completion: 67.5,
  ai_accuracy: 89.2,
  group_goals_count: 432,
  group_goals_total: 432,
  active_invites: 234,
  weekly_interactions: 5621,
  avg_group_size: 4.2,
  global_forecast_accuracy: 89.2,
  avg_forecast_error: 3.8,
  ai_model_updates: 127,
  ai_feedback_score: 4.6
};

const monthlyGoalsData = [
  { month: "Ene", goals: 420 },
  { month: "Feb", goals: 580 },
  { month: "Mar", goals: 720 },
  { month: "Abr", goals: 890 },
  { month: "May", goals: 1050 },
  { month: "Jun", goals: 1340 }
];

const savingsOverTimeData = [
  { month: "Ene", savings: 45000000 },
  { month: "Feb", savings: 62000000 },
  { month: "Mar", savings: 84000000 },
  { month: "Abr", savings: 103000000 },
  { month: "May", savings: 125000000 },
  { month: "Jun", savings: 145000000 }
];

const aiAccuracyData = [
  { month: "Ene", predicted: 78, actual: 75 },
  { month: "Feb", predicted: 82, actual: 80 },
  { month: "Mar", predicted: 85, actual: 84 },
  { month: "Abr", predicted: 88, actual: 87 },
  { month: "May", predicted: 89, actual: 89 },
  { month: "Jun", predicted: 91, actual: 89 }
];

const goalsByCategoryData = [
  { name: "Viajes", value: 2845, color: "#00B2FF" },
  { name: "Tech", value: 1923, color: "#6366F1" },
  { name: "Educación", value: 1456, color: "#F59E0B" },
  { name: "Fondo Emergencia", value: 1234, color: "#10B981" },
  { name: "Inversión", value: 876, color: "#8B5CF6" },
  { name: "Custom", value: 600, color: "#EC4899" }
];

const topSaversData = [
  { name: "Ana García", amount: 450000 },
  { name: "Carlos Ruiz", amount: 380000 },
  { name: "María López", amount: 340000 },
  { name: "Juan Pérez", amount: 310000 },
  { name: "Sofia Martínez", amount: 295000 }
];

const userProfilesData = [
  { user_name: "Ana García", country: "México", joined_date: "2024-01-15", total_goals: 5, active_goals: 3, avg_savings: 12500, completion_rate: 80, ai_accuracy: 92 },
  { user_name: "Carlos Ruiz", country: "Colombia", joined_date: "2024-02-20", total_goals: 4, active_goals: 2, avg_savings: 9800, completion_rate: 75, ai_accuracy: 88 },
  { user_name: "María López", country: "Argentina", joined_date: "2024-01-08", total_goals: 6, active_goals: 4, avg_savings: 11200, completion_rate: 83, ai_accuracy: 91 },
  { user_name: "Juan Pérez", country: "México", joined_date: "2024-03-12", total_goals: 3, active_goals: 2, avg_savings: 8500, completion_rate: 67, ai_accuracy: 85 },
  { user_name: "Sofia Martínez", country: "Chile", joined_date: "2024-02-05", total_goals: 7, active_goals: 5, avg_savings: 13400, completion_rate: 86, ai_accuracy: 93 }
];

const goalPerformanceData = [
  { goal_name: "Viaje a Europa", goal_type: "Group", category: "Viajes", avg_weekly: 3500, completion_rate: 85, participants: 8, predicted_date: "2025-12-15" },
  { goal_name: "MacBook Pro", goal_type: "Individual", category: "Tech", avg_weekly: 2800, completion_rate: 78, participants: 1, predicted_date: "2025-08-20" },
  { goal_name: "Fondo Emergencia", goal_type: "Individual", category: "Emergencia", avg_weekly: 4200, completion_rate: 92, participants: 1, predicted_date: "2025-06-10" },
  { goal_name: "Maestría MBA", goal_type: "Individual", category: "Educación", avg_weekly: 5600, completion_rate: 67, participants: 1, predicted_date: "2026-01-30" }
];

const topActiveGroupsData = [
  { group_name: "Viaje a Japón", members: 6, total_saved: 240000, messages: 156, completion: 68 },
  { group_name: "Casa en la playa", members: 4, total_saved: 680000, messages: 234, completion: 45 },
  { group_name: "Startup Fund", members: 8, total_saved: 890000, messages: 412, completion: 72 }
];

const KPICard = ({ label, value, icon: Icon, format = "number" }: any) => {
  const formatValue = (val: number) => {
    if (format === "currency") return `$${(val / 1000000).toFixed(1)}M`;
    if (format === "percentage") return `${val.toFixed(1)}%`;
    if (format === "rating") return `${val.toFixed(1)}/5`;
    return val.toLocaleString();
  };

  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
          {formatValue(value)}
        </div>
      </CardContent>
    </Card>
  );
};

const AdminAnalytics = () => {
  return (
    <>
      <div className="page-standard min-h-screen pb-24 bg-[#faf9f8]">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-b from-white/95 to-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="page-container py-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              📊 Moni AI Analytics Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Internal intelligence panel — monitor user growth, savings activity, and AI performance
            </p>
          </div>
        </div>

        <div className="page-container py-6 space-y-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="ai">AI Performance</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <KPICard label="Total Users" value={kpiData.total_users} icon={Users} />
                <KPICard label="Active Goals" value={kpiData.active_goals} icon={Target} />
                <KPICard label="Total Savings (MXN)" value={kpiData.total_saved} icon={PiggyBank} format="currency" />
                <KPICard label="Avg Completion Rate" value={kpiData.avg_completion} icon={TrendingUp} format="percentage" />
                <KPICard label="AI Forecast Accuracy" value={kpiData.ai_accuracy} icon={Brain} format="percentage" />
                <KPICard label="Group Goals Created" value={kpiData.group_goals_count} icon={UsersIcon} />
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Monthly New Goals Created</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyGoalsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="goals" fill="#00B2FF" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Total Savings Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={savingsOverTimeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => `$${(value / 1000000).toFixed(1)}M`} />
                        <Line type="monotone" dataKey="savings" stroke="#00C67A" strokeWidth={3} dot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* AI Forecast Chart */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>AI Forecast vs. Actual Goal Completion</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={aiAccuracyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="predicted" stackId="1" stroke="#6366F1" fill="#6366F1" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="actual" stackId="2" stroke="#00C67A" fill="#00C67A" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>User & Behavior Analytics</CardTitle>
                  <CardDescription>Understand how Moni users interact with goals, AI forecasts, and savings plans</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User Name</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Total Goals</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead>Avg Savings/Week</TableHead>
                        <TableHead>Completion %</TableHead>
                        <TableHead>AI Accuracy</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userProfilesData.map((user, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{user.user_name}</TableCell>
                          <TableCell>{user.country}</TableCell>
                          <TableCell>{user.joined_date}</TableCell>
                          <TableCell>{user.total_goals}</TableCell>
                          <TableCell>{user.active_goals}</TableCell>
                          <TableCell>${user.avg_savings.toLocaleString()}</TableCell>
                          <TableCell>{user.completion_rate}%</TableCell>
                          <TableCell>{user.ai_accuracy}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Top 10 Saving Users (MXN)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topSaversData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                        <Bar dataKey="amount" fill="#00B2FF" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Goals by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={goalsByCategoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {goalsByCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Goals Tab */}
            <TabsContent value="goals" className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Top Performing Goals</CardTitle>
                  <CardDescription>Track goal categories, average time to completion, and user consistency</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Goal Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Avg Weekly Saving</TableHead>
                        <TableHead>Completion Rate</TableHead>
                        <TableHead>Participants</TableHead>
                        <TableHead>Predicted Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {goalPerformanceData.map((goal, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{goal.goal_name}</TableCell>
                          <TableCell>{goal.goal_type}</TableCell>
                          <TableCell>{goal.category}</TableCell>
                          <TableCell>${goal.avg_weekly.toLocaleString()}</TableCell>
                          <TableCell>{goal.completion_rate}%</TableCell>
                          <TableCell>{goal.participants}</TableCell>
                          <TableCell>{goal.predicted_date}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Goals by Category Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={goalsByCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {goalsByCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Social Tab */}
            <TabsContent value="social" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard label="Total Group Goals" value={kpiData.group_goals_total} icon={UsersIcon} />
                <KPICard label="Active Invitations" value={kpiData.active_invites} icon={Mail} />
                <KPICard label="Weekly Interactions" value={kpiData.weekly_interactions} icon={MessageCircle} />
                <KPICard label="Avg Group Size" value={kpiData.avg_group_size} icon={UserPlus} />
              </div>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Top Group Goals by Activity</CardTitle>
                  <CardDescription>Analyze group dynamics, invitations, and engagement across Moni's ecosystem</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Group Name</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Total Saved</TableHead>
                        <TableHead>Messages Posted</TableHead>
                        <TableHead>Completion %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topActiveGroupsData.map((group, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{group.group_name}</TableCell>
                          <TableCell>{group.members}</TableCell>
                          <TableCell>${group.total_saved.toLocaleString()}</TableCell>
                          <TableCell>{group.messages}</TableCell>
                          <TableCell>{group.completion}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Performance Tab */}
            <TabsContent value="ai" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard label="Forecast Accuracy (All Users)" value={kpiData.global_forecast_accuracy} icon={Brain} format="percentage" />
                <KPICard label="Avg Forecast Error (Days)" value={kpiData.avg_forecast_error} icon={Clock} />
                <KPICard label="Active Learning Updates" value={kpiData.ai_model_updates} icon={Database} />
                <KPICard label="User Satisfaction (AI Advice)" value={kpiData.ai_feedback_score} icon={ThumbsUp} format="rating" />
              </div>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>AI Model Performance Over Time</CardTitle>
                  <CardDescription>Monitor how Moni AI's models perform in forecasting accuracy and financial recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={aiAccuracyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="predicted" stroke="#6366F1" strokeWidth={3} name="Predicted Accuracy" />
                      <Line type="monotone" dataKey="actual" stroke="#00C67A" strokeWidth={3} name="Actual Accuracy" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <BottomNav />
    </>
  );
};

export default AdminAnalytics;
