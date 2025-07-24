import React, { useState } from 'react'
import { useDragAndDrop } from '../hooks/useDragAndDrop.js'

const DragDropDemo = () => {
  const [players, setPlayers] = useState([
    { id: 1, name: 'Alice', color: 'primary' },
    { id: 2, name: 'Bob', color: 'secondary' },
    { id: 3, name: 'Charlie', color: 'accent' },
    { id: 4, name: 'Diana', color: 'info' }
  ])

  const { isDragging, draggedIndex, dragOverIndex, longPressStarted, getDraggableProps, getPlayerNameProps } = useDragAndDrop(
    players,
    setPlayers,
    (player) => player.id
  )

  return (
    <div className="min-h-screen bg-base-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">🎮 Drag & Drop Demo</h1>
          <p className="text-base-content/70">
            Long press on player names to start dragging
          </p>
          {longPressStarted && (
            <div className="badge badge-primary badge-outline mt-2 animate-pulse">
              Long press detected... hold to drag
            </div>
          )}
          {isDragging && (
            <div className="badge badge-success mt-2">
              🎯 Drag active - move to reorder
            </div>
          )}
        </div>

        <div className="space-y-3">
          {players.map((player, index) => (
            <div
              key={player.id}
              {...getDraggableProps(index)}
              className={`
                card card-compact bg-base-200 shadow-lg hover:shadow-xl
                ${getDraggableProps(index).className}
              `}
            >
              <div className="card-body">
                <div 
                  {...getPlayerNameProps(index)}
                  className={`
                    card-title justify-center text-${player.color}
                    ${getPlayerNameProps(index).className}
                  `}
                >
                  <span className="mr-2">👤</span>
                  {player.name}
                  <span className="ml-2">✋</span>
                </div>
                <div className="text-xs text-center text-base-content/50">
                  Player {index + 1}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-info/10 rounded-lg">
          <h3 className="font-semibold text-info mb-2">How to use:</h3>
          <ul className="text-sm space-y-1 text-base-content/70">
            <li>• Long press on a player name to start dragging</li>
            <li>• Move your finger/cursor to reorder players</li>
            <li>• Release to drop in the new position</li>
            <li>• Works on both touch and desktop devices</li>
          </ul>
        </div>

        <div className="mt-4 text-center">
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => setPlayers([...players].reverse())}
          >
            🔄 Reverse Order
          </button>
        </div>
      </div>
    </div>
  )
}

export default DragDropDemo
