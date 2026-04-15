import { z } from 'zod';

export const ClubSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  image_url: z.string().url().optional().or(z.literal("")),
  description: z.string().max(500).optional(),
  address: z.string().optional(),
  category: z.string().optional(),
});

export const EventSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, "Title too short"),
  description: z.string().min(10, "Description too short"),
  media_url: z.string().url().optional().or(z.literal("")),
  club_id: z.string().uuid(),
});

export type ClubInput = z.infer<typeof ClubSchema>;
export type EventInput = z.infer<typeof EventSchema>;
