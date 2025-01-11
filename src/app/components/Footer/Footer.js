import { SiDiscord, /* SiTwitter,*/ SiGithub } from 'react-icons/si'

import styles from './Footer.css'

export default function Footer({ activeSocial = true }) {
  return (
    <footer className={['Footer', !activeSocial && 'inactiveSocial'].join(' ')}>
      <span
        style={{ fontSize: '20px', color: 'black', fontWeight: '500' }}
        className={'Copyright'}
      >
        &copy; PLAY ART {new Date().getFullYear()}
      </span>
      <div
        style={{ fontSize: '17px', color: 'black', fontWeight: '300' }}
        className={'tAndC'}
      >
        <span>Built by 0xPr0f</span>
      </div>
      <div className={'socials'}>
        <a target={'_blank'} rel="noreferrer" href="https://github.com/0xpr0f">
          <SiGithub size={25} fill="rgb(8, 8, 154)" />
        </a>
      </div>
    </footer>
  )
}
