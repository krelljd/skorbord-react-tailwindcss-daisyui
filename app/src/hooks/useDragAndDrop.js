import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Drag and drop hook with HTML5 drag and drop + touch support for mobile
 * Optimized for iOS Safari and mobile browsers
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
  const [isLongPressActive, setIsLongPressActive] = useState(false)
  
  // Touch-specific state
  const touchStartPos = useRef({ x: 0, y: 0 })
  const touchDragStarted = useRef(false)
  const longPressTimer = useRef(null)
  const longPressThreshold = 3000 // Long press duration in ms (3 seconds for player reordering)
  const moveThreshold = 10 // Maximum movement allowed during long press
  const scrollThreshold = 15 // Minimum vertical movement to detect scroll intent
  const hasDetectedScrollIntent = useRef(false) // Track if user is scrolling
  
  // Reset drag state when items array changes - but only if not currently dragging
  useEffect(() => {
    if (!isDragging) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      setIsLongPressActive(false)
    }
  }, [items, isDragging])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])
  
  // Handle drag start (mouse)
  const handleDragStart = useCallback((index, event) => {
    setDraggedIndex(index)
    setIsDragging(true)
    
    // Set drag data for HTML5 drag and drop
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', index.toString())
  }, [])
  
  // Handle drag over (mouse) - must prevent default to allow drop
  const handleDragOver = useCallback((index, event) => {
    event.preventDefault()
    
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
    
    event.dataTransfer.dropEffect = 'move'
  }, [draggedIndex])
  
  // Handle drag enter (mouse)
  const handleDragEnter = useCallback((index, event) => {
    event.preventDefault()
    
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }, [draggedIndex])
  
  // Handle drop (mouse)
  const handleDrop = useCallback((targetIndex, event) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (draggedIndex !== null && onReorder && draggedIndex !== targetIndex) {
      // Create new array with reordered items
      const newItems = [...items]
      const draggedItem = newItems[draggedIndex]
      
      // Remove the dragged item
      newItems.splice(draggedIndex, 1)
      
      // Insert at new position
      newItems.splice(targetIndex, 0, draggedItem)
      
      // Call the reorder callback
      onReorder(newItems)
    }
    
    // Reset drag state
    setDraggedIndex(null)
    setDragOverIndex(null)
    setIsDragging(false)
  }, [draggedIndex, items, onReorder])
  
  // Handle drag end (mouse)
  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
    setDragOverIndex(null)
    setIsDragging(false)
    setIsLongPressActive(false)
    touchDragStarted.current = false
    hasDetectedScrollIntent.current = false
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])
  
  // Handle touch start
  const handleTouchStart = useCallback((index, event) => {
    // Check if touch started on a button or interactive element
    const target = event.target
    const isButton = target.closest('button, [role="button"], input, select, textarea, .btn')
    
    if (isButton) {
      // Don't interfere with button interactions at all
      return
    }

    const touch = event.touches[0]
    touchStartPos.current = { x: touch.clientX, y: touch.clientY }
    touchDragStarted.current = false
    hasDetectedScrollIntent.current = false
    
    // Start long press timer
    setIsLongPressActive(true)
    longPressTimer.current = setTimeout(() => {
      // Only activate drag if user hasn't shown scroll intent
      if (!hasDetectedScrollIntent.current) {
        // Trigger haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50) // Short vibration
        }
        
        touchDragStarted.current = true
        setDraggedIndex(index)
        setIsDragging(true)
        setIsLongPressActive(false)
      } else {
        // User was scrolling, just clean up
        setIsLongPressActive(false)
      }
    }, longPressThreshold)
    
    // Don't prevent default here to allow normal scrolling if long press doesn't activate
  }, [longPressThreshold])
  
  // Handle touch move
  const handleTouchMove = useCallback((index, event) => {
    if (!event.touches[0]) return
    
    const touch = event.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x)
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y)
    const totalDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    // Detect scroll intent: primarily vertical movement beyond threshold
    if (isLongPressActive && !hasDetectedScrollIntent.current) {
      const isVerticalMovement = deltaY > scrollThreshold && deltaY > deltaX * 1.5
      
      if (isVerticalMovement) {
        // User is scrolling - cancel long press and allow normal scrolling
        hasDetectedScrollIntent.current = true
        setIsLongPressActive(false)
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = null
        }
        return // Allow the scroll to continue naturally
      }
      
      // Cancel long press if user moves too much in any direction before it activates
      if (totalDistance > moveThreshold) {
        setIsLongPressActive(false)
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = null
        }
        return
      }
    }
    
    // If we're in active drag mode, handle the drag
    if (touchDragStarted.current) {
      event.preventDefault()
      
      // Find element under touch point
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
      const dropTarget = elementBelow?.closest('[data-drop-zone]')
      
      if (dropTarget) {
        const dropIndex = parseInt(dropTarget.getAttribute('data-drop-zone'))
        if (!isNaN(dropIndex) && dropIndex !== draggedIndex) {
          setDragOverIndex(dropIndex)
        }
      }
    }
  }, [draggedIndex, moveThreshold, scrollThreshold, isLongPressActive])
  
  // Handle touch end
  const handleTouchEnd = useCallback((index, event) => {
    // Clear long press timer if still active
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    
    setIsLongPressActive(false)
    
    if (touchDragStarted.current && event.changedTouches[0]) {
      const touch = event.changedTouches[0]
      
      // Find element under touch point
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
      const dropTarget = elementBelow?.closest('[data-drop-zone]')
      
      if (dropTarget && draggedIndex !== null && onReorder) {
        const dropIndex = parseInt(dropTarget.getAttribute('data-drop-zone'))
        
        if (!isNaN(dropIndex) && dropIndex !== draggedIndex) {
          // Create new array with reordered items
          const newItems = [...items]
          const draggedItem = newItems[draggedIndex]
          
          // Remove the dragged item
          newItems.splice(draggedIndex, 1)
          
          // Insert at new position
          newItems.splice(dropIndex, 0, draggedItem)
          
          // Call the reorder callback
          onReorder(newItems)
        }
      }
    }
    
    // Reset all drag state
    setDraggedIndex(null)
    setDragOverIndex(null)
    setIsDragging(false)
    touchDragStarted.current = false
    hasDetectedScrollIntent.current = false
  }, [draggedIndex, items, onReorder])
  
  // Generate props for draggable items
  const getDraggableProps = useCallback((index) => ({
    draggable: true,
    'data-draggable': true,
    'data-drop-zone': index,
    // Mouse events
    onDragStart: (e) => handleDragStart(index, e),
    onDragOver: (e) => handleDragOver(index, e),
    onDragEnter: (e) => handleDragEnter(index, e),
    onDrop: (e) => handleDrop(index, e),
    onDragEnd: handleDragEnd,
    // Touch events for mobile
    onTouchStart: (e) => handleTouchStart(index, e),
    onTouchMove: (e) => handleTouchMove(index, e),
    onTouchEnd: (e) => handleTouchEnd(index, e),
    className: `
      ${isDragging && draggedIndex === index ? 'opacity-50 scale-105' : ''}
      ${dragOverIndex === index && draggedIndex !== index ? 'border-t-4 border-primary' : ''}
      ${isLongPressActive && !isDragging ? 'ring-2 ring-primary ring-opacity-50 animate-pulse' : ''}
      cursor-move select-none touch-none
    `.trim(),
    style: {
      // Improve touch experience on iOS
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
      WebkitTapHighlightColor: 'transparent',
      // Only prevent touch action when actively dragging
      touchAction: touchDragStarted.current ? 'none' : 'auto',
      transition: 'all 0.2s ease'
    }
  }), [
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDrop,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isDragging,
    draggedIndex,
    dragOverIndex,
    isLongPressActive
  ])
  
  return {
    isDragging,
    draggedIndex,
    dragOverIndex,
    isLongPressActive,
    getDraggableProps
  }
}
