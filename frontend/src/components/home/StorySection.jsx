import React, { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScanEye, Brain, ClipboardCheck, BarChart3, Sparkles } from 'lucide-react'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'

gsap.registerPlugin(ScrollTrigger)

const STAGES = [
  {
    n: '01', title: 'IDENTIFY', icon: ScanEye,
    body: 'AI recognizes the waste. Our computer-vision engine analyzes the image the moment it is captured.',
  },
  {
    n: '02', title: 'UNDERSTAND', icon: Brain,
    body: 'The system determines material and recyclability, mapping the object to a specific category with a confidence score.',
  },
  {
    n: '03', title: 'ACT', icon: ClipboardCheck,
    body: 'The user receives clear disposal and recycling guidance — no guesswork about which bin it belongs in.',
  },
  {
    n: '04', title: 'MEASURE', icon: BarChart3,
    body: 'The platform calculates estimated environmental impact from real, logged activity over time.',
  },
  {
    n: '05', title: 'IMPROVE', icon: Sparkles,
    body: 'AI surfaces personalized sustainability recommendations based on patterns in your own data.',
  },
]

export default function StorySection() {
  const containerRef = useRef(null)
  const stageRefs = useRef([])
  const reducedMotion = useReducedMotion()

  useLayoutEffect(() => {
    if (reducedMotion) return undefined

    const ctx = gsap.context(() => {
      stageRefs.current.forEach((el, i) => {
        if (!el) return
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 60 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 75%',
              end: 'top 40%',
              toggleActions: 'play none none reverse',
            },
          }
        )

        const bar = el.querySelector('[data-progress-bar]')
        if (bar) {
          gsap.fromTo(
            bar,
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: el,
                start: 'top 75%',
                end: 'bottom 55%',
                scrub: 0.6,
              },
            }
          )
        }
      })
    }, containerRef)

    return () => ctx.revert()
  }, [reducedMotion])

  return (
    <section ref={containerRef} className="section-pad py-28 relative">
      <div className="max-w-3xl mx-auto text-center mb-20">
        <p className="label-mono text-emerald-400 mb-3">The Process</p>
        <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
          From Waste to Impact
        </h2>
        <p className="text-mist mt-4">
          Every scan moves through the same intelligence pipeline — from recognition to
          measurable environmental outcome.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon
          return (
            <div
              key={stage.n}
              ref={(el) => (stageRefs.current[i] = el)}
              className={`glass-panel p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center ${reducedMotion ? '' : 'opacity-0'}`}
              style={reducedMotion ? undefined : { visibility: 'hidden' }}
            >
              <div className="flex items-center gap-4 md:w-56 shrink-0">
                <span className="font-mono text-3xl text-emerald-400/70">{stage.n}</span>
                <div className="w-11 h-11 rounded-xl bg-emerald-400/10 flex items-center justify-center text-emerald-400">
                  <Icon size={20} />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl font-bold mb-1.5 tracking-wide">{stage.title}</h3>
                <p className="text-mist text-sm md:text-base">{stage.body}</p>
                <div className="mt-4 h-[2px] w-full bg-white/[0.06] overflow-hidden rounded-full">
                  <div
                    data-progress-bar
                    className="h-full w-full bg-gradient-to-r from-emerald-400 to-lime-300 origin-left"
                    style={{ transform: 'scaleX(0)' }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
