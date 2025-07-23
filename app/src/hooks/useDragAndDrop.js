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
  
  // Touch-specific state
  const touchStartPos = useRef({ x: 0, y: 0 })
  const touchDragStarted = useRef(false)
  const touchMoveThreshold = 10 // Minimum distance to start touch drag
  
  // Reset drag state when items array changes - but only if not currently dragging
  useEffect(() => {
    if (!isDragging) {
      setDraggedIndex(null)
      setDragOverIndex(null)
    }
  }, [items, isDragging])
  
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
    touchDragStarted.current = false
  }, [])
  
  // Handle touch start
  const handleTouchStart = useCallback((index, event) => {
    const touch = event.touches[0]
    touchStartPos.current = { x: touch.clientX, y: touch.clientY }
    touchDragStarted.current = false
    
    // Prevent default to avoid scrolling during potential drag
    event.preventDefault()
  }, [])
  
  // Handle touch move
  const handleTouchMove = useCallback((index, event) => {
    if (!event.touches[0]) return
    
    const touch = event.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x)
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y)
    const totalDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    // Start drag if we've moved beyond threshold
    if (!touchDragStarted.current && totalDistance > touchMoveThreshold) {
      touchDragStarted.current = true
      setDraggedIndex(index)
      setIsDragging(true)
    }
    
    // If we're dragging, find what element we're over
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
  }, [draggedIndex, touchMoveThreshold])
  
  // Handle touch end
  const handleTouchEnd = useCallback((index, event) => {
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
      ${isDragging && draggedIndex === index ? 'opacity-50' : ''}
      ${dragOverIndex === index && draggedIndex !== index ? 'border-t-4 border-primary' : ''}
      cursor-move select-none touch-none
    `.trim(),
    style: {
      // Improve touch experience on iOS
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
      WebkitTapHighlightColor: 'transparent',
      touchAction: 'none'
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
    dragOverIndex
  ])
  
  return {
    isDragging,
    draggedIndex,
    dragOverIndex,
    getDraggableProps
  }
}
