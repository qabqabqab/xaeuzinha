"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import sdk from "@farcaster/miniapp-sdk";
import styles from "./page.module.css";

const NFT_COLLECTION = "0x3a005d81ec81f9f48f973c433206ca7ef907721a";
const NFT_TOKEN_ID = "4";
const CHAIN_ID = 8453;
const IN_PROCESS_URL = `https://www.inprocess.world/collect/base:${NFT_COLLECTION}/${NFT_TOKEN_ID}`;

type Comment = { id: string; sender: string; username: string; comment: string; timestamp: number };
type Collector = { id: string; collector: string; username: string; amount: number; transactionHash: string; timestamp: number };
type MintAmount = 1 | 3 | 7 | "custom";

// Rainbow animated text rendered as a styled span
function RainbowText({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`${styles.rainbowAnimated} ${className || ""}`}>{children}</span>;
}

export default function Home() {
  const [sdkReady, setSdkReady] = useState(false);
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [mintAmount, setMintAmount] = useState<MintAmount>(1);
  const [customAmount, setCustomAmount] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [txHash, setTxHash] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Init Farcaster SDK
  useEffect(() => {
    const t = setTimeout(() => setSdkReady(true), 2000);
    sdk.actions.ready().catch(() => {}).finally(() => { clearTimeout(t); setSdkReady(true); });
  }, []);

  // Load model-viewer web component
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!document.querySelector('script[src*="model-viewer"]')) {
      const s = document.createElement("script");
      s.type = "module";
      s.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js";
      document.head.appendChild(s);
    }
  }, []);

  // Fetch NFT metadata — extract GLB from content.uri
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `https://api.inprocess.world/api/moment?collectionAddress=${NFT_COLLECTION}&tokenId=${NFT_TOKEN_ID}&chainId=${CHAIN_ID}`
        );
        if (!res.ok) return;
        const data = await res.json();

        // Try multiple known paths for GLB/GLTF in In Process API responses
        const glb =
          data?.metadata?.content?.uri ||
          data?.metadata?.animation_url ||
          data?.metadata?.model ||
          data?.content?.uri ||
          data?.animation_url ||
          data?.model ||
          // sometimes it's nested under "asset"
          data?.asset?.uri ||
          data?.metadata?.asset?.uri ||
          null;

        const img =
          data?.metadata?.image ||
          data?.image ||
          data?.metadata?.thumbnail ||
          null;

        if (glb) setGlbUrl(glb);
        if (img) setPosterUrl(img);

        // Debug: log full response so you can inspect the real shape
        if (!glb) {
          console.warn("[xaeuzinha] GLB not found. Full API response:", JSON.stringify(data, null, 2));
          // Fallback to local GLB file
          setGlbUrl("/watermelon.glb");
        }
      } catch (e) {
        console.error("[xaeuzinha] Failed to fetch NFT metadata:", e);
        // Fallback to local GLB file
        setGlbUrl("/watermelon.glb");
      }
    })();
  }, []);

  const fetchComments = async () => {
    try {
      const r = await fetch(`https://api.inprocess.world/api/moment/comments?collectionAddress=${NFT_COLLECTION}&tokenId=${NFT_TOKEN_ID}&chainId=${CHAIN_ID}`);
      if (r.ok) setComments((await r.json()).comments || []);
    } catch {}
  };

  const fetchCollectors = async () => {
    try {
      const r = await fetch(`https://api.inprocess.world/api/moment/collectors?collectionAddress=${NFT_COLLECTION}&tokenId=${NFT_TOKEN_ID}&chainId=${CHAIN_ID}`);
      if (r.ok) setCollectors((await r.json()).collectors || []);
    } catch {}
  };

  useEffect(() => { fetchComments(); fetchCollectors(); }, []);

  const getAmount = () => mintAmount === "custom" ? (parseInt(customAmount) || 1) : mintAmount;

  const handleConnect = () => { if (connectors[0]) connect({ connector: connectors[0] }); };

  const handleMint = async () => {
    if (!isConnected) { handleConnect(); return; }
    const amount = getAmount();
    setStatus("loading"); setErrorMsg("");
    try {
      const res = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionAddress: NFT_COLLECTION, tokenId: NFT_TOKEN_ID, chainId: CHAIN_ID, amount, comment: comment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "error");
      setTxHash(data.hash || "");
      setStatus("success");
      setComment("");
      setTimeout(() => { fetchComments(); fetchCollectors(); }, 3000);
    } catch {
      // Fallback: open In•Process
      try { await sdk.actions.openUrl(IN_PROCESS_URL); } catch { window.open(IN_PROCESS_URL, "_blank"); }
      setStatus("idle");
    }
  };

  const effectiveAmount = getAmount();

  return (
    <main className={styles.main}>
      {/* Connect wallet button */}
      <div className={styles.headerRow}>
        {isConnected ? (
          <button className={styles.walletBtn} onClick={() => disconnect()}>
            {address?.slice(0, 6)}…{address?.slice(-4)}
          </button>
        ) : (
          <button className={styles.walletBtn} onClick={handleConnect}>connect wallet</button>
        )}
      </div>

      {/* Title with proper stroke */}
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>
          Win a <RainbowText>qabqabqab</RainbowText>
          <br />ceramic piece 🎁
        </h1>
      </div>

      {/* Subtitle */}
      <div className={styles.subtitleBlock}>
        <p className={styles.subtitle}>
          Mint <span className={styles.colorCyan}>1x</span> for a chance to receive
          <br />&apos;xaeuzinha&apos; at home.
        </p>
        <p className={styles.subtitle}>
          Mint <span className={styles.colorGreen}>2x</span>,{" "}
          <span className={styles.colorGreen}>3x</span> or{" "}
          <span className={styles.colorGreen}>99x</span> to
          <br />increase your chances!!!
        </p>
        <p className={`${styles.subtitle} ${styles.rainbowAnimated}`}>more mints = more chances.</p>
      </div>

      {/* Body copy */}
      <div className={styles.bodyText}>
        <p>&apos;xaeuzinha&apos; is the final outcome of noun.wtf Grant #29. Hand-sculpted and created specifically for this occasion, it offers a chance for someone to own one of my works at an accessible price, starting at 1 USD.</p>
        <br />
        <p>To participate, simply collect the piece and drop your Farcaster username in the comments.</p>
        <br />
        <p>The results will be announced on May 15. I&apos;ll reach out if you&apos;re selected as the winner.</p>
      </div>

      {/* 3D GLB viewer */}
      <div className={styles.modelWrap}>
        <div className={styles.modelInner}>
          {glbUrl ? (
            // @ts-ignore
            <model-viewer
              src={glbUrl}
              poster={posterUrl || undefined}
              alt="xaeuzinha ceramic sculpture"
              auto-rotate
              camera-controls
              shadow-intensity="0.5"
              touch-action="pan-y"
              loading="lazy"
              style={{ width: "100%", height: "100%", background: "transparent" }}
            />
          ) : (
            <div className={styles.modelPlaceholder}>
              <div className={styles.modelSpinner} />
              <p className={styles.modelLoadingText}>loading 3D model…</p>
            </div>
          )}
        </div>
      </div>

      {/* Interaction card */}
      <div className={styles.card}>
        {/* Comment */}
        <div className={styles.commentSection}>
          <label className={styles.commentLabel}>Comment Section</label>
          <textarea
            className={styles.commentArea}
            placeholder="don't forget to leave your @username"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            maxLength={280}
          />
          <div className={styles.commentUnderline} />
        </div>

        {/* Quantity buttons */}
        <div className={styles.amountGrid}>
          {([1, 3, 7] as const).map((v) => (
            <button
              key={v}
              className={`${styles.amountBtn} ${mintAmount === v ? styles.amountBtnActive : ""}`}
              onClick={() => setMintAmount(v)}
            >{v}x</button>
          ))}
          <button
            className={`${styles.amountBtn} ${mintAmount === "custom" ? styles.amountBtnCustomActive : ""}`}
            onClick={() => setMintAmount("custom")}
          >
            <RainbowText className={styles.customBtnText}>custom</RainbowText>
          </button>
        </div>

        {/* Custom input */}
        {mintAmount === "custom" && (
          <input
            type="number"
            min={1}
            className={styles.customInput}
            placeholder="How many?"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
          />
        )}

        {/* Status */}
        {status === "error" && <p className={styles.errorMsg}>{errorMsg || "Something went wrong."}</p>}
        {status === "success" && (
          <div className={styles.successBox}>
            <p>Successfully collected! 🎉</p>
            {txHash && (
              <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className={styles.txLink}>
                View transaction ↗
              </a>
            )}
          </div>
        )}

        {/* MINT button */}
        <button
          className={styles.mintBtn}
          onClick={() => status === "success" ? setStatus("idle") : handleMint()}
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <span className={styles.dots}><span /><span /><span /></span>
          ) : (
            <RainbowText className={styles.mintBtnText}>
              {status === "success" ? "MINT MORE" : isConnected ? `MINT` : "MINT"}
            </RainbowText>
          )}
        </button>

        {/* Community / comments */}
        <div className={styles.community}>
          <h3 className={styles.communityTitle}>
            Community
            <span className={styles.communityCount}>{collectors.length} collectors</span>
          </h3>

          {comments.length === 0 ? (
            <p className={styles.emptyState}>Be the first to comment!</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className={styles.commentCard}>
                <div className={styles.commentCardTop}>
                  <span className={styles.commentUser}>{c.username ? `@${c.username}` : c.sender.slice(0,6) + "…"}</span>
                  <span className={styles.commentDate}>{new Date(c.timestamp * 1000).toLocaleDateString()}</span>
                </div>
                <p className={styles.commentContent}>{c.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <footer className={styles.footer}>THANK YOU, ILY &lt;3</footer>
    </main>
  );
}
