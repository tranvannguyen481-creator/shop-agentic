import { ReactNode, createContext, useContext } from "react";

const RequiredFieldsContext = createContext<Set<string> | null>(null);

export function RequiredFieldsProvider({
  value,
  children,
}: {
  value: Set<string> | null;
  children: ReactNode;
}) {
  return (
    <RequiredFieldsContext.Provider value={value}>
      {children}
    </RequiredFieldsContext.Provider>
  );
}

export function useRequiredFields() {
  return useContext(RequiredFieldsContext);
}
