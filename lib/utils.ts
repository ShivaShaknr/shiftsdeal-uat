import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRupeeNumber(amount: number): string {
  return Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function formatRupeeHtml(amount: number): string {
  return `<span style="font-size:12px">₹</span> <span style="font-size:15px;font-weight:700">${formatRupeeNumber(amount)}</span>`;
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export const venueTypes = [
  { value: 'training-hall', label: 'Training Hall', icon: '🎓' },
  { value: 'auditorium', label: 'Auditorium', icon: '🎭' },
  { value: 'conference-room', label: 'Conference Room', icon: '💼' },
  { value: 'workshop-space', label: 'Workshop Space', icon: '🔧' },
  { value: 'banquet-hall', label: 'Banquet Hall', icon: '🎉' },
  { value: 'hotel-venue', label: 'Hotel Venue', icon: '🏨' },
  { value: 'institutional', label: 'Institutional', icon: '🏛️' },
  { value: 'private', label: 'Private Venue', icon: '🏠' },
];

export const amenitiesList = [
  'WiFi',
  'Projector',
  'Whiteboard',
  'AC',
  'Parking',
  'Catering',
  'Sound System',
  'Stage',
  'Green Room',
  'Breakout Rooms',
  'Video Conferencing',
  'Wheelchair Access',
  'Power Backup',
  'Security',
  'Restrooms',
  'Kitchen Access',
];

export const amenities = [
  { value: 'wifi', label: 'WiFi' },
  { value: 'projector', label: 'Projector' },
  { value: 'whiteboard', label: 'Whiteboard' },
  { value: 'ac', label: 'AC' },
  { value: 'parking', label: 'Parking' },
  { value: 'catering', label: 'Catering' },
  { value: 'sound-system', label: 'Sound System' },
  { value: 'stage', label: 'Stage' },
  { value: 'green-room', label: 'Green Room' },
  { value: 'breakout-rooms', label: 'Breakout Rooms' },
  { value: 'video-conferencing', label: 'Video Conferencing' },
  { value: 'wheelchair-access', label: 'Wheelchair Access' },
  { value: 'power-backup', label: 'Power Backup' },
  { value: 'security', label: 'Security' },
  { value: 'restrooms', label: 'Restrooms' },
  { value: 'kitchen-access', label: 'Kitchen Access' },
];

export const cities = [
  { value: 'mumbai', label: 'Mumbai' },
  { value: 'delhi', label: 'Delhi' },
  { value: 'bangalore', label: 'Bangalore' },
  { value: 'hyderabad', label: 'Hyderabad' },
  { value: 'chennai', label: 'Chennai' },
  { value: 'kolkata', label: 'Kolkata' },
  { value: 'pune', label: 'Pune' },
  { value: 'ahmedabad', label: 'Ahmedabad' },
  { value: 'jaipur', label: 'Jaipur' },
  { value: 'lucknow', label: 'Lucknow' },
  { value: 'chandigarh', label: 'Chandigarh' },
  { value: 'gurgaon', label: 'Gurgaon' },
  { value: 'noida', label: 'Noida' },
  { value: 'goa', label: 'Goa' },
  { value: 'kochi', label: 'Kochi' },
];
