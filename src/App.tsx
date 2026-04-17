import React, { useState } from 'react';
import { useAuth } from './lib/auth-context';
import { useClients, useBookings, useServices, Booking, Client } from './lib/data-hooks';
import { Calendar } from '../components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { format, startOfMonth, endOfMonth, isSameDay, startOfDay } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Users, 
  DollarSign, 
  Plus, 
  Phone, 
  MapPin, 
  LayoutDashboard, 
  Settings,
  LogOut,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function App() {
  const { user, loading: authLoading, signIn, logout } = useAuth();
  const { clients, addClient } = useClients();
  const { bookings, addBooking, updateBookingStatus } = useBookings();
  const { services, addService } = useServices();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  if (authLoading) return <div className="flex h-screen items-center justify-center font-sans">Loading...</div>;

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-paper p-4 font-sans text-ink">
        <div className="mb-8 text-center">
          <h1 className="text-[42px] font-serif font-light tracking-tight text-ink mb-2">GlowBook</h1>
          <p className="text-ink/50 uppercase tracking-widest text-[10px]">Prestige Makeup Artist Suite</p>
        </div>
        <Card className="w-full max-w-md border border-border-editorial shadow-none bg-white rounded-none overflow-hidden">
          <CardHeader className="pt-10 pb-6 text-center">
            <CardTitle className="font-serif italic text-2xl font-normal">Welcome Back</CardTitle>
            <CardDescription className="text-ink/60">Manage your artistry with elegance and precision.</CardDescription>
          </CardHeader>
          <CardContent className="pb-10 px-10">
            <Button 
              onClick={signIn} 
              className="w-full bg-ink hover:bg-ink/90 text-white py-6 rounded-none transition-all duration-300 uppercase tracking-widest text-[11px]"
            >
              Enter using Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const revenueData = [
    { name: 'Bridal', value: bookings.filter(b => b.serviceType === 'Bridal').reduce((acc, b) => acc + b.price, 0) },
    { name: 'Editorial', value: bookings.filter(b => b.serviceType === 'Editorial').reduce((acc, b) => acc + b.price, 0) },
    { name: 'Party', value: bookings.filter(b => b.serviceType === 'Party').reduce((acc, b) => acc + b.price, 0) },
  ].filter(d => d.value > 0);

  const stats = {
    monthlyRevenue: bookings.reduce((acc, b) => acc + b.price, 0),
    activeClients: clients.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    completedJobs: bookings.filter(b => b.status === 'completed').length,
  };

  const getDayBookings = (date: Date) => {
    return bookings.filter(b => {
      const bDate = new Date(b.date);
      return isSameDay(bDate, date);
    });
  };

  return (
    <div className="min-h-screen bg-paper font-sans text-ink selection:bg-accent-soft selection:text-ink">
      {/* Sidebar / Navigation */}
      <div className="fixed left-0 top-0 bottom-0 w-[240px] bg-white border-r border-border-editorial px-[30px] py-[40px] flex flex-col z-10 hidden md:flex">
        <div className="mb-[60px]">
          <h2 className="text-[24px] font-serif italic tracking-[-0.5px] text-ink">Luxe & Glow.</h2>
        </div>
        
        <div className="space-y-6 flex-1">
          <NavItem icon={<LayoutDashboard size={18}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<CalendarIcon size={18}/>} label="Calendar" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
          <NavItem icon={<Users size={18}/>} label="Client List" active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} />
        </div>

        <div className="pt-6 border-t border-border-editorial">
          <div className="flex items-center gap-3 mb-6 px-3">
            <Avatar className="h-9 w-9 border border-border-editorial rounded-full">
              <AvatarImage src={user.photoURL || ''} />
              <AvatarFallback className="bg-paper">{user.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate">{user.displayName}</p>
              <p className="text-[11px] text-ink/50 truncate tracking-tight">{user.email}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={logout} className="w-full justify-start gap-2 text-ink/60 hover:text-ink hover:bg-paper px-3 rounded-none text-[13px] uppercase tracking-widest">
            <LogOut size={16} /> Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="md:ml-[240px] p-[40px] md:px-[50px] flex flex-col gap-[40px]">
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-[40px]">
            <header className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div className="welcome">
                <h1 className="font-serif text-[42px] font-light leading-none mb-2">Studio Overview</h1>
                <p className="text-[14px] text-ink/50">Welcome back. Here's a summary of your studio's performance.</p>
              </div>
              
              <div className="flex gap-[40px]">
                <div className="text-right">
                  <div className="font-serif text-[28px]">${stats.monthlyRevenue.toLocaleString()}</div>
                  <div className="text-[10px] uppercase tracking-[0.05em] opacity-50">Month Revenue</div>
                </div>
                <div className="text-right">
                  <div className="font-serif text-[28px]">{stats.pendingBookings}</div>
                  <div className="text-[10px] uppercase tracking-[0.05em] opacity-50">Pending Jobs</div>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-[40px] flex-1">
              {/* Revenue Chart */}
              <Card className="bg-white border border-border-editorial rounded-none shadow-none p-6 flex flex-col">
                <CardHeader className="px-0 pt-0 pb-5">
                  <CardTitle className="font-serif italic text-[18px] font-normal flex justify-between items-center">
                    <span>Revenue by Service</span>
                    <span className="font-sans font-normal text-[11px] uppercase tracking-[0.1em] opacity-40">Year to Date</span>
                  </CardTitle>
                </CardHeader>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#1A1A1A', fontSize: 12, opacity: 0.5}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#1A1A1A', fontSize: 12, opacity: 0.5}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '0', border: '1px solid rgba(26,26,26,0.12)', boxShadow: 'none', padding: '12px' }}
                        cursor={{ fill: '#F9F7F5' }}
                      />
                      <Bar dataKey="value" fill="#D4A373" radius={[0, 0, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Recent Bookings */}
              <div className="flex flex-col gap-[40px]">
                <Card className="border border-border-editorial rounded-none shadow-none bg-white flex flex-col p-[24px]">
                  <CardHeader className="p-0 mb-[20px]">
                    <CardTitle className="font-serif italic text-[18px] font-normal flex justify-between items-center">
                      <span>Upcoming Jobs</span>
                      <span className="font-sans font-normal text-[11px] uppercase tracking-[0.1em] opacity-40">October</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex flex-col">
                      {bookings.slice(0, 5).sort((a,b) => a.date - b.date).map((booking) => (
                        <div key={booking.id} className="py-[16px] border-b border-[#f5f5f5] flex items-center last:border-0 hover:bg-paper/50 transition-colors">
                          <div className="font-serif italic text-[14px] w-[80px]">
                            {format(new Date(booking.date), 'hh:mm a')}
                          </div>
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="font-semibold text-[14px]">{booking.clientName}</div>
                            <div className="text-[12px] opacity-60 capitalize truncate">
                              {booking.serviceType} &bull; {booking.location}
                            </div>
                          </div>
                          <div className="ml-auto">
                            <span className="px-[8px] py-[4px] bg-paper rounded-[20px] text-[10px] uppercase tracking-[0.05em]">
                              {booking.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {bookings.length === 0 && <p className="text-[13px] opacity-50 italic py-4">No appointments scheduled.</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* CALENDAR VIEW */}
        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-[40px] flex-1">
            <div className="flex flex-col gap-8">
              <header>
                <h1 className="font-serif text-[42px] font-light leading-none mb-2">Calendar</h1>
                <p className="text-[14px] text-ink/50">Detailed schedule and appointment management.</p>
              </header>
              <Card className="border border-border-editorial shadow-none rounded-none p-4 bg-white">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-none bg-white"
                  classNames={{
                    day_selected: "bg-accent-soft text-ink hover:bg-accent-gold hover:text-white focus:bg-accent-soft focus:text-ink rounded-none",
                    day_today: "bg-paper text-ink rounded-none",
                    day: "h-10 w-10 p-0 font-normal rounded-none hover:bg-paper transition-colors"
                  }}
                />
              </Card>
              <NewBookingDialog onBooked={() => toast.success("Booking created!")} clients={clients} services={services} />
            </div>

            <div className="flex flex-col h-full">
              <Card className="border border-border-editorial shadow-none rounded-none bg-white min-h-[500px]">
                <CardHeader className="p-8 border-b border-border-editorial">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-serif italic text-2xl font-normal">{selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Schedule'}</CardTitle>
                      <CardDescription className="opacity-50">Appointments for this day</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                   <div className="flex flex-col">
                     {selectedDate && getDayBookings(selectedDate).length > 0 ? (
                       getDayBookings(selectedDate).map((booking) => (
                         <div key={booking.id} className="py-[16px] border-b border-[#f5f5f5] flex items-center justify-between group">
                            <div className="flex items-center gap-6">
                               <div className="font-serif italic text-[16px] w-[80px]">
                                 {format(new Date(booking.date), 'h:mm a')}
                               </div>
                               <div className="space-y-1">
                                 <div className="flex items-center gap-3">
                                   <p className="font-semibold text-[15px]">{booking.clientName}</p>
                                   <span className="px-[8px] py-[4px] bg-paper rounded-[20px] text-[10px] uppercase tracking-[0.05em]">
                                     {booking.status}
                                   </span>
                                 </div>
                                 <div className="flex items-center gap-4 text-[13px] opacity-60">
                                   <span className="flex items-center gap-1.5"><MapPin size={12}/> {booking.location}</span>
                                   <span>&bull;</span>
                                   <span>{booking.serviceType}</span>
                                 </div>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="font-serif text-[24px] font-semibold mb-2">${booking.price}</p>
                               <div className="flex justify-end gap-2">
                                  {booking.status !== 'completed' && (
                                    <Button size="sm" variant="outline" className="rounded-none border-border-editorial h-8 px-4 text-[11px] uppercase tracking-widest hover:bg-paper" onClick={() => updateBookingStatus(booking.id, 'completed')}>Complete</Button>
                                  )}
                                  {booking.status !== 'cancelled' && (
                                    <Button size="sm" variant="ghost" className="rounded-none h-8 px-4 text-[11px] uppercase tracking-widest text-[#D4A373] hover:text-ink hover:bg-paper" onClick={() => updateBookingStatus(booking.id, 'cancelled')}>Cancel</Button>
                                  )}
                               </div>
                            </div>
                         </div>
                       ))
                     ) : (
                       <div className="flex flex-col items-center justify-center py-20 text-stone-400 italic">
                          <CalendarIcon size={40} className="mb-4 opacity-10" />
                          <p>No appointments scheduled for this date.</p>
                       </div>
                     )}
                   </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* CLIENT LIST VIEW */}
        {activeTab === 'clients' && (
          <div className="flex flex-col gap-[40px] flex-1">
            <header className="flex items-end justify-between">
              <div>
                <h1 className="font-serif text-[42px] font-light leading-none mb-2">Client Registry</h1>
                <p className="text-[14px] text-ink/50">Manage your relationships and service history.</p>
              </div>
              <NewClientDialog onCreated={() => toast.success("Client added!")} />
            </header>

            <Card className="border border-border-editorial shadow-none rounded-none bg-white overflow-hidden p-[24px]">
              <CardTitle className="font-serif italic text-[18px] font-normal flex justify-between items-center mb-6">
                 <span>Client List</span>
                 <span className="font-sans font-normal text-[11px] uppercase tracking-[0.1em] opacity-40">Recent</span>
              </CardTitle>
              <div className="text-[13px]">
                  {clients.map((client) => (
                    <div key={client.id} className="flex justify-between py-[12px] border-b border-[#f5f5f5] hover:bg-paper/30 transition-colors">
                      <div className="flex-1 flex items-center gap-4 pl-4">
                        <Avatar className="h-8 w-8 rounded-full border border-border-editorial">
                          <AvatarFallback className="bg-paper text-ink text-[10px] uppercase tracking-widest">{client.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="font-semibold">{client.name}</div>
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                          <p className="font-mono opacity-50 flex items-center gap-2 text-[12px]"><Phone size={10}/> {client.phone}</p>
                      </div>
                      <div className="flex-1 flex flex-col justify-center text-[12px]">
                         <p className="text-ink/60 truncate max-w-[200px]">{client.notes || 'No notes'}</p>
                      </div>
                      <div className="flex-1 flex flex-col justify-center items-end pr-4 text-[10px] uppercase tracking-[0.1em] opacity-40">
                          Added {format(client.createdAt ? new Date(client.createdAt) : new Date(), 'MMM yy')}
                      </div>
                    </div>
                  ))}
                  {clients.length === 0 && (
                    <div className="h-40 flex items-center justify-center text-ink/40 italic text-sm">
                      No clients found. Start by adding your first client.
                    </div>
                  )}
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border-editorial h-16 px-6 flex items-center justify-around z-50">
        <MobileNavItem icon={<LayoutDashboard size={20}/>} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <MobileNavItem icon={<CalendarIcon size={20}/>} active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
        <MobileNavItem icon={<Users size={20}/>} active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} />
        <button onClick={logout} className="p-2 text-ink/40"><LogOut size={20}/></button>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`relative w-full flex items-center gap-3 px-3 py-[12px] cursor-pointer text-[13px] uppercase tracking-[0.1em] font-medium transition-all ${
        active ? 'opacity-100 text-accent-gold before:content-["•"] before:absolute before:-left-[15px]' : 'opacity-60 hover:opacity-100'
      }`}
    >
      {label}
    </div>
  );
}

function MobileNavItem({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`p-2 transition-all ${active ? 'text-accent-gold' : 'text-ink/40'}`}
    >
      {icon}
    </button>
  );
}

function StatCard({ label, value, icon, trend }: { label: string, value: string, icon: React.ReactNode, trend?: string }) {
  return (
    <div className="text-right flex flex-col">
      <div className="font-serif text-[28px]">{value}</div>
      <div className="text-[10px] uppercase tracking-[0.05em] opacity-50">{label}</div>
    </div>
  );
}

function NewClientDialog({ onCreated }: { onCreated: () => void }) {
  const { addClient } = useClients();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', notes: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addClient(formData);
    onCreated();
    setOpen(false);
    setFormData({ name: '', phone: '', email: '', notes: '' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-ink hover:bg-ink/90 text-white gap-2 rounded-none px-6 uppercase tracking-widest text-[11px] h-10">
          New Client
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-none border-border-editorial shadow-2xl p-[40px] max-w-md bg-paper">
        <DialogHeader className="mb-6">
          <DialogTitle className="font-serif italic text-2xl font-normal">New Client</DialogTitle>
          <p className="text-ink/60 text-[13px]">Add a client to your studio database.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Full Name</Label>
            <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="rounded-none border-border-editorial bg-white py-6 text-[13px] shadow-none" placeholder="Eleanor Vance" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Phone</Label>
              <Input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="rounded-none border-border-editorial bg-white py-6 text-[13px] shadow-none" placeholder="+1 234..." />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Email</Label>
              <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="rounded-none border-border-editorial bg-white py-6 text-[13px] shadow-none" placeholder="e.vance@example.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Notes (Private)</Label>
            <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="rounded-none border-border-editorial bg-white py-6 text-[13px] shadow-none" placeholder="Skin type, preferences..." />
          </div>
          <Button type="submit" className="w-full bg-ink hover:bg-ink/90 text-white rounded-none h-12 uppercase tracking-widest text-[11px] mt-4">Save client record</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewBookingDialog({ onBooked, clients, services }: { onBooked: () => void, clients: Client[], services: any[] }) {
  const { addBooking } = useBookings();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    clientId: '', 
    serviceType: 'Bridal', 
    price: '', 
    location: '', 
    date: new Date().toISOString().substring(0, 16) 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === formData.clientId);
    if (!client) return;
    
    await addBooking({
      clientId: formData.clientId,
      clientName: client.name,
      serviceType: formData.serviceType,
      price: Number(formData.price),
      location: formData.location || 'In-Studio',
      status: 'pending',
      date: new Date(formData.date).getTime()
    });
    onBooked();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-border-editorial hover:border-ink hover:bg-paper rounded-none h-12 uppercase tracking-widest text-[11px] transition-all">
          Schedule Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-none border-border-editorial shadow-2xl p-[40px] max-w-md bg-paper">
        <DialogHeader className="mb-6">
          <DialogTitle className="font-serif italic text-2xl font-normal">New Booking</DialogTitle>
          <p className="text-ink/60 text-[13px]">Schedule a new session for your client.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Select Client</Label>
            <Select onValueChange={(val) => setFormData({...formData, clientId: val})}>
              <SelectTrigger className="rounded-none border-border-editorial bg-white py-6 h-auto shadow-none">
                <SelectValue placeholder="Search by name" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border-editorial">
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id} className="rounded-none cursor-pointer">{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Service</Label>
              <Select onValueChange={(val) => setFormData({...formData, serviceType: val})}>
                <SelectTrigger className="rounded-none border-border-editorial bg-white py-6 h-auto shadow-none">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-border-editorial">
                  <SelectItem value="Bridal" className="rounded-none cursor-pointer">Bridal</SelectItem>
                  <SelectItem value="Editorial" className="rounded-none cursor-pointer">Editorial</SelectItem>
                  <SelectItem value="Party" className="rounded-none cursor-pointer">Party</SelectItem>
                  <SelectItem value="Masterclass" className="rounded-none cursor-pointer">Masterclass</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Price ($)</Label>
              <Input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="rounded-none border-border-editorial bg-white py-6 text-[13px] shadow-none" placeholder="0.00" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-ink/40">DateTime</Label>
            <Input type="datetime-local" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="rounded-none border-border-editorial bg-white py-6 text-[13px] shadow-none" />
          </div>
          <Button type="submit" className="w-full bg-ink hover:bg-ink/90 text-white rounded-none h-12 uppercase tracking-widest text-[11px] mt-4 px-6">Confirm booking</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
