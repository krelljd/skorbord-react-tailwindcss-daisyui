import { useState, useCallback } from 'react';

/**
 * Custom hook for managing modal state with enhanced UX patterns
 *
 * @returns {Object} Modal management functions and state
 */
export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setIsLoading(false);
  }, []);

  const setLoading = useCallback((loading) => {
    setIsLoading(loading);
  }, []);

  return {
    isOpen,
    isLoading,
    openModal,
    closeModal,
    setLoading,
  };
}

/**
 * Multiple modal manager hook for complex modal scenarios
 *
 * @param {string[]} modalNames - Array of modal names to manage
 * @returns {Object} Modal management functions for each modal
 */
export function useMultipleModals(modalNames = []) {
  const [modalStates, setModalStates] = useState(
    modalNames.reduce((acc, name) => {
      acc[name] = { isOpen: false, isLoading: false };
      return acc;
    }, {})
  );

  const openModal = useCallback((modalName) => {
    setModalStates(prev => ({
      ...prev,
      [modalName]: { ...prev[modalName], isOpen: true }
    }));
  }, []);

  const closeModal = useCallback((modalName) => {
    setModalStates(prev => ({
      ...prev,
      [modalName]: { isOpen: false, isLoading: false }
    }));
  }, []);

  const setLoading = useCallback((modalName, loading) => {
    setModalStates(prev => ({
      ...prev,
      [modalName]: { ...prev[modalName], isLoading: loading }
    }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModalStates(prev =>
      Object.keys(prev).reduce((acc, key) => {
        acc[key] = { isOpen: false, isLoading: false };
        return acc;
      }, {})
    );
  }, []);

  return {
    modalStates,
    openModal,
    closeModal,
    setLoading,
    closeAllModals,
  };
}
