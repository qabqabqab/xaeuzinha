"use client";

import { useEffect, useState, useRef } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import sdk from "@farcaster/miniapp-sdk";
import styles from "./page.module.css";
import GLBViewer from "../components/GLBViewer";

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

// Stronger rainbow stroke — same as the MINT button. Use for qabqabqab and "more mints" line
function RainbowStrong({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`${styles.rainbowStrong} ${className || ""}`}>{children}</span>;
}

export default function Home() {
  const [sdkReady, setSdkReady] = useState(false);
  const sdkInitialized = useRef(false);
  const [glbUrl, setGlbUrl] = useState<string | null>("/watermelon.glb");
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

  // Init Farcaster SDK — robusto para iOS
  useEffect(() => {
    if (sdkInitialized.current) return;
    sdkInitialized.current = true;

    let resolved = false;

    const markReady = () => {
      if (!resolved) {
        resolved = true;
        setSdkReady(true);
      }
    };

    // Fallback timeout: se o SDK demorar mais de 3s, continua mesmo assim
    const fallbackTimer = setTimeout(markReady, 3000);

    // Tenta chamar sdk.actions.ready() — necessário para o Farcaster remover a splash screen
    const initSdk = async () => {
      try {
        await sdk.actions.ready();
      } catch {
        // Ignora erros — pode falhar fora do contexto Farcaster (browser normal)
      } finally {
        clearTimeout(fallbackTimer);
        markReady();
      }
    };

    // Pequeno delay para garantir que o DOM está pronto no iOS WebKit
    const initTimer = setTimeout(initSdk, 100);

    return () => {
      clearTimeout(fallbackTimer);
      clearTimeout(initTimer);
    };
  }, []);

  // Fetch NFT metadata — try to upgrade to the real GLB from In Process API
  // Falls back silently to the local /watermelon.glb already set in state
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `https://api.inprocess.world/api/moment?collectionAddress=${NFT_COLLECTION}&tokenId=${NFT_TOKEN_ID}&chainId=${CHAIN_ID}`
        );
        if (!res.ok) return;
        const data = await res.json();
        const glb =
          data?.metadata?.content?.uri ||
          data?.metadata?.animation_url ||
          data?.metadata?.model ||
          data?.content?.uri ||
          data?.animation_url;
        const img = data?.metadata?.image || data?.image;
        if (glb) setGlbUrl(glb);   // upgrade to remote only if found
        if (img) setPosterUrl(img);
      } catch {}

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
          Win a <RainbowStrong>qabqabqab</RainbowStrong>
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
        <p className={styles.subtitle}><RainbowStrong>more mints = more chances.</RainbowStrong></p>
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
        {glbUrl && <GLBViewer src={glbUrl} width={300} height={300} />}
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
            // iOS: evita auto-focus e evita abrir teclado ao carregar
            autoFocus={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
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
            inputMode="numeric"
            pattern="[0-9]*"
            min={1}
            className={styles.customInput}
            placeholder="How many?"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            autoFocus={false}
            autoComplete="off"
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
