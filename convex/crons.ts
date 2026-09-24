import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Purge stale ghost participants every 30 minutes
crons.interval(
  "cleanup-stale-room-participants",
  { minutes: 30 },
  internal.rooms.cleanupStaleParticipants,
  {}
);

export default crons;
