import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Drag and drop hook optimized for iOS Safari and mobile touch interfaces
 * Uses unified pointer events and DaisyUI design patterns for smooth interactions
 * 
 * @param {Array} items - Array of items to be reordered
 * @param {Function} onReorder - Callback function called when items are reordered
 * @param {Function} getItemId - Function to extract unique ID from item
 * @returns {Object} Drag and drop handlers and state
 */
export const useDragAndDrop = (items, onReorder, getItemId = (item) => item.id) => {
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [longPressStarted, setLongPressStarted] = useState(false)
  
  // Unified pointer tracking for touch and mouse
  const pointerStart = useRef({ x: 0, y: 0, pointerId: null })
  const dragInitiated = useRef(false)
  const longPressTimer = useRef(null)
  const animationFrame = useRef(null)
  
  // Configuration constants optimized for mobile
  const LONG_PRESS_DURATION = 600 // Reduced from 3000ms for better UX
  const MOVEMENT_THRESHOLD = 8 // Pixels before canceling long press
  const DRAG_THRESHOLD = 12 // Pixels to start drag after long press

  // Reset drag state when items array changes - but only if not currently dragging
  useEffect(() => {
    if (!isDragging) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      setLongPressStarted(false)
    }
  }, [items, isDragging])

  // Cleanup timers and animations on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [])

  // Helper function to find drop target based on pointer position
  const findDropTarget = useCallback((event) => {
    const elements = document.querySelectorAll('[data-drag-item]')
    let closestIndex = null
    let closestDistance = Infinity
    
    elements.forEach((element, idx) => {
      const rect = element.getBoundingClientRect()
      const centerY = rect.top + rect.height / 2
      const distance = Math.abs(event.clientY - centerY)
      
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = idx
      }
    })
    
    return closestIndex
  }, [])

  // Unified pointer down handler (works for both touch and mouse)
  const handlePointerDown = useCallback((index, event) => {
    // Only handle primary pointer (touch/left mouse button)
    if (!event.isPrimary) return
    
    // Check if interaction started on the player name area
    const target = event.target
    const isPlayerNameArea = target.closest('.player-name-area')
    
    if (!isPlayerNameArea) {
      return // Only allow drag from player name area
    }

    // Prevent default behaviors that might interfere
    event.preventDefault()
    
    // Store pointer information
    pointerStart.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId
    }
    
    // Reset state
    dragInitiated.current = false
    setLongPressStarted(true)
    
    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      if (!dragInitiated.current) {
        // Long press completed - prepare for drag
        setLongPressStarted(false)
        setIsDragging(true)
        setDraggedIndex(index)
        dragInitiated.current = true
        
        // Add haptic feedback on supported devices
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }
      }
    }, LONG_PRESS_DURATION)
    
    // Capture pointer to ensure we get move/up events even outside element
    if (event.target.setPointerCapture) {
      event.target.setPointerCapture(event.pointerId)
    }
  }, [LONG_PRESS_DURATION])

  // Unified pointer move handler
  const handlePointerMove = useCallback((index, event) => {
    if (pointerStart.current.pointerId !== event.pointerId) return
    
    const deltaX = Math.abs(event.clientX - pointerStart.current.x)
    const deltaY = Math.abs(event.clientY - pointerStart.current.y)
    const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    if (longPressStarted && totalMovement > MOVEMENT_THRESHOLD) {
      // Cancel long press if moved too much
      setLongPressStarted(false)
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
      return
    }
    
    if (isDragging && draggedIndex !== null) {
      // Handle drag movement - find drop target
      const dropTarget = findDropTarget(event)
      if (dropTarget !== null && dropTarget !== draggedIndex) {
        setDragOverIndex(dropTarget)
      }
    }
  }, [longPressStarted, isDragging, draggedIndex, MOVEMENT_THRESHOLD, findDropTarget])

  // Unified pointer up handler
  const handlePointerUp = useCallback((index, event) => {
    if (pointerStart.current.pointerId !== event.pointerId) return
    
    // Clear timers and reset state
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    
    setLongPressStarted(false)
    
    // Handle drop if we were dragging
    if (isDragging && draggedIndex !== null && dragOverIndex !== null) {
      if (draggedIndex !== dragOverIndex && onReorder) {
        // Use requestAnimationFrame for smooth reorder
        animationFrame.current = requestAnimationFrame(() => {
          const newItems = [...items]
          const [movedItem] = newItems.splice(draggedIndex, 1)
          newItems.splice(dragOverIndex, 0, movedItem)
          onReorder(newItems)
        })
      }
    }
    
    // Reset all drag state
    setIsDragging(false)
    setDraggedIndex(null)
    setDragOverIndex(null)
    dragInitiated.current = false
    pointerStart.current = { x: 0, y: 0, pointerId: null }
    
    // Release pointer capture
    if (event.target.releasePointerCapture) {
      event.target.releasePointerCapture(event.pointerId)
    }
  }, [isDragging, draggedIndex, dragOverIndex, items, onReorder])

  // Generate props for draggable items with unified pointer events
  const getDraggableProps = useCallback((index) => ({
    'data-drag-item': index,
    'data-drop-zone': index,
    // Unified pointer events for both touch and mouse
    onPointerDown: (e) => handlePointerDown(index, e),
    onPointerMove: (e) => handlePointerMove(index, e),
    onPointerUp: (e) => handlePointerUp(index, e),
    onPointerCancel: (e) => handlePointerUp(index, e), // Treat cancel as up
    // Disable HTML5 drag to avoid conflicts
    draggable: false,
    // DaisyUI-inspired styling with smooth transitions
    className: `
      ${isDragging && draggedIndex === index ? 
        'transform scale-95 opacity-75 shadow-2xl transition-all duration-200 ease-out z-50' : 
        ''
      }
      ${dragOverIndex === index && draggedIndex !== index ? 
        'transform translate-y-1 transition-all duration-150 ease-out' : 
        ''
      }
      ${longPressStarted && !isDragging ? 
        'transform scale-105 shadow-lg transition-all duration-300 ease-out ring-2 ring-primary/30' : 
        ''
      }
      touch-none select-none
    `.trim(),
    style: {
      // Improved touch responsiveness
      touchAction: 'none',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
      // Smooth transitions
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      // Ensure proper layering during drag
      zIndex: isDragging && draggedIndex === index ? 1000 : 'auto'
    }
  }), [
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    isDragging,
    draggedIndex,
    dragOverIndex,
    longPressStarted
  ])

  // Generate props specifically for player name areas
  const getPlayerNameProps = useCallback((index) => ({
    className: `
      player-name-area
      ${isDragging && draggedIndex === index ? 'cursor-grabbing' : 'cursor-grab'}
      ${longPressStarted === index ? 'long-press-active' : ''}
      transition-all duration-200 ease-out
    `.trim(),
    style: {
      // Ensure player names stay centered
      textAlign: 'center',
      display: 'block',
      width: '100%',
      // Touch optimization
      touchAction: 'none',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      // Smooth visual feedback
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      // Prevent text selection during drag
      WebkitTouchCallout: 'none',
      WebkitTapHighlightColor: 'transparent'
    },
    onPointerDown: (event) => handlePointerDown(index, event),
    'data-draggable-index': index,
  }), [isDragging, draggedIndex, longPressStarted, handlePointerDown])
  
  return {
    isDragging,
    draggedIndex,
    dragOverIndex,
    longPressStarted,
    getDraggableProps,
    getPlayerNameProps
  }
}
