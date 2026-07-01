export type CampaignStatus = "draft" | "published" | "paused" | "closed";

export type GamificationCampaign = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: CampaignStatus;
  starts_at: string | null;
  ends_at: string | null;
  participant_count?: number;
};

export type MissionProgressRow = {
  id: string;
  missionId: string;
  title: string;
  description: string | null;
  targetPoints: number | null;
  progressValue: number;
  status: string;
  completedAt: string | null;
  sortOrder: number;
};

export type AchievementRow = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  pointsReward: number;
  rarity: string;
  campaignName: string | null;
  unlockedAt: string | null;
  isUnlocked: boolean;
};

export type JourneySummary = {
  campaignsParticipated: number;
  totalPoints: number;
  victories: number;
  medals: number;
  medianPoints: number;
  userPoints: number;
  ledgerHistory: { id: string; points: number; description: string | null; createdAt: string }[];
  campaigns: { id: string; name: string; status: CampaignStatus; points: number }[];
};

export type CampaignAdminRow = {
  id: string;
  name: string;
  slug: string;
  status: CampaignStatus;
  starts_at: string | null;
  ends_at: string | null;
  participant_count: number;
  published_at: string | null;
};
