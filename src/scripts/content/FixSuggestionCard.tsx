// FixSuggestionCard.tsx
import React from 'react';
import * as Diff from 'diff';

interface FixSuggestionCardProps {
  original: string;
  modified: string;
  explanation: string;
  onAccept: () => void;
  onDiscard: () => void;
  onAgain: () => void;
}

const FixSuggestionCard: React.FC<FixSuggestionCardProps> = ({
  original,
  modified,
  explanation,
  onAccept,
  onDiscard,
  onAgain,
}) => {
  const diff = Diff.diffLines(original, modified);

  // Filter to show only changed parts (removed or added)
  const changedParts = diff.filter(part => part.removed || part.added);

  return (
    <div className="border rounded-md shadow bg-white p-3 space-y-2 mt-2 relative">
      <p className="text-sm text-gray-700">{explanation}</p>

      <pre className="bg-gray-100 text-sm p-2 rounded overflow-x-auto font-mono whitespace-pre-wrap">
        {changedParts.map((part, index) => (
          <div
            key={index}
            className={part.added ? 'bg-green-100 text-green-800 px-1' : 'bg-red-100 text-red-700 px-1'}
          >
            {part.added ? '+' : '-'} {part.value.trim()}
          </div>
        ))}
      </pre>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onAccept}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        >
          Accept
        </button>
        <button
          onClick={onDiscard}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
        >
          Discard
        </button>
        <button
          onClick={onAgain}
          className="px-3 py-1 bg-orange-300 text-white rounded text-sm hover:bg-orange-400"
        >
          Again
        </button>
      </div>
    </div>
  );
};

export default FixSuggestionCard;