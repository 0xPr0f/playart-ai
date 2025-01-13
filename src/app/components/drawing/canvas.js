import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Stage, Layer, Line, Group } from 'react-konva'
import Konva from 'konva'
import { dataString } from './base64data'
// Custom hook for debouncing
const useDebounce = (fn, delay) => {
  const [timer, setTimer] = useState(null)

  useEffect(() => {
    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [timer])

  return useCallback(
    (...args) => {
      if (timer) clearTimeout(timer)
      setTimer(
        setTimeout(() => {
          fn(...args)
        }, delay)
      )
    },
    [fn, timer, delay]
  )
}

const DrawApp = ({
  width,
  height,
  initialBrushColor,
  initialBrushSize,
  initialBrushOpacity,
  loadedPlaybackDrawingData,
  loadedKonvaDrawingData,
  loadedDrawingData,
  onCanvasChangeData,
  useKonva = true,
}) => {
  const [isDrawing, setIsDrawing] = useState(false)
  const [layers, setLayers] = useState([
    { visible: true, groups: [{ x: 0, y: 0, shapes: [] }] },
  ])
  const [layersIndex, setLayersIndex] = useState(0)
  const [brushColor, setBrushColor] = useState(initialBrushColor || '#000000')
  const [brushSize, setBrushSize] = useState(initialBrushSize || 5)
  const [brushOpacity, setBrushOpacity] = useState(initialBrushOpacity || 1)
  const [tool, setTool] = useState('brush')
  const [showGobbler, setShowGobbler] = useState(false)
  const stageRef = useRef(null)
  const layersRef = useRef([])
  const canvasRef = useRef(null)
  const [lines, setLines] = useState([])
  const intervalRefs = useRef([]) // To keep track of interval IDs
  const canvasSize = { width, height }
  const dpr = window.devicePixelRatio >= 2 ? 2 : 1

  useEffect(() => {
    if (stageRef.current) {
      stageRef.current.width(width)
      stageRef.current.height(height)
      stageRef.current.batchDraw()
    }
  }, [width, height])

  useEffect(() => {
    setBrushColor(initialBrushColor)
    setBrushOpacity(initialBrushOpacity)
    setBrushSize(initialBrushSize)
  }, [initialBrushColor, initialBrushSize, initialBrushOpacity])

  // Helper function to get the correct position for drawing
  const getPositionedStage = (target) => {
    const stage = target.getStage()
    const oldScale = stage.scale() || { x: 1, y: 1 }
    const { x, y } = layers[layersIndex].groups[0] || { x: 0, y: 0 }
    let pos = stage.getPointerPosition() || { x: 0, y: 0 }
    pos.x = pos.x / oldScale.x - x
    pos.y = pos.y / oldScale.y - y
    return pos
  }

  // Function to start drawing a new line

  // Function to add a new line
  const addNewLine = (target) => {
    setIsDrawing(true)
    const pos = getPositionedStage(target)

    const newLine = {
      type: 'line',
      points: [pos.x, pos.y],
      tool: tool,
      color: tool === 'eraser' ? 'transparent' : brushColor,
      size: brushSize,
      opacity: brushOpacity / 100,
      hardness: 1,
      canvasSize: canvasSize,
      dpr: dpr,
    }

    const newGroupShapes = [...layers[layersIndex].groups[0].shapes, newLine]
    const newGroups = [
      { ...layers[layersIndex].groups[0], shapes: newGroupShapes },
    ]

    const newLayers = [...layers]
    newLayers[layersIndex] = { ...newLayers[layersIndex], groups: newGroups }
    setLayers(newLayers)
  }

  // Function to continue drawing the current line
  const continueDrawingLine = (target) => {
    const pos = getPositionedStage(target)
    if (!layers[layersIndex].groups[0]) return

    let selectedGroupShapes = [...layers[layersIndex].groups[0].shapes]
    let lastLine = selectedGroupShapes[selectedGroupShapes.length - 1]
    if (!lastLine) return

    lastLine.points = [...lastLine.points, pos.x, pos.y]

    const newGroups = [
      { ...layers[layersIndex].groups[0], shapes: selectedGroupShapes },
    ]
    const newLayers = [...layers]
    newLayers[layersIndex] = { ...newLayers[layersIndex], groups: newGroups }
    setLayers(newLayers)
  }

  // Function to import drawing data for immediate rendering
  const importDrawingData = (data) => {
    try {
      const drawingData = JSON.parse(data)
      if (!drawingData.lines || !Array.isArray(drawingData.lines)) {
        throw new Error('Invalid drawing data format')
      }

      const newShapes = drawingData.lines.map((line) => ({
        type: 'line',
        points: line.points.reduce((acc, point) => {
          acc.push(point.x, point.y)
          return acc
        }, []),
        tool: 'brush',
        color: line.brushColor,
        size: line.brushRadius * 2,
        opacity: line.opacity,
        hardness: 1,
        canvasSize: { width: drawingData.width, height: drawingData.height },
        dpr: dpr,
      }))

      const newLayers = [...layers]
      newLayers[layersIndex] = {
        ...newLayers[layersIndex],
        groups: [{ x: 0, y: 0, shapes: newShapes }],
      }
      setLayers(newLayers)
    } catch (error) {
      console.error('Error importing drawing data:', error)
    }
  }
  const debouncedSetLayers = useDebounce(setLayers, 16) // Debounce by 16ms, matching our frame update rate
  const [isPlaybackFinished, setIsPlaybackFinished] = useState(false)
  const importKonvaPlaybackDrawingData = useCallback(
    (data, speedMultiplier = 1) => {
      try {
        const drawingData = JSON.parse(data)
        if (!drawingData.lines || !Array.isArray(drawingData.lines)) {
          throw new Error('Invalid drawing data format')
        }

        // Find the bounding box of the drawing
        let minX = Infinity,
          maxX = -Infinity,
          minY = Infinity,
          maxY = -Infinity
        drawingData.lines.forEach((line) => {
          line.points.forEach((point) => {
            minX = Math.min(minX, point.x)
            maxX = Math.max(maxX, point.x)
            minY = Math.min(minY, point.y)
            maxY = Math.max(maxY, point.y)
          })
        })

        // Calculate width and height of the drawing
        const drawingWidth = maxX - minX
        const drawingHeight = maxY - minY

        // Calculate scaling factors
        const scaleX = width / drawingWidth
        const scaleY = height / drawingHeight

        // Use the smaller scale to ensure the entire drawing fits
        const scale = Math.min(scaleX, scaleY)

        // Scale the drawing data
        const scaledDrawingData = {
          ...drawingData,
          lines: drawingData.lines.map((line) => ({
            ...line,
            points: line.points.map((point) => ({
              x: (point.x - minX) * scale,
              y: (point.y - minY) * scale,
            })),
          })),
        }

        const totalPoints = scaledDrawingData.lines.reduce(
          (sum, line) => sum + line.points.length,
          0
        )
        let processedPoints = 0
        const batchSize = 50 / speedMultiplier // Example: 50 for balance, adjust as needed

        // Update the state with the scaled shapes
        setLayers((prevLayers) => {
          const newShapes = scaledDrawingData.lines.map((line) => ({
            type: 'line',
            points: [],
            tool: line.tool,
            color: line.tool === 'eraser' ? 'transparent' : line.brushColor,
            size: line.brushRadius * 2 * scale, // Scale brush size according to the drawing's scale
            opacity: line.opacity,
            hardness: line.hardness,
            canvasSize: { width: width, height: height },
            dpr: dpr,
          }))

          const newLayers = [...prevLayers]
          newLayers[layersIndex] = {
            ...newLayers[layersIndex],
            groups: [{ x: 0, y: 0, shapes: newShapes }],
          }
          return newLayers
        })

        // Function to draw a single line
        const drawLine = (lineIndex) => {
          let pointIndex = 0

          const drawFrame = () => {
            // Update the state with new points
            setLayers((prevLayers) => {
              const newLayers = [...prevLayers]
              const currentShape =
                newLayers[layersIndex].groups[0].shapes[lineIndex]

              // Draw in batches
              const newPoints = []
              for (
                let i = 0;
                i < batchSize &&
                pointIndex < scaledDrawingData.lines[lineIndex].points.length;
                i++
              ) {
                const point =
                  scaledDrawingData.lines[lineIndex].points[pointIndex]
                newPoints.push(point.x, point.y)
                pointIndex++
                processedPoints++
              }
              currentShape.points = [...currentShape.points, ...newPoints]

              return newLayers
            })

            // Log progress
            const progressPercent = Math.round(
              (processedPoints / totalPoints) * 100
            )
            console.log(`Progress: ${progressPercent}%`)

            // Continue drawing if there are more points in the current line
            if (pointIndex < scaledDrawingData.lines[lineIndex].points.length) {
              // Control frame rate with speedMultiplier
              setTimeout(
                () => requestAnimationFrame(drawFrame),
                16 / speedMultiplier
              )
            } else if (lineIndex < scaledDrawingData.lines.length - 1) {
              // If there's another line, start drawing it
              requestAnimationFrame(() => drawLine(lineIndex + 1))
            } else {
              // Log completion when the last line is finished
              console.log('Drawing complete. Progress: 100%')
              setIsPlaybackFinished(true)
            }
          }

          requestAnimationFrame(drawFrame)
        }

        // Start drawing with the first line
        if (scaledDrawingData.lines.length > 0) {
          drawLine(0)
        } else {
          console.log('No lines to draw')
          setIsPlaybackFinished(true)
        }
      } catch (error) {
        console.error('Error importing playback drawing data:', error)
      }
    },
    [width, height, setLayers, layersIndex, dpr, setIsPlaybackFinished]
  )

  const importPlaybackDrawingData = useCallback(
    (data, speedMultiplier = 0.5) => {
      try {
        const drawingData = JSON.parse(data)
        if (!drawingData.lines || !Array.isArray(drawingData.lines)) {
          throw new Error('Invalid drawing data format')
        }

        const totalPoints = drawingData.lines.reduce(
          (sum, line) => sum + line.points.length,
          0
        )
        let processedPoints = 0
        // Adjust batchSize for quality and speed. Lower for better quality, higher for speed.
        const batchSize = 50 / speedMultiplier // Example: 50 for balance, adjust as needed

        const canvas = canvasRef.current
        if (!canvas) {
          console.error('Canvas not found')
          return
        }

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          console.error('Canvas context not available')
          return
        }

        // Clear canvas before drawing
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Ensure high-quality rendering
        ctx.imageSmoothingEnabled = true
        // Improve line quality
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'

        // Function to draw a single line
        const drawLine = (line, lineIndex) => {
          let pointIndex = 0

          const drawFrame = () => {
            ctx.beginPath()
            ctx.lineWidth = line.brushRadius * 2
            ctx.strokeStyle = line.brushColor
            ctx.globalAlpha = line.opacity

            // Start from the first point of the line
            if (pointIndex === 0) {
              ctx.moveTo(line.points[pointIndex].x, line.points[pointIndex].y)
              pointIndex++
              processedPoints++
            }

            // Draw in batches
            for (
              let i = 0;
              i < batchSize && pointIndex < line.points.length;
              i++
            ) {
              ctx.lineTo(line.points[pointIndex].x, line.points[pointIndex].y)
              pointIndex++
              processedPoints++
            }

            ctx.stroke() // Draw the batched line

            // Log progress
            const progressPercent = Math.round(
              (processedPoints / totalPoints) * 100
            )
            console.log(`Progress: ${progressPercent}%`)

            // Continue drawing if there are more points in the current line
            if (pointIndex < line.points.length) {
              // Control frame rate with speedMultiplier
              setTimeout(
                () => requestAnimationFrame(drawFrame),
                16 / speedMultiplier
              )
            } else if (lineIndex < drawingData.lines.length - 1) {
              // If there's another line, start drawing it
              requestAnimationFrame(() =>
                drawLine(drawingData.lines[lineIndex + 1], lineIndex + 1)
              )
            } else {
              // Log completion when the last line is finished
              console.log('Drawing complete. Progress: 100%')
              setIsPlaybackFinished(true)
            }
          }

          requestAnimationFrame(drawFrame)
        }

        // Start drawing with the first line
        if (drawingData.lines.length > 0) {
          drawLine(drawingData.lines[0], 0)
        } else {
          console.log('No lines to draw')
          setIsPlaybackFinished(true)
        }
      } catch (error) {
        console.error('Error importing playback drawing data:', error)
      }
    },
    [setIsPlaybackFinished]
  )

  useEffect(() => {
    if (loadedPlaybackDrawingData) {
      importPlaybackDrawingData(JSON.stringify(loadedPlaybackDrawingData))
    } else {
      setIsPlaybackFinished(true) // If no playback data, we're ready to draw
    }
  }, [loadedPlaybackDrawingData, importPlaybackDrawingData])

  useEffect(() => {
    if (isPlaybackFinished) {
      console.log('Canvas is now ready for new drawings.')
    }
  }, [isPlaybackFinished])
  useEffect(() => {
    if (loadedKonvaDrawingData) {
      importKonvaPlaybackDrawingData(JSON.stringify(loadedKonvaDrawingData), 1) // Normal speed
    } else {
      setIsPlaybackFinished(true) // If no playback data, we're ready to draw
    }
  }, [loadedKonvaDrawingData, importKonvaPlaybackDrawingData])

  // UseEffect for loading regular drawing data
  useEffect(() => {
    if (loadedDrawingData) {
      importDrawingData(JSON.stringify(loadedDrawingData))
    }
  }, [loadedDrawingData])

  // Exporting drawing data
  const exportDrawingData = useCallback(() => {
    const lines = layers[layersIndex].groups[0].shapes.map((shape) => ({
      points: shape.points.reduce((acc, point, index) => {
        if (index % 2 === 0) {
          acc.push({ x: point, y: shape.points[index + 1] })
        }
        return acc
      }, []),
      brushColor: shape.color,
      brushRadius: shape.size / 2,
      opacity: shape.opacity,
    }))

    return {
      lines: lines,
      width: canvasSize.width,
      height: canvasSize.height,
    }
  }, [layers, layersIndex, canvasSize])

  // UseEffect for exporting drawing data when it changes
  useEffect(() => {
    if (onCanvasChangeData) {
      onCanvasChangeData(exportDrawingData())
    }
  }, [layers, onCanvasChangeData, exportDrawingData])

  // Event handlers
  const handleMouseDown = (e) => {
    // Prevent the context menu from appearing on right click
    e.evt.preventDefault()

    if (isPlaybackFinished) {
      // Check if it's a right click
      if (e.evt.button === 2) {
        setIsDrawing(true)
        addNewLine(e.target)
      }
    }
  }

  const handleMouseMove = (e) => {
    if (isPlaybackFinished && isDrawing) {
      continueDrawingLine(e.target)
    }
  }

  const handleMouseUp = (e) => {
    // Prevent the context menu from appearing on right click
    e.evt.preventDefault()

    if (isDrawing) {
      setIsDrawing(false)
      // Optionally, you can add logic here to finalize the line or perform other actions on mouse up
    }
  }

  // UI interaction functions
  const changeLayer = (index) => setLayersIndex(index)
  const toggleGobbler = () => setShowGobbler(!showGobbler)
  const toggleTool = () => setTool(tool === 'brush' ? 'eraser' : 'brush')

  // Render method
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        justifyContent: 'space-between',
        marginTop: '20px',
      }}
    >
      {useKonva ? (
        <main
          style={{
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Stage
            ref={stageRef}
            width={width}
            height={height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onContextMenu={(e) => e.evt.preventDefault()}
            style={{
              cursor: 'crosshair',
              border: '2px solid #000',
              backgroundImage: `url(data:image/png;base64,${dataString})`,
              backgroundSize: '350px 350px',
              borderRadius: '10px',
            }}
          >
            {layers.map((layer, i) => (
              <Layer
                key={i}
                ref={(el) => {
                  layersRef.current[i] = el
                }}
                visible={layer.visible}
              >
                {layer.groups.map((group, k) => (
                  <Group key={k} x={group.x} y={group.y}>
                    {group.shapes.map(
                      (shape, j) =>
                        shape.type === 'line' && (
                          <Line
                            key={j}
                            points={shape.points}
                            stroke={shape.color}
                            strokeWidth={shape.size}
                            opacity={shape.opacity}
                            lineJoin="round"
                            lineCap="round"
                          />
                        )
                    )}
                  </Group>
                ))}
              </Layer>
            ))}
          </Stage>
        </main>
      ) : (
        <div>
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{
              border: '2px solid #000',
              backgroundImage: `url(data:image/png;base64,${dataString})`,
              backgroundSize: '350px 350px',
              borderRadius: '10px',
            }}
          />
        </div>
      )}
    </div>
  )
}

export default DrawApp
