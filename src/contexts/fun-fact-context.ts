// src/contexts/fun-fact-context.ts
import * as React from 'react';

// This context will provide a function to allow any component
// to trigger a refresh of the fun fact.
interface FunFactContextType {
  refreshFunFact: () => void;
}

// We provide a no-op function as the default value to avoid errors
// if a component tries to use the context without a provider.
export const FunFactContext = React.createContext<FunFactContextType>({
  refreshFunFact: () => {},
});
