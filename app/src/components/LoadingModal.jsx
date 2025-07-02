import React from 'react';
import Modal from './Modal';

/**
 * Loading Modal for async operations
 * Props:
 *   open: boolean
 *   onClose: function()
 *   title: string (optional)
 *   message: string (optional)
 *   allowClose: boolean (default: false)
 */
export default function LoadingModal({
  open,
  onClose,
  title = "Loading...",
  message = "Please wait while we process your request.",
  allowClose = false
}) {
  return (
    <Modal
      open={open}
      onClose={allowClose ? onClose : () => {}}
      title={title}
      closeOnBackdrop={allowClose}
      closeOnEscape={allowClose}
    >
      <div className="text-center py-8">
        {/* Loading Spinner */}
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <div className="absolute inset-0 rounded-full h-12 w-12 border-2 border-gray-700 mx-auto"></div>
        </div>

        {/* Loading Message */}
        <p className="text-gray-300 text-sm leading-relaxed max-w-sm mx-auto">
          {message}
        </p>

        {/* Cancel Button (if allowed) */}
        {allowClose && (
          <div className="mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
