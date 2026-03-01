// app/api/data/route.js
// Returns the currently cached scraped data

import { getData } from '../../../lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = getData();
  return Response.json(data);
}
