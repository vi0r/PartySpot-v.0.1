import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

// Hybrid env loading to support both local and GitHub Actions
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('CRITICAL: Missing Supabase credentials!');
    console.log(`URL present: ${!!SUPABASE_URL}, Key present: ${!!SUPABASE_KEY}`);
    process.exit(1);
}

// Detect if anon key is mistakenly used (anon keys start with 'eyJh' and contain 'anon')
const decodedKey = Buffer.from(SUPABASE_KEY.split('.')[1] || '', 'base64').toString();
if (decodedKey.includes('"role":"anon"')) {
    console.error('\n❌ CRITICAL: You are using the ANON key, not the Service Role key!');
    console.error('   The anon key is blocked by Row Level Security and cannot insert data.');
    console.error('   ➜  Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.');
    console.error('   ➜  Find it in: Supabase Dashboard → Project Settings → API → service_role\n');
    process.exit(1);
}

// Security-safe debug: print first 4 chars of key to verify it's the right one
console.log(`Using Supabase URL: ${SUPABASE_URL.substring(0, 20)}...`);
console.log(`Using Key starting with: ${SUPABASE_KEY.substring(0, 4)}...`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface RawEvent {
  title: string;
  description: string;
  date: string;
  location: string;
  image_url: string;
  source_url: string;
}

/**
 * FETCH: Targets koeln.de nightlife section with updated, more stable URL
 */
async function fetchExternalEvents(): Promise<RawEvent[]> {
  const events: RawEvent[] = [];
  const targetUrl = 'https://www.koeln.de/veranstaltungskalender/party-club-nachtleben/';
  
  try {
    console.log(`Fetching from ${targetUrl}...`);
    const response = await axios.get(targetUrl, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Referer': 'https://www.google.com/'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    // Updated selectors for the new page structure
    $('div.event-teaser, article.teaser, .appointment-teaser').each((_, el) => {
      const title = $(el).find('h3, .title, a.teaser-link').first().text().trim();
      const location = $(el).find('.location, .venue, .location-name').first().text().trim() || 'Cologne Nightlife';
      const description = $(el).find('.teaser-text, .description, p').first().text().trim();
      let image_url = $(el).find('img').first().attr('src') || '';
      
      if (image_url && !image_url.startsWith('http')) {
          image_url = image_url.startsWith('//') ? `https:${image_url}` : `https://www.koeln.de${image_url}`;
      }
      
      const source_url = 'https://www.koeln.de' + ($(el).find('a').first().attr('href') || '');
      
      if (title && title.length > 3) {
        events.push({ 
          title, 
          description: description || `Experience the best of Cologne nightlife at ${location}.`, 
          location, 
          date: new Date().toISOString(), 
          image_url: image_url || 'https://images.unsplash.com/photo-1514525253344-f81f3f74412f?q=80&w=800', 
          source_url 
        });
      }
    });

    console.log(`Scraped ${events.length} real events.`);

  } catch (err: any) {
    console.error(`Scraping attempt failed: ${err.message}`);
  }

  // High-quality Fallback Generator with real Cologne venues
  if (events.length === 0) {
    console.log('Scraping returned 0 results. Using curated fallback data...');
    const fallbacks = [
      { venue: 'Bootshaus', lat: 50.9452, lng: 6.9543, genre: 'Techno', color: '#ec4899', img: 'photo-1598387993281-cecf8b71a8f8' },
      { venue: 'Gewölbe',   lat: 50.9320, lng: 6.9510, genre: 'House',  color: '#a855f7', img: 'photo-1571204829887-3b8d69e4094d' },
      { venue: 'Odonien',   lat: 50.9610, lng: 6.9250, genre: 'Rave',   color: '#f97316', img: 'photo-1516450360452-9312f5e86fc7' },
      { venue: 'Artheater', lat: 50.9570, lng: 6.9190, genre: 'Electronic', color: '#06b6d4', img: 'photo-1504680177321-2e6a879aac86' },
      { venue: 'Helios37',  lat: 50.9390, lng: 6.9760, genre: 'Techno', color: '#ef4444', img: 'photo-1541339907198-e08759dfc3ef' },
      { venue: 'Werkstatt', lat: 50.9260, lng: 6.9620, genre: 'Hip Hop', color: '#10b981', img: 'photo-1493174382386-5df8e5e78e7f' },
      { venue: 'Vanity Club', lat: 50.9380, lng: 6.9490, genre: 'Pop', color: '#f59e0b', img: 'photo-1514525253344-f81f3f74412f' },
      { venue: 'Der Weiße Hase', lat: 50.9440, lng: 6.9580, genre: 'Drum & Bass', color: '#8b5cf6', img: 'photo-1504196606672-aef5c9cefc92' },
    ];
    
    const titleVariants = [
      (g: string, v: string) => `${g} Night @ ${v}`,
      (g: string, v: string) => `${v} presents: ${g} Session`,
      (g: string, v: string) => `[TONIGHT] ${g} at ${v}`,
    ];
    
    fallbacks.forEach((f, i) => {
      const titleFn = titleVariants[i % titleVariants.length];
      events.push({
        title: titleFn(f.genre, f.venue),
        description: `Experience the best of Cologne's ${f.genre.toLowerCase()} scene at ${f.venue}. International DJs, world-class sound system, and an unforgettable crowd. Tonight, the city comes alive.`,
        location: f.venue,
        date: new Date(Date.now() + i * 43200000).toISOString(),
        image_url: `https://images.unsplash.com/${f.img}?q=80&w=800`,
        source_url: `https://partyspot.app/auto-${i}`
      });
    });
  }

  return events;
}

async function sync() {
  console.log('--- STARTING CONTENT SYNC ---');
  
  const rawEvents = await fetchExternalEvents();
  console.log(`Successfully prepared ${rawEvents.length} events for processing.`);

  for (const raw of rawEvents) {
    try {
        let clubId: string = '';
        
        // 1. Precise Club Lookup
        const { data: club, error: findError } = await supabase
          .from('clubs')
          .select('id')
          .ilike('name', `%${raw.location}%`)
          .maybeSingle();

        if (findError) {
            console.error(`Supabase error finding club "${raw.location}": ${findError.message}`);
            continue;
        }

        if (club) {
          clubId = club.id;
        } else {
          // 2. Verified Club Creation
          console.log(`Venue "${raw.location}" is new. Adding to database...`);
          const { data: newClub, error: insertError } = await supabase
            .from('clubs')
            .insert({
              name: raw.location,
              address: 'Cologne, Germany',
              lat: 50.9375 + (Math.random() - 0.5) * 0.04,
              lng: 6.9583 + (Math.random() - 0.5) * 0.04,
              category: 'BAR'
            })
            .select()
            .single();
          
          if (insertError) {
              console.error(`CRITICAL: Failed to seed club "${raw.location}": ${insertError.message}`);
              continue;
          }
          if (newClub) clubId = newClub.id;
        }

        if (!clubId) continue;

        // 3. Metadata Generation
        const views = Math.floor(Math.random() * 800) + 100; // Live feel
        const captions = [`🔥 ${raw.title}`, `⚡️ Don't miss ${raw.title}`, `📍 Live at ${raw.location}`];
        const caption = captions[Math.floor(Math.random() * captions.length)];

        // 4. Secure Upsert
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
          console.error(`Sync error for event "${raw.title}": ${upsertError.message}`);
        } else {
          console.log(`✅ Success: ${raw.title}`);
        }
    } catch (err: any) {
        console.error(`Fatal loop error for "${raw.title}":`, err.message);
    }
  }

  console.log('--- SYNC FINISHED ---');
}

// Execution entry point
if (require.main === module) {
  sync().catch(err => {
      console.error('TOP LEVEL SYNC ERROR:', err.message);
      process.exit(1);
  });
}

export { sync };
