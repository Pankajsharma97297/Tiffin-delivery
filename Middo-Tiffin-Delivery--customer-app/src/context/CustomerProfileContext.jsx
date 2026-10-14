import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

const noop = () => undefined;

const CustomerProfileContext = createContext({
  customerProfile: null,
  mergeCustomerProfile: noop,
  setCustomerProfile: noop,
});

export function CustomerProfileProvider({ children }) {
  const [customerProfile, setCustomerProfileState] = useState(null);

  const setCustomerProfile = useCallback(profile => {
    setCustomerProfileState(profile || null);
  }, []);

  const mergeCustomerProfile = useCallback(patch => {
    setCustomerProfileState(current => ({
      ...(current || {}),
      ...(patch || {}),
    }));
  }, []);

  const value = useMemo(
    () => ({
      customerProfile,
      mergeCustomerProfile,
      setCustomerProfile,
    }),
    [customerProfile, mergeCustomerProfile, setCustomerProfile],
  );

  return (
    <CustomerProfileContext.Provider value={value}>
      {children}
    </CustomerProfileContext.Provider>
  );
}

export function useCustomerProfile() {
  return useContext(CustomerProfileContext);
}
