import React from 'react';

interface ErrorDisplayProps {
  isVisible: boolean;
  onDismiss: () => void;
  setDebugResponse: (value: string | null) => void;
  setParsed: (value: any) => void;
  debugResponse: string | null;
  parsed: any;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ isVisible, onDismiss, setDebugResponse, setParsed, debugResponse, parsed }) => {
  const handleDismiss = () => {
    if (debugResponse !== null && parsed === null) {
      setDebugResponse(null);
      setParsed(null);
    }
    onDismiss();
  };

  return (
    <div
      className={`fixed right-4 bg-red-100 text-red-800 border border-red-300 rounded-md shadow-lg p-4 z-[1002] transition-transform duration-300 ease-in-out ${
        isVisible ? 'animate-slide-in-shake' : 'translate-x-[calc(100%+1rem)]'
      }`}
      style={{ 
        bottom: '110px', 
        maxWidth: '600px'
      }}
    >
      <p className="text-sm">Debugger unexpectedly failed this time. Please try again!</p>
      <button
        onClick={handleDismiss}
        className="absolute top-0 right-0 px-1 py-0 text-gray-500 rounded-full text-xs hover:bg-red-600 hover:text-white" 
        style={{ fontSize: '0.65rem' }}
      >
        ✕
      </button>
    </div>
  );
};

export default ErrorDisplay;