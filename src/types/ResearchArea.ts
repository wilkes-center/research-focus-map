export interface ResearchArea {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: string;
  term: string;
  type: string;
  mapFocus: 'World' | 'Utah' | 'Campus';
  researcherName: string;
  collaborator: string;
  links: string;
  geographicFocus: string;
}

export type ResearchCategory = 'Ecology' | 'Geology' | 'Climate' | 'Art/Environment' | 'Forestry' | 'Research'; 