import { useEffect, useRef } from "react";
import { Physics, SpinePlayer } from "@esotericsoftware/spine-player";
import "@esotericsoftware/spine-player/dist/spine-player.css";

const SPINE_BASE = "/spine/ishua-capsule";
const LOOK = { capsule: 10, face: 16, pupil: 4 };

type LookTarget = {
  x: number;
  y: number;
};

function applyMouseLook(player: SpinePlayer, look: LookTarget, enabled: boolean) {
  const skeleton = player.skeleton;
  if (!skeleton) return;

  const capsule = skeleton.findBone("capsule");
  const face = skeleton.findBone("face");
  const pupilL = skeleton.findBone("pupil-l");
  const pupilR = skeleton.findBone("pupil-r");

  if (!capsule || !face || !pupilL || !pupilR) return;

  if (!enabled) {
    capsule.pose.rotation = 0;
    face.pose.rotation = 0;
    pupilL.pose.x = 0;
    pupilL.pose.y = 0;
    pupilR.pose.x = 0;
    pupilR.pose.y = 0;
    skeleton.updateWorldTransform(Physics.none);
    return;
  }

  capsule.pose.rotation = look.x * LOOK.capsule;
  face.pose.rotation = look.x * LOOK.face;
  pupilL.pose.x = look.x * LOOK.pupil;
  pupilL.pose.y = -look.y * (LOOK.pupil * 0.75);
  pupilR.pose.x = look.x * LOOK.pupil;
  pupilR.pose.y = -look.y * (LOOK.pupil * 0.75);
  skeleton.updateWorldTransform(Physics.none);
}

export function RegisterMascot() {
  const hostRef = useRef<HTMLDivElement>(null);
  const lookRef = useRef<LookTarget>({ x: 0, y: 0 });
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function handleMove(event: MouseEvent) {
      if (reducedMotionRef.current || !host) return;

      const bounds = host.getBoundingClientRect();
      const nextX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      const nextY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

      lookRef.current = {
        x: Math.max(-1, Math.min(1, nextX)),
        y: Math.max(-1, Math.min(1, nextY)),
      };
    }

    window.addEventListener("mousemove", handleMove);

    const player = new SpinePlayer(host, {
      skeleton: `${SPINE_BASE}/ishua-capsule.json`,
      atlas: `${SPINE_BASE}/ishua-capsule.atlas`,
      animation: "idle",
      alpha: true,
      backgroundColor: "#00000000",
      preserveDrawingBuffer: false,
      showControls: false,
      showLoading: false,
      interactive: false,
      viewport: {
        padLeft: "12%",
        padRight: "12%",
        padTop: "8%",
        padBottom: "8%",
      },
      success: (instance) => {
        instance.setAnimation("idle", true);
      },
      update: (instance) => {
        applyMouseLook(instance, lookRef.current, !reducedMotionRef.current);
      },
      error: (_instance, message) => {
        console.error("Spine mascot failed to load:", message);
      },
    });

    return () => {
      window.removeEventListener("mousemove", handleMove);
      player.dispose();
    };
  }, []);

  return (
    <div className="register-mascot mx-auto w-full max-w-[240px]">
      <div
        ref={hostRef}
        aria-hidden
        className="h-[220px] w-full overflow-hidden [&_.spine-player]:h-full [&_.spine-player]:w-full [&_.spine-player_canvas]:h-full [&_.spine-player_canvas]:w-full"
      />
      <p className="mt-1 text-center text-sm font-medium text-brand">iShua</p>
    </div>
  );
}
