import React, { useState, useEffect } from 'react';

interface DynamicBackgroundProps {
  emotion: string | null;
}

const emotionToTheme: Record<string, string> = {
  romance: 'theme-romance',
  danger: 'theme-danger',
  suspense: 'theme-danger',
  horror: 'theme-danger',
  mystery: 'theme-mystery',
  calm: 'theme-calm',
  peaceful: 'theme-calm',
  joy: 'theme-joy',
  happy: 'theme-joy',
};

const DynamicBackground: React.FC<DynamicBackgroundProps> = ({ emotion }) => {
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  const [previousTheme, setPreviousTheme] = useState<string | null>(null);

  useEffect(() => {
    // Determine the new theme based on the emotion prop.
    const newTheme = emotion ? emotionToTheme[emotion.toLowerCase()] : null;
    
    // Only update if the theme has actually changed to prevent unnecessary re-renders.
    if (newTheme !== activeTheme) {
      // The current theme becomes the previous one, which will be faded out.
      setPreviousTheme(activeTheme);
      // The new theme becomes the active one, which will be faded in.
      setActiveTheme(newTheme);
    }
  }, [emotion, activeTheme]);

  // Using two divs allows for a smooth cross-fade effect.
  // The previous theme div fades to opacity 0 while the new active theme div fades to opacity 1.
  // The `key` prop is crucial to ensure React treats them as distinct elements for the transition.
  return (
    <>
      {previousTheme && (
        <div
          key={previousTheme}
          className={`dynamic-background ${previousTheme}`}
          style={{ opacity: 0 }} // Fades out
        />
      )}
      {activeTheme && (
        <div
          key={activeTheme}
          className={`dynamic-background ${activeTheme}`}
          style={{ opacity: 1 }} // Fades in
        />
      )}
    </>
  );
};

export default DynamicBackground;
