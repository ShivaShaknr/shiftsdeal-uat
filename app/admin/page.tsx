'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  Building2,
  Calendar,
  IndianRupee,
  Shield,
  AlertTriangle,
  Check,
  X,
  Eye,
  Search,
  Download,
  Filter,
  TrendingUp,
  BrainCog,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  MoreVertical,
  Clock,
  FileText,
} from 'lucide-react';
import { Button, Card, Badge, Input } from '@/components/ui';
import { formatCurrency, cn } from '@/lib/utils';

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'venues', label: 'Venues', icon: Building2 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'kyc', label: 'KYC Review', icon: Shield },
  { id: 'ai', label: 'AI Insights', icon: BrainCog },
];

const stats = [
  {
    label: 'Total Revenue',
    value: '₹45.2L',
    change: '+18.2%',
    isPositive: true,
    icon: IndianRupee,
    color: 'bg-success/10 text-success',
  },
  {
    label: 'Active Venues',
    value: '156',
    change: '+12',
    isPositive: true,
    icon: Building2,
    color: 'bg-primary/10 text-primary',
  },
  {
    label: 'Total Bookings',
    value: '1,247',
    change: '+8.5%',
    isPositive: true,
    icon: Calendar,
    color: 'bg-info/10 text-info',
  },
  {
    label: 'Active Users',
    value: '3,892',
    change: '+23.1%',
    isPositive: true,
    icon: Users,
    color: 'bg-warning/10 text-warning',
  },
];

const recentBookings = [
  {
    id: 'BK001',
    venue: 'Grand Conference Hall',
    renter: 'Tech Corp Pvt Ltd',
    owner: 'Rahul Sharma',
    date: '2024-01-20',
    amount: 45000,
    status: 'confirmed',
    kycStatus: 'verified',
  },
  {
    id: 'BK002',
    venue: 'Sky Lounge',
    renter: 'Event Masters',
    owner: 'Priya Kapoor',
    date: '2024-01-18',
    amount: 72000,
    status: 'pending',
    kycStatus: 'pending',
  },
  {
    id: 'BK003',
    venue: 'Garden Venue',
    renter: 'Wedding Planning Co',
    owner: 'Amit Patel',
    date: '2024-01-15',
    amount: 150000,
    status: 'completed',
    kycStatus: 'verified',
  },
  {
    id: 'BK004',
    venue: 'Training Center A',
    renter: 'EduTech Solutions',
    owner: 'Sneha Gupta',
    date: '2024-01-12',
    amount: 25000,
    status: 'completed',
    kycStatus: 'verified',
  },
];

const pendingKYC = [
  {
    id: 'KYC001',
    user: 'Event Masters Pvt Ltd',
    type: 'GST Certificate',
    submitted: '2 hours ago',
    booking: 'BK002',
    riskScore: 25,
  },
  {
    id: 'KYC002',
    user: 'Party Planners Inc',
    type: 'Company PAN',
    submitted: '5 hours ago',
    booking: 'BK005',
    riskScore: 45,
  },
  {
    id: 'KYC003',
    user: 'Corporate Events Ltd',
    type: 'GST Certificate',
    submitted: '1 day ago',
    booking: 'BK006',
    riskScore: 15,
  },
];

const venuesList = [
  {
    id: 'V001',
    name: 'Grand Conference Hall',
    owner: 'Rahul Sharma',
    city: 'Mumbai',
    status: 'active',
    bookings: 24,
    revenue: 542000,
    rating: 4.8,
  },
  {
    id: 'V002',
    name: 'Sky Lounge',
    owner: 'Priya Kapoor',
    city: 'Delhi',
    status: 'active',
    bookings: 18,
    revenue: 380000,
    rating: 4.6,
  },
  {
    id: 'V003',
    name: 'Beachside Pavilion',
    owner: 'Vikram Singh',
    city: 'Goa',
    status: 'pending',
    bookings: 0,
    revenue: 0,
    rating: 0,
  },
  {
    id: 'V004',
    name: 'Heritage Hall',
    owner: 'Meera Reddy',
    city: 'Hyderabad',
    status: 'active',
    bookings: 31,
    revenue: 620000,
    rating: 4.9,
  },
];

const usersList = [
  {
    id: 'U001',
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    role: 'owner',
    venues: 2,
    joined: '2023-06-15',
    status: 'active',
  },
  {
    id: 'U002',
    name: 'Tech Corp Pvt Ltd',
    email: 'contact@techcorp.com',
    role: 'renter',
    bookings: 8,
    joined: '2023-08-20',
    status: 'active',
  },
  {
    id: 'U003',
    name: 'Event Masters',
    email: 'info@eventmasters.in',
    role: 'renter',
    bookings: 3,
    joined: '2024-01-10',
    status: 'pending',
  },
];

const aiInsights = [
  {
    type: 'trend',
    title: 'Booking Surge Detected',
    description: 'Conference venues in Bangalore showing 40% increase in bookings this week. Consider promotional campaigns for other cities.',
    priority: 'high',
  },
  {
    type: 'risk',
    title: 'High-Risk Booking Alert',
    description: 'Booking BK007 flagged for unusual attendee count (500+) at a 200-capacity venue. Manual review recommended.',
    priority: 'critical',
  },
  {
    type: 'revenue',
    title: 'Revenue Optimization',
    description: 'Weekend pricing for Mumbai venues is 15% below market average. Suggest owner outreach for pricing adjustment.',
    priority: 'medium',
  },
  {
    type: 'user',
    title: 'Churn Risk',
    description: '12 venue owners haven\'t received bookings in 30 days. Consider engagement campaign or listing optimization tips.',
    priority: 'medium',
  },
];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
      case 'active':
      case 'verified':
        return 'success';
      case 'completed':
        return 'primary';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-error/10 border-error/30 text-error';
      case 'high':
        return 'bg-warning/10 border-warning/30 text-warning';
      case 'medium':
        return 'bg-info/10 border-info/30 text-info';
      default:
        return 'bg-foreground-muted/10 border-border text-foreground-muted';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
                <Badge variant="primary">Admin</Badge>
              </div>
              <p className="text-foreground-muted">Platform management & analytics</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                Export Report
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-primary text-background'
                    : 'text-foreground-muted hover:text-foreground hover:bg-background-light'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', stat.color)}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <div className={cn('flex items-center gap-1 text-sm', stat.isPositive ? 'text-success' : 'text-error')}>
                        {stat.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {stat.change}
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-foreground-muted">{stat.label}</p>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Alerts & Quick Actions */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <h3 className="font-semibold text-foreground">Pending Actions</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-warning" />
                      <span className="text-sm text-foreground">3 KYC documents pending review</span>
                    </div>
                    <Button size="sm" variant="ghost">Review</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-primary" />
                      <span className="text-sm text-foreground">5 new venue listings to approve</span>
                    </div>
                    <Button size="sm" variant="ghost">Review</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-error/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-error" />
                      <span className="text-sm text-foreground">1 high-risk booking flagged</span>
                    </div>
                    <Button size="sm" variant="ghost">View</Button>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-success" />
                  <h3 className="font-semibold text-foreground">Quick Stats</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-background-light rounded-lg">
                    <p className="text-2xl font-bold text-foreground">87%</p>
                    <p className="text-sm text-foreground-muted">Booking success rate</p>
                  </div>
                  <div className="p-3 bg-background-light rounded-lg">
                    <p className="text-2xl font-bold text-foreground">4.6</p>
                    <p className="text-sm text-foreground-muted">Avg. venue rating</p>
                  </div>
                  <div className="p-3 bg-background-light rounded-lg">
                    <p className="text-2xl font-bold text-foreground">₹35K</p>
                    <p className="text-sm text-foreground-muted">Avg. booking value</p>
                  </div>
                  <div className="p-3 bg-background-light rounded-lg">
                    <p className="text-2xl font-bold text-foreground">2.3 days</p>
                    <p className="text-sm text-foreground-muted">Avg. response time</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-foreground">Recent Bookings</h3>
                <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                  View All
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Venue</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Renter</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">KYC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-border/50 hover:bg-background-light">
                        <td className="py-3 px-4 text-sm text-foreground-muted">{booking.id}</td>
                        <td className="py-3 px-4 font-medium text-foreground">{booking.venue}</td>
                        <td className="py-3 px-4 text-foreground-muted">{booking.renter}</td>
                        <td className="py-3 px-4 text-foreground">{formatCurrency(booking.amount)}</td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusColor(booking.status) as any}>{booking.status}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusColor(booking.kycStatus) as any}>{booking.kycStatus}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'kyc' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">KYC Review Queue</h2>
              <Badge variant="warning">{pendingKYC.length} pending</Badge>
            </div>

            <div className="space-y-4">
              {pendingKYC.map((kyc) => (
                <Card key={kyc.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{kyc.user}</p>
                        <p className="text-sm text-foreground-muted">{kyc.type} • Booking {kyc.booking}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-foreground-muted">Risk Score</p>
                        <p className={cn(
                          'font-semibold',
                          kyc.riskScore < 30 ? 'text-success' : kyc.riskScore < 50 ? 'text-warning' : 'text-error'
                        )}>
                          {kyc.riskScore}%
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-foreground-muted">Submitted</p>
                        <p className="text-foreground">{kyc.submitted}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                          View
                        </Button>
                        <button className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors">
                          <Check className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'venues' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                <input
                  type="text"
                  placeholder="Search venues..."
                  className="w-full bg-background-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
                Filters
              </Button>
            </div>

            <Card className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-background-light">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Venue</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Owner</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">City</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Bookings</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Revenue</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Rating</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-foreground-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {venuesList.map((venue) => (
                    <tr key={venue.id} className="border-b border-border/50 hover:bg-background-light">
                      <td className="py-3 px-4 font-medium text-foreground">{venue.name}</td>
                      <td className="py-3 px-4 text-foreground-muted">{venue.owner}</td>
                      <td className="py-3 px-4 text-foreground-muted">{venue.city}</td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusColor(venue.status) as any}>{venue.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-foreground">{venue.bookings}</td>
                      <td className="py-3 px-4 text-foreground">{formatCurrency(venue.revenue)}</td>
                      <td className="py-3 px-4 text-foreground">{venue.rating || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <button className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-light">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full bg-background-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                {['All', 'Owners', 'Renters'].map((filter) => (
                  <button
                    key={filter}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      filter === 'All'
                        ? 'bg-primary text-background'
                        : 'bg-background-card text-foreground-muted hover:text-foreground'
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <Card className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-background-light">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">User</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Activity</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Joined</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-foreground-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((user) => (
                    <tr key={user.id} className="border-b border-border/50 hover:bg-background-light">
                      <td className="py-3 px-4 font-medium text-foreground">{user.name}</td>
                      <td className="py-3 px-4 text-foreground-muted">{user.email}</td>
                      <td className="py-3 px-4">
                        <Badge variant={user.role === 'owner' ? 'primary' : 'default'}>{user.role}</Badge>
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {user.role === 'owner' ? `${user.venues} venues` : `${user.bookings} bookings`}
                      </td>
                      <td className="py-3 px-4 text-foreground-muted">{user.joined}</td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusColor(user.status) as any}>{user.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-light">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </motion.div>
        )}

        {activeTab === 'ai' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2">
              <BrainCog className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">AI-Powered Insights</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {aiInsights.map((insight, index) => (
                <Card key={index} className={cn('p-4 border', getPriorityColor(insight.priority))}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                      {insight.type === 'trend' && <TrendingUp className="w-5 h-5" />}
                      {insight.type === 'risk' && <AlertTriangle className="w-5 h-5" />}
                      {insight.type === 'revenue' && <IndianRupee className="w-5 h-5" />}
                      {insight.type === 'user' && <Users className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-foreground">{insight.title}</h3>
                        <Badge variant={insight.priority === 'critical' ? 'error' : insight.priority === 'high' ? 'warning' : 'default'}>
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground-muted">{insight.description}</p>
                      <Button variant="ghost" size="sm" className="mt-2" rightIcon={<ChevronRight className="w-4 h-4" />}>
                        Take Action
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4">AI Analysis Summary</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-success/10 rounded-lg">
                  <p className="text-3xl font-bold text-success">92%</p>
                  <p className="text-sm text-foreground-muted">KYC Verification Rate</p>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <p className="text-3xl font-bold text-primary">18</p>
                  <p className="text-sm text-foreground-muted">Avg. AI Risk Score</p>
                </div>
                <div className="text-center p-4 bg-warning/10 rounded-lg">
                  <p className="text-3xl font-bold text-warning">3</p>
                  <p className="text-sm text-foreground-muted">Flagged Bookings Today</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'bookings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  className="w-full bg-background-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map((filter) => (
                  <button
                    key={filter}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      filter === 'All'
                        ? 'bg-primary text-background'
                        : 'bg-background-card text-foreground-muted hover:text-foreground'
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <Card className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-background-light">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Venue</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Renter</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Owner</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-foreground-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-border/50 hover:bg-background-light">
                      <td className="py-3 px-4 text-sm text-foreground-muted">{booking.id}</td>
                      <td className="py-3 px-4 font-medium text-foreground">{booking.venue}</td>
                      <td className="py-3 px-4 text-foreground-muted">{booking.renter}</td>
                      <td className="py-3 px-4 text-foreground-muted">{booking.owner}</td>
                      <td className="py-3 px-4 text-foreground-muted">{booking.date}</td>
                      <td className="py-3 px-4 text-foreground">{formatCurrency(booking.amount)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusColor(booking.status) as any}>{booking.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
