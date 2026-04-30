import React from 'react';
import { Suggestion } from '../services/scenarioSuggestions';

interface SuggestionBoxProps {
  suggestions: Suggestion | Suggestion[] | null;
}

const SuggestionBox: React.FC<SuggestionBoxProps> = ({ suggestions }) => {
  if (!suggestions) {
    return null;
  }

  const suggestionArray = Array.isArray(suggestions) ? suggestions : [suggestions];
  if (suggestionArray.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      {suggestionArray.map((suggestion, index) => (
        <div
          key={index}
          className={`p-3 rounded-md text-sm ${
            suggestion.type === 'warning'
              ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
              : 'bg-sky-500/20 border border-sky-500/30 text-sky-300'
          }`}
        >
          <div className="font-medium">
            {suggestion.type === 'warning' ? '⚠️ Suggestion' : '💡 Tip'}
          </div>
          <div>{suggestion.message}</div>
        </div>
      ))}
    </div>
  );
};

export default SuggestionBox;