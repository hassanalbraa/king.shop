import type { ImagePlaceholder } from './placeholder-images';
import { PlaceHolderImages } from './placeholder-images';
import { User as FirebaseUser } from 'firebase/auth';

// This is the shape of our user profile data stored in Firestore
export interface UserProfile {
  id: string; // Corresponds to Firebase Auth UID
  username: string;
  balance: number;
  isAdmin: boolean;
}

// This combines Firebase's user object with our custom profile
export type User = FirebaseUser & UserProfile;

export interface GameOffer {
  id: string;
  name: string;
  description: string;
  price: number;
  image: ImagePlaceholder;
}

// Mock Data - We will move this to Firestore setup or a seeding script
export const initialOffers: GameOffer[] = [
  {
    id: 'pubg-1',
    name: 'PUBG',
    description: '60 شدة',
    price: 3500,
    image: PlaceHolderImages.find(img => img.id === 'game-pubg')!,
  },
  {
    id: 'pubg-2',
    name: 'PUBG',
    description: '120 شدة',
    price: 7000,
    image: PlaceHolderImages.find(img => img.id === 'game-pubg')!,
  },
  {
    id: 'pubg-3',
    name: 'PUBG',
    description: '240 شدة',
    price: 14000,
    image: PlaceHolderImages.find(img => img.id === 'game-pubg')!,
  },
  {
    id: 'ff-1',
    name: 'Free Fire',
    description: '100 💎',
    price: 3400,
    image: PlaceHolderImages.find(img => img.id === 'game-1')!,
  },
  {
    id: 'ff-2',
    name: 'Free Fire',
    description: '210 💎',
    price: 6800,
    image: PlaceHolderImages.find(img => img.id === 'game-1')!,
  },
  {
    id: 'ff-3',
    name: 'Free Fire',
    description: '530 💎',
    price: 17000,
    image: PlaceHolderImages.find(img => img.id === 'game-1')!,
  },
  {
    id: 'ff-4',
    name: 'Free Fire',
    description: '1080 💎',
    price: 34000,
    image: PlaceHolderImages.find(img => img.id === 'game-1')!,
  },
  {
    id: 'ff-5',
    name: 'Free Fire',
    description: '2200 💎',
    price: 70000,
    image: PlaceHolderImages.find(img => img.id === 'game-1')!,
  },
  {
    id: 'ff-6',
    name: 'Free Fire',
    description: 'عضوية أسبوعية 💎',
    price: 8000,
    image: PlaceHolderImages.find(img => img.id === 'game-1')!,
  },
  {
    id: 'ff-7',
    name: 'Free Fire',
    description: 'عضوية شهرية 💎',
    price: 38500,
    image: PlaceHolderImages.find(img => img.id === 'game-1')!,
  },
  {
    id: 'ff-8',
    name: 'Free Fire',
    description: 'باقة تصريح مستوى 6 (120💎)',
    price: 2000,
    image: PlaceHolderImages.find(img => img.id === 'game-1')!,
  },
  {
    id: 'ff-9',
    name: 'Free Fire',
    description: 'باقة تصريح مستوى 10 (200💎)',
    price: 3200,
    image: PlaceHolderImages.find(img => img.id === 'game-1')!,
  },
  {
    id: 'ff-10',
    name: 'Free Fire',
    description: 'باقة تصريح مستوى 15 (200💎)',
    price: 3200,
    image: PlaceHolderImages.find(img => img.id === 'game-1')!,
  },
  {
    id: 'ff-11',
    name: 'Free Fire',
    description: 'باقة تصريح مستوى 20 (200💎)',
    price: 3200,
    image: PlaceHolderImages.find(img => img.id === 'game-1')!,
  },
  {
    id: 'ff-12',
    name: 'Free Fire',
    description: 'باقة تصريح مستوى 25 (200💎)',
    price: 3200,
    image: PlaceHolderImages.find(img => img.id === 'game-1')!,
  },
  {
    id: 'ff-13',
    name: 'Free Fire',
    description: 'باقة تصريح مستوى 30 (200💎)',
    price: 3200,
    image: PlaceHolderImages.find(img => img.id === 'game-1')!,
  },
  {
    id: 'ff-14',
    name: 'Free Fire',
    description: 'باقة تصريح مستوى 35 (350💎)',
    price: 4500,
    image: PlaceHolderImages.find(img => img.id === 'game-1')!,
  },
  {
    id: 'garena-1',
    name: 'اكواد جارينا',
    description: '10$ جارينا',
    price: 33700,
    image: PlaceHolderImages.find(img => img.id === 'game-garena')!,
  },
  {
    id: 'garena-2',
    name: 'اكواد جارينا',
    description: '20$ جارينا',
    price: 33600,
    image: PlaceHolderImages.find(img => img.id === 'game-garena')!,
  },
  {
    id: 'garena-3',
    name: 'اكواد جارينا',
    description: '50$ جارينا',
    price: 33300,
    image: PlaceHolderImages.find(img => img.id === 'game-garena')!,
  },
  {
    id: 'tiktok-1',
    name: 'عروض التيك توك',
    description: '70 🪙',
    price: 3500,
    image: PlaceHolderImages.find(img => img.id === 'game-tiktok')!,
  },
  {
    id: 'tiktok-2',
    name: 'عروض التيك توك',
    description: '100 🪙',
    price: 5250,
    image: PlaceHolderImages.find(img => img.id === 'game-tiktok')!,
  },
  {
    id: 'tiktok-3',
    name: 'عروض التيك توك',
    description: '140 🪙',
    price: 7000,
    image: PlaceHolderImages.find(img => img.id === 'game-tiktok')!,
  },
  {
    id: 'tiktok-4',
    name: 'عروض التيك توك',
    description: '200 🪙',
    price: 10500,
    image: PlaceHolderImages.find(img => img.id === 'game-tiktok')!,
  },
  {
    id: 'tiktok-5',
    name: 'عروض التيك توك',
    description: '500 🪙',
    price: 26000,
    image: PlaceHolderImages.find(img => img.id === 'game-tiktok')!,
  },
  {
    id: 'tiktok-6',
    name: 'عروض التيك توك',
    description: '700 🪙',
    price: 36000,
    image: PlaceHolderImages.find(img => img.id === 'game-tiktok')!,
  },
];
