"use client";

import type { ComponentProps, CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Oswald, Inter } from "next/font/google";
import { useEffect, useRef } from "react";
import { SCENE_URLS, SEAM_URLS, SPRITES, spriteStyle } from "./descent-assets";
import { bootDescent } from "./descent-engine";
import "./descent.css";

const oswald = Oswald({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-oswald" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" });

function Glow({ l, t, w, cold }: { l: number; t: number; w: number; cold?: boolean }) {
  return (
    <div
      className={`descent-glow${cold ? " cold" : ""}`}
      style={{ left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${w}%` }}
      aria-hidden
    />
  );
}

function Fall(props: ComponentProps<"canvas"> & { kind?: "ghost" | "lava"; speed?: number; seamBody?: boolean }) {
  const { kind = "ghost", speed = 1, seamBody, className = "", style, ...rest } = props;
  return (
    <canvas
      className={`descent-fall ${className}`}
      data-kind={kind}
      data-speed={speed}
      data-seam-body={seamBody ? "1" : "0"}
      style={style}
      aria-hidden
      {...rest}
    />
  );
}

function Dust(props: ComponentProps<"canvas"> & { dust: string; count?: number; speed?: number; box?: [number, number, number, number] }) {
  const { dust, count = 50, speed = 1, box, className = "", style, ...rest } = props;
  return (
    <canvas
      className={`descent-dust ${className}`}
      data-dust={dust}
      data-count={count}
      data-speed={speed}
      data-x={box?.[0]}
      data-y={box?.[1]}
      data-w={box?.[2]}
      data-h={box?.[3]}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", ...style }}
      aria-hidden
      {...rest}
    />
  );
}

function Ghost({ id, l, t, w }: { id: keyof typeof SPRITES; l: number; t: number; w: number }) {
  return (
    <div
      className="descent-ghost"
      data-l={l}
      data-t={t}
      style={{ left: `${l}%`, top: `${t}%`, width: `${w}%`, ...spriteStyle(SPRITES[id]) }}
      aria-hidden
    />
  );
}

function Bat({ y0 }: { y0: number }) {
  return (
    <div
      className="descent-bat"
      data-y0={y0}
      style={{ ...spriteStyle(SPRITES.batUp), width: "2.4%", position: "absolute" }}
      aria-hidden
    />
  );
}

function CopyBlock({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className={`descent-copy ${className ?? ""}`} style={style}>
      {children}
    </div>
  );
}

function Line({ children }: { children: ReactNode }) {
  return (
    <span className="ln">
      <span>{children}</span>
    </span>
  );
}

const HERO_GLOWS: [number, number, number][] = [
  [4.8, 54.4, 4.6],
  [18.5, 50.6, 3.6],
  [17.5, 69.4, 3.8],
  [25.9, 38.3, 2.6],
  [31.6, 42, 2.4],
  [30.4, 63, 2.4],
  [80, 36.7, 3],
  [85, 45.3, 3],
  [93.8, 53, 4.6],
  [87.8, 73, 3.8],
  [74.5, 61, 2.6],
  [67.2, 64.8, 2.6],
];

export function DescentLanding() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    document.documentElement.classList.add("descent-active");
    const ctrl = bootDescent(root);
    return () => {
      ctrl.destroy();
      document.documentElement.classList.remove("descent-active");
    };
  }, []);

  const title = "TRACER";

  return (
    <div ref={rootRef} className={`descent-root ${oswald.variable} ${inter.variable}`}>
      <header className="descent-nav">
        <div className="descent-nav-left">
          <a href="#story">Mechanism</a>
          <a href="#rites">How it works</a>
          <Link href="/markets">Markets</Link>
        </div>
        <Link href="/" className="descent-logo" aria-label="Tracer home">
          <svg width="26" height="24" viewBox="0 0 26 24" aria-hidden>
            <polygon points="13,1 25,23 1,23" fill="#fff" />
            <circle cx="13" cy="15.2" r="3.4" fill="#110A2A" />
            <circle cx="14.4" cy="14.4" r="3" fill="#fff" />
          </svg>
        </Link>
        <div className="descent-nav-right">
          <Link href="/hedge">Hedge</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/markets" className="descent-nav-tickets">
            Browse markets
          </Link>
        </div>
      </header>

      <div className="descent-lamp" aria-hidden />

      <div id="descent-scroller">
        {/* 1 Hero */}
        <section className="descent-scene" id="top" style={{ ["--focus" as string]: 50 }}>
          <div className="descent-art" style={{ ["--img" as string]: `url('${SCENE_URLS[0]}')` }}>
            <div className="descent-bg" />
            <div className="descent-moonglow" style={{ left: "50.2%", top: "25.6%", width: "21%", height: "21%" }} />
            <Fall style={{ left: "47.4%", top: "51%", width: "5.6%", height: "22%" }} />
            <div className="descent-mist" style={{ left: "50%", top: "73%", width: "22%", height: "9%" }} />
            <Fall speed={1.15} style={{ left: "44%", top: "80%", width: "12.4%", height: "34%" }} />
            {HERO_GLOWS.map(([l, t, w], i) => (
              <Glow key={i} l={l} t={t} w={w} />
            ))}
            <Dust dust="wisp" count={70} style={{ inset: 0 }} />
            <Ghost id="ghost1" l={21} t={30} w={4.2} />
            <Ghost id="ghost2" l={78} t={21} w={3.4} />
            <Ghost id="ghost4" l={64} t={44} w={2.8} />
            <Ghost id="ghost3" l={36} t={46} w={2.4} />
            {[12, 18, 24, 30].map((y0) => (
              <Bat key={y0} y0={y0} />
            ))}
          </div>
          <div className="descent-hero-copy">
            <h1>
              {title.split("").map((c, i) => (
                <span key={i} className="ch">
                  {c}
                </span>
              ))}
            </h1>
            <p className="descent-sub">TRACE VOLATILITY · NOT DIRECTION</p>
          </div>
        </section>

        <div className="descent-seam">
          <div className="descent-band" style={{ ["--focus" as string]: 48 }}>
            <Fall
              seamBody
              style={{ left: "44.8%", top: "2%", width: "10.4%", height: "90%", position: "absolute" }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SEAM_URLS[0]} alt="" width={2688} height={1152} />
          </div>
        </div>

        {/* 2 Story / mechanism */}
        <section className="descent-scene" id="story" style={{ ["--focus" as string]: 48 }}>
          <div className="descent-art" style={{ ["--img" as string]: `url('${SCENE_URLS[1]}')` }}>
            <div className="descent-bg" />
            <Fall speed={0.9} style={{ left: "40.6%", top: "0", width: "17.2%", height: "90%" }} />
            <div className="descent-mist" style={{ left: "49%", top: "84%", width: "34%", height: "14%" }} />
            <Glow l={20.3} t={69.8} w={7} cold />
            <Glow l={72.5} t={19} w={5} cold />
            <Glow l={80.4} t={18.1} w={4.4} cold />
            <Glow l={76} t={41.6} w={5.6} cold />
            <Glow l={85} t={43.3} w={4} cold />
            <Glow l={70.5} t={68.5} w={4.4} cold />
            <Glow l={77.3} t={63.7} w={4.4} cold />
            <Glow l={85.3} t={66.3} w={4} cold />
            <Glow l={7.6} t={85} w={4.4} />
            <Glow l={13.2} t={87} w={3.2} />
            <Glow l={92.2} t={84} w={3.6} />
            <Dust dust="mote" count={50} style={{ inset: 0 }} />
            <Ghost id="ghost4" l={30} t={22} w={2.6} />
          </div>
          <CopyBlock style={{ left: "6.5%", top: "26%", width: "31%" }}>
            <h2>
              <Line>Trade volatility,</Line>
              <Line>not direction.</Line>
            </h2>
            <div className="descent-rule" />
            <Line>
              Buy receipts that pay realized variance, or write them from a vault only you own. Both sides quote on chain,
              every unit sold is fully collateralized, and settlement is computed from Chainlink&apos;s own round history.
            </Line>
            <Line>
              Tracer makes ETH realized variance tradable on 1inch Aqua — three SwapVM strategies on the official router, with
              pricing behind TracerMarketEngine.
            </Line>
            <Link href="/docs/about/why-variance" className="descent-btn">
              Why variance
            </Link>
          </CopyBlock>
        </section>

        <div className="descent-seam">
          <div className="descent-band" style={{ ["--focus" as string]: 40 }}>
            <Fall
              seamBody
              style={{ left: "21.4%", top: "22%", width: "10.6%", height: "74%", position: "absolute" }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SEAM_URLS[1]} alt="" width={2688} height={1152} />
          </div>
        </div>

        {/* 3 How it works */}
        <section className="descent-scene" id="rites" style={{ ["--focus" as string]: 40 }}>
          <div className="descent-art" style={{ ["--img" as string]: `url('${SCENE_URLS[2]}')` }}>
            <div className="descent-bg" />
            <Fall speed={1.05} style={{ left: "19.5%", top: "0", width: "18%", height: "38%" }} />
            <div className="descent-mist" style={{ left: "31%", top: "33%", width: "22%", height: "10%" }} />
            <Glow l={12} t={34} w={4.2} />
            <Glow l={37.5} t={47.7} w={4.2} />
            <Glow l={32.3} t={52.6} w={4.2} />
            <Glow l={11.7} t={62.3} w={4.2} />
            <Glow l={39} t={78.2} w={4.2} />
            <Glow l={64.5} t={70.3} w={9} cold />
            <Glow l={88.5} t={70.7} w={9} cold />
            <Glow l={61.4} t={75} w={2.4} />
            <Glow l={72.6} t={75.4} w={2.4} />
            <Glow l={91.5} t={75.4} w={2.4} />
            <Dust dust="spray" count={60} box={[20, 30, 20, 18]} />
          </div>
          <CopyBlock style={{ left: "55%", top: "24%", width: "40%" }}>
            <h2>
              <Line>How it works</Line>
            </h2>
            <div className="descent-rule" />
            <h3>Three SwapVM strategies.</h3>
            <Line>
              Each writer funds a maker vault. VarianceSeriesFactory mints receipt inventory and ships ISSUE, EXIT, and
              SETTLE to canonical Aqua in one transaction — stock programs on the unmodified AquaSwapVMRouter.
            </Line>
            <h3>Quote equals swap.</h3>
            <Line>
              TracerMarketEngine prices every leg; storage updates only outside static calls. Takers approve the router;
              reservations release only when receipts burn on exit or redemption.
            </Line>
          </CopyBlock>
        </section>

        <div className="descent-seam">
          <div className="descent-band" style={{ ["--focus" as string]: 66 }}>
            <Fall
              seamBody
              speed={1}
              style={{ left: "60.8%", top: "46%", width: "13.6%", height: "50%", position: "absolute" }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SEAM_URLS[2]} alt="" width={2688} height={1152} />
          </div>
        </div>

        {/* 4 Markets */}
        <section className="descent-scene" id="night" style={{ ["--focus" as string]: 66 }}>
          <div className="descent-art" style={{ ["--img" as string]: `url('${SCENE_URLS[3]}')` }}>
            <div className="descent-bg" />
            <Fall style={{ left: "67.4%", top: "0", width: "11.8%", height: "37%" }} />
            <Fall kind="lava" speed={0.55} style={{ left: "62.3%", top: "66.5%", width: "1.8%", height: "25%" }} />
            <Fall kind="lava" speed={0.6} style={{ left: "69.4%", top: "66.5%", width: "1.8%", height: "25%" }} />
            <Fall kind="lava" speed={0.5} style={{ left: "76.5%", top: "66.5%", width: "1.8%", height: "25%" }} />
            <Glow l={70} t={93} w={26} />
            <Glow l={16.8} t={78.2} w={6} />
            <Glow l={27.8} t={85.3} w={4} />
            <Glow l={18} t={66.3} w={8} />
            <Glow l={73} t={33} w={14} cold />
            <Dust dust="bubble" count={22} box={[60, 8, 24, 28]} />
          </div>
          <CopyBlock style={{ left: "6.5%", top: "25%", width: "40%" }}>
            <h2>
              <Line>Open series</Line>
            </h2>
            <div className="descent-rule" />
            <h3>Executable quotes.</h3>
            <Line>
              Every market quotes a bid and an ask. The quote rises as inventory sells, falls when holders exit, and decays
              toward the anchor — rows from the Lens, fills from the indexer.
            </Line>
            <h3>Write or buy.</h3>
            <Line>
              Browse live receipts, connect a wallet on the fork or Sepolia manifest, and re-quote on chain before you sign.
              Writers deploy a deterministic vault with no admin and no upgrade path.
            </Line>
            <Link href="/write" className="descent-btn">
              Write a series
            </Link>
          </CopyBlock>
        </section>

        <div className="descent-seam">
          <div className="descent-band" style={{ ["--focus" as string]: 45 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SEAM_URLS[3]} alt="" width={2688} height={1152} />
          </div>
        </div>

        {/* 5 Finale */}
        <section className="descent-scene" id="finale" style={{ ["--focus" as string]: 45 }}>
          <div className="descent-art" style={{ ["--img" as string]: `url('${SCENE_URLS[4]}')` }}>
            <div className="descent-bg" />
            <div className="descent-moonglow" style={{ left: "39.1%", top: "56.6%", width: "19%", height: "19%" }} />
            <Dust dust="shimmer" count={90} box={[34, 69, 10, 22]} />
            <Glow l={29.9} t={76.7} w={3.4} />
            <Glow l={32.9} t={72.7} w={2.4} />
            <Glow l={45.9} t={72.7} w={2.4} />
            <Glow l={48.3} t={77.4} w={3.6} />
            <Glow l={55.4} t={81.8} w={4} />
            <Glow l={58.1} t={75.6} w={3.2} />
            <Glow l={53.9} t={72.2} w={2.2} />
            <Glow l={62.5} t={72.5} w={2.2} />
            <Glow l={69.9} t={80.9} w={4} />
            <Glow l={74.9} t={75.9} w={3.2} />
            <Glow l={73} t={72.3} w={2.2} />
            <Glow l={79.1} t={72.5} w={2.2} />
            <Glow l={24.8} t={72.1} w={2.2} />
            <Glow l={7.8} t={65.4} w={5} />
            <Glow l={89.8} t={76.9} w={5} />
            <Ghost id="ghost2" l={66} t={26} w={3} />
            <Ghost id="ghost1" l={27} t={38} w={2.6} />
            {[26, 32, 38].map((y0) => (
              <Bat key={y0} y0={y0} />
            ))}
          </div>
          <CopyBlock style={{ left: "50%", transform: "translateX(-50%)", top: "30%", width: "60%", textAlign: "center" }}>
            <h2>
              <Line>Loss-versus-rebalancing</Line>
              <Line>is a variance bill.</Line>
            </h2>
            <div className="descent-rule" style={{ marginLeft: "auto", marginRight: "auto", transformOrigin: "center" }} />
            <Line>Pay it forward — estimate notional from V·σ²·T/8, then compare live receipt cost and capacity on Hedge.</Line>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/markets" className="descent-btn">
                Browse markets
              </Link>
              <Link href="/hedge" className="descent-btn ghost">
                Hedge LVR
              </Link>
            </div>
          </CopyBlock>
        </section>
      </div>
    </div>
  );
}
