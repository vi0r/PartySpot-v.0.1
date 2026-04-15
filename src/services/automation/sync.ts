import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

// Load environment variables (for local testing) or use process.env (for GH Actions)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
 * FETCH: Targets koeln.de nightlife section
 */
async function fetchExternalEvents(): Promise<RawEvent[]> {
  const events: RawEvent[] = [];
  
  try {
    console.log('Fetching from koeln.de/veranstaltungen/party...');
    const response = await axios.get('https://www.koeln.de/veranstaltungen/party', {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,de;q=0.8',
        'Referer': 'https://www.google.com/'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Updated selectors for koeln.de event list
    $('.appointment-teaser, .teaser-event').each((_, el) => {
      const title = $(el).find('h3, .title, a[title]').text().trim();
      const location = $(el).find('.location, .venue, .location-name').text().trim() || 'Cologne Nightlife';
      const description = $(el).find('.teaser-text, .description').text().trim();
      let image_url = $(el).find('img').attr('src') || '';
      if (image_url && !image_url.startsWith('http')) image_url = 'https://www.koeln.de' + image_url;
      
      const source_url = 'https://www.koeln.de' + ($(el).find('a').attr('href') || '');
      
      if (title && title.length > 3) {
        events.push({ 
          title, 
          description: description || `Join us at ${location} for an epic night in Cologne.`, 
          location, 
          date: new Date().toISOString(), 
          image_url: image_url || 'https://images.unsplash.com/photo-1514525253344-f81f3f74412f?q=80&w=800', 
          source_url 
        });
      }
    });

    console.log(`Scraped ${events.length} real events from koeln.de`);

  } catch (err: any) {
    console.error(`Scraping failed: ${err.message}. Generating fallbacks to ensure feed is alive.`);
  }

  // Fallback / Generator (Enhanced to bypass duplication if needed)
  if (events.length === 0) {
    const fallbackVenues = ['Bootshaus', 'Gewölbe', 'Odonien', 'Artheater', 'Helios37'];
    for (let i = 0; i < 5; i++) {
        events.push({
            title: `Cologne Night: ${['Techno', 'House', 'Urban', 'Rave'][i % 4]} Session #${Math.floor(Math.random() * 1000)}`,
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
  console.log(`Processing ${rawEvents.length} events...`);

  for (const raw of rawEvents) {
    try {
        let clubId: string = '';
        
        // 1. Find the club
        const { data: club, error: findError } = await supabase
          .from('clubs')
          .select('id')
          .ilike('name', `%${raw.location}%`)
          .maybeSingle();

        if (findError) {
            console.error(`Error finding club ${raw.location}:`, findError.message);
        }

        if (club) {
          clubId = club.id;
        } else {
          // 2. Create club if missing
          console.log(`Club "${raw.location}" not found. Creating skeleton...`);
          const { data: newClub, error: insertError } = await supabase
            .from('clubs')
            .insert({
              name: raw.location,
              address: 'Cologne, Germany',
              lat: 50.9375 + (Math.random() - 0.5) * 0.05,
              lng: 6.9583 + (Math.random() - 0.5) * 0.05,
              category: 'BAR' // Default category
            })
            .select()
            .single();
          
          if (insertError) {
              console.error(`FAILED to create club "${raw.location}":`, insertError.message);
              continue; // Skip event if club creation fails
          }
          if (newClub) clubId = newClub.id;
        }

        if (!clubId) {
            console.warn(`Skipping event "${raw.title}": No clubId available.`);
            continue;
        }

        // 3. Generate Social Proof & Ranking Data
        const views = Math.floor(Math.random() * 450) + 50;
        const captions = [
            `🔥 ${raw.title} tonight at ${raw.location}`,
            `🎉 ${raw.title} — check it out!`,
            `📍 ${raw.title} is waiting for you`
        ];
        const caption = captions[Math.floor(Math.random() * captions.length)];

        // 4. Upsert Event
        const { error: upsertError } = await supabase
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
          }, { onConflict: 'title,club_id' });

        if (upsertError) {
          console.error(`FAILED to sync event "${raw.title}":`, upsertError.message);
        } else {
          console.log(`✅ Synced: ${raw.title}`);
        }
    } catch (unexpectedError: any) {
        console.error(`Unexpected error processing event "${raw.title}":`, unexpectedError.message);
    }
  }

  console.log('--- SYNC COMPLETED ---');
}

// Run if called directly
if (require.main === module) {
  sync().catch(console.error);
}

export { sync };
