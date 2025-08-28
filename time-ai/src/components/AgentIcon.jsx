import { useRef, useEffect } from 'react'
import Lottie from 'lottie-react'
import agentAnimation from '../assets/agent.json'

const AgentIcon = ({ width = 20, height = 20, isParentHovered = false }) => {
  const lottieRef = useRef()

  useEffect(() => {
    if (lottieRef.current) {
      if (isParentHovered) {
        lottieRef.current.play()
      } else {
        lottieRef.current.stop()
        lottieRef.current.goToAndStop(0, true) // Reset to first frame
      }
    }
  }, [isParentHovered])

  return (
    <div
      className="agent-icon"
      style={{
        width: width,
        height: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'currentColor'
      }}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={agentAnimation}
        loop={true}
        autoplay={false}
        style={{
          width: width,
          height: height,
          filter: 'none'
        }}
      />
    </div>
  )
}

export default AgentIcon