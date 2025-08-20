// Map utilities for colors, filtering, and department categorization
import { ResearchArea } from '../types/ResearchArea';


const DEPARTMENT_COLORS: { [key: string]: string } = {
  // Original department names from CSV
  'ENVST': '#2d5954', // Great Salt Lake Green
  'Environmental Studies': '#2d5954', // Great Salt Lake Green
  'Anthropology': '#cea25d', // Canyonlands Tan
  'Chemistry': '#751d0c', // Moab Mahogany
  'Atmospheric Sciences': '#99aa88', // Spiral Jetty Sage
  'Biology': '#2d5954', // Great Salt Lake Green
  'School of Biological Sciences': '#2d5954', // Great Salt Lake Green
  'Materials Science Engineering': '#2d5954', // Great Salt Lake Green
  'Department of Materials Science and Engineering': '#2d5954', // Great Salt Lake Green
  'Materials Science & Engineering': '#2d5954', // Great Salt Lake Green
  'Geology & Geophysics': '#751d0c', // Moab Mahogany
  'Department of Geology and Geophysics': '#751d0c', // Moab Mahogany
  'Geology and Geophysics': '#751d0c', // Moab Mahogany
  'Communication': '#cea25d', // Canyonlands Tan
  'Department of Communication': '#cea25d', // Canyonlands Tan
  'Civil & Environmental Engineering': '#99aa88', // Spiral Jetty Sage
  'Department of Civil and Environmental Engineering': '#99aa88', // Spiral Jetty Sage
  'Medicine': '#dd3b00', // Rocky Mountain Rust
  'Biomedical Engineering': '#789ba8', // Bonneville Salt Flats Blue
  'Biomedical Informatics': '#dd3b00', // Rocky Mountain Rust
  'Mathematics': '#1a1a1a', // Olympic Park Obsidian
  'Gender Studies': '#dd3b00', // Rocky Mountain Rust
  'Department of Gender Studies': '#dd3b00', // Rocky Mountain Rust
  'Sociology': '#dd3b00', // Rocky Mountain Rust
  'Department of Sociology': '#dd3b00', // Rocky Mountain Rust
  'Psychology': '#789ba8', // Bonneville Salt Flats Blue
  'Department of Psychology': '#789ba8', // Bonneville Salt Flats Blue
  'Political Science': '#751d0c', // Moab Mahogany
  'Department of Political Science': '#751d0c', // Moab Mahogany
  'School of Dentistry': '#dd3b00', // Rocky Mountain Rust
  'Neuroscience': '#2d5954', // Great Salt Lake Green
  'Neurobiology': '#99aa88', // Spiral Jetty Sage
  'Mechanical Engineering': '#789ba8', // Bonneville Salt Flats Blue
  'Architecture': '#cea25d', // Canyonlands Tan
  'Architecure': '#cea25d', // Canyonlands Tan (typo in CSV)
  'Health': '#789ba8', // Bonneville Salt Flats Blue
  'Geography': '#cea25d', // Canyonlands Tan
  'Environmental Humanities': '#99aa88', // Spiral Jetty Sage
  'PSM': '#cea25d', // Canyonlands Tan
  'City & Metropolitan Planning': '#cea25d', // Canyonlands Tan
  'Chemical Engineering': '#751d0c', // Moab Mahogany
  'Population Health Sciences': '#789ba8', // Bonneville Salt Flats Blue
  'Epidemiology/Internal Medicine': '#dd3b00', // Rocky Mountain Rust
  'Anesthesiology': '#dd3b00', // Rocky Mountain Rust
  'Parks, Recreation & Tourism': '#2d5954', // Great Salt Lake Green
  'Surgery, Division of Urology': '#dd3b00', // Rocky Mountain Rust
  'Elect & Computer Engineering': '#789ba8', // Bonneville Salt Flats Blue
  'History': '#cea25d', // Canyonlands Tan
  'Pediatrics': '#dd3b00', // Rocky Mountain Rust
  
  // Legacy category names (for backward compatibility)
  'Climate': '#2d5954', // Great Salt Lake Green
  'Ecology': '#2d5954', // Great Salt Lake Green
  'Research': '#1a1a1a', // Olympic Park Obsidian
  'Geology': '#751d0c' // Moab Mahogany
};

// Get color for a department (handles both original department names and categories)
export const getDepartmentColor = (department: string): string => {
  return DEPARTMENT_COLORS[department] || '#1a1a1a'; // Default Olympic Park Obsidian
};

// Get all unique departments from research areas
export const getUniqueDepartments = (researchAreas: ResearchArea[]): string[] => {
  const departments = new Set(researchAreas.map(area => area.department));
  return Array.from(departments).sort();
};

// Filter research areas by departments
export const filterByDepartments = (researchAreas: ResearchArea[], selectedDepartments: string[]): ResearchArea[] => {
  if (selectedDepartments.length === 0) return researchAreas;
  return researchAreas.filter(area => selectedDepartments.includes(area.department));
};

// Get research areas by map focus
export const getResearchAreasByFocus = (researchAreas: ResearchArea[], focusOnUtah: boolean): ResearchArea[] => {
  if (focusOnUtah) {
    return researchAreas.filter(area => area.mapFocus === 'Utah' || area.mapFocus === 'Campus');
  }
  return researchAreas;
}; 