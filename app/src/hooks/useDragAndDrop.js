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

  // Global pointer move and up handlers for drag operations
  useEffect(() => {
    if (!isDragging) return

    const handleGlobalPointerMove = (event) => {
      if (pointerStart.current.pointerId !== event.pointerId) return
      
      // Always prevent default during active drag to stop iOS Safari scrolling
      event.preventDefault()
      event.stopPropagation()
      
      const dropTarget = findDropTarget(event)
      if (dropTarget !== null && dropTarget !== draggedIndex) {
        setDragOverIndex(dropTarget)
      }
    }

    const handleGlobalPointerUp = (event) => {
      if (pointerStart.current.pointerId !== event.pointerId) return
      
      // Restore scrolling capability
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      document.body.classList.remove('dragging-active')
      document.documentElement.classList.remove('dragging-active')
      
      // Handle drop if we were dragging
      if (draggedIndex !== null && dragOverIndex !== null) {
        if (draggedIndex !== dragOverIndex && onReorder) {
          const newItems = [...items]
          const [movedItem] = newItems.splice(draggedIndex, 1)
          newItems.splice(dragOverIndex, 0, movedItem)
          onReorder(newItems)
        }
      }
      
      // Reset all drag state
      setIsDragging(false)
      setDraggedIndex(null)
      setDragOverIndex(null)
      dragInitiated.current = false
      pointerStart.current = { x: 0, y: 0, pointerId: null }
    }

    document.addEventListener('pointermove', handleGlobalPointerMove, { passive: false })
    document.addEventListener('pointerup', handleGlobalPointerUp)
    document.addEventListener('pointercancel', handleGlobalPointerUp)

    return () => {
      document.removeEventListener('pointermove', handleGlobalPointerMove)
      document.removeEventListener('pointerup', handleGlobalPointerUp)
      document.removeEventListener('pointercancel', handleGlobalPointerUp)
    }
  }, [isDragging, draggedIndex, dragOverIndex, items, onReorder, findDropTarget])

  // Safety cleanup - reset drag state if pointer is lost
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && (isDragging || longPressStarted)) {
        // Page became hidden while dragging - reset state and restore scrolling
        document.body.style.overflow = ''
        document.documentElement.style.overflow = ''
        document.body.classList.remove('dragging-active')
        document.documentElement.classList.remove('dragging-active')
        
        setIsDragging(false)
        setDraggedIndex(null)
        setDragOverIndex(null)
        setLongPressStarted(false)
        dragInitiated.current = false
        pointerStart.current = { x: 0, y: 0, pointerId: null }
        
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = null
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isDragging, longPressStarted])

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
        // Prevent all default behaviors for iOS Safari compatibility
        event.preventDefault()
        event.stopPropagation()
        
        // Prevent document scrolling on iOS Safari
        document.body.style.overflow = 'hidden'
        document.documentElement.style.overflow = 'hidden'
        document.body.classList.add('dragging-active')
        document.documentElement.classList.add('dragging-active')
        
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
    // Use immediate capture for iOS Safari
    if (event.target.setPointerCapture) {
      event.target.setPointerCapture(event.pointerId)
    }
  }, [LONG_PRESS_DURATION])

  // Global movement tracking during long press
  useEffect(() => {
    if (!longPressStarted) return

    const handleGlobalPointerMove = (event) => {
      if (pointerStart.current.pointerId !== event.pointerId) return
      
      const deltaX = Math.abs(event.clientX - pointerStart.current.x)
      const deltaY = Math.abs(event.clientY - pointerStart.current.y)
      const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      
      if (totalMovement > MOVEMENT_THRESHOLD) {
        // Cancel long press if moved too much
        setLongPressStarted(false)
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = null
        }
        
        // Restore scrolling if long press was cancelled
        document.body.style.overflow = ''
        document.documentElement.style.overflow = ''
        document.body.classList.remove('dragging-active')
        document.documentElement.classList.remove('dragging-active')
      }
    }

    document.addEventListener('pointermove', handleGlobalPointerMove, { passive: false })
    return () => {
      document.removeEventListener('pointermove', handleGlobalPointerMove)
    }
  }, [longPressStarted, MOVEMENT_THRESHOLD])

  // Generate props for draggable items with unified pointer events
  const getDraggableProps = useCallback((index) => ({
    'data-drag-item': index,
    'data-drop-zone': index,
    // Only attach pointer events to specific drag handles, not the whole card
    // Remove these to prevent interference with scrolling
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
    `.trim(),
    style: {
      // Allow normal touch interactions for scrolling
      // touchAction: 'manipulation', // This allows scrolling but prevents zoom
      userSelect: 'none',
      WebkitUserSelect: 'none',
      // Smooth transitions
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      // Ensure proper layering during drag
      zIndex: isDragging && draggedIndex === index ? 1000 : 'auto'
    }
  }), [
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
      // Aggressive touch control for iOS Safari compatibility
      touchAction: (isDragging || longPressStarted === index) ? 'none' : 'manipulation',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      // iOS Safari specific properties
      WebkitTouchCallout: 'none',
      WebkitTapHighlightColor: 'transparent',
      WebkitUserDrag: 'none', // Prevent iOS drag
      // Smooth visual feedback
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    onPointerDown: (event) => handlePointerDown(index, event),
    // Add touchstart for iOS Safari compatibility
    onTouchStart: (event) => {
      // iOS Safari sometimes needs explicit touch handling
      if (event.touches.length === 1) {
        const touch = event.touches[0]
        const pointerEvent = {
          ...event,
          clientX: touch.clientX,
          clientY: touch.clientY,
          pointerId: touch.identifier,
          isPrimary: true,
          target: event.target,
          preventDefault: () => event.preventDefault(),
          stopPropagation: () => event.stopPropagation()
        }
        handlePointerDown(index, pointerEvent)
      }
    },
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
