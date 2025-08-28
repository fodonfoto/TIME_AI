import { useEffect, useRef } from 'react'

function ChatScrollAnchor({ trackVisibility }) {
  const ref = useRef(null)

  useEffect(() => {
    if (trackVisibility && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [trackVisibility])

  return <div ref={ref} className="scroll-anchor" />
}

export default ChatScrollAnchor