import { createPublicClient, http, formatEther, type Address } from "viem";
import { base } from "viem/chains";

export const baseClient = createPublicClient({
  chain: base,
  transport: http("https://mainnet.base.org"),
});

export interface WalletStats {
  address: Address;
  balanceEth: number;
  txCount: number;
  blockNumber: bigint;
  firstSeenBlock: number | null;
  walletAgeDays: number | null;
  isContract: boolean;
}

// Binary search for first block where account has any nonce/code/balance.
// Approximate wallet age — good enough for an MVP without a full indexer.
async function findFirstActivityBlock(
  address: Address,
  currentBlock: bigint,
): Promise<number | null> {
  let lo = 0n;
  let hi = currentBlock;
  let found: bigint | null = null;
  // limit iterations
  for (let i = 0; i < 30 && lo <= hi; i++) {
    const mid = (lo + hi) / 2n;
    try {
      const [nonce, bal] = await Promise.all([
        baseClient.getTransactionCount({ address, blockNumber: mid }),
        baseClient.getBalance({ address, blockNumber: mid }),
      ]);
      if (nonce > 0 || bal > 0n) {
        found = mid;
        hi = mid - 1n;
      } else {
        lo = mid + 1n;
      }
    } catch {
      break;
    }
  }
  return found ? Number(found) : null;
}

export async function fetchWalletStats(address: Address): Promise<WalletStats> {
  const [balance, txCount, blockNumber, code] = await Promise.all([
    baseClient.getBalance({ address }),
    baseClient.getTransactionCount({ address }),
    baseClient.getBlockNumber(),
    baseClient.getCode({ address }).catch(() => undefined),
  ]);

  const firstSeenBlock = await findFirstActivityBlock(address, blockNumber);

  let walletAgeDays: number | null = null;
  if (firstSeenBlock !== null) {
    try {
      const block = await baseClient.getBlock({ blockNumber: BigInt(firstSeenBlock) });
      const firstTs = Number(block.timestamp) * 1000;
      walletAgeDays = Math.max(0, Math.floor((Date.now() - firstTs) / 86_400_000));
    } catch {
      // ignore
    }
  }

  return {
    address,
    balanceEth: Number(formatEther(balance)),
    txCount,
    blockNumber,
    firstSeenBlock,
    walletAgeDays,
    isContract: !!code && code !== "0x",
  };
}

// Weighted reputation engine. Inputs are bounded with diminishing returns
// so a brand new wallet scores low and a long-lived active wallet caps near 1000.
export interface ScoreBreakdown {
  total: number;
  tier: { label: string; color: string };
  parts: {
    age: number;
    activity: number;
    nft: number;
    defi: number;
    diversity: number;
  };
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function computeScore(stats: WalletStats): ScoreBreakdown {
  // Age: cap at 365 days for full marks
  const age = clamp01((stats.walletAgeDays ?? 0) / 365) * 200;
  // Activity: log scale, 500 tx ~= full
  const activity =
    clamp01(Math.log10((stats.txCount || 0) + 1) / Math.log10(500)) * 250;
  // NFT & DeFi are unavailable from RPC alone — derive proxy from balance + tx mix.
  const balanceFactor = clamp01(Math.log10(stats.balanceEth + 1) / Math.log10(5));
  const nft = balanceFactor * 200 * 0.6 + clamp01(stats.txCount / 200) * 200 * 0.4;
  const defi = balanceFactor * 250 * 0.7 + clamp01(stats.txCount / 300) * 250 * 0.3;
  // Diversity proxy: ratio of tx count to age (txns/day) tells us consistency
  const txPerDay = stats.walletAgeDays && stats.walletAgeDays > 0
    ? stats.txCount / stats.walletAgeDays
    : 0;
  const diversity = clamp01(txPerDay / 2) * 100;

  const total = Math.round(age + activity + nft + defi + diversity);

  const tier =
    total >= 801
      ? { label: "Base OG", color: "premium" }
      : total >= 601
      ? { label: "Advanced User", color: "accent" }
      : total >= 301
      ? { label: "Explorer", color: "primary" }
      : { label: "Beginner", color: "muted-foreground" };

  return {
    total,
    tier,
    parts: {
      age: Math.round(age),
      activity: Math.round(activity),
      nft: Math.round(nft),
      defi: Math.round(defi),
      diversity: Math.round(diversity),
    },
  };
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  earned: boolean;
  icon: string;
}

export function computeBadges(stats: WalletStats, score: ScoreBreakdown): Badge[] {
  return [
    {
      id: "early",
      label: "Early Adopter",
      description: "Wallet active for over 180 days on Base",
      earned: (stats.walletAgeDays ?? 0) >= 180,
      icon: "🌱",
    },
    {
      id: "power",
      label: "Power User",
      description: "More than 200 transactions",
      earned: stats.txCount >= 200,
      icon: "⚡",
    },
    {
      id: "defi",
      label: "DeFi Explorer",
      description: "Strong DeFi engagement signal",
      earned: score.parts.defi >= 150,
      icon: "💧",
    },
    {
      id: "nft",
      label: "NFT Collector",
      description: "Onchain collector signal",
      earned: score.parts.nft >= 120,
      icon: "🖼️",
    },
    {
      id: "og",
      label: "Base OG",
      description: "Score of 801 or higher",
      earned: score.total >= 801,
      icon: "👑",
    },
    {
      id: "consistent",
      label: "Consistent",
      description: "Active multiple times per day on average",
      earned: score.parts.diversity >= 50,
      icon: "📈",
    },
  ];
}
