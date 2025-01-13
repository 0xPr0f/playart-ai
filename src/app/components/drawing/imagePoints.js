import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

const ImageToJSON = ({ canvasWidth = 800, canvasHeight = 600 }) => {
  const canvasRef = useRef(null)
  const canvas2Ref = useRef(null)
  const imageRef = useRef(null)
  const [canvasLoaded, setCanvasLoaded] = useState(false)

  useEffect(() => {
    // Ensure we have references before using them
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const canvas2 = canvas2Ref.current
    const ctx2 = canvas2.getContext('2d')

    const image = imageRef.current

    // Function to clear the canvas
    function clear() {
      ctx2.clearRect(0, 0, canvas2.width, canvas2.height)
    }

    // Function to draw points
    function drawPoints({ points, brushColor, brushRadius }) {
      ctx2.beginPath()
      ctx2.strokeStyle = brushColor
      ctx2.lineWidth = brushRadius * 2
      ctx2.lineCap = 'round'
      ctx2.lineJoin = 'round'

      if (points.length > 0) {
        ctx2.moveTo(points[0].x, points[0].y)
        for (let i = 1; i < points.length; i++) {
          ctx2.lineTo(points[i].x, points[i].y)
        }
      }

      ctx2.stroke()
    }

    // Function to simulate drawing lines
    function simulateDrawingLines({ lines, immediate }) {
      let curTime = 0
      let timeoutGap = immediate ? 0 : 10

      lines.forEach((line) => {
        const { points, brushColor, brushRadius } = line

        if (immediate) {
          drawPoints({ points, brushColor, brushRadius })
          return
        }

        for (let i = 1; i < points.length; i++) {
          curTime += timeoutGap
          setTimeout(() => {
            drawPoints({
              points: points.slice(0, i + 1),
              brushColor,
              brushRadius,
            })
          }, curTime)
        }
      })
    }

    // Function to load save data
    function loadSaveData(saveData, immediate = false) {
      if (typeof saveData !== 'string') {
        throw new Error('saveData needs to be of type string!')
      }

      const { lines, width, height } = JSON.parse(saveData)

      if (!lines || !Array.isArray(lines)) {
        throw new Error('saveData.lines needs to be an array!')
      }

      clear()

      if (width === canvasWidth && height === canvasHeight) {
        simulateDrawingLines({ lines, immediate })
      } else {
        // we need to rescale the lines based on saved & current dimensions
        const scaleX = canvasWidth / width
        const scaleY = canvasHeight / height
        const scaleAvg = (scaleX + scaleY) / 2

        simulateDrawingLines({
          lines: lines.map((line) => ({
            ...line,
            points: line.points.map((p) => ({
              x: p.x * scaleX,
              y: p.y * scaleY,
            })),
            brushRadius: line.brushRadius * scaleAvg,
          })),
          immediate,
        })
      }
    }

    // Image onload event
    image.onload = () => {
      // Set canvas size to match the image
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight

      // Draw the image onto the canvas
      ctx.drawImage(image, 0, 0)

      // Get the image data from the canvas
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      let points = []
      let lines = []
      let currentLine = null

      // Function to calculate color difference
      function colorDiff(r1, g1, b1, r2, g2, b2) {
        return Math.sqrt(
          Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
        )
      }

      // Iterate over each pixel in the image
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          let index = (y * canvas.width + x) * 4
          // Check if the pixel is not transparent
          if (data[index + 3] > 0) {
            let r = data[index]
            let g = data[index + 1]
            let b = data[index + 2]

            // Calculate brightness with more precision
            let brightness = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
            // Adjust brush radius based on brightness, with finer control
            let brushRadius = Math.max(1, Math.round(brightness / 25.5))

            // Convert RGB to hex for brush color
            let brushColor = `#${((1 << 24) + (r << 16) + (g << 8) + b)
              .toString(16)
              .slice(1)}`

            // Check if we need to start a new line
            if (
              !currentLine ||
              colorDiff(
                r,
                g,
                b,
                parseInt(currentLine.brushColor.slice(1, 3), 16),
                parseInt(currentLine.brushColor.slice(3, 5), 16),
                parseInt(currentLine.brushColor.slice(5, 7), 16)
              ) > 10 || // If color change is significant
              currentLine.brushRadius !== brushRadius
            ) {
              if (currentLine && currentLine.points.length > 0) {
                lines.push(currentLine)
              }
              currentLine = {
                points: [{ x, y }],
                brushColor,
                brushRadius,
              }
            } else {
              // Add point if it's part of the current line but with some distance check
              let lastPoint = currentLine.points[currentLine.points.length - 1]
              if (
                Math.sqrt(
                  Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2)
                ) > 1
              ) {
                currentLine.points.push({ x, y })
              }
            }
          } else if (currentLine && currentLine.points.length > 0) {
            // End the current line if we hit a transparent pixel
            lines.push(currentLine)
            currentLine = null
          }
        }
      }

      // If there's an unfinished line, add it to lines
      if (currentLine && currentLine.points.length > 0) {
        lines.push(currentLine)
      }

      // Create the output JSON
      const jsonOutput = {
        lines,
        width: canvas.width,
        height: canvas.height,
      }

      // Simplification function
      function simplifyLine(points, tolerance) {
        if (points.length <= 2) return points

        let maxDistance = 0
        let index = 0
        for (let i = 1; i < points.length - 1; i++) {
          let distance = perpendicularDistance(
            points[i],
            points[0],
            points[points.length - 1]
          )
          if (distance > maxDistance) {
            maxDistance = distance
            index = i
          }
        }

        if (maxDistance >= tolerance) {
          let result = simplifyLine(points.slice(0, index + 1), tolerance)
          result.pop()
          result = result.concat(simplifyLine(points.slice(index), tolerance))
          return result
        } else {
          return [points[0], points[points.length - 1]]
        }
      }

      // Helper function for simplification
      function perpendicularDistance(point, lineStart, lineEnd) {
        let area = Math.abs(
          0.5 *
            (lineStart.x * lineEnd.y +
              lineEnd.x * point.y +
              point.x * lineStart.y -
              lineEnd.x * lineStart.y -
              point.x * lineEnd.y -
              lineStart.x * point.y)
        )
        let bottom = Math.hypot(
          lineEnd.x - lineStart.x,
          lineEnd.y - lineStart.y
        )
        return (area * 2) / bottom
      }

      // Function to rework the line data
      function rework(Linedata) {
        let newLineData = JSON.parse(JSON.stringify(Linedata)) // Deep copy to keep original data unchanged

        newLineData.lines.forEach((line) => {
          let points = line.points
          let modifiedPoints = simplifyLine(points, 1.0)
          line.points = modifiedPoints
        })
        return newLineData
      }

      let simplifiedPoints = rework(jsonOutput)

      // Ensure canvas2 is loaded before drawing
      if (canvas2) {
        setCanvasLoaded(true)
        loadSaveData(JSON.stringify(simplifiedPoints), false)
      }

      console.log('entered')
      console.log(JSON.stringify(simplifiedPoints))
    }

    // Trigger image load
    image.src = '/your_image2.webp' // Make sure this path is correct relative to your public folder
  }, [])

  return (
    <div>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      <canvas
        ref={canvas2Ref}
        width={canvasWidth}
        height={canvasHeight}
        style={{ border: '1px solid black' }}
      ></canvas>
      <Image
        ref={imageRef}
        src="/your_image2.webp"
        alt="Image for JSON generation"
        width={0} // Next.js requires width and height, but setting to 0 hides it
        height={0}
        onLoad={() => {
          const image = imageRef.current
          if (image && image.complete) {
            image.onload()
          }
        }}
      />
    </div>
  )
}

export default ImageToJSON
