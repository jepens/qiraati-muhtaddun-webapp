-- Create tables
create table if not exists activities (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  date date not null,
  time time not null,
  location text not null,
  category text not null check (category in ('kajian', 'sholat', 'sosial', 'pendidikan', 'lainnya')),
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists albums (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists photos (
  id uuid default gen_random_uuid() primary key,
  album_id uuid not null references albums(id) on delete cascade,
  image_url text not null,
  caption text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies
alter table activities enable row level security;
alter table albums enable row level security;
alter table photos enable row level security;

create policy "Allow public read access" on activities
  for select
  to public
  using (true);

create policy "Allow authenticated users to create activities" on activities
  for insert
  to authenticated
  with check (true);

create policy "Allow authenticated users to update activities" on activities
  for update
  to authenticated
  using (true);

create policy "Allow authenticated users to delete activities" on activities
  for delete
  to authenticated
  using (true);

create policy "Allow public read access" on albums
  for select
  to public
  using (true);

create policy "Allow authenticated users to create albums" on albums
  for insert
  to authenticated
  with check (true);

create policy "Allow authenticated users to update albums" on albums
  for update
  to authenticated
  using (true);

create policy "Allow authenticated users to delete albums" on albums
  for delete
  to authenticated
  using (true);

create policy "Allow public read access" on photos
  for select
  to public
  using (true);

create policy "Allow authenticated users to create photos" on photos
  for insert
  to authenticated
  with check (true);

create policy "Allow authenticated users to update photos" on photos
  for update
  to authenticated
  using (true);

create policy "Allow authenticated users to delete photos" on photos
  for delete
  to authenticated
  using (true);

-- Insert sample data
insert into activities (title, description, date, time, location, category, is_active)
values 
  ('Kajian Rutin Minggu Pagi', 'Kajian rutin setiap hari Minggu pagi dengan tema "Akhlak dalam Islam". Kajian ini terbuka untuk jamaah dari segala usia dan akan dipimpin oleh Ustadz Ahmad Fauzi.', '2025-07-13', '08:00:00', 'Ruang Utama Masjid', 'kajian', true),
  ('Sholat Tarawih Berjamaah', 'Sholat Tarawih berjamaah setiap malam Ramadan. Mari ramaikan masjid dengan ibadah bersama dan renungkan hikmah bulan suci ini.', '2025-07-15', '19:30:00', 'Ruang Utama Masjid', 'sholat', true);

insert into albums (title, description, date)
values 
  ('Pembukaan Ramadan 1445 H', 'Dokumentasi kegiatan pembukaan Ramadan 1445 H di Masjid Al-Muhtaddun', '2024-03-12'),
  ('Sholat Idul Fitri 1444 H', 'Dokumentasi pelaksanaan Sholat Idul Fitri 1444 H', '2023-04-21');

insert into photos (album_id, image_url, caption)
values 
  ((select id from albums where title = 'Pembukaan Ramadan 1445 H' limit 1), 'https://example.com/photos/ramadan1.jpg', 'Sambutan dari Ketua DKM'),
  ((select id from albums where title = 'Pembukaan Ramadan 1445 H' limit 1), 'https://example.com/photos/ramadan2.jpg', 'Persiapan buka puasa bersama'),
  ((select id from albums where title = 'Sholat Idul Fitri 1444 H' limit 1), 'https://example.com/photos/idul-fitri1.jpg', 'Jamaah mulai berdatangan'),
  ((select id from albums where title = 'Sholat Idul Fitri 1444 H' limit 1), 'https://example.com/photos/idul-fitri2.jpg', 'Pelaksanaan sholat Id'); 