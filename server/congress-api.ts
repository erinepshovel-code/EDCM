const CONGRESS_API_BASE = "https://api.congress.gov/v3";

interface CongressMember {
  bioguideId: string;
  name: string;
  party: string;
  state: string;
  chamber: string;
  url?: string;
}

interface MemberStatement {
  date: string;
  title: string;
  url: string;
  type: string;
}

export async function searchMembers(query: string, apiKey: string): Promise<CongressMember[]> {
  if (!apiKey) {
    throw new Error("CONGRESS_API_KEY required");
  }

  const searchTerms = query.toLowerCase().split(" ");
  
  const res = await fetch(
    `${CONGRESS_API_BASE}/member?api_key=${apiKey}&limit=50&format=json`
  );
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Congress API error: ${res.status} - ${text}`);
  }
  
  const data = await res.json();
  const members = data.members || [];
  
  const filtered = members.filter((m: any) => {
    const fullName = (m.name || "").toLowerCase();
    const firstName = (m.firstName || "").toLowerCase();
    const lastName = (m.lastName || "").toLowerCase();
    
    return searchTerms.some(term => 
      fullName.includes(term) || 
      firstName.includes(term) || 
      lastName.includes(term)
    );
  });
  
  return filtered.slice(0, 10).map((m: any) => ({
    bioguideId: m.bioguideId,
    name: m.name || `${m.firstName} ${m.lastName}`,
    party: m.partyName || m.party || "Unknown",
    state: m.state || "Unknown",
    chamber: m.terms?.item?.[0]?.chamber || "Unknown",
    url: m.url,
  }));
}

export async function getMemberDetails(bioguideId: string, apiKey: string): Promise<any> {
  if (!apiKey) {
    throw new Error("CONGRESS_API_KEY required");
  }

  const res = await fetch(
    `${CONGRESS_API_BASE}/member/${bioguideId}?api_key=${apiKey}&format=json`
  );
  
  if (!res.ok) {
    throw new Error(`Congress API error: ${res.status}`);
  }
  
  return res.json();
}

export async function searchCongressionalRecord(
  query: string, 
  apiKey: string,
  limit: number = 10
): Promise<any[]> {
  if (!apiKey) {
    throw new Error("CONGRESS_API_KEY required");
  }

  const res = await fetch(
    `${CONGRESS_API_BASE}/congressional-record?api_key=${apiKey}&limit=${limit}&format=json`
  );
  
  if (!res.ok) {
    throw new Error(`Congress API error: ${res.status}`);
  }
  
  const data = await res.json();
  return data.results || [];
}

export async function getRecentBillsByMember(
  bioguideId: string,
  apiKey: string,
  limit: number = 5
): Promise<any[]> {
  if (!apiKey) {
    throw new Error("CONGRESS_API_KEY required");
  }

  const res = await fetch(
    `${CONGRESS_API_BASE}/member/${bioguideId}/sponsored-legislation?api_key=${apiKey}&limit=${limit}&format=json`
  );
  
  if (!res.ok) {
    return [];
  }
  
  const data = await res.json();
  return data.sponsoredLegislation || [];
}
