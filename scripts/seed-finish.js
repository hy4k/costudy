/**
 * CoStudy Seed Finish
 * Adds memberships, posts, and comments to existing seeded users
 */

const SUPABASE_URL = 'https://supabase.fets.in';
const SUPABASE_SERVICE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzU3MTY2MCwiZXhwIjo0OTE5MjQ1MjYwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.foK8qYNysm_IZWMQHWv9Wr_Cf2sdShF2eDl0uos3ebQ';

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function hoursAgo(hours) {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

async function supabaseGet(table, query = '') {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    }
  });
  return response.json();
}

async function supabaseInsert(table, data) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Insert error: ${response.status} - ${error}`);
  }
  
  return response.json();
}

async function supabaseDelete(table, query) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    }
  });
  return response.ok;
}

async function run() {
  console.log('🔧 Finishing CoStudy seed...\n');
  
  // Get existing data
  console.log('📊 Fetching existing data...');
  const profiles = await supabaseGet('user_profiles', '?select=id,name,role&limit=100');
  const rooms = await supabaseGet('study_rooms', '?select=id,name,creator_id&limit=20');
  
  console.log(`   • ${profiles.length} profiles`);
  console.log(`   • ${rooms.length} rooms`);
  
  // Clean up duplicate rooms (keep only 3)
  if (rooms.length > 3) {
    console.log('\n🧹 Cleaning up duplicate rooms...');
    const roomsToDelete = rooms.slice(3);
    for (const room of roomsToDelete) {
      await supabaseDelete('study_rooms', `?id=eq.${room.id}`);
    }
    console.log(`   Deleted ${roomsToDelete.length} duplicate rooms`);
  }
  
  const finalRooms = rooms.slice(0, 3);
  
  // Check existing memberships
  const existingMemberships = await supabaseGet('study_room_members', '?select=id&limit=1');
  
  if (existingMemberships.length === 0) {
    console.log('\n👥 Adding room memberships...');
    const memberships = [];
    
    for (const room of finalRooms) {
      // Get creator or use first profile
      const creatorId = room.creator_id || profiles[0].id;
      
      memberships.push({
        room_id: room.id,
        user_id: creatorId,
        role: 'admin',
        status: 'active',
        joined_at: daysAgo(30),
        last_active_at: hoursAgo(randomInt(0, 12))
      });
      
      // Add 10-15 random members
      const shuffled = profiles.filter(p => p.id !== creatorId).sort(() => Math.random() - 0.5);
      const memberCount = randomInt(10, 15);
      
      for (let i = 0; i < memberCount && i < shuffled.length; i++) {
        memberships.push({
          room_id: room.id,
          user_id: shuffled[i].id,
          role: 'member',
          status: 'active',
          joined_at: daysAgo(randomInt(1, 20)),
          last_active_at: hoursAgo(randomInt(0, 48))
        });
      }
    }
    
    await supabaseInsert('study_room_members', memberships);
    console.log(`   ✅ ${memberships.length} memberships added`);
  } else {
    console.log('\n👥 Memberships already exist, skipping...');
  }
  
  // Check existing posts
  const existingPosts = await supabaseGet('posts', '?select=id&limit=1');
  
  if (existingPosts.length === 0) {
    console.log('\n📝 Adding wall posts...');
    
    const postTemplates = [
      { type: 'update', content: 'Just completed 50 MCQs on Cost Management! Feeling confident 💪' },
      { type: 'question', content: 'Can someone explain absorption vs variable costing?', subject: 'Cost Accounting' },
      { type: 'update', content: 'Day 30 of my CMA journey. Consistency is key!' },
      { type: 'resource', content: 'Found a great video on transfer pricing. DM for link!' },
      { type: 'question', content: 'How long did Part 1 take you all?', subject: 'Study Planning' },
      { type: 'update', content: 'Mock exam score: 72%! First time crossing 70 ✨' },
      { type: 'update', content: 'Kerala study group meetup was amazing! 🙌' },
      { type: 'question', content: 'Gleim or Wiley for Part 2?', subject: 'Study Materials' },
      { type: 'update', content: 'Finally understood variance analysis after 3 days!' },
      { type: 'tip', content: 'Pro tip: Create flashcards for formulas. Game changer!' },
      { type: 'update', content: 'Essay practice session tonight at 8 PM!' },
      { type: 'question', content: 'Anyone from Kochi for Jan window?', subject: 'Study Group' },
      { type: 'update', content: '100 days to exam day. Let\'s goooo! 🚀' },
      { type: 'tip', content: 'CoStudy AI tutor is actually so good for revision!' },
      { type: 'update', content: 'Part 1 CLEARED! On to Part 2 now 🎉' },
      { type: 'update', content: 'Started my CMA journey today. Nervous but excited!' },
      { type: 'question', content: 'Best time management tips?', subject: 'Study Tips' },
      { type: 'update', content: 'Study streak: 21 days! Accountability is real.' },
      { type: 'tip', content: 'Do MCQs before theory - helps you focus!' },
      { type: 'update', content: 'Completed Section A of Part 1. Progress!' }
    ];
    
    const posts = postTemplates.map((t, i) => ({
      author_id: profiles[i % profiles.length].id,
      content: t.content,
      subject: t.subject || null,
      tags: randomFrom(['{"cma","part1"}', '{"cma","part2"}', '{"motivation"}', '{"studytips"}']),
      likes: randomInt(5, 50),
      created_at: daysAgo(i)
    }));
    
    const insertedPosts = await supabaseInsert('posts', posts);
    console.log(`   ✅ ${insertedPosts.length} posts added`);
    
    // Add comments
    console.log('\n💬 Adding comments...');
    const commentTemplates = [
      'This is so helpful! 🙏', 'Same here!', 'Great progress! 💪',
      'Can we connect?', 'Congrats! 🎉', 'Exactly what I needed!',
      'Following!', 'Count me in!', 'Kerala gang! 🙌', 'This is gold!'
    ];
    
    const comments = [];
    for (const post of insertedPosts) {
      const commentCount = randomInt(1, 4);
      for (let i = 0; i < commentCount; i++) {
        const author = randomFrom(profiles);
        if (author.id !== post.author_id) {
          comments.push({
            post_id: post.id,
            author_id: author.id,
            content: randomFrom(commentTemplates),
            created_at: daysAgo(randomInt(0, 7))
          });
        }
      }
    }
    
    await supabaseInsert('comments', comments);
    console.log(`   ✅ ${comments.length} comments added`);
  } else {
    console.log('\n📝 Posts already exist, skipping...');
  }
  
  console.log('\n' + '═'.repeat(50));
  console.log('✅ SEED COMPLETE!');
  console.log('═'.repeat(50));
  console.log('\n🎉 CoStudy is now populated and ready for launch!');
}

run().catch(console.error);
