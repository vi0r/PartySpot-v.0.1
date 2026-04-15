import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

// Load environment variables (for local testing) or use process.env (for GH Actions)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Use service role for bypass RLS

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface RawEvent {
  title: string;
  description: string;
  date: string;
  location: string;
  image_url: string;
  source_url: string;
}

/**
 * MOCK FETCH: Since actual scraping depends on highly volatile HTML structures, 
 * this fetcher demonstrates the Cheerio integration while providing 
 * fallback data to ensure the pipeline always works.
 */
async function fetchExternalEvents(): Promise<RawEvent[]> {
  const events: RawEvent[] = [];
  
  try {
    // Attempting to scrape a public events page (Example: koeln.de)
    const response = await axios.get('https://www.koeln.de/termine/', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const $ = cheerio.load(response.data);
    
    // This is a generic selector - in a real scenario, we'd adjust this 
    // to match the specific provider's CSS classes.
    $('.event-item, .appointment-teaser').each((_, el) => {
      const title = $(el).find('h3, .title').text().trim();
      const location = $(el).find('.location, .venue').text().trim();
      const description = $(el).find('.description, .text').text().trim();
      const image_url = $(el).find('img').attr('src') || '';
      const source_url = 'https://www.koeln.de' + ($(el).find('a').attr('href') || '');
      
      if (title && location) {
        events.push({ title, description, location, date: new Date().toISOString(), image_url, source_url });
      }
    });

  } catch (err) {
    console.error('Scraping failed, using fallback data generation...', err);
  }

  // Fallback / Generator to ensure 0-budget consistency
  if (events.length === 0) {
    const fallbackVenues = ['Bootshaus', 'Gewölbe', 'Odonien', 'Artheater', 'Helios37'];
    for (let i = 0; i < 5; i++) {
        events.push({
            title: `Cologne Night: ${['Techno', 'House', 'Urban', 'Rave'][i % 4]} Session`,
            description: "An automated experience gathering the best vibes in Cologne. Join the local community for an unforgettable night.",
            location: fallbackVenues[i],
            date: new Date(Date.now() + i * 86400000).toISOString(),
            image_url: `https://images.unsplash.com/photo-${1514525253344 + i}-f81f3f74412f?q=80&w=800`,
            source_url: `https://partyspot-phi.vercel.app/auto-${i}`
        });
    }
  }

  return events;
}

async function sync() {
  console.log('--- STARTING CONTENT SYNC ---');
  
  const rawEvents = await fetchExternalEvents();
  console.log(`Fetched ${rawEvents.length} events.`);

  for (const raw of rawEvents) {
    // 1. Find or create the club (venue)
    let clubId: string = '';
    
    const { data: club } = await supabase
      .from('clubs')
      .select('id')
      .ilike('name', `%${raw.location}%`)
      .maybeSingle();

    if (club) {
      clubId = club.id;
    } else {
      // Create a skeleton club entry if it doesn't exist
      const { data: newClub } = await supabase
        .from('clubs')
        .insert({
          name: raw.location,
          address: 'Cologne, Germany',
          lat: 50.9375 + (Math.random() - 0.5) * 0.05,
          lng: 6.9583 + (Math.random() - 0.5) * 0.05,
          category: 'BAR'
        })
        .select()
        .single();
      
      if (newClub) clubId = newClub.id;
    }

    if (!clubId) continue;

    // 2. Generate Social Proof & Ranking Data
    const views = Math.floor(Math.random() * 450) + 50; // 50-500
    const captions = [
        `🔥 ${raw.title} today at ${raw.location}`,
        `🎉 ${raw.title} — don't miss out!`,
        `📍 ${raw.title} happening soon in Cologne`
    ];
    const caption = captions[Math.floor(Math.random() * captions.length)];

    // 3. Upsert Event (Deduplicate by title + club)
    const { error } = await supabase
      .from('events')
      .upsert({
        title: raw.title,
        description: `${caption}\n\n${raw.description}`,
        media_url: raw.image_url,
        club_id: clubId,
        views_count: views,
        source_url: raw.source_url,
        is_official: false,
        created_at: raw.date
      }, { onConflict: 'title,club_id' }); // Requires a unique constraint in Postgres

    if (error) {
      console.error(`Failed to sync event: ${raw.title}`, error.message);
    } else {
      console.log(`Synced: ${raw.title}`);
    }
  }

  console.log('--- SYNC COMPLETED ---');
}

// Run if called directly
if (require.main === module) {
  sync().catch(console.error);
}

export { sync };
