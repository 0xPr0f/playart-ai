'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'

//import { Dna } from 'react-loader-spinner'
//import LoadingBar from 'react-top-loading-bar'
//import { useLocation } from 'react-router-dom'

const InitializeArtPage = () => {
  const router = useRouter()
  //const [localDraft, setLocalDraft] = useState([])
  //const [progress, setProgress] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const { address, isConnected, isDisconnected } = useAccount()

  useEffect(() => {
    if (isCreating === false) {
      CreateArt()
    }
  }, [])

  const CreateArt = async () => {
    setIsCreating(true)
    //const ArtTestData = Moralis.Object.extend("ArtTestData");
    // const artTestData = new ArtTestData();

    const data = {
      ShowNavbar: false,
      ShowColorPalette: false,
      BrushColor: '#000000',
      BrushRadius: 10,
      LazyRadius: 1,
      SavedData: '',
      ArtName: '',
      ArtSeed: Math.round(Math.random() * 1000000000),
      ArtCreator: isConnected ? address : '',
      AllowPublicEdit: isConnected ? false : true,
      AllowPublicMint: isConnected ? false : true,
    }

    const response = await fetch('/api/initializeNewArtData', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const result = await response.json()
    if (result.success) {
      console.log(result)
      console.log('New object created: ' + result)
      router.push(`/draw/${result.data.insertedId}`)
    } else {
      console.log(
        'Failed to create new object, with error code: ' + error.message
      )
    }
  }
  /*
  const location = useLocation()
  useEffect(() => {
    for (var i = 0; i < 70; i++) {
      setProgress(i)
    }
  }, [location])
*/
  return (
    <>
      {/*} <LoadingBar
        color="#F76D6E"
        height="5px"
        progress={progress}
        onLoaderFinished={() => setProgress(0)}
      /> */}
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignitems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignitems: 'center',
            justifyContent: 'center',

            gap: '3em',
          }}
        >
          <h1 style={{ marginTop: '0.38em' }}>Creating Canvas </h1>
          {/*<Dna
            visible={true}
            height="80"
            width="80"
            ariaLabel="dna-loading"
            wrapperStyle={{}}
            wrapperClass="dna-wrapper"
          /> */}
        </div>
      </div>
    </>
  )
}

export default InitializeArtPage
