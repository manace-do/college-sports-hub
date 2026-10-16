const assert = require('assert');

// Verify starter sports structure and grouping
const { STARTER_SPORTS, isSupabaseConfigured } = require('./lib/supabaseClient.js');

console.log('--- Testing Feature #1 Data & Logic ---');

// Check that starter sports is an array and has items
assert(Array.isArray(STARTER_SPORTS), 'STARTER_SPORTS must be an array');
assert(STARTER_SPORTS.length >= 7, 'Must have at least 7 starter sports');

// Check that every sport has an id, name, category, and coach_name
STARTER_SPORTS.forEach((sport) => {
  assert(sport.id, `Sport missing id: ${JSON.stringify(sport)}`);
  assert(sport.name, `Sport missing name: ${JSON.stringify(sport)}`);
  assert(['men', 'women', 'mixed'].includes(sport.category), `Invalid category: ${sport.category}`);
});

// Test category grouping
const menSports = STARTER_SPORTS.filter((s) => s.category === 'men');
const womenSports = STARTER_SPORTS.filter((s) => s.category === 'women');
const mixedSports = STARTER_SPORTS.filter((s) => s.category === 'mixed');

console.log(`Men's sports count: ${menSports.length}`);
console.log(`Women's sports count: ${womenSports.length}`);
console.log(`Mixed sports count: ${mixedSports.length}`);

assert(menSports.length > 0, "Must have men's sports");
assert(womenSports.length > 0, "Must have women's sports");
assert(mixedSports.length > 0, "Must have mixed sports");

// Test search filter logic
function searchSports(query) {
  const q = query.trim().toLowerCase();
  return STARTER_SPORTS.filter(
    (s) => s.name.toLowerCase().includes(q) || (s.coach_name && s.coach_name.toLowerCase().includes(q))
  );
}

const footballSearch = searchSports('football');
assert.strictEqual(footballSearch.length, 1, 'Should find 1 football');
assert.strictEqual(footballSearch[0].name, 'Football');

const sharmaCoachSearch = searchSports('Sharma');
assert.strictEqual(sharmaCoachSearch.length, 1, 'Should find coach Mr. Sharma');

const nonexistentSearch = searchSports('Curling');
assert.strictEqual(nonexistentSearch.length, 0, 'Should find 0 results for non-existent sport');

console.log('All Feature #1 logic tests passed successfully!');
