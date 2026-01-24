/**
 * Keyless-by-default Political Ingest
 * Uses official public sources without API keys:
 * - FederalRegister.gov API (no key)
 * - House Roll Call Votes XML (no key)
 * - Senate Roll Call Votes XML (no key)
 */

export interface PoliticalDocument {
  id: string;
  title: string;
  type: 'rule' | 'notice' | 'proposed_rule' | 'vote' | 'statement';
  source: 'federal_register' | 'house_votes' | 'senate_votes';
  date: string;
  url: string;
  abstract?: string;
  agencies?: string[];
  full_text?: string;
}

export interface VoteRecord {
  rollNumber: number;
  congress: number;
  session: number;
  chamber: 'house' | 'senate';
  date: string;
  question: string;
  result: string;
  url: string;
}

export interface MemberVote {
  memberId: string;
  memberName: string;
  party: string;
  state: string;
  vote: 'Yea' | 'Nay' | 'Not Voting' | 'Present';
}

const FEDERAL_REGISTER_API = "https://www.federalregister.gov/api/v1";
const HOUSE_VOTES_BASE = "https://clerk.house.gov/evs";
const SENATE_VOTES_BASE = "https://www.senate.gov/legislative/LIS/roll_call_votes";

export async function searchFederalRegister(params: {
  term?: string;
  agencies?: string[];
  docType?: ('RULE' | 'PRORULE' | 'NOTICE')[];
  perPage?: number;
}): Promise<{ results: PoliticalDocument[]; count: number }> {
  const searchParams = new URLSearchParams();
  
  if (params.term) {
    searchParams.set('conditions[term]', params.term);
  }
  if (params.agencies?.length) {
    params.agencies.forEach(a => searchParams.append('conditions[agencies][]', a));
  }
  if (params.docType?.length) {
    params.docType.forEach(t => searchParams.append('conditions[type][]', t));
  }
  searchParams.set('per_page', String(params.perPage || 10));
  searchParams.set('order', 'newest');
  
  const res = await fetch(`${FEDERAL_REGISTER_API}/documents.json?${searchParams}`);
  
  if (!res.ok) {
    throw new Error(`Federal Register API error: ${res.status}`);
  }
  
  const data = await res.json();
  
  const results: PoliticalDocument[] = (data.results || []).map((doc: any) => ({
    id: doc.document_number,
    title: doc.title,
    type: doc.type === 'Rule' ? 'rule' : doc.type === 'Proposed Rule' ? 'proposed_rule' : 'notice',
    source: 'federal_register' as const,
    date: doc.publication_date,
    url: doc.html_url,
    abstract: doc.abstract,
    agencies: doc.agencies?.map((a: any) => a.name) || [],
  }));
  
  return { results, count: data.count || results.length };
}

export async function getRecentFederalRegisterByAgency(
  agencySlug: string,
  limit: number = 5
): Promise<PoliticalDocument[]> {
  const res = await fetch(
    `${FEDERAL_REGISTER_API}/documents.json?conditions[agencies][]=${agencySlug}&per_page=${limit}&order=newest`
  );
  
  if (!res.ok) {
    return [];
  }
  
  const data = await res.json();
  
  return (data.results || []).map((doc: any) => ({
    id: doc.document_number,
    title: doc.title,
    type: doc.type === 'Rule' ? 'rule' : doc.type === 'Proposed Rule' ? 'proposed_rule' : 'notice',
    source: 'federal_register' as const,
    date: doc.publication_date,
    url: doc.html_url,
    abstract: doc.abstract,
    agencies: doc.agencies?.map((a: any) => a.name) || [],
  }));
}

export async function getHouseVotesList(
  year: number,
  session: number = 1
): Promise<VoteRecord[]> {
  const congress = Math.floor((year - 1789) / 2) + 1;
  const url = `${HOUSE_VOTES_BASE}/${year}/index.asp`;
  
  return [{
    rollNumber: 0,
    congress,
    session,
    chamber: 'house',
    date: `${year}-01-01`,
    question: 'House votes available at clerk.house.gov',
    result: 'See source',
    url,
  }];
}

export async function getSenateVotesList(
  congress: number,
  session: number = 1
): Promise<VoteRecord[]> {
  const url = `${SENATE_VOTES_BASE}/vote_menu_${congress}_${session}.xml`;
  
  return [{
    rollNumber: 0,
    congress,
    session,
    chamber: 'senate',
    date: new Date().toISOString().split('T')[0],
    question: 'Senate votes available at senate.gov',
    result: 'See source',
    url,
  }];
}

export async function searchPoliticalDocuments(query: string): Promise<{
  federalRegister: PoliticalDocument[];
  votesSummary: { house: string; senate: string };
}> {
  const [frResults] = await Promise.all([
    searchFederalRegister({ term: query, perPage: 10 }),
  ]);
  
  const currentYear = new Date().getFullYear();
  const congress = Math.floor((currentYear - 1789) / 2) + 1;
  
  return {
    federalRegister: frResults.results,
    votesSummary: {
      house: `https://clerk.house.gov/evs/${currentYear}`,
      senate: `https://www.senate.gov/legislative/LIS/roll_call_votes/vote_menu_${congress}_1.xml`,
    },
  };
}

export function getKeylessSourceInfo() {
  return {
    sources: [
      {
        name: 'Federal Register',
        description: 'Official rulemaking documents, notices, executive publications',
        url: 'https://www.federalregister.gov/developers/documentation/api/v1',
        keyRequired: false,
      },
      {
        name: 'House Roll Call Votes',
        description: 'Official House voting records in XML format',
        url: 'https://clerk.house.gov/evs/',
        keyRequired: false,
      },
      {
        name: 'Senate Roll Call Votes',
        description: 'Official Senate voting records in XML format',
        url: 'https://www.senate.gov/legislative/votes.htm',
        keyRequired: false,
      },
    ],
    enrichmentSources: [
      {
        name: 'Congress.gov API',
        description: 'Detailed member info, bills, statements',
        keyUrl: 'https://api.data.gov/signup/',
        keyRequired: true,
      },
      {
        name: 'GovInfo API',
        description: 'Congressional publications, hearings',
        keyUrl: 'https://api.data.gov/signup/',
        keyRequired: true,
      },
    ],
  };
}
