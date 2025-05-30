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

  // Split explanation into lines to preserve newlines
  const explanationLines = explanation.split('\n').map(line => line.trim());

  // Function to parse bold (**text**) and backtick (`text`) within a line
  const parseLine = (line: string, lineIndex: number) => {
    // First, split on backticks to handle inline code
    let parts = line.split(/(`[^`]+`)/g);
    // Then, within each non-backtick part, split on ** for bold
    const renderedParts: JSX.Element[] = [];
    parts.forEach((part, partIndex) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        // Handle backtick-enclosed text
        renderedParts.push(
          <span
            key={`${lineIndex}-${partIndex}`}
            className="bg-orange-400/10 text-orange-500 font-mono text-sm px-1.5 py-0.5 rounded"
          >
            {part.slice(1, -1)}
          </span>
        );
      } else {
        // Split on ** for bold text, ensuring pairs of ** are matched
        const boldParts = part.split(/\*\*(.*?)\*\*/g);
        boldParts.forEach((boldPart, boldIndex) => {
          if (boldIndex % 2 === 1) {
            // Odd indices are the text between ** **, so render as bold
            renderedParts.push(
              <span
                key={`${lineIndex}-${partIndex}-${boldIndex}`}
                className="font-bold"
              >
                {boldPart}
              </span>
            );
          } else {
            // Even indices are outside ** **, render as normal text
            renderedParts.push(
              <span key={`${lineIndex}-${partIndex}-${boldIndex}`}>
                {boldPart}
              </span>
            );
          }
        });
      }
    });
    return renderedParts;
  };

  return (
    <div className="border rounded-md shadow bg-white p-3 space-y-2 mt-2 relative">
      {/* Render explanation with preserved newlines, styled backtick content, and bold text */}
      <div className="text-sm text-gray-700">
        {explanationLines.map((line, lineIndex) => (
          <p key={lineIndex} className="mb-1 last:mb-0">
            {parseLine(line, lineIndex)}
          </p>
        ))}
      </div>

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