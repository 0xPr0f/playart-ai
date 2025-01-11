const React = require('react')
const { useState, useRef, useEffect, useca } = require('react')
const { Stage, Layer, Line, Group } = require('react-konva')
const Konva = require('konva')
const { dataString } = require('./base64data')

const DrawApp = ({
  width,
  height,
  initialBrushColor,
  initialBrushSize,
  initialBrushOpacity,
  loadedDrawingData,
  onCanvasChangeData,
}) => {
  const [isDrawing, setIsDrawing] = useState(false)
  const [layers, setLayers] = useState([
    {
      visible: true,
      name: 'Layer 0',
      id: 'default-layer',
      groups: [{ x: 0, y: 0, shapes: [] }],
    },
  ])
  const [layersIndex, setLayersIndex] = useState(0)
  const [brushColor, setBrushColor] = useState(initialBrushColor || '#000000')
  const [brushSize, setBrushSize] = useState(initialBrushSize || 5)
  const [brushOpacity, setBrushOpacity] = useState(initialBrushOpacity || 100)
  const [tool, setTool] = useState('brush') // New state for tool selection
  const [showGobbler, setShowGobbler] = useState(false)
  const stageRef = useRef()
  const layersRef = useRef([])

  const canvasSize = { width, height }
  const dpr = window.devicePixelRatio >= 2 ? 2 : 1

  useEffect(() => {
    if (stageRef.current) {
      stageRef.current.width(width)
      stageRef.current.height(height)
      stageRef.current.batchDraw()
    }
    if (loadedDrawingData) {
      importDrawingData(JSON.stringify(loadedDrawingData))
    }
  }, [width, height, loadedDrawingData, importDrawingData])

  useEffect(() => {
    setBrushColor(initialBrushColor)
    setBrushOpacity(initialBrushOpacity)
    setBrushSize(initialBrushSize)
  }, [initialBrushColor, initialBrushSize, initialBrushOpacity])

  const getPositionedStage = (target) => {
    const stage = target.getStage()
    const oldScale = stage.scale() || { x: 1, y: 1 }
    const { x, y } = layers[layersIndex].groups[0] || { x: 0, y: 0 }
    let pos = stage.getPointerPosition() || { x: 0, y: 0 }
    pos.x = pos.x / oldScale.x - x
    pos.y = pos.y / oldScale.y - y
    return pos
  }

  const addNewLine = (target) => {
    setIsDrawing(true)
    const pos = getPositionedStage(target)

    const newLine = {
      type: 'line',
      points: [pos.x, pos.y],
      tool: tool, // Use the current tool
      color: tool === 'eraser' ? 'transparent' : brushColor, // If eraser, set color to transparent
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
  /*
  const importDrawingData = (data) => {
    try {
      const drawingData = JSON.parse(data)
      // Validate the structure of the imported data
      if (!drawingData.lines || !Array.isArray(drawingData.lines)) {
        throw new Error('Invalid drawing data format')
      }

      // Convert the imported data back into our internal format
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

      // Update the state with the new shapes
      const newLayers = [...layers]
      newLayers[layersIndex] = {
        ...newLayers[layersIndex],
        groups: [{ x: 0, y: 0, shapes: newShapes }],
      }
      setLayers(newLayers)
    } catch (error) {
      console.error('Error importing drawing data:', error)
      // Optionally, you could show an error message to the user here
    }
  } */
  const importDrawingData = useCallback(
    (data) => {
      try {
        const drawingData = JSON.parse(data)
        // Validate the structure of the imported data
        if (!drawingData.lines || !Array.isArray(drawingData.lines)) {
          throw new Error('Invalid drawing data format')
        }

        // Convert the imported data back into our internal format
        const newShapes = drawingData.lines.map((line) => ({
          type: 'line',
          points: [], // Initialize with empty points array
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

        // Simulate drawing by gradually adding points
        drawingData.lines.forEach((line, lineIndex) => {
          let pointIndex = 0
          const interval = setInterval(() => {
            if (pointIndex < line.points.length) {
              // Add two points at a time since each point is represented by x and y
              const currentShape =
                newLayers[layersIndex].groups[0].shapes[lineIndex]
              currentShape.points = [
                ...currentShape.points,
                line.points[pointIndex].x,
                line.points[pointIndex].y,
              ]
              pointIndex++

              // Update the state
              setLayers([...newLayers])

              // If we reach the end of the points, clear the interval
            } else {
              clearInterval(interval)
            }
          }, 10) // Adjust this value to control the speed of the drawing simulation
        })
      } catch (error) {
        console.error('Error importing drawing data:', error)
        // Optionally, you could show an error message to the user here
      }
    },
    [layers, layersIndex, dpr]
  )
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

    // Construct the object to be exported
    return {
      lines: lines,
      width: canvasSize.width,
      height: canvasSize.height,
    }
  }, [layers, layersIndex, canvasSize])

  useEffect(() => {
    if (onCanvasChangeData) {
      onCanvasChangeData(exportDrawingData())
    }
  }, [layers, onCanvasChangeData, exportDrawingData])

  const handleMouseDown = ({ target }) => {
    addNewLine(target)
  }

  const handleMouseMove = ({ target }) => {
    if (isDrawing) {
      continueDrawingLine(target)
    }
  }

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false)
    }
  }

  const changeLayer = (index) => {
    setLayersIndex(index)
  }

  const toggleGobbler = () => {
    setShowGobbler(!showGobbler)
  }

  const toggleTool = () => {
    setTool(tool === 'brush' ? 'eraser' : 'brush')
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          marginTop: '20px',
        }}
      >
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
            style={{
              cursor: 'crosshair',
              border: '2px solid #000',
              backgroundImage: `url(data:image/png;base64,${dataString})`, // Updated transparent grid pattern
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
      </div>
    </>
  )
}

module.exports = DrawApp
