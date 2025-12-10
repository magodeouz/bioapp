-- Profiles tablosuna tema ayarları için alanlar ekle
-- Bu scripti Supabase SQL Editor'de çalıştır

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS background_image TEXT,
ADD COLUMN IF NOT EXISTS button_color TEXT DEFAULT '#4F46E5',
ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#1a1a1a',
ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS button_shape TEXT DEFAULT 'pill',
ADD COLUMN IF NOT EXISTS is_dark_mode BOOLEAN DEFAULT false;

