import React, { useState, useEffect } from 'react';
import MapComponent from './components/MapComponent';
import CategoryFilter from './components/CategoryFilter';
import IntroPage from './components/IntroPage';
import LoadingAnimation from './components/LoadingAnimation';
import { ResearchArea } from './types/ResearchArea';
import { loadResearchFocusData } from './utils/csvParser';
import './App.css';

interface FilterState {
  departments: string[];
  terms: string[];
  types: string[];
}

const App: React.FC = () => {
  const [selectedFilters, setSelectedFilters] = useState<FilterState>({
    departments: [],
    terms: [],
    types: []
  });
  const [researchAreas, setResearchAreas] = useState<ResearchArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading Research Areas...');
  const [error, setError] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [hasStartedLoading, setHasStartedLoading] = useState(false);
  
  useEffect(() => {
    // Only load data if user has clicked Enter Map
    if (!hasStartedLoading) return;

    const loadData = async () => {
      try {
        console.log('Starting to load CSV data...');
        setLoading(true);
        setLoadingMessage('Loading research data...');
        setError(null);
        
        // Start timer for minimum loading duration
        const startTime = Date.now();
        const minimumLoadingTime = 2000; // 2 seconds
        
        // Update loading message after a short delay to indicate geocoding
        setTimeout(() => {
          setLoadingMessage('Loading location data...');
        }, 1000);
        
        const data = await loadResearchFocusData();
        console.log('Loaded data:', data);
        console.log('Number of research areas:', data.length);
        
        // Calculate remaining time to ensure minimum loading duration
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);
        
        // Wait for remaining time if needed
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
        if (data.length === 0) {
          setError('No research areas were loaded from the CSV file');
        } else {
          setResearchAreas(data);
        }
      } catch (err) {
        console.error('Error in loadData:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [hasStartedLoading]);
  
  const handleEnterMap = () => {
    setShowIntro(false);
    setHasStartedLoading(true);
  };
  
  const handleReturnToIntro = () => {
    setShowIntro(true);
    setHasStartedLoading(false);
    setLoading(false);
    setError(null);
  };
  
  // Extract unique values for each filter type
  const departments = Array.from(new Set(researchAreas.map(area => area.category))).sort();
  const terms = Array.from(new Set(researchAreas.map(area => area.term))).sort();
  const types = Array.from(new Set(researchAreas.map(area => area.type))).sort();

  // Show intro page first
  if (showIntro) {
    return <IntroPage onComplete={handleEnterMap} />;
  }

  if (loading) {
    return <LoadingAnimation />;
  }

  if (error) {
    return (
      <div className="App">
        <header style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2000,
          backgroundColor: '#1a1a1a',
          borderBottom: '2px solid #1a1a1a',
          padding: '12px 24px',
          boxShadow: '0 1px 6px rgba(26,26,26,0.1)'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '700',
            color: '#f9f6ef',
            fontFamily: 'Sora, -apple-system, BlinkMacSystemFont, sans-serif',
            letterSpacing: '0.08em',
            textAlign: 'center',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            cursor: 'pointer'
          }}
          onClick={handleReturnToIntro}
          title="Return to Introduction"
          >
            <img 
              src={`${process.env.PUBLIC_URL}/logo192.png`} 
              alt="Wilkes Center Logo" 
              style={{
                width: '24px',
                height: '24px'
              }}
            />
            WILKES CENTER RESEARCH MAP
          </h1>
        </header>
        
        <div style={{ paddingTop: '60px', height: '100vh' }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            backgroundColor: '#f9f6ef',
            padding: '40px',
            borderRadius: '0',
            boxShadow: '0 4px 20px rgba(26,26,26,0.15)',
            border: '2px solid #dd3b00',
            fontFamily: 'Sora, sans-serif',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              margin: '0 0 16px 0', 
              color: '#dd3b00',
              fontSize: '20px',
              fontWeight: '600'
            }}>
              Error Loading Data
            </h2>
            <p style={{ 
              margin: '0', 
              color: '#1a1a1a',
              fontSize: '14px'
            }}>
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2000,
        backgroundColor: '#1a1a1a',
        borderBottom: '2px solid #1a1a1a',
        padding: '12px 24px',
        boxShadow: '0 1px 6px rgba(26,26,26,0.1)'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: '700',
          color: '#f9f6ef',
          fontFamily: 'Sora, -apple-system, BlinkMacSystemFont, sans-serif',
          letterSpacing: '0.08em',
          textAlign: 'center',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          cursor: 'pointer'
        }}
        onClick={handleReturnToIntro}
        title="Return to Introduction"
        >
          <img 
            src={`${process.env.PUBLIC_URL}/logo192.png`} 
            alt="Wilkes Center Logo" 
            style={{
              width: '24px',
              height: '24px'
            }}
          />
          WILKES CENTER RESEARCH MAP
        </h1>
      </header>
      
      <div style={{ paddingTop: '60px', height: '100vh' }}>
        {!loading && !error && (
          <>
            <MapComponent 
              researchAreas={researchAreas}
              selectedFilters={selectedFilters}
            />
            <CategoryFilter
              departments={departments}
              terms={terms}
              types={types}
              selectedFilters={selectedFilters}
              onFiltersChange={setSelectedFilters}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default App; 