import {
  Utensils, Pizza, Coffee, Car, Bike, Bus, Plane, Home,
  ShoppingBag, Shirt, Dumbbell, Heart, Music, Gamepad2,
  Smartphone, BookOpen, Zap, Wrench, Gift, Users, Tag, Wallet, Box, Star,
} from 'lucide-react'

export const CATEGORY_ICONS = {
  utensils: Utensils,
  pizza: Pizza,
  coffee: Coffee,
  car: Car,
  bike: Bike,
  bus: Bus,
  plane: Plane,
  home: Home,
  'shopping-bag': ShoppingBag,
  shirt: Shirt,
  dumbbell: Dumbbell,
  heart: Heart,
  music: Music,
  gamepad: Gamepad2,
  smartphone: Smartphone,
  book: BookOpen,
  zap: Zap,
  wrench: Wrench,
  gift: Gift,
  users: Users,
  tag: Tag,
  wallet: Wallet,
  box: Box,
  star: Star,
}

export const ICON_OPTIONS = Object.keys(CATEGORY_ICONS)

export function getIcon(iconName, props = {}) {
  const Component = CATEGORY_ICONS[iconName] ?? Box
  return <Component {...props} />
}
