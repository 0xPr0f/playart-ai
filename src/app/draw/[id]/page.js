'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import styles from './CreateArt.module.scss'
import { Back, Paint } from '@icon-park/react'
import { useAccount } from 'wagmi'
import CanvasDraw from 'react-canvas-draw'

import {
  UilEye,
  UilEyeSlash,
  UilSun,
  UilMoon,
  UilImageDownload,
  UilHistoryAlt,
  UilSave,
  UilTrash,
  UilPen,
} from '@iconscout/react-unicons'
//import LoadingBar from "react-top-loading-bar";

import { useDebounce } from 'use-debounce'
import Navbar from '@/app/components/Navbar/Navbar'
import {
  RoundButtonInputArt,
  RoundButtonTools,
} from '@/app/components/RoundButton/RoundButtonTools'
import InputArtField from '@/app/components/Addons/InputArtField'
import { useParams } from 'next/navigation'

import { ChromePicker } from 'react-color'
import rgbHex from 'rgb-hex'
import { BrushPreviewCircle } from '@/app/components/Addons/BrushPreviewCircle'
import { PrettoSlider } from '@/app/components/Addons/Slider'
import { FormControlLabel } from '@mui/material'
import { MaterialUISwitch } from '@/app/components/Addons/SwitchButton'

import data from './dump'
//import DrawApp from '@/app/components/drawing/canvas'
import dynamic from 'next/dynamic'
import { dataString, testData } from '@/app/components/drawing/base64data'

const LazyLoadedDrawApp = dynamic(
  () => import('@/app/components/drawing/canvas'),
  {
    ssr: false,
    loading: (props) => <div tabIndex={0}></div>,
  }
)

export const CreateArt = () => {
  const router = useRouter()
  const [showNavbar, setShowNavbar] = useState(false)
  const [showColorPalette, setShowColorPalette] = useState(false)
  const [brushColor, setBrushColor] = useState('#000000')
  const [brushRadius, setBrushRadius] = useState(10)
  const [allowPublicEdit, setAllowPublicEdit] = useState(false)
  const [allowPublicMint, setAllowPublicMint] = useState(false)
  const [brushOpacity, setBrushOpacity] = useState(100)
  const [savedData, setSavedData] = useState('')
  const [artName, setArtName] = useState('')
  const [debouncedArtName] = useDebounce(artName, 1000)
  const [artUrlData, setArtUrlData] = useState('')
  const [creator, setCreator] = useState('')
  const { address, isConnected } = useAccount()
  const [isSaving, setIsSaving] = useState('')
  const [progress, setProgress] = useState(0)
  const [artData, setArtData] = useState([])
  const [showPreviewAndHideModal, setShowPreviewAndHideModal] = useState(false)

  const saveableCanvas = useRef('')
  const { id } = useParams()

  const LoadData = async () => {
    setSavedData(saveableCanvas?.current?.getSaveData())
    setArtUrlData(saveableCanvas?.current?.getDataURL())
  }

  function base64ToImage(base64String) {
    return new Promise((resolve) => {
      let img = new window.Image()
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
    let currentLine = null
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        let index = (y * img.width + x) * 4
        if (data[index + 3] > 0) {
          // not transparent
          let r = data[index]
          let g = data[index + 1]
          let b = data[index + 2]

          // Calculate brush radius based on brightness or any other pixel property
          let brightness = (r + g + b) / 3
          let brushRadius = Math.max(1, Math.round(brightness / 25)) // Example: scale brightness to brush radius

          // Convert RGB to hex color
          let brushColor = `#${((1 << 24) | (r << 16) | (g << 8) | b)
            .toString(16)
            .slice(1)}`

          if (
            !currentLine ||
            currentLine.brushColor !== brushColor ||
            currentLine.brushRadius !== brushRadius
          ) {
            if (currentLine) lines.push(currentLine)
            currentLine = {
              points: [{ x: x, y: y }],
              brushColor: brushColor,
              brushRadius: brushRadius,
            }
          } else {
            currentLine.points.push({ x: x, y: y })
          }
        } else if (currentLine && currentLine.points.length > 0) {
          // End of line
          lines.push(currentLine)
          currentLine = null
        }
      }
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

  function rework(lineScheme) {
    // Extract points from line data, manipulate them, and put them back
    let newLineData = JSON.parse(JSON.stringify(lineScheme)) // Deep copy to keep original data unchanged

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

  const loaddata = (dataInput) => {
    console.log('clicked')
    imageToLinesSchema(dataInput).then((result) => {
      let simplifiedPoints = rework(result)
      return JSON.stringify(simplifiedPoints, null, 0)
    })
  }
  const handleChange = (data) => {
    console.log('Drawing data changed:', JSON.stringify(data))
    // Here you can do whatever you want with the changed data
  }

  return (
    <div>
      <div>
        <div>{showNavbar && <Navbar />}</div>
        <div
          style={{
            margin: '1% 10%',
          }}
        >
          <div
            className={[styles.editCanvasbtn, 'edit canvas buttons'].join(' ')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1em' }}>
              <RoundButtonTools
                onClick={() => {
                  router.back()
                }}
              >
                <Back theme="outline" size="30" fill="#000000" />
              </RoundButtonTools>
              <br />
              <RoundButtonTools onClick={() => console.log(allowPublicEdit)}>
                <Paint theme="outline" size="30" fill="#000000" />
              </RoundButtonTools>

              <RoundButtonTools
                onClick={() => {
                  saveableCanvas.current.eraseAll()
                }}
              >
                <UilTrash size="30" color="#00000" />
              </RoundButtonTools>
              <RoundButtonTools
                onClick={() => {
                  saveableCanvas.current.undo()
                }}
              >
                <UilHistoryAlt size="30" color="#00000" />
              </RoundButtonTools>
              <RoundButtonTools
                onClick={() => {
                  debounceSaveData(
                    showNavbar,
                    showColorPalette,
                    brushColor,
                    brushRadius,
                    lazyRadius,
                    allowPublicEdit,
                    allowPublicMint,
                    artName,
                    creator
                  )
                }}
              >
                <UilSave size="30" color="#00000" />
              </RoundButtonTools>
              <RoundButtonTools
                onClick={() => {
                  console.log(saveableCanvas.current?.getDataURL())

                  console.log('download the image')
                }}
              >
                <UilImageDownload size="30" color="#00000" />
              </RoundButtonTools>
              <RoundButtonTools>
                <UilSun
                  size="30"
                  color="#00000"
                  onClick={() => {
                    loaddata()
                  }}
                />
                {/* <UilMoon size="30" color="#00000" />  */}
              </RoundButtonTools>
              <RoundButtonTools>
                {showNavbar ? (
                  <UilEye
                    onClick={() => setShowNavbar(false)}
                    size="30"
                    color="#00000"
                  />
                ) : (
                  <UilEyeSlash
                    onClick={() => setShowNavbar(true)}
                    size="30"
                    color="#00000"
                  />
                )}
              </RoundButtonTools>
            </div>
            <div className={styles.ExportAspect} style={{ gap: '1em' }}>
              <div style={{ marginLeft: '2em' }}>
                <InputArtField
                  value={artName}
                  onChange={(event) => setArtName(event.target.value)}
                  placeholder="Untitled Art"
                  icon={<UilPen size="24" color="#00000" />}
                />
              </div>
              <div>
                <RoundButtonInputArt
                  padding="0em 1.3em"
                  width="200px"
                  borderRadius="38px"
                  cursor="pointer"
                  onClick={() => {
                    setShowPreviewAndHideModal(true)
                  }}
                >
                  Preview and Share
                </RoundButtonInputArt>
              </div>
            </div>
          </div>

          <div
            className={styles.HeadMainCanvsSection}
            style={{ display: 'flex', alignItems: 'center', gap: '3%' }}
          >
            <div
              style={{ margin: showNavbar ? '.7em 0em' : '2.5em 0em' }}
              className={styles.CanvasDraw}
            >
              {/*}
              <CanvasDraw
                ref={(canvasDraw) => {
                  saveableCanvas.current = canvasDraw
                }}
                style={{ borderRadius: '20px' }}
                canvasWidth={810}
                canvasHeight={810}
                brushRadius={brushRadius}
                immediateLoading={true}
                lazyRadius={lazyRadius}
                brushColor={brushColor}
                // saveData={}
                onChange={() => {
                  setSavedData(saveableCanvas.current?.getSaveData())
                  setArtUrlData(saveableCanvas.current?.getDataURL())
                  /*
                  debounceSaveData(
                    showNavbar,
                    showColorPalette,
                    brushColor,
                    brushRadius,
                    lazyRadius,
                    allowPublicEdit,
                    allowPublicMint,
                    artName,
                    creator
                  ) */
              /* }}
              /> */}
              <LazyLoadedDrawApp
                width={810}
                height={810}
                initialBrushColor={brushColor}
                initialBrushSize={brushRadius}
                initialBrushOpacity={brushOpacity}
                loadedDrawingData={testData}
                // onCanvasChangeData={handleChange}
              />
            </div>
            <div className={styles.CanvasDrawSettingPanel}>
              {/*//////****    BRUSH PROPS    */}
              <div className={styles.BrushProperties}>
                <div
                  className={styles.BrushPropertiesText}
                  style={{
                    backgroundColor: 'rgba(255,255,255,.1)',
                    color: 'black',
                    width: '100%',
                    height: '3.7em',
                    padding: '1em 1.9em',
                    fontWeight: '700',
                  }}
                >
                  <span>Properties</span>
                </div>
                <div
                  style={{ overflow: 'auto', height: '30em', width: '100%' }}
                >
                  <div style={{ width: '100%', padding: '1em 1em' }}>
                    {showColorPalette && (
                      <div
                        style={{
                          marginTop: '.3em',
                          position: 'absolute',
                          zIndex: '9',
                          marginLeft: '-13em',
                        }}
                      >
                        <ChromePicker
                          color={brushColor}
                          onChange={(color) => {
                            setBrushColor(
                              '#' +
                                rgbHex(
                                  color.rgb.r,
                                  color.rgb.g,
                                  color.rgb.b,
                                  color.rgb.a
                                )
                            )
                          }}
                          onChangeComplete={(color) => {
                            setBrushColor(
                              '#' +
                                rgbHex(
                                  color.rgb.r,
                                  color.rgb.g,
                                  color.rgb.b,
                                  color.rgb.a
                                )
                            )
                          }}
                        />
                      </div>
                    )}
                    <span style={{ userSelect: 'none', fontSize: '15px' }}>
                      Brush color
                    </span>
                    <div
                      style={{
                        borderRadius: '10px',
                        margin: '0.4em 0.7em',
                        height: '2.5em',
                        padding: '0.45em',
                        border: '1px solid black',
                        cursor: 'pointer',
                      }}
                      onClick={() =>
                        !showColorPalette
                          ? setShowColorPalette(true)
                          : setShowColorPalette(false)
                      }
                    >
                      <div
                        style={{
                          userSelect: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-around',
                        }}
                      >
                        <span style={{ fontWeight: '600' }}>{brushColor} </span>{' '}
                        <BrushPreviewCircle
                          height={`20px`}
                          width={`20px`}
                          color={brushColor}
                          border="1px solid #8860CE"
                        />
                      </div>
                    </div>

                    {/*  <ReactSlider />
                     */}

                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '1em',
                        }}
                      >
                        <span style={{ fontSize: '15px', userSelect: 'none' }}>
                          Brush radius
                        </span>
                        <span style={{ fontWeight: '600', fontSize: '15px' }}>
                          {brushRadius}
                        </span>
                      </div>
                      <div style={{ margin: '0em 0.8em' }}>
                        <PrettoSlider
                          valueLabelDisplay="auto"
                          aria-label="pretto slider"
                          min={1}
                          max={100}
                          value={brushRadius}
                          onChange={(e) => {
                            setBrushRadius(e.target.value)
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span style={{ fontSize: '15px', userSelect: 'none' }}>
                          Lazy radius
                        </span>
                        <span style={{ fontWeight: '600', fontSize: '15px' }}>
                          {brushOpacity}
                        </span>
                      </div>
                      <div style={{ margin: '0em 0.8em' }}>
                        <PrettoSlider
                          valueLabelDisplay="auto"
                          aria-label="pretto slider"
                          min={1}
                          max={100}
                          defaultValue={100}
                          value={brushOpacity}
                          onChange={(e) => {
                            setBrushOpacity(e.target.value)
                          }}
                        />
                      </div>
                    </div>
                    <span style={{ fontSize: '15px', userSelect: 'none' }}>
                      Brush preview
                    </span>
                    <div>
                      <div
                        style={{
                          margin: '0.4em 0.7em',
                          border: '1px solid black',
                          borderRadius: '12px',
                          height: '11em',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <BrushPreviewCircle
                          height={`${brushRadius}px`}
                          width={`${brushRadius}px`}
                          color={brushColor}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {isConnected && (
                <div className={styles.PageSettings}>
                  <div
                    className={styles.BrushPropertiesText}
                    style={{
                      backgroundColor: 'rgba(255,255,255,.1)',
                      color: 'black',
                      width: '100%',
                      height: '3.7em',
                      padding: '1em 1.9em',
                      fontWeight: '700',
                    }}
                  >
                    <span>Settings</span>
                  </div>
                  <div style={{ width: '100%', padding: '1em 1em' }}>
                    <span>Public Edit</span>
                    <div
                      style={{
                        margin: '0.1em 0.2em',
                        height: '2.5em',
                        cursor: 'pointer',
                      }}
                    >
                      <FormControlLabel
                        onChange={(event) => {
                          setAllowPublicEdit(event.target.checked)
                        }}
                        checked={allowPublicEdit}
                        control={<MaterialUISwitch sx={{ m: 1 }} />}
                        label="Yes"
                      />
                    </div>
                  </div>
                  <div style={{ width: '100%', padding: '0.5em 1em' }}>
                    <span>Public Mint</span>
                    <div
                      style={{
                        margin: '0.1em 0.2em',
                        height: '2.5em',
                        cursor: 'pointer',
                      }}
                    >
                      <FormControlLabel
                        onChange={(event) => {
                          setAllowPublicMint(event.target.checked)
                        }}
                        checked={allowPublicMint}
                        control={<MaterialUISwitch sx={{ m: 1 }} />}
                        label="Yes"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/*<PreviewAndShareModal
          previewcanvasdata={savedData}
          show={showPreviewAndHideModal}
          object_id={object_id}
          data={savedData}
          onHide={() => setShowPreviewAndHideModal(false)}
        /> */}
      </div>
      <div className="border flex justify-center items-center h-screen border-red-700">
        <div className="w-[45%]" style={{ gap: '1em' }}>
          <div style={{ marginLeft: '2em' }}>
            <InputArtField
              value={artName}
              onChange={(event) => setArtName(event.target.value)}
              placeholder="Draw a cool art"
              icon={
                <UilPen
                  onClick={() => {
                    console.log(savedData)
                    console.log(artUrlData)
                  }}
                  className="cursor-pointer"
                  size="24"
                  color="#00000"
                />
              }
            />
          </div>
        </div>
      </div>
      <div></div>
    </div>
  )
}

export default CreateArt
