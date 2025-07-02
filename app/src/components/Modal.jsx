import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Professional Modal component with proper UX patterns
 * Features:
 * - Backdrop click to close
 * - ESC key to close
 * - Focus management
 * - Smooth entrance/exit animations
 * - Body scroll prevention
 * - Portal rendering
 * - Accessibility support
 *
 * Props:
 *   open: boolean
 *   onClose: function()
 *   title: string
 *   children: React.ReactNode
 *   closeOnBackdrop: boolean (default: true)
 *   closeOnEscape: boolean (default: true)
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  closeOnBackdrop = true,
  closeOnEscape = true
}) {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Animation state management
  useEffect(() => {
    if (open) {
      setShouldRender(true);
      setIsAnimating(true);

      // Trigger entrance animation
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);

      return () => clearTimeout(timer);
    } else if (shouldRender) {
      // Trigger exit animation
      setIsAnimating(true);

      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsAnimating(false);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [open, shouldRender]);

  // Handle ESC key
  useEffect(() => {
    if (!open || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose, closeOnEscape]);

  // Focus management
  useEffect(() => {
    if (open) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement;

      // Focus the modal container
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 100);
    } else if (previousActiveElement.current) {
      // Restore focus when modal closes
      setTimeout(() => {
        if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
          previousActiveElement.current.focus();
        }
      }, 200);
    }
  }, [open]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!shouldRender) return null;

  const modalContent = (
    <div
      className={`modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 ${
        open && !isAnimating ? 'modal-overlay-enter' : 'modal-overlay-exit'
      }`}
      onClick={handleBackdropClick}
      aria-labelledby={title ? "modal-title" : undefined}
      aria-modal="true"
      role="dialog"
    >
      <div 
        ref={modalRef}
        className={`modal-content w-full max-w-md relative bg-base-200 text-base-content rounded-xl shadow-2xl border border-base-300 ${
          open && !isAnimating ? 'modal-content-enter' : 'modal-content-exit'
        }`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
          aria-label="Close modal"
          onClick={onClose}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal header */}
        {title && (
          <div className="modal-header mb-6 border-b border-base-300 pb-4">
            <h3 id="modal-title" className="text-xl font-bold text-base-content pr-10">
              {title}
            </h3>
          </div>
        )}

        {/* Modal content */}
        <div className="modal-body text-base-content">
          {children}
        </div>
      </div>
    </div>
  );

  // Render modal in a portal to ensure proper layering
  return createPortal(modalContent, document.body);
}
