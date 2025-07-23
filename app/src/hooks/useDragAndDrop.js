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
    // Check if drag started from the player name area
    const target = event.target
    const isPlayerNameArea = target.closest('.player-name-area')
    
    if (!isPlayerNameArea) {
      // Prevent drag if not starting from player name area
      event.preventDefault()
      return false
    }

    setDraggedIndex(index)
    setIsDragging(true)
    
    // Enhanced Safari compatibility for drag data
    try {
      event.dataTransfer.effectAllowed = 'move'
      // Safari requires multiple data formats for reliable operation
      event.dataTransfer.setData('text/plain', index.toString())
      event.dataTransfer.setData('application/x-player-index', index.toString())
      // Additional Safari compatibility: set a default text value
      event.dataTransfer.setData('text/html', `<div data-player-index="${index}">Player ${index}</div>`)
    } catch (e) {
      // Fallback for browsers that don't support setData
      console.warn('Drag and drop may not work properly in this browser:', e)
      // Safari fallback: try to set at least one data type
      try {
        event.dataTransfer.setData('text', index.toString())
      } catch (fallbackError) {
        console.warn('Drag fallback also failed:', fallbackError)
      }
    }
    
    // Safari-specific: Ensure the drag image is properly set
    // This helps with Safari's drag preview behavior
    if (event.dataTransfer.setDragImage && isPlayerNameArea) {
      // Use the player name area as the drag image for consistency
      try {
        event.dataTransfer.setDragImage(isPlayerNameArea, isPlayerNameArea.offsetWidth / 2, isPlayerNameArea.offsetHeight / 2)
      } catch (dragImageError) {
        // Safari sometimes fails setDragImage, continue anyway
        console.warn('Could not set custom drag image:', dragImageError)
      }
    }
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
    
    // Enhanced drag data retrieval for Safari compatibility
    let sourceIndex = draggedIndex
    try {
      // Try multiple data formats in order of preference
      const dragData = event.dataTransfer.getData('application/x-player-index') || 
                      event.dataTransfer.getData('text/plain') ||
                      event.dataTransfer.getData('text/html')?.match(/data-player-index="(\d+)"/)?.[1] ||
                      event.dataTransfer.getData('text')
      
      if (dragData && !isNaN(parseInt(dragData))) {
        sourceIndex = parseInt(dragData)
      }
    } catch (e) {
      // Use fallback from state
      console.warn('Could not read drag data, using fallback:', e)
    }
    
    // Additional Safari validation: ensure indices are valid
    if (sourceIndex === null || sourceIndex === undefined || 
        targetIndex === null || targetIndex === undefined ||
        sourceIndex < 0 || targetIndex < 0 ||
        sourceIndex >= items.length || targetIndex >= items.length) {
      console.warn('Invalid drag indices:', { sourceIndex, targetIndex, itemsLength: items.length })
      // Reset drag state
      setDraggedIndex(null)
      setDragOverIndex(null)
      setIsDragging(false)
      return
    }
    
    if (sourceIndex !== targetIndex && onReorder) {
      // Create new array with reordered items
      const newItems = [...items]
      const draggedItem = newItems[sourceIndex]
      
      // Remove the dragged item
      newItems.splice(sourceIndex, 1)
      
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
    
    // Only allow drag initiation from the player name area
    const isPlayerNameArea = target.closest('.player-name-area')
    
    if (isButton || !isPlayerNameArea) {
      // Don't interfere with button interactions or if not touching player name area
      return
    }

    // Safari-specific: Check if this is a genuine touch start
    const touch = event.touches[0]
    if (!touch) {
      return
    }

    touchStartPos.current = { x: touch.clientX, y: touch.clientY }
    touchDragStarted.current = false
    hasDetectedScrollIntent.current = false
    
    // Start long press timer - 3 seconds for player reordering
    setIsLongPressActive(true)
    longPressTimer.current = setTimeout(() => {
      // Only activate drag if user hasn't shown scroll intent and touch is still active
      if (!hasDetectedScrollIntent.current && !touchDragStarted.current) {
        // Enhanced Safari touch drag initiation
        touchDragStarted.current = true
        setDraggedIndex(index)
        setIsDragging(true)
        setIsLongPressActive(false)
        
        // Safari-specific: Add haptic feedback if available
        if (navigator.vibrate) {
          try {
            navigator.vibrate(50) // Short vibration for feedback
          } catch (vibrateError) {
            // Vibration not supported or failed, continue silently
          }
        }
      } else {
        // Cancel long press if scroll intent detected
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
    draggable: false, // Disable HTML5 drag by default
    'data-draggable': true,
    'data-drop-zone': index,
    // Mouse events - will only work if initiated from player-name-area
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
      ${isDragging && draggedIndex === index ? 'opacity-60 scale-[0.98] shadow-lg' : ''}
      ${dragOverIndex === index && draggedIndex !== index ? 'border-t-2 border-primary/50' : ''}
      ${isLongPressActive && !isDragging ? 'ring-1 ring-primary/30 bg-base-200/50' : ''}
      transition-all duration-200 ease-out
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

  // Generate props specifically for player name areas to enable mouse dragging
  const getPlayerNameProps = useCallback((index) => {
    // Safari browser detection (following Context7 best practices)
    const isSafari = navigator.userAgent.includes('AppleWebKit') && !navigator.userAgent.includes('Chrome')
    
    return {
      draggable: true, // Enable HTML5 drag for player name area
      onDragStart: (e) => {
        // This will be called when drag starts from player name area
        handleDragStart(index, e)
      },
      className: 'player-name-area',
      style: {
        cursor: isDragging && draggedIndex === index ? 'grabbing' : 'grab',
        // Enhanced Safari-specific improvements
        WebkitUserDrag: 'element',
        // Ensure the element is draggable in Safari
        userSelect: 'none',
        WebkitUserSelect: 'none',
        // Safari-specific: Prevent text selection during drag
        MozUserSelect: 'none',
        msUserSelect: 'none',
        // Safari-specific: Improve touch handling
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
        // Conditional transform handling for Safari (Context7 recommendation)
        ...(isSafari ? {
          // Safari has issues with transforms on drag previews, so avoid them
          transform: 'none',
          willChange: 'auto'
        } : {
          // For non-Safari browsers, allow normal transforms
          willChange: isDragging && draggedIndex === index ? 'transform' : 'auto'
        })
      }
    }
  }, [handleDragStart, isDragging, draggedIndex])
  
  return {
    isDragging,
    draggedIndex,
    dragOverIndex,
    isLongPressActive,
    getDraggableProps,
    getPlayerNameProps
  }
}
