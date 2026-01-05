import 'dotenv/config';
import { supabase } from '../src/lib/supabase';

async function main() {
  // 1) Seed candidates
  const { data: candidates, error: candError } = await supabase
    .from('candidates')
    .insert([
      { name: 'Candidate A', party: 'Party X' },
      { name: 'Candidate B', party: 'Party Y' },
    ])
    .select();

  if (candError) {
    console.error('Error seeding candidates', candError);
    process.exit(1);
  }

  const candidateA = candidates![0];

  // 2) Seed rallies
  const { error: ralliesError } = await supabase.from('rallies').insert([
    {
      candidate_id: candidateA.id,
      title: 'Kampala Central Rally',
      description: 'Main Kampala rally.',
      location_name: 'Kololo Independence Grounds',
      lat: 0.3369,
      lng: 32.5940,
      start_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    },
  ]);

  if (ralliesError) {
    console.error('Error seeding rallies', ralliesError);
    process.exit(1);
  }

  console.log('Seeded candidates and rallies successfully');
}

main().then(() => process.exit(0));
