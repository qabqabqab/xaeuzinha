"use client";

import { useEffect, useState, useRef } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import sdk from "@farcaster/miniapp-sdk";
import styles from "./page.module.css";

// ===== NFT CONFIG =====
const NFT_COLLECTION = "0x3a005d81ec81f9f48f973c433206ca7ef907721a";
const NFT_TOKEN_ID = "4";
const CHAIN_ID = 8453;
const IN_PROCESS_URL = `https://www.inprocess.world/collect/base:${NFT_COLLECTION}/${NFT_TOKEN_ID}`;
// ======================

type Comment = {
  id: string;
  sender: string;
  username: string;
  comment: string;
  timestamp: number;
};

type Collector = {
  id: string;
  collector: string;
  username: string;
  amount: number;
  transactionHash: string;
  timestamp: number;
};

type MintAmount = 1 | 3 | 7 | "custom";

export default function Home() {
  const [sdkReady, setSdkReady] = useState(false);
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [mintAmount, setMintAmount] = useState<MintAmount>(1);
  const [customAmount, setCustomAmount] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [txHash, setTxHash] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const modelRef = useRef<HTMLElement | null>(null);

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Init SDK
  useEffect(() => {
    sdk.actions.ready().catch(() => {}).finally(() => setSdkReady(true));
  }, []);

  // Load model-viewer script
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!document.querySelector('script[src*="model-viewer"]')) {
      const script = document.createElement("script");
      script.type = "module";
      script.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js";
      document.head.appendChild(script);
    }
  }, []);

  // Fetch NFT info to get GLB url
  useEffect(() => {
    const fetchMoment = async () => {
      try {
        const res = await fetch(
          `https://api.inprocess.world/api/moment?collectionAddress=${NFT_COLLECTION}&tokenId=${NFT_TOKEN_ID}&chainId=${CHAIN_ID}`
        );
        if (!res.ok) return;
        const data = await res.json();
        // content.uri is the GLB, metadata.image is the poster
        const contentUri = data?.metadata?.content?.uri;
        if (contentUri) setGlbUrl(contentUri);
      } catch {
        console.log("Could not fetch moment info");
      }
    };
    fetchMoment();
  }, []);

  // Fetch comments
  const fetchComments = async () => {
    try {
      const res = await fetch(
        `https://api.inprocess.world/api/moment/comments?collectionAddress=${NFT_COLLECTION}&tokenId=${NFT_TOKEN_ID}&chainId=${CHAIN_ID}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setComments(data.comments || []);
    } catch {}
  };

  // Fetch collectors
  const fetchCollectors = async () => {
    try {
      const res = await fetch(
        `https://api.inprocess.world/api/moment/collectors?collectionAddress=${NFT_COLLECTION}&tokenId=${NFT_TOKEN_ID}&chainId=${CHAIN_ID}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setCollectors(data.collectors || []);
    } catch {}
  };

  useEffect(() => {
    fetchComments();
    fetchCollectors();
  }, []);

  const getAmount = (): number => {
    if (mintAmount === "custom") return parseInt(customAmount) || 1;
    return mintAmount;
  };

  const handleConnect = () => {
    if (connectors[0]) connect({ connector: connectors[0] });
  };

  const handleMint = async () => {
    if (!isConnected) {
      handleConnect();
      return;
    }

    const amount = getAmount();
    if (isNaN(amount) || amount < 1) {
      setErrorMsg("Por favor insira uma quantidade válida.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      // Call In•Process collect API via our proxy route (avoids CORS + keeps API key server-side)
      const res = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionAddress: NFT_COLLECTION,
          tokenId: NFT_TOKEN_ID,
          chainId: CHAIN_ID,
          amount,
          comment: comment.trim(),
          walletAddress: address,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao coletar. Tente novamente.");
      }

      setTxHash(data.hash || "");
      setStatus("success");
      setComment("");
      // Refresh comments and collectors
      setTimeout(() => {
        fetchComments();
        fetchCollectors();
      }, 3000);
    } catch (err: unknown) {
      // Fallback: open In•Process directly
      try {
        await sdk.actions.openUrl(IN_PROCESS_URL);
        setStatus("idle");
      } catch {
        window.open(IN_PROCESS_URL, "_blank");
        setStatus("idle");
      }
    }
  };

  const effectiveAmount = getAmount();

  return (
    <main className={styles.main}>
      {/* Header: connect wallet button */}
      <div className={styles.headerRow}>
        {isConnected ? (
          <button className={styles.walletBtn} onClick={() => disconnect()}>
            {address?.slice(0, 6)}…{address?.slice(-4)}
          </button>
        ) : (
          <button className={styles.walletBtn} onClick={handleConnect}>
            connect wallet
          </button>
        )}
      </div>

      {/* Title */}
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>
          Win a <span className={styles.rainbow}>qabqabqab</span>
          <br />ceramic piece 🎁
        </h1>
      </div>

      {/* Subtitle lines */}
      <div className={styles.subtitleBlock}>
        <p className={styles.subtitle}>
          Mint <span className={styles.colorGreen}>1x</span> for a chance to receive
          <br />&apos;xaeuzinha&apos; at home.
        </p>
        <p className={styles.subtitle}>
          Mint <span className={styles.colorGreen}>2x</span>,{" "}
          <span className={styles.colorBlue}>3x</span> or{" "}
          <span className={styles.colorRed}>99x</span> to
          <br />increase your chances!!!
        </p>
        <p className={styles.subtitleRainbow}>
          more mints = more chances.
        </p>
      </div>

      {/* Body text */}
      <div className={styles.bodyText}>
        <p>
          &apos;xaeuzinha&apos; is the final outcome of noun.wtf Grant #29.
          Hand-sculpted and created specifically for this occasion,
          it offers a chance for someone to own one of my works
          at an accessible price, starting at 1 USD.
        </p>
        <br />
        <p>
          To participate, simply collect the piece and drop your
          Farcaster username in the comments.
        </p>
        <br />
        <p>
          The results will be announced on May 15. I&apos;ll reach out if
          you&apos;re selected as the winner.
        </p>
      </div>

      {/* GLB 3D Viewer */}
      <div className={styles.modelContainer}>
        {glbUrl ? (
          // @ts-ignore — model-viewer is a custom element
          <model-viewer
            ref={modelRef}
            src={glbUrl}
            auto-rotate
            camera-controls
            shadow-intensity="0"
            exposure="1"
            style={{ width: "100%", height: "100%", background: "transparent" }}
            poster={`https://api.inprocess.world/api/og/moment?collectionAddress=${NFT_COLLECTION}&tokenId=${NFT_TOKEN_ID}&chainId=${CHAIN_ID}`}
          />
        ) : (
          <div className={styles.modelPlaceholder}>
            <div className={styles.modelLoader} />
          </div>
        )}
      </div>

      {/* Comment box */}
      <div className={styles.commentCard}>
        <p className={styles.commentLabel}>Comment</p>
        <textarea
          className={styles.commentArea}
          placeholder="leave your @username here"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={280}
        />
      </div>

      {/* Amount buttons */}
      <div className={styles.amountRow}>
        {([1, 3, 7, "custom"] as MintAmount[]).map((val) => (
          <button
            key={String(val)}
            className={`${styles.amountBtn} ${mintAmount === val ? styles.amountBtnActive : ""}`}
            onClick={() => setMintAmount(val)}
          >
            {val === "custom" ? "custom" : `${val}x`}
          </button>
        ))}
      </div>

      {/* Custom amount input */}
      {mintAmount === "custom" && (
        <div className={styles.customRow}>
          <input
            type="number"
            min={1}
            className={styles.customInput}
            placeholder="how many?"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
          />
        </div>
      )}

      {/* Status messages */}
      {status === "error" && (
        <p className={styles.errorMsg}>{errorMsg || "Algo deu errado. Tente novamente."}</p>
      )}
      {status === "success" && (
        <div className={styles.successMsg}>
          <p>✓ Coletado com sucesso!</p>
          {txHash && (
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.txLink}
              onClick={() => sdk.actions.openUrl(`https://basescan.org/tx/${txHash}`).catch(() => {})}
            >
              Ver transação ↗
            </a>
          )}
        </div>
      )}

      {/* MINT button */}
      <div className={styles.mintRow}>
        <button
          className={styles.mintBtn}
          onClick={() => {
            if (status === "success") setStatus("idle");
            else handleMint();
          }}
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <span className={styles.dots}>
              <span />
              <span />
              <span />
            </span>
          ) : status === "success" ? (
            "MINT MORE"
          ) : isConnected ? (
            `MINT ${effectiveAmount > 1 ? effectiveAmount + "x" : ""}`
          ) : (
            "MINT"
          )}
        </button>
      </div>

      {/* Comments section */}
      {comments.length > 0 && (
        <div className={styles.commentsSection}>
          <h3 className={styles.sectionTitle}>Comments ({comments.length})</h3>
          {comments.map((c) => (
            <div key={c.id} className={styles.commentItem}>
              <span className={styles.commentUser}>
                {c.username ? `@${c.username}` : c.sender.slice(0, 8) + "…"}
              </span>
              <p className={styles.commentText}>{c.comment}</p>
              <span className={styles.commentTime}>
                {new Date(c.timestamp * 1000).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Collectors section */}
      {collectors.length > 0 && (
        <div className={styles.collectorsSection}>
          <h3 className={styles.sectionTitle}>Collectors ({collectors.length})</h3>
          {collectors.map((c) => (
            <div key={c.id} className={styles.collectorItem}>
              <span className={styles.commentUser}>
                {c.username ? `@${c.username}` : c.collector.slice(0, 8) + "…"}
              </span>
              <span className={styles.collectorAmount}>{c.amount}x</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.bottomPad} />
    </main>
  );
}
