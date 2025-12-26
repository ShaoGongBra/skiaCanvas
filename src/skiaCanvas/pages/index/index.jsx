import { View, Text } from '@tarojs/components'
import { Header, TopView } from '@/duxapp'
import { Canvas, defineCanvasRef } from '@/duxappCanvas'
import { useEffect, useMemo, useRef, useState } from 'react'

export default TopView.page(function Index() {
  const canvasRef = useRef(defineCanvasRef())
  const canvasInstanceRef = useRef(null)
  const sizeRef = useRef({ width: 0, height: 0 })
  const rafIdRef = useRef(null)
  const rafFnRef = useRef(null)
  const cafFnRef = useRef(null)
  const runningRef = useRef(false)

  const [fps, setFps] = useState(0)

  const now = useMemo(() => {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return () => performance.now()
    }
    return () => Date.now()
  }, [])

  useEffect(() => {
    let cancelled = false

    const start = async () => {
      try {
        const { canvas, size } = await canvasRef.current.getCanvas()
        if (cancelled) {
          return
        }

        canvasInstanceRef.current = canvas
        sizeRef.current = size
        const ctx = canvas.getContext('2d')

        const raf =
          canvas.requestAnimationFrame ||
          (typeof requestAnimationFrame === 'function'
            ? requestAnimationFrame
            : cb => setTimeout(cb, 16))
        const caf =
          canvas.cancelAnimationFrame ||
          (typeof cancelAnimationFrame === 'function'
            ? cancelAnimationFrame
            : id => clearTimeout(id))

        rafFnRef.current = raf
        cafFnRef.current = caf

        let frameCount = 0
        let lastFpsAt = now()

        const loop = () => {
          if (cancelled || !runningRef.current) {
            return
          }

          const t = now()
          const { width, height } = sizeRef.current

          if (width && height) {
            ctx.clearRect(0, 0, width, height)
            drawRandomShapes(ctx, width, height)
          }

          frameCount += 1
          const dt = t - lastFpsAt
          if (dt >= 500) {
            setFps(frameCount * 1000 / dt)
            frameCount = 0
            lastFpsAt = t
          }

          rafIdRef.current = raf(loop)
        }

        runningRef.current = true
        rafIdRef.current = raf(loop)
      } catch (e) {
        console.error(e)
      }
    }

    start()
    return () => {
      cancelled = true
      runningRef.current = false
      if (rafIdRef.current != null) {
        const caf = cafFnRef.current || cancelAnimationFrame
        caf(rafIdRef.current)
      }
      rafIdRef.current = null
      canvasInstanceRef.current = null
      rafFnRef.current = null
      cafFnRef.current = null
    }
  }, [now])

  return <>
    <Header title='skiaCanvas' titleCenter />
    <View style={{ flex: 1, position: 'relative' }}>
      <Canvas
        ref={canvasRef}
        style={{ flex: 1, width: '100%' }}
        onLayout={size => {
          sizeRef.current = size
        }}
      />
      <View style={{
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 6
      }}
      >
        <Text style={{ color: '#fff', fontSize: 12 }}>{`FPS: ${fps.toFixed(1)}`}</Text>
      </View>
    </View>
  </>
})

const drawRandomShapes = (ctx, width, height) => {
  // circles
  for (let i = 0; i < 50; i++) {
    const r = rand(4, 22)
    const x = rand(r, width - r)
    const y = rand(r, height - r)
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = randomColor(0.35)
    ctx.fill()
  }

  // squares
  for (let i = 0; i < 50; i++) {
    const s = rand(8, 36)
    const x = rand(0, width - s)
    const y = rand(0, height - s)
    ctx.fillStyle = randomColor(0.35)
    ctx.fillRect(x, y, s, s)
  }

  // lines
  for (let i = 0; i < 50; i++) {
    ctx.beginPath()
    ctx.moveTo(rand(0, width), rand(0, height))
    ctx.lineTo(rand(0, width), rand(0, height))
    ctx.strokeStyle = randomColor(0.6)
    ctx.lineWidth = rand(1, 4)
    ctx.stroke()
  }
}

const rand = (min, max) => min + Math.random() * (max - min)

const randomColor = (alpha = 1) => {
  const r = (Math.random() * 255) | 0
  const g = (Math.random() * 255) | 0
  const b = (Math.random() * 255) | 0
  return `rgba(${r},${g},${b},${alpha})`
}
