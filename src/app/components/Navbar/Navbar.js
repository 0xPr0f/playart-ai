import React from 'react'
import Link from 'next/link'
import './Navbar.css'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'

function Navbar() {
  const { address, isConnected } = useAccount()

  return (
    <>
      <nav className={'Navbar'}>
        <h3
          style={{ cursor: 'pointer' }}
          onClick={() => {
            window.location = '/'
          }}
        >
          PLAY ART
        </h3>
        <div className={'Links'}>
          {/*} <Link to={"/explore"}>Explore</Link> */}
          <Link href={'/'}>Home</Link>
          <Link href={'/draw'}>Create</Link>
          {isConnected ? (
            <Link href={`/account/${address}`}>Account</Link>
          ) : (
            <Link href={`/account`}>Account</Link>
          )}
          <ConnectButton
            showBalance={false}
            chainStatus={{ smallScreen: 'icon', largeScreen: 'full' }}
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
          />
        </div>
      </nav>
    </>
  )
}

export default Navbar
