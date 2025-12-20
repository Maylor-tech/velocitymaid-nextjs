'use client';

type BookingStatus = 
  | 'pending' 
  | 'assigned' 
  | 'confirmed' 
  | 'on_the_way' 
  | 'completed' 
  | 'cancelled' 
  | 'cancelled_by_customer';

interface BookingStatusBadgeProps {
  status: BookingStatus;
  size?: 'sm' | 'md';
}

export default function BookingStatusBadge({ status, size = 'md' }: BookingStatusBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'on_the_way':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'cancelled_by_customer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'assigned':
        return 'Assigned';
      case 'confirmed':
        return 'Confirmed';
      case 'on_the_way':
        return 'On The Way';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'cancelled_by_customer':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClasses[size]} ${getStatusColor(status)}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}




