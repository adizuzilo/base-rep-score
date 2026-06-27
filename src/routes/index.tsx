import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  Award,
  Copy,
  Share2,
  Sparkles,
  TrendingUp,
  Wallet,
  Loader2,
  Trophy,
  Layers,
  Droplet,
  Calendar,
} from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import type { Address } from "viem";

import { useWallet } from "@/hooks/use-wallet";
import {
  computeBadges,
  computeScore,
  fetchWalletStats,
  type ScoreBreakdown,
  type WalletStats,
  type Badge,
} from "@/lib/reputation";
import { ScoreGauge } from "@/components/score-gauge";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BaseRep — Onchain Reputation for Base" },
      {
        name: "description",
        content:
          "Connect your Base wallet to get an onchain reputation score, activity analytics, badges, and leaderboard ranking.",
      },
      { property: "og:title", content: "BaseRep — Onchain Reputation for Base" },
      {
        property: "og:description",
        content:
          "Your trusted reputation layer for the Base ecosystem. Analyze, score, and showcase your onchain identity.",
      },
      { property: "og:url", content: "https://base-rep-score.lovable.app/" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: "https://base-rep-score.lovable.app/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "BaseRep",
          url: "https://base-rep-score.lovable.app/",
          description:
            "Onchain reputation and profile scoring system for wallets on the Base network.",
          publisher: {
            "@type": "Organization",
            name: "BaseRep",
            url: "https://base-rep-score.lovable.app/",
          },
        }),
      },
    ],
  }),
  component: HomePage,
});

const LEADERBOARD = [
  { addr: "0x7a25...d8e1", score: 962, tier: "Base OG" },
  { addr: "0x4c0a...91bb", score: 918, tier: "Base OG" },
  { addr: "0xae31...02f7", score: 874, tier: "Base OG" },
  { addr: "0x18df...6c10", score: 803, tier: "Base OG" },
  { addr: "0x5511...77a2", score: 762, tier: "Advanced" },
  { addr: "0xee9c...c4b9", score: 701, tier: "Advanced" },
];

function shorten(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function HomePage() {
  const { address, connect, disconnect, connecting, error } = useWallet();
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  async function analyze(addr: Address) {
    setLoading(true);
    setLoadErr(null);
    try {
      const s = await fetchWalletStats(addr);
      const sc = computeScore(s);
      setStats(s);
      setScore(sc);
      setBadges(computeBadges(s, sc));
    } catch (e) {
      setLoadErr((e as Error).message || "Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (address) analyze(address);
    else {
      setStats(null);
      setScore(null);
      setBadges([]);
    }
  }, [address]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Toaster theme="dark" position="top-right" />

      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-base-blue to-base-violet shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">BaseRep</div>
            <div className="text-xs text-muted-foreground">
              Onchain reputation · Base mainnet
            </div>
          </div>
        </div>
        {address ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(address);
                toast.success("Address copied");
              }}
              className="glass flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition hover:scale-[1.02]"
              aria-label="Copy wallet address"
            >
              <Wallet className="h-4 w-4" />
              <span className="font-mono">{shorten(address)}</span>
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <Button variant="ghost" size="sm" onClick={disconnect}>
              Disconnect
            </Button>
          </div>
        ) : null}
      </header>

      {!address ? (
        /* Hero / Connect */
        <section className="mt-20 flex flex-col items-center text-center">
          <div className="glass-strong inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            Live on Base Mainnet
          </div>
          <h1 className="mt-6 max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
            Your <span className="text-gradient">onchain reputation</span>,
            quantified.
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Connect your Base wallet to generate a verifiable reputation score
            from your transactions, holdings, and ecosystem participation.
          </p>
          <Button
            size="lg"
            onClick={connect}
            disabled={connecting}
            className="mt-8 h-12 rounded-xl bg-gradient-to-r from-base-blue to-base-violet px-8 text-base font-semibold shadow-xl shadow-violet-900/30 transition hover:scale-[1.03] hover:shadow-2xl"
          >
            {connecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting…
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
              </>
            )}
          </Button>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <div className="mt-16 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                icon: TrendingUp,
                title: "Reputation Score",
                desc: "Weighted 0–1000 score from age, activity, NFTs, DeFi & diversity.",
              },
              {
                icon: Activity,
                title: "Activity Analytics",
                desc: "Transactions, balance, wallet age and consistency at a glance.",
              },
              {
                icon: Award,
                title: "Badges & Leaderboard",
                desc: "Earn milestones and showcase your tier against the community.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="glass rounded-2xl p-6 text-left transition hover:scale-[1.02]"
              >
                <f.icon className="h-6 w-6 text-base-violet" />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      ) : loading || !stats || !score ? (
        <div className="mt-32 flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-base-violet" />
          <p className="text-sm">Analyzing your onchain footprint on Base…</p>
          <p className="text-xs">This may take a few seconds.</p>
          {loadErr && <p className="text-sm text-destructive">{loadErr}</p>}
        </div>
      ) : (
        <Dashboard
          stats={stats}
          score={score}
          badges={badges}
          onShare={() => {
            const text = `My BaseRep score is ${score.total}/1000 — ${score.tier.label} on @base. Check yours:`;
            const url = window.location.href;
            window.open(
              `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
              "_blank",
            );
          }}
        />
      )}

      <footer className="mt-20 border-t border-white/5 pt-6 text-center text-xs text-muted-foreground">
        Built for the Base ecosystem · Data fetched live from Base mainnet RPC
      </footer>
    </main>
  );
}

function Dashboard({
  stats,
  score,
  badges,
  onShare,
}: {
  stats: WalletStats;
  score: ScoreBreakdown;
  badges: Badge[];
  onShare: () => void;
}) {
  const breakdown = [
    { name: "Age", value: score.parts.age, max: 200 },
    { name: "Activity", value: score.parts.activity, max: 250 },
    { name: "NFT", value: score.parts.nft, max: 200 },
    { name: "DeFi", value: score.parts.defi, max: 250 },
    { name: "Diversity", value: score.parts.diversity, max: 100 },
  ];

  return (
    <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Score card */}
      <section className="glass-strong relative col-span-1 overflow-hidden rounded-3xl p-6 lg:col-span-2">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-base-violet/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-base-blue/30 blur-3xl" />
        <div className="relative flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Your reputation
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              {score.tier.label}
            </h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Based on {stats.txCount.toLocaleString()} transactions across{" "}
              {stats.walletAgeDays ?? 0} days of activity on Base.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                onClick={onShare}
                className="rounded-xl bg-gradient-to-r from-base-blue to-base-violet"
              >
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
              <Button
                variant="outline"
                className="rounded-xl border-white/15 bg-white/5"
                onClick={() =>
                  window.open(
                    `https://basescan.org/address/${stats.address}`,
                    "_blank",
                  )
                }
              >
                View on BaseScan
              </Button>
            </div>
          </div>
          <ScoreGauge
            value={score.total}
            label="Score"
            tier={score.tier.label}
          />
        </div>
      </section>

      {/* Wallet stats */}
      <section className="glass rounded-3xl p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Wallet className="h-4 w-4" /> Wallet stats
        </h3>
        <div className="mt-4 space-y-4">
          <StatRow
            icon={<Calendar className="h-4 w-4" />}
            label="Wallet age"
            value={stats.walletAgeDays !== null ? `${stats.walletAgeDays} days` : "—"}
          />
          <StatRow
            icon={<Activity className="h-4 w-4" />}
            label="Transactions"
            value={stats.txCount.toLocaleString()}
          />
          <StatRow
            icon={<Droplet className="h-4 w-4" />}
            label="Balance"
            value={`${stats.balanceEth.toFixed(4)} ETH`}
          />
          <StatRow
            icon={<Layers className="h-4 w-4" />}
            label="First seen block"
            value={stats.firstSeenBlock?.toLocaleString() ?? "—"}
          />
        </div>
      </section>

      {/* Breakdown chart */}
      <section className="glass col-span-1 rounded-3xl p-6 lg:col-span-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <TrendingUp className="h-4 w-4" /> Score breakdown
        </h3>
        <div className="mt-6 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={breakdown} barSize={48}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.75 0.20 260)" />
                  <stop offset="100%" stopColor="oklch(0.55 0.22 295)" />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "oklch(0.75 0.03 260)", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "oklch(0.75 0.03 260)", fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: "oklch(1 0 0 / 5%)" }}
                contentStyle={{
                  background: "oklch(0.22 0.07 270)",
                  border: "1px solid oklch(1 0 0 / 12%)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: "oklch(0.98 0 0)" }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {breakdown.map((_, i) => (
                  <Cell key={i} fill="url(#barGrad)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Badges */}
      <section className="glass rounded-3xl p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Award className="h-4 w-4" /> Achievements
        </h3>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`group relative overflow-hidden rounded-2xl border p-4 transition ${
                b.earned
                  ? "border-white/20 bg-gradient-to-br from-base-blue/30 to-base-violet/20 hover:scale-[1.04]"
                  : "border-white/5 bg-white/[0.03] opacity-50"
              }`}
              title={b.description}
            >
              <div className="text-2xl">{b.icon}</div>
              <div className="mt-2 text-sm font-semibold">{b.label}</div>
              <div className="text-[10px] text-muted-foreground">
                {b.earned ? "Earned" : "Locked"}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Leaderboard */}
      <section className="glass col-span-1 rounded-3xl p-6 lg:col-span-3">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Trophy className="h-4 w-4" /> Community leaderboard
          </h3>
          <span className="text-xs text-muted-foreground">
            Sample data · global ranking coming soon
          </span>
        </div>
        <div className="mt-4 divide-y divide-white/5">
          {LEADERBOARD.map((row, i) => (
            <div
              key={row.addr}
              className="flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`grid h-8 w-8 place-items-center rounded-lg text-sm font-bold ${
                    i === 0
                      ? "bg-premium/20 text-premium"
                      : i < 3
                      ? "bg-white/10 text-foreground"
                      : "bg-white/5 text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                <div className="font-mono text-sm">{row.addr}</div>
                <span className="hidden rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted-foreground sm:inline">
                  {row.tier}
                </span>
              </div>
              <div className="text-base font-bold text-gradient tabular-nums">
                {row.score}
              </div>
            </div>
          ))}
          {/* you */}
          <div className="mt-2 flex items-center justify-between rounded-xl bg-gradient-to-r from-base-blue/20 to-base-violet/20 px-3 py-3">
            <div className="flex items-center gap-4">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 text-sm font-bold">
                ★
              </div>
              <div className="font-mono text-sm">{shorten(stats.address)}</div>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                You · {score.tier.label}
              </span>
            </div>
            <div className="text-base font-bold text-gradient tabular-nums">
              {score.total}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}
