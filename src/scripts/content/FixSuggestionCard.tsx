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
  // Process the diff to extract changed parts with correct line numbers
  const diff = Diff.diffLines(original, modified);

  const highlightCharDiff = (
    originalLine: string,
    modifiedLine: string
  ): { original: JSX.Element; modified: JSX.Element } => {
    const charDiff = Diff.diffChars(originalLine, modifiedLine);

    const originalElements: JSX.Element[] = [];
    const modifiedElements: JSX.Element[] = [];

    charDiff.forEach((part, i) => {
      if (part.added) {
        modifiedElements.push(
          <span
            key={`mod-${i}`}
            className={/^\s+$/.test(part.value) ? 'bg-green-400' : ''}
          >
            {part.value}
          </span>
        );
      } else if (part.removed) {
        originalElements.push(
          <span
            key={`orig-${i}`}
            className={/^\s+$/.test(part.value) ? 'bg-red-400' : ''}
          >
            {part.value}
          </span>
        );
      } else {
        originalElements.push(<span key={`orig-${i}`}>{part.value}</span>);
        modifiedElements.push(<span key={`mod-${i}`}>{part.value}</span>);
      }
    });

    return {
      original: <>{originalElements}</>,
      modified: <>{modifiedElements}</>,
    };
  };

  // Split explanation into parts based on backticks
  const explanationParts = explanation.split(/(`[^`]+`)/g);

  return (
    <div className="border rounded-md shadow bg-white p-3 space-y-2 mt-2 relative">
      {/* Render explanation with styled backtick content */}
      <p className="text-sm text-gray-700">
        {explanationParts.map((part, index) =>
          part.startsWith('`') && part.endsWith('`') ? (
            <span
              key={index}
              className="bg-orange-400/10 text-orange-500 font-mono text-sm px-1.5 py-0.5 rounded"
            >
              {part.slice(1, -1)}
            </span>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </p>

      <pre className="bg-gray-100 text-sm p-2 rounded overflow-x-auto font-mono whitespace-pre-wrap">
        {(() => {
          let originalLine = 1;
          let modifiedLine = 1;
          const renderedLines: JSX.Element[] = [];

          for (let i = 0; i < diff.length; i++) {
            const part = diff[i];
            const lines = part.value.split('\n');
            if (lines[lines.length - 1] === '') lines.pop();

            // Case: Removed followed by Added → treat as a pair
            if (part.removed && diff[i + 1]?.added) {
              const nextPart = diff[i + 1];
              const removedLines = lines;
              const addedLines = nextPart.value.split('\n');
              if (addedLines[addedLines.length - 1] === '') addedLines.pop();

              // First, render all removed lines
              removedLines.forEach((line, j) => {
                const modLine = addedLines[j] ?? '';
                const { original } = highlightCharDiff(line, modLine);
                renderedLines.push(
                  <div key={`removed-${i}-${j}`} className="bg-red-100 text-red-700 px-1">
                    <span className="inline-block w-8 text-right text-gray-500 pr-2">
                      {originalLine++}
                    </span>
                    {original}
                  </div>
                );
              });

              // Then render all added lines
              addedLines.forEach((line, j) => {
                const origLine = removedLines[j] ?? '';
                const { modified } = highlightCharDiff(origLine, line);
                renderedLines.push(
                  <div key={`added-${i}-${j}`} className="bg-green-100 text-green-800 px-1">
                    <span className="inline-block w-8 text-right text-gray-500 pr-2">
                      {modifiedLine++}
                    </span>
                    {modified}
                  </div>
                );
              });

              i++; // Skip added part since we already handled it
            } else if (part.removed) {
              // Removed block with no matching added part
              lines.forEach((line, j) => {
                renderedLines.push(
                  <div key={`removed-${i}-${j}`} className="bg-red-100 text-red-700 px-1">
                    <span className="inline-block w-8 text-right text-gray-500 pr-2">
                      {originalLine++}
                    </span>
                    {line}
                  </div>
                );
              });
            } else if (part.added) {
              // Added block with no matching removed part
              lines.forEach((line, j) => {
                renderedLines.push(
                  <div key={`added-${i}-${j}`} className="bg-green-100 text-green-800 px-1">
                    <span className="inline-block w-8 text-right text-gray-500 pr-2">
                      {modifiedLine++}
                    </span>
                    {line}
                  </div>
                );
              });
            } else {
              // Unchanged lines (skip or handle if needed)
              lines.forEach(() => {
                originalLine++;
                modifiedLine++;
              });
            }
          }

          return renderedLines;
        })()}
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