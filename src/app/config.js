'use client'
import * as React from 'react'
import '@rainbow-me/rainbowkit/styles.css'
import './styles/Home.css'
import {
  RainbowKitProvider,
  getDefaultWallets,
  getDefaultConfig,
  lightTheme,
} from '@rainbow-me/rainbowkit'
import {
  rabbyWallet,
  trustWallet,
  ledgerWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { base, mainnet } from 'wagmi/chains'
import Navbar from './components/Navbar/Navbar'

const { wallets } = getDefaultWallets()
export const config = getDefaultConfig({
  appName: 'Blast Point Test',
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  wallets: [
    ...wallets,
    {
      groupName: 'Others',
      wallets: [rabbyWallet, trustWallet, ledgerWallet],
    },
  ],
  chains: [base, mainnet],

  ssr: true,
})

const queryClient = new QueryClient()

export default function Config({ children }) {
  return (
    <div className="App">
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            modalSize="compact"
            theme={lightTheme({
              connectButtonBackground: '#5bb8eb',
              accentColor: '#5bb8eb',
              accentColorForeground: '#000000',
              connectButtonTextError: '#000000',
            })}
          >
            <div>{children}</div>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </div>
  )
}
