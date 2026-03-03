/**
 * CoStudy Database Seeder
 * Seeds realistic Kerala-based CMA candidates and teachers
 * 
 * Run: node scripts/seed-users.js
 */

const SUPABASE_URL = 'https://supabase.fets.in';
const SUPABASE_SERVICE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzU3MTY2MCwiZXhwIjo0OTE5MjQ1MjYwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.foK8qYNysm_IZWMQHWv9Wr_Cf2sdShF2eDl0uos3ebQ';

// Kerala-specific data
const KERALA_FIRST_NAMES = {
  male: ['Arun', 'Vishnu', 'Anand', 'Rahul', 'Sreejith', 'Ajith', 'Deepak', 'Nithin', 'Sandeep', 'Prasanth', 
         'Jithin', 'Manu', 'Sujith', 'Vinod', 'Rejin', 'Bibin', 'Sreerag', 'Akhil', 'Ashwin',
         'Arjun', 'Vivek', 'Sachin', 'Vineeth', 'Anoop', 'Bijoy', 'Dileep', 'Harikrishnan', 'Jishnu', 'Kiran'],
  female: ['Ananya', 'Priya', 'Lakshmi', 'Sneha', 'Aiswarya', 'Divya', 'Remya', 'Sreelakshmi', 'Athira', 'Neethu',
           'Anjali', 'Reshma', 'Swathi', 'Gopika', 'Meera', 'Arya', 'Deepthi', 'Haritha', 'Kavya', 'Lekshmi',
           'Aparna', 'Amrutha', 'Bhavana', 'Gayathri', 'Jyothi', 'Krishna', 'Nimisha', 'Pooja', 'Revathi', 'Sruthi']
};

const KERALA_SURNAMES = ['Nair', 'Menon', 'Pillai', 'Varma', 'Krishnan', 'Kumar', 'Mohan', 'Raj', 'Babu', 'Das',
                         'Panicker', 'Kurup', 'Namboothiri', 'Warrier', 'Unnithan', 'Kartha', 'Thampi', 'Kaimal'];

const KERALA_CITIES = ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur', 'Alappuzha', 
                       'Palakkad', 'Malappuram', 'Kottayam', 'Ernakulam', 'Pathanamthitta'];

const EXAM_FOCUS_OPTIONS = ['part1', 'part2', 'both'];
const LEVEL_OPTIONS = [1, 2, 3, 4, 5];

const TAGLINES = [
  'CMA Part 1 aspirant 📚', 'Preparing for Jan 2026 exam', 'Night owl studying for CMA',
  'Working professional | CMA journey', 'Part 2 grinder 💪', 'Gleim gang represent!',
  'Accountant by day, CMA student by night', 'From Kerala to CMA certified', 'Coffee + CMA = Life',
  'Part 1 cleared, Part 2 loading...', 'Finance professional | CMA prep', 'Study buddy needed!',
  'On my way to becoming a CMA', 'Counting down to exam day', 'Making variance analysis my friend'
];

const TEACHER_SPECIALTIES = [
  ['Part 1', 'Financial Planning', 'Cost Management'],
  ['Part 2', 'Strategic Management', 'Decision Analysis'],
  ['Part 1', 'Part 2', 'Essay Writing'],
  ['Budgeting', 'Performance Management', 'Ethics']
];

const TEACHER_BIOS = [
  'CMA certified with 8+ years of coaching experience. Helped 200+ students clear Part 1 on first attempt.',
  'Former Big 4 auditor turned CMA instructor. Specializing in practical application of concepts.',
  'Part 1 and Part 2 specialist. I make cost accounting fun (yes, really!).',
  'Passionate about helping working professionals balance study with career. Flexible timings available.'
];

// Helper functions
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateHandle(name) {
  return name.toLowerCase().replace(/[^a-z]/g, '') + randomInt(1, 999);
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

// Create auth user via Admin API
async function createAuthUser(email, password) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true // Auto-confirm email
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Auth error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  return data.id; // Return the user UUID
}

// Generate profile data (normalized for both candidates and teachers)
function generateProfileData(userId, name, isTeacher, specialtyIndex = 0) {
  const city = randomFrom(KERALA_CITIES);
  
  return {
    id: userId,
    name,
    handle: generateHandle(name.split(' ')[0]),
    avatar: null,
    role: isTeacher ? 'TEACHER' : 'STUDENT',
    level: isTeacher ? 10 : randomFrom(LEVEL_OPTIONS),
    tagline: isTeacher ? `CMA Instructor | ${city}` : randomFrom(TAGLINES),
    bio: isTeacher 
      ? TEACHER_BIOS[specialtyIndex] 
      : `CMA aspirant from ${city}, Kerala. ${randomFrom(['Working professional', 'Full-time student', 'CA Inter cleared', 'B.Com graduate'])} preparing for ${randomFrom(['Jan 2026', 'May 2026', 'Sep 2026'])} window.`,
    timezone: 'Asia/Kolkata',
    exam_focus: isTeacher ? null : randomFrom(EXAM_FOCUS_OPTIONS),
    costudy_status: isTeacher ? 'online' : randomFrom(['online', 'studying', 'away', 'offline']),
    specialties: isTeacher ? `{${TEACHER_SPECIALTIES[specialtyIndex].map(s => `"${s}"`).join(',')}}` : null,
    years_experience: isTeacher ? randomInt(5, 15) : null,
    hourly_rate: isTeacher ? randomInt(500, 1500) : null,
    offerings: isTeacher ? '{"1-on-1 sessions","Group classes","Essay review"}' : null,
    performance: JSON.stringify(isTeacher 
      ? { students_taught: randomInt(50, 300), average_rating: (4 + Math.random()).toFixed(1) }
      : { mcq_accuracy: randomInt(55, 92), questions_attempted: randomInt(50, 500), study_hours: randomInt(20, 200) }
    ),
    reputation: isTeacher ? randomInt(500, 2000) : randomInt(10, 500),
    created_at: daysAgo(randomInt(isTeacher ? 30 : 1, isTeacher ? 90 : 45)),
    updated_at: hoursAgo(randomInt(1, isTeacher ? 24 : 72))
  };
}

// PostgREST API helper
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
    throw new Error(`Supabase error: ${response.status} - ${error}`);
  }
  
  return response.json();
}

// Main seeding function
async function seed() {
  console.log('🌱 Starting CoStudy database seeding...\n');
  
  const users = [];
  const teacherNames = [
    'Suresh Menon', 'Dr. Lakshmi Pillai', 'Rajesh Kumar', 'Anita Varma'
  ];
  
  try {
    // Create candidates
    console.log('👤 Creating 60 candidate accounts...');
    for (let i = 0; i < 60; i++) {
      const isMale = Math.random() > 0.45;
      const firstName = randomFrom(isMale ? KERALA_FIRST_NAMES.male : KERALA_FIRST_NAMES.female);
      const lastName = randomFrom(KERALA_SURNAMES);
      const email = `${firstName.toLowerCase()}${randomInt(100, 9999)}@costudy-seed.local`;
      
      try {
        const userId = await createAuthUser(email, 'SeedPassword123!');
        const profileData = generateProfileData(userId, `${firstName} ${lastName}`, false);
        users.push({ ...profileData, email });
        process.stdout.write(`   ✓ ${i + 1}/60 candidates\r`);
      } catch (e) {
        console.log(`   ⚠ Skipping ${firstName}: ${e.message}`);
      }
    }
    console.log(`\n   ✅ Created ${users.length} candidates`);
    
    // Create teachers
    console.log('\n👨‍🏫 Creating 4 teacher accounts...');
    const teacherUsers = [];
    for (let i = 0; i < teacherNames.length; i++) {
      const name = teacherNames[i];
      const email = `${name.split(' ')[0].toLowerCase()}@costudy-seed.local`;
      
      try {
        const userId = await createAuthUser(email, 'SeedPassword123!');
        const profileData = generateProfileData(userId, name, true, i);
        teacherUsers.push({ ...profileData, email });
        console.log(`   ✓ ${name}`);
      } catch (e) {
        console.log(`   ⚠ Skipping ${name}: ${e.message}`);
      }
    }
    console.log(`   ✅ Created ${teacherUsers.length} teachers`);
    
    const allUsers = [...users, ...teacherUsers];
    
    // Insert profiles
    console.log('\n📤 Inserting user profiles...');
    const profiles = allUsers.map(u => {
      const { email, ...profile } = u;
      return profile;
    });
    await supabaseInsert('user_profiles', profiles);
    console.log('   ✅ Profiles inserted');
    
    // Create study rooms
    console.log('\n🏠 Creating study rooms...');
    const studyRooms = [
      {
        name: 'Kerala CMA Warriors ⚔️',
        category: 'regional',
        description: 'Study group for CMA aspirants from Kerala. Daily accountability, study sessions, and doubt clearing.',
        color: '#DC2626',
        sections: '{"Part 1","Part 2"}',
        target_topics: '{"Cost Management","Financial Planning","Ethics"}',
        room_type: 'public',
        cluster_streak: randomInt(15, 45),
        creator_id: users[0]?.id,
        created_at: daysAgo(randomInt(30, 60))
      },
      {
        name: 'Part 1 Night Owls 🦉',
        category: 'exam_focus',
        description: 'Late night study sessions for Part 1. Active 9 PM - 2 AM IST. Pomodoro together!',
        color: '#7C3AED',
        sections: '{"Part 1"}',
        target_topics: '{"External Financial Reporting","Planning Budgeting","Cost Management"}',
        room_type: 'public',
        cluster_streak: randomInt(20, 60),
        creator_id: users[1]?.id,
        created_at: daysAgo(randomInt(20, 40))
      },
      {
        name: 'Working Professionals Hub 💼',
        category: 'lifestyle',
        description: 'For those balancing job + CMA prep. Weekend warriors and early morning grinders welcome!',
        color: '#059669',
        sections: '{"Part 1","Part 2"}',
        target_topics: '{"All Topics"}',
        room_type: 'public',
        cluster_streak: randomInt(10, 30),
        creator_id: users[2]?.id,
        created_at: daysAgo(randomInt(15, 30))
      }
    ];
    
    const insertedRooms = await supabaseInsert('study_rooms', studyRooms);
    console.log('   ✅ 3 study rooms created');
    
    // Create memberships
    console.log('\n👥 Adding room memberships...');
    const memberships = [];
    
    for (const room of insertedRooms) {
      // Creator membership
      memberships.push({
        room_id: room.id,
        user_id: room.creator_id,
        role: 'admin',
        status: 'active',
        joined_at: room.created_at,
        last_active_at: hoursAgo(randomInt(0, 12))
      });
      
      // Add random members
      const shuffled = allUsers.filter(u => u.id !== room.creator_id).sort(() => Math.random() - 0.5);
      const memberCount = randomInt(8, 15);
      
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
    console.log(`   ✅ ${memberships.length} memberships created`);
    
    // Create wall posts
    console.log('\n📝 Creating wall posts...');
    const postTemplates = [
      { type: 'update', content: 'Just completed 50 MCQs on Cost Management! Feeling confident 💪' },
      { type: 'question', content: 'Can someone explain the difference between absorption costing and variable costing?', subject: 'Cost Accounting' },
      { type: 'update', content: 'Day 30 of my CMA journey. Consistency is key! Who else is studying today?' },
      { type: 'resource', content: 'Found a great YouTube video explaining transfer pricing. DM if you need the link!' },
      { type: 'question', content: 'How long did Part 1 take you all? Planning for 4 months, is that realistic while working?', subject: 'Study Planning' },
      { type: 'update', content: 'Mock exam score: 72%! First time crossing 70. Small wins matter ✨' },
      { type: 'update', content: 'Kerala CMA study group meetup was amazing! Met so many motivated people 🙌' },
      { type: 'question', content: 'Gleim or Wiley for Part 2? Which worked better for you?', subject: 'Study Materials' },
      { type: 'update', content: 'Finally understood variance analysis after 3 days of struggle. Never giving up!' },
      { type: 'tip', content: 'Pro tip: Create flashcards for formulas. Review them during commute. Game changer!' },
      { type: 'update', content: 'Essay practice session tonight at 8 PM. Join the study room if interested!' },
      { type: 'question', content: 'Anyone from Kochi preparing for Jan window? Looking for study partners.', subject: 'Study Group' },
      { type: 'update', content: '100 days to exam day. Let\'s goooo! 🚀' },
      { type: 'tip', content: 'The CoStudy AI tutor is actually so good for quick concept revision. Saved me hours!' },
      { type: 'update', content: 'Part 1 CLEARED! Thank you everyone for the support. On to Part 2 now 🎉' },
      { type: 'update', content: 'Started my CMA journey today. Nervous but excited!' },
      { type: 'question', content: 'Best time management tips for working professionals?', subject: 'Study Tips' },
      { type: 'update', content: 'Finally completed Section A of Part 1. Progress feels good.' },
      { type: 'tip', content: 'Do MCQs before reading theory. Helps you know what to focus on.' },
      { type: 'update', content: 'Study streak: 21 days! The room accountability is real.' }
    ];
    
    const posts = postTemplates.map((template, i) => ({
      author_id: allUsers[i % allUsers.length].id,
      type: template.type,
      content: template.content,
      subject: template.subject || null,
      tags: randomFrom(['{"cma","part1"}', '{"cma","part2"}', '{"motivation"}', '{"studytips"}', '{"kerala"}']),
      likes: randomInt(5, 50),
      created_at: daysAgo(i)
    }));
    
    const insertedPosts = await supabaseInsert('posts', posts);
    console.log(`   ✅ ${posts.length} posts created`);
    
    // Create comments
    console.log('\n💬 Adding comments...');
    const commentTemplates = [
      'This is so helpful! Thank you 🙏',
      'Same struggle here!',
      'Great progress! Keep it up 💪',
      'Can we connect?',
      'Congratulations! 🎉',
      'Exactly what I needed!',
      'Following!',
      'Count me in!',
      'Kerala gang! 🙌',
      'This is gold!'
    ];
    
    const comments = [];
    for (const post of insertedPosts) {
      const commentCount = randomInt(1, 4);
      for (let i = 0; i < commentCount; i++) {
        const author = randomFrom(allUsers);
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
    console.log(`   ✅ ${comments.length} comments created`);
    
    // Summary
    console.log('\n' + '═'.repeat(50));
    console.log('✅ SEEDING COMPLETE!');
    console.log('═'.repeat(50));
    console.log(`\n📊 Created:`);
    console.log(`   • ${users.length} candidates`);
    console.log(`   • ${teacherUsers.length} teachers`);
    console.log(`   • 3 study rooms`);
    console.log(`   • ${memberships.length} room memberships`);
    console.log(`   • ${posts.length} wall posts`);
    console.log(`   • ${comments.length} comments`);
    console.log('\n🎉 CoStudy is now populated with Kerala-based users!');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seed();
