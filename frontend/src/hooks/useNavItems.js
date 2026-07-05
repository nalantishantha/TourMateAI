// Primary navigation items, shared by the desktop navbar and mobile drawer.
//
// Admin visibility: the backend doesn't return a `role` yet, so the Admin link
// stays hidden for everyone until the Users table grows one. No frontend
// change will be needed beyond the backend sending user.role === 'admin'.

import { useAuth } from '../context/AuthContext'

export default function useNavItems() {
  const { user } = useAuth()
  const items = [
    { to: '/explore', label: 'Explore' },
    { to: '/itineraries', label: 'Itineraries' },
    { to: '/chat', label: 'Chat' },
  ]
  if (user?.role === 'admin') items.push({ to: '/admin', label: 'Admin' })
  return items
}
