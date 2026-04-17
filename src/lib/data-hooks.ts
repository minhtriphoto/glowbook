import { useEffect, useState } from 'react';
import { useAuth } from './auth-context';
import { toast } from 'sonner';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  ownerId: string;
  createdAt: number;
}

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  date: number; 
  serviceType: string;
  price: number;
  location: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  ownerId: string;
  updatedAt: number;
}

export interface Service {
  id: string;
  name: string;
  basePrice: number;
  duration: number;
  ownerId: string;
}

export function useClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(data.clients || []);
    } catch (e) {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user]);

  const addClient = async (client: Omit<Client, 'id' | 'ownerId' | 'createdAt'>) => {
    if (!user) return;
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client)
      });
      if (!res.ok) throw new Error('API Error');
      fetchClients();
    } catch (e) { toast.error('Failed to add client'); }
  };

  return { clients, loading, addClient, fetchClients };
}

export function useBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (e) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const addBooking = async (booking: Omit<Booking, 'id' | 'ownerId' | 'updatedAt'>) => {
    if (!user) return;
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking)
      });
      if (!res.ok) throw new Error('API Error');
      fetchBookings();
    } catch (e) { toast.error('Failed to add booking'); }
  };

  const updateBookingStatus = async (id: string, status: Booking['status']) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/bookings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('API Error');
      fetchBookings();
    } catch (e) { toast.error('Failed to update booking status'); }
  };

  return { bookings, loading, addBooking, updateBookingStatus, fetchBookings };
}

export function useServices() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock services since not implemented in backend fully yet but keeping interface
  const fetchServices = async () => {
    if (!user) return;
    setServices([]);
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, [user]);

  const addService = async (service: Omit<Service, 'id' | 'ownerId'>) => {
    // Implement API call when ready
    fetchServices();
  };

  return { services, loading, addService, fetchServices };
}
