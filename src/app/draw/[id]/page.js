'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import styles from './CreateArt.module.scss'
import { Back, Paint } from '@icon-park/react'
import { useAccount } from 'wagmi'
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

//import DrawApp from '@/app/components/drawing/canvas'
import dynamic from 'next/dynamic'
import { testData } from '@/app/components/drawing/base64data'

const LazyLoadedDrawApp = dynamic(
  () => import('@/app/components/drawing/canvas'),
  {
    ssr: false,
    loading: () => <div tabIndex={0}></div>,
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
  const [pointsData, setPointData] = useState()
  const [showPreviewAndHideModal, setShowPreviewAndHideModal] = useState(false)
  const colorPaletteRef = useRef(null)
  const triggerRef = useRef(null)
  const saveableCanvas = useRef('')
  const { id } = useParams()

  const LoadData = async () => {
    setSavedData(saveableCanvas?.current?.getSaveData())
    setArtUrlData(saveableCanvas?.current?.getDataURL())
  }
  useEffect(() => {
    setPointData(testData)
  }, [testData])

  // Effect to handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showColorPalette &&
        colorPaletteRef.current &&
        !colorPaletteRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setShowColorPalette(false)
      }
    }

    // Add when the palette is shown
    document.addEventListener('mousedown', handleClickOutside)

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColorPalette])

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
                  load()
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
              <LazyLoadedDrawApp
                width={810}
                height={810}
                initialBrushColor={brushColor}
                initialBrushSize={brushRadius}
                initialBrushOpacity={brushOpacity}
                //loadedKonvaDrawingData={pointsData}
                //loadedDrawingData={pointsData}
                //loadedPlaybackDrawingData={pointsData}
                //useKonva={false}
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
                        ref={colorPaletteRef}
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
                      ref={triggerRef}
                      style={{
                        borderRadius: '10px',
                        margin: '0.4em 0.7em',
                        height: '2.5em',
                        padding: '0.45em',
                        border: '1px solid black',
                        cursor: 'pointer',
                      }}
                      onClick={() => setShowColorPalette(!showColorPalette)}
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
                          Opacity
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
