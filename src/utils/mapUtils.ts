import { ResearchArea } from '../types/ResearchArea';

// Color mapping for departments using Wilkes Center color palette
const DEPARTMENT_COLORS: { [key: string]: string } = {
  'Anthropology': '#cea25d', // Canyonlands Tan
  'Atmospheric Sciences': '#99aa88', // Spiral Jetty Sage
  'Biology': '#2d5954', // Great Salt Lake Green
  'Biomedical Engineering': '#789ba8', // Bonneville Salt Flats Blue
  'Biomedical Informatics': '#dd3b00', // Rocky Mountain Rust
  'Chemistry': '#751d0c', // Moab Mahogany
  'Civil & Environmental Engineering': '#99aa88', // Spiral Jetty Sage
  'Communication': '#cea25d', // Canyonlands Tan
  'ENVST': '#2d5954', // Great Salt Lake Green
  'Environmental Humanities': '#99aa88', // Spiral Jetty Sage
  'Gender Studies': '#dd3b00', // Rocky Mountain Rust
  'Geography': '#cea25d', // Canyonlands Tan
  'Geology & Geophysics': '#751d0c', // Moab Mahogany
  'Health': '#789ba8', // Bonneville Salt Flats Blue
  'Materials Science Engineering': '#2d5954', // Great Salt Lake Green
  'Mathematics': '#1a1a1a', // Olympic Park Obsidian
  'Mechanical Engineering': '#789ba8', // Bonneville Salt Flats Blue
  'Medicine': '#dd3b00', // Rocky Mountain Rust
  'Neurobiology': '#99aa88', // Spiral Jetty Sage
  'Neuroscience': '#2d5954', // Great Salt Lake Green
  'PSM': '#cea25d', // Canyonlands Tan
  'Political Science': '#751d0c', // Moab Mahogany
  'Psychology': '#789ba8', // Bonneville Salt Flats Blue
  'Sociology': '#dd3b00' // Rocky Mountain Rust
};

// Get color for a department
export const getDepartmentColor = (department: string): string => {
  return DEPARTMENT_COLORS[department] || '#1a1a1a'; // Default Olympic Park Obsidian
};

// Get all unique departments from research areas
export const getUniqueDepartments = (researchAreas: ResearchArea[]): string[] => {
  const departments = new Set(researchAreas.map(area => area.category));
  return Array.from(departments).sort();
};

// Filter research areas by departments
export const filterByDepartments = (researchAreas: ResearchArea[], selectedDepartments: string[]): ResearchArea[] => {
  if (selectedDepartments.length === 0) return researchAreas;
  return researchAreas.filter(area => selectedDepartments.includes(area.category));
};

// Get research areas by map focus
export const getResearchAreasByFocus = (researchAreas: ResearchArea[], focusOnUtah: boolean): ResearchArea[] => {
  if (focusOnUtah) {
    return researchAreas.filter(area => area.mapFocus === 'Utah' || area.mapFocus === 'Campus');
  }
  return researchAreas;
}; 