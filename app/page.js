import { supabase, mediaUrl } from '../lib/supabase';
import { Gallery, Socials, ContactForm } from '../components/Parts';
export const dynamic = 'force-dynamic';

const SERVICES = [
  ['AI-Generated Product Images', 'Studio-quality product visuals created with AI, tailored to your brand.'],
  ['Food Product Advertisements', 'Mouth-watering ad creatives that make your food products stand out.'],
  ['Cinematic AI Video Ads', 'Short, scroll-stopping AI video ads with a cinematic look.'],
  ['Commercial Video Editing', 'Clean, fast-paced edits for ads, social media and product promos.'],
];

export default async function Home() {
  const [{ data: items }, { data: links }] = await Promise.all([
    supabase.from('portfolio_items').select('*').eq('published', true).or
