export interface Activity {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: 'kajian' | 'sholat' | 'sosial' | 'pendidikan' | 'lainnya';
  is_active: boolean;
  max_participants?: number;
  current_participants: number;
  created_at: string;
  updated_at: string;
}

export interface Album {
  id: string;
  title: string;
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
  photos?: Photo[];
}

export interface Photo {
  id: string;
  album_id: string;
  image_url: string;
  caption?: string;
  created_at: string;
}

export interface AboutContent {
  id: string;
  history_text: string;
  vision_text: string;
  mission_items: string[];
  address: string;
  phone: string;
  email: string;
  office_hours: string;
  google_maps_embed?: string;
  created_at: string;
  updated_at: string;
}

export interface Facility {
  id: string;
  name: string;
  description: string;
  icon_name: 'users' | 'book' | 'clock' | 'heart' | 'home' | 'mosque' | 'quran' | 'parking' | 'wifi' | 'mic' | 'ac';
  created_at: string;
  updated_at: string;
}

export interface HomepageContent {
  id: string;
  arabic_greeting: string;
  main_title: string;
  main_description: string;
  qiraati_title: string;
  qiraati_subtitle: string;
  welcome_title: string;
  welcome_description: string;
  quran_verse_arabic: string;
  quran_verse_translation: string;
  quran_verse_reference: string;
  announcements: {
    title: string;
    description: string;
    type: 'primary' | 'secondary';
  }[];
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  role: 'admin' | 'user';
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      activities: {
        Row: Activity;
        Insert: Omit<Activity, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Activity, 'id'>>;
      };
      albums: {
        Row: Album;
        Insert: Omit<Album, 'id' | 'created_at' | 'updated_at' | 'photos'>;
        Update: Partial<Omit<Album, 'id' | 'photos'>>;
      };
      photos: {
        Row: Photo;
        Insert: Omit<Photo, 'id' | 'created_at'>;
        Update: Partial<Omit<Photo, 'id' | 'album_id' | 'created_at'>>;
      };
      about_content: {
        Row: AboutContent;
        Insert: Omit<AboutContent, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AboutContent, 'id'>>;
      };
      facilities: {
        Row: Facility;
        Insert: Omit<Facility, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Facility, 'id'>>;
      };
      homepage_content: {
        Row: HomepageContent;
        Insert: Omit<HomepageContent, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<HomepageContent, 'id'>>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
    };
  };
} 