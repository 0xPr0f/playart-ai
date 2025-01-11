const data = require('./dump')

function base64ToImage(base64String) {
  return new Promise((resolve) => {
    let img = new Image()
    img.onload = () => resolve(img)
    img.src = base64String
  })
}

async function imageToLinesSchema(base64String) {
  let img = await base64ToImage(base64String)
  let canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  let ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)

  // Get image data
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let data = imageData.data

  let lines = []
  let currentLine = { points: [], brushColor: '#000000', brushRadius: 10 }

  // Simple edge detection:
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      let index = (y * canvas.width + x) * 4
      // Check if this pixel is an 'edge' by comparing with neighbors.
      // Here, we'll just check if it's not transparent:
      if (data[index + 3] > 0) {
        // not transparent
        currentLine.points.push({ x: x, y: y })
      } else if (currentLine.points.length > 0) {
        // End of line
        lines.push(currentLine)
        currentLine = { points: [], brushColor: '#000000', brushRadius: 10 }
      }
    }
  }
  if (currentLine.points.length > 0) {
    lines.push(currentLine)
  }

  return {
    lines: lines,
    width: canvas.width,
    height: canvas.height,
  }
}

function base64ToImage(base64String) {
  return new Promise((resolve) => {
    let img = new Image()
    img.onload = () => resolve(img)
    img.src = base64String
  })
}

async function imageToLinesSchema(base64String) {
  let img = await base64ToImage(base64String)
  let canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  let ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)

  // Get image data
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let data = imageData.data

  let lines = []
  let currentLine = {
    points: [],
    brushColor: '#000000',
    brushRadius: 10,
  }

  // Simple edge detection:
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      let index = (y * canvas.width + x) * 4
      // Check if this pixel is an 'edge' by comparing with neighbors.
      // Here, we'll just check if it's not transparent:
      if (data[index + 3] > 0) {
        // not transparent
        currentLine.points.push({ x: x, y: y })
      } else if (currentLine.points.length > 0) {
        // End of line
        lines.push(currentLine)
        currentLine = {
          points: [],
          brushColor: '#000000',
          brushRadius: 10,
        }
      }
    }
  }
  if (currentLine.points.length > 0) {
    lines.push(currentLine)
  }

  return {
    lines: lines,
    width: canvas.width,
    height: canvas.height,
  }
}

function simplifyLine(points, tolerance) {
  // If there are 2 or fewer points, return them all

  if (points.length <= 2) return points

  // Find the point with the maximum distance
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

  // If the maximum distance is greater than our tolerance,
  // recursively simplify the two parts of the line
  if (maxDistance >= tolerance) {
    let result = simplifyLine(points.slice(0, index + 1), tolerance)
    result.pop() // remove the last point as it's repeated
    result = result.concat(simplifyLine(points.slice(index), tolerance))
    return result
  } else {
    // Otherwise, just return the start and end points
    return [points[0], points[points.length - 1]]
  }
}

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
  let bottom = Math.hypot(lineEnd.x - lineStart.x, lineEnd.y - lineStart.y)
  return (area / bottom) * 2
}
function rework() {
  // Extract points from line data, manipulate them, and put them back
  let newLineData = JSON.parse(JSON.stringify(data)) // Deep copy to keep original data unchanged

  newLineData.lines.forEach((line) => {
    // Extract points
    let points = line.points

    // Modify points
    let modifiedPoints = simplifyLine(points, 1.0)

    // Put modified points back
    line.points = modifiedPoints
  })
  return newLineData
}

let simplifiedPoints = rework()
console.log(simplifiedPoints)
