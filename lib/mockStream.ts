// lib/mockStream.ts
// StudyStream — Canvas Mock Media Stream Generator
// Allows developers to test multi-party video grids and latency on a single machine
// Reference: 07_Sandbox_Testing_and_Local_Verification.md

export function createMockVideoStream(label: string = "Test Scholar"): {
  stream: MediaStream;
  stop: () => void;
} {
  if (typeof window === "undefined") {
    throw new Error("createMockVideoStream can only run in browser environment");
  }

  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d")!;

  let frameCount = 0;
  let animId: number;

  function draw() {
    frameCount++;
    // 1. Dynamic background cycle to clearly show active motion
    const hue = (frameCount * 2) % 360;
    ctx.fillStyle = `hsl(${hue}, 20%, 12%)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Animated pulsing circle simulating student movement
    const x = canvas.width / 2 + Math.sin(frameCount * 0.05) * 80;
    const y = canvas.height / 2 + Math.cos(frameCount * 0.05) * 40;
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fillStyle = "#6366f1";
    ctx.fill();

    // 3. Status text and real-time millisecond timestamp
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 22px monospace";
    ctx.fillText(`MOCK PEER: ${label}`, 24, 48);

    ctx.font = "18px monospace";
    ctx.fillStyle = "#10b981";
    ctx.fillText(`UTC: ${new Date().toISOString().substring(11, 23)}`, 24, 88);
    ctx.fillStyle = "#f59e0b";
    ctx.fillText(`FPS: 30 · FRAME: #${frameCount}`, 24, 120);

    animId = requestAnimationFrame(draw);
  }

  draw();

  const stream = (
    canvas as HTMLCanvasElement & { captureStream(fps: number): MediaStream }
  ).captureStream(30);

  return {
    stream,
    stop: () => {
      cancelAnimationFrame(animId);
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    },
  };
}
