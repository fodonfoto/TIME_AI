import { useRef, useEffect } from 'react'
import Lottie from 'lottie-react'
import settingsAnimation from '../assets/setting.json'

const SettingsIcon = ({ width = 20, height = 20, isParentHovered = false }) => {
  const lottieRef = useRef()

  useEffect(() => {
    if (lottieRef.current) {
      if (isParentHovered) {
        lottieRef.current.play()
      } else {
        lottieRef.current.stop()
        lottieRef.current.goToAndStop(0, true)
      }
    }
  }, [isParentHovered])

  const iconStyle = {
    width,
    height,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'currentColor'
  }

  const lottieStyle = {
    width,
    height,
    filter: 'none'
  }

  return (
    <div className="settings-icon" style={iconStyle}>
      <Lottie
        lottieRef={lottieRef}
        animationData={settingsAnimation}
        loop={true}
        autoplay={false}
        style={lottieStyle}
      />
    </div>
  )
}

export default SettingsIcon