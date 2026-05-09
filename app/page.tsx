"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import sdk from "@farcaster/miniapp-sdk";
import styles from "./page.module.css";

// ===== CONFIGURE YOUR NFT HERE =====
const NFT_COLLECTION = "0x9b1acd279e13115742e92cda0baccb02384f4a79";
const NFT_TOKEN_ID = "4";
const CHAIN_ID = 8453;
// ====================================

const IN_PROCESS_URL = `https://www.inprocess.world/collect/base:${NFT_COLLECTION}/${NFT_TOKEN_ID}`;
const NFT_IMAGE = `https://api.inprocess.world/api/og/moment?collectionAddress=${NFT_COLLECTION}&tokenId=${NFT_TOKEN_ID}&chainId=${CHAIN_ID}`;
const API_BASE = "https://api.inprocess.world/api";

type MomentData = {
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
  };
  saleConfig?: {
    pricePerToken?: string;
    type?: string;
  };
};

type CollectStatus = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [moment, setMoment] = useState<MomentData | null>(null);
  const [collectStatus, setCollectStatus] = useState<CollectStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Initialize Farcaster SDK
  useEffect(() => {
    const initSDK = async () => {
      try {
        await sdk.actions.ready();
        setIsSDKLoaded(true);
      } catch {
        // Running outside Farcaster - still show the page
        setIsSDKLoaded(true);
      }
    };
    initSDK();
  }, []);

  // Fetch NFT data
  useEffect(() => {
    const fetchMoment = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/moment?collectionAddress=${NFT_COLLECTION}&tokenId=${NFT_TOKEN_ID}&chainId=${CHAIN_ID}`
        );
        if (res.ok) {
          const data = await res.json();
          setMoment(data);
        }
      } catch {
        // Use fallback data if API fails
        console.log("Using fallback NFT data");
      }
    };
    fetchMoment();
  }, []);

  const handleConnect = () => {
    if (connectors[0]) {
      connect({ connector: connectors[0] });
    }
  };

  const handleCollect = async () => {
    if (!isConnected) {
      handleConnect();
      return;
    }

    setCollectStatus("loading");
    setErrorMessage("");

    try {
      // Open in In_Process directly for collection
      // This opens the native collect flow in the Farcaster client
      await sdk.actions.openUrl(IN_PROCESS_URL);
      setCollectStatus("success");
    } catch (err) {
      // Fallback: open URL in browser
      window.open(IN_PROCESS_URL, "_blank");
      setCollectStatus("idle");
    }
  };

  const handleViewOnInProcess = async () => {
    try {
      await sdk.actions.openUrl(IN_PROCESS_URL);
    } catch {
      window.open(IN_PROCESS_URL, "_blank");
    }
  };

  const formatPrice = (priceInWei?: string) => {
    if (!priceInWei) return "Free";
    const eth = Number(BigInt(priceInWei)) / 1e18;
    if (eth === 0) return "Free";
    return `${eth.toFixed(4)} ETH`;
  };

  const nftName = moment?.metadata?.name || "Untitled Moment";
  const nftDescription = moment?.metadata?.description || "A moment on the In•Process protocol.";
  const nftImage = moment?.metadata?.image || NFT_IMAGE;
  const price = formatPrice(moment?.saleConfig?.pricePerToken);

  if (!isSDKLoaded) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <main className={styles.main}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.protocol}>in•process</span>
        </div>
        <div className={styles.headerRight}>
          {isConnected ? (
            <button className={styles.walletBtn} onClick={() => disconnect()}>
              {address?.slice(0, 6)}…{address?.slice(-4)}
            </button>
          ) : (
            <button className={styles.walletBtn} onClick={handleConnect}>
              Connect
            </button>
          )}
        </div>
      </header>

      {/* NFT Card */}
      <div className={styles.card}>
        {/* Image */}
        <div className={styles.imageWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={nftImage}
            alt={nftName}
            className={styles.nftImage}
            onError={(e) => {
              (e.target as HTMLImageElement).src = NFT_IMAGE;
            }}
          />
        </div>

        {/* Info */}
        <div className={styles.info}>
          <div className={styles.badge}>Moment #{NFT_TOKEN_ID}</div>
          <h1 className={styles.title}>{nftName}</h1>
          <p className={styles.description}>{nftDescription}</p>

          <div className={styles.divider} />

          <div className={styles.priceRow}>
            <span className={styles.priceLabel}>Price</span>
            <span className={styles.priceValue}>{price}</span>
          </div>

          {collectStatus === "success" ? (
            <div className={styles.successBox}>
              <span className={styles.successIcon}>✓</span>
              <span>Collect page opened!</span>
            </div>
          ) : collectStatus === "error" ? (
            <div className={styles.errorBox}>
              <p>{errorMessage || "Something went wrong. Try again."}</p>
              <button
                className={styles.retryBtn}
                onClick={() => setCollectStatus("idle")}
              >
                Try again
              </button>
            </div>
          ) : (
            <button
              className={styles.collectBtn}
              onClick={handleCollect}
              disabled={collectStatus === "loading"}
            >
              {collectStatus === "loading" ? (
                <span className={styles.btnLoading}>
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </span>
              ) : isConnected ? (
                "Collect"
              ) : (
                "Connect & Collect"
              )}
            </button>
          )}

          <button
            className={styles.viewBtn}
            onClick={handleViewOnInProcess}
          >
            View on In•Process ↗
          </button>
        </div>
      </div>

      {txHash && (
        <div className={styles.txRow}>
          <a
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.txLink}
          >
            View transaction ↗
          </a>
        </div>
      )}
    </main>
  );
}
