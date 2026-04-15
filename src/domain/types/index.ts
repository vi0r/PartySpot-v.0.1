export interface Club {
  id: string;
  name: string;
  lat: number;
  lng: number;
  color?: string;
  image_url?: string;
  description?: string;
  address?: string;
  category?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  media_url?: string;
  club_id: string;
  clubs?: Club;
  created_at: string;
  views_count?: number;
  source_url?: string;
}

export interface Profile {
  id: string;
  is_admin: boolean;
  username?: string;
}
