// Introduction page component with styled components and navigation tabs
import React, { useState } from 'react';
import styled from 'styled-components';
import { MapPin, Info, HelpCircle, MessageSquare, Github } from 'lucide-react';

interface IntroPageProps {
  onComplete: () => void;
}

interface TabButtonProps {
  $active: boolean;
}

interface ContentCardProps {
  wide?: boolean;
}

/**
 * Introduction page component shown to users on first visit to Research Focus Map
 */
const IntroPage: React.FC<IntroPageProps> = ({ onComplete }) => {
  const [activeSection, setActiveSection] = useState('about');
  const [logoError, setLogoError] = useState(false);

  const handleLogoError = () => {
    console.error('Failed to load favicon');
    setLogoError(true);
  };

  const handleLogoLoad = () => {
    console.log('Favicon loaded successfully');
    setLogoError(false);
  };

  return (
    <IntroContainer>
      {/* Background gradient accents */}
      <GradientBackground>
        <GradientTopLeft />
        <GradientBottomRight />
      </GradientBackground>
      
      {/* Main container */}
      <ContentContainer>
        {/* Header with title and tabs */}
        <Header>
          <LogoTitle>
            <LogoContainer>
              {logoError ? (
                <LogoFallback>LOGO</LogoFallback>
              ) : (
                <LogoImage 
                  src={`${process.env.PUBLIC_URL}/favicon-32x32.png`}
                  alt="Wilkes Center Research Focus Map Logo"
                  onError={handleLogoError}
                  onLoad={handleLogoLoad}
                />
              )}
            </LogoContainer>
            <Title>
              <TitleAccent>Research Focus</TitleAccent> Map
            </Title>
          </LogoTitle>
          
          {/* Action Buttons */}
          <EnterButtonContainer>
            <EnterButton onClick={onComplete}>
              <MapPin size={20} className="mr-2" />
              Enter Map
            </EnterButton>
          </EnterButtonContainer>
          
          {/* Navigation Tabs */}
          <TabContainer>
            <TabWrapper>
              <TabButton 
                $active={activeSection === 'about'}
                onClick={() => setActiveSection('about')}
              >
                <Info size={24} />
                <span>About</span>
                {activeSection === 'about' && <TabIndicator />}
              </TabButton>
              
              <TabButton 
                $active={activeSection === 'howto'}
                onClick={() => setActiveSection('howto')}
              >
                <HelpCircle size={24} />
                <span>How to Use</span>
                {activeSection === 'howto' && <TabIndicator />}
              </TabButton>
              
              <TabButton 
                $active={activeSection === 'feedback'}
                onClick={() => setActiveSection('feedback')}
              >
                <MessageSquare size={24} />
                <span>Feedback</span>
                {activeSection === 'feedback' && <TabIndicator />}
              </TabButton>
            </TabWrapper>
          </TabContainer>
        </Header>
        
        {/* Content container */}
        <Content>
          {activeSection === 'about' && (
            <CenteredContainer>
              {/* About This Tool */}
              <ContentCard>
                <SectionTitle>About This Tool</SectionTitle>
                <Divider />
                
                <Paragraph>
                  This map visualizes the geographic focus of Wilkes Scholars and their research activities across different institutions and locations. The interactive visualization displays research areas, academic departments, and scholarly work distribution, helping to understand the geographic scope and institutional connections of the Wilkes Center community.
                </Paragraph>

              </ContentCard>
            </CenteredContainer>
          )}

          {activeSection === 'howto' && (
            <CenteredContainer>
              {/* Quick Start Guide */}
              <GuideCard>
                <SectionTitle>Quick Start Guide</SectionTitle>
                <Divider />
                
                <StepList>
                  <Step>
                    <StepNumber>1</StepNumber>
                    <StepContent>
                      <StepTitle>Navigate the map</StepTitle>
                      <StepDescription>Use standard zoom and pan controls to explore different geographic regions and research locations.</StepDescription>
                    </StepContent>
                  </Step>
                  
                  <Step>
                    <StepNumber>2</StepNumber>
                    <StepContent>
                      <StepTitle>Filter by categories</StepTitle>
                      <StepDescription>Use the filter panel to narrow down research areas by department, term, or research type.</StepDescription>
                    </StepContent>
                  </Step>
                  
                  <Step>
                    <StepNumber>3</StepNumber>
                    <StepContent>
                      <StepTitle>Explore research markers</StepTitle>
                      <StepDescription>Click on map markers to view detailed information about research activities and scholars at each location.</StepDescription>
                    </StepContent>
                  </Step>
                  
                  <Step>
                    <StepNumber>4</StepNumber>
                    <StepContent>
                      <StepTitle>View research details</StepTitle>
                      <StepDescription>Access comprehensive information about research focus areas, institutional affiliations, and scholarly work.</StepDescription>
                    </StepContent>
                  </Step>
                  
                  <Step>
                    <StepNumber>5</StepNumber>
                    <StepContent>
                      <StepTitle>Customize your view</StepTitle>
                      <StepDescription>Adjust filters and map layers to focus on specific research themes or geographic regions of interest.</StepDescription>
                    </StepContent>
                  </Step>
                </StepList>
              </GuideCard>
            </CenteredContainer>
          )}

          {activeSection === 'feedback' && (
            <ContentCard wide>
              <SectionTitle>Submit Feedback</SectionTitle>
              <Divider />
              
              <FeedbackContainer>
                <FeedbackHeader>
                  <Github size={24} className="mr-3" />
                  <FeedbackTitle>GitHub Issues</FeedbackTitle>
                </FeedbackHeader>
                
                <Paragraph>
                  For bug reports, feature requests, and technical feedback about the Research Focus Map, please submit a GitHub issue. This helps us track and address your concerns effectively.
                </Paragraph>
                
                <GithubLink>
                  <RepoUrl>
                    github.com/wilkes-center/research-focus-map/issues
                  </RepoUrl>
                  <SubmitButton 
                    href="https://github.com/wilkes-center/research-focus-map/issues" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Submit Issue
                  </SubmitButton>
                </GithubLink>
              </FeedbackContainer>
            </ContentCard>
          )}
        </Content>
      </ContentContainer>
    </IntroContainer>
  );
};

// Styled Components
const IntroContainer = styled.div`
  position: fixed;
  inset: 0;
  font-family: 'Sora', sans-serif;
  background-color: #f9f6ef;
  z-index: 1000;
`;

const GradientBackground = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
`;

const GradientTopLeft = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 33%;
  height: 33%;
  background-color: rgba(153, 170, 136, 0.1);
  border-radius: 50%;
  filter: blur(100px);
  transform: translate(-50%, -50%);
`;

const GradientBottomRight = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 50%;
  height: 50%;
  background-color: rgba(45, 89, 84, 0.05);
  border-radius: 50%;
  filter: blur(100px);
  transform: translate(25%, 25%);
`;

const ContentContainer = styled.div`
  width: 100%;
  height: 100%;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  max-height: 100vh;
  overflow: auto;
`;

const Header = styled.header`
  margin-bottom: 2rem;
`;

const LogoTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const LogoContainer = styled.div`
  width: 4rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LogoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 0.375rem;
`;

const LogoFallback = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #99aa88;
  border-radius: 0.375rem;
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
`;

const Title = styled.h1`
  font-family: 'Sora', sans-serif;
  font-size: 36pt;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 24pt;
  }
`;

const TitleAccent = styled.span`
  color: #751d0c;
`;

const EnterButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
`;

const EnterButton = styled.button`
  background-color: #751d0c;
  color: white;
  font-family: 'Sora', sans-serif;
  font-weight: 600;
  font-size: 18px;
  padding: 0.75rem 2.5rem;
  border-radius: 0.75rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background-color: #8b2113;
    transform: scale(1.05);
  }
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
`;

const TabWrapper = styled.div`
  display: flex;
  gap: 1rem;
  padding: 0.25rem;
  background-color: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(4px);
  border-radius: 0.75rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const TabButton = styled.button<TabButtonProps>`
  padding: 1rem 2.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  position: relative;
  font-family: 'Sora', sans-serif;
  font-size: 16px;
  background-color: ${props => props.$active ? 'rgba(153, 170, 136, 0.3)' : 'transparent'};
  color: ${props => props.$active ? '#2d5954' : 'rgba(45, 89, 84, 0.7)'};
  font-weight: ${props => props.$active ? '600' : '400'};
  
  &:hover {
    background-color: ${props => props.$active ? 'rgba(153, 170, 136, 0.3)' : 'rgba(45, 89, 84, 0.05)'};
  }
`;

const TabIndicator = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: #751d0c;
  border-radius: 0 0 4px 4px;
`;

const Content = styled.div`
  flex: 1;
  margin-bottom: 2rem;
`;

const ContentCard = styled.div<ContentCardProps>`
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  grid-column: ${props => props.wide ? '1 / -1' : 'auto'};
`;

const GuideCard = styled(ContentCard)``;

const SectionTitle = styled.h2`
  font-family: 'Sora', sans-serif;
  font-size: 24pt;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 1.5rem 0;
`;


const Divider = styled.div`
  height: 3px;
  width: 5rem;
  background-color: #751d0c;
  margin-bottom: 1.5rem;
`;

const Paragraph = styled.p`
  font-family: 'Sora', sans-serif;
  font-size: 12pt;
  font-weight: 400;
  line-height: 1.6;
  color: #1a1a1a;
  margin-bottom: 1rem;
`;

const StepList = styled.ol`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Step = styled.li`
  display: flex;
  align-items: flex-start;
`;

const StepNumber = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #99aa88;
  color: #2d5954;
  font-family: 'Sora', sans-serif;
  font-weight: 700;
  margin-right: 1rem;
  flex-shrink: 0;
`;

const StepContent = styled.div``;

const StepTitle = styled.h3`
  font-family: 'Sora', sans-serif;
  font-size: 12pt;
  font-weight: 600;
  color: #2d5954;
  margin: 0 0 0.25rem 0;
`;

const StepDescription = styled.p`
  font-family: 'Sora', sans-serif;
  font-size: 9pt;
  font-weight: 400;
  color: #1a1a1a;
  margin: 0;
`;

const FeedbackContainer = styled.div`
  background-color: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
`;

const FeedbackHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  color: #2d5954;
`;

const FeedbackTitle = styled.h4`
  font-family: 'Sora', sans-serif;
  font-size: 14pt;
  font-weight: 500;
  margin: 0;
`;

const GithubLink = styled.div`
  background-color: #f9f6ef;
  border: 1px solid rgba(153, 170, 136, 0.5);
  border-radius: 0.5rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const RepoUrl = styled.div`
  flex: 1;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  color: #1a1a1a;
  font-family: 'Sora', sans-serif;
  font-size: 9pt;
`;

const SubmitButton = styled.a`
  padding: 0.5rem 1.25rem;
  background-color: #2d5954;
  color: #f9f6ef;
  border-radius: 0.5rem;
  font-family: 'Sora', sans-serif;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s;
  white-space: nowrap;
  
  &:hover {
    background-color: #1e3d3a;
  }
`;

const CenteredContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  padding-top: 2rem;
  
  ${ContentCard} {
    max-width: 800px;
    width: 100%;
  }
`;

export default IntroPage; 