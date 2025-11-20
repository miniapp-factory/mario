"use client";

import { useEffect, useRef } from "react";

const canvasWidth = 800;
const canvasHeight = 400;
const groundY = canvasHeight - 50;
const gravity = 0.6;
const jumpStrength = -12;
const moveSpeed = 2;

type Sprite = {
  x: number;
  y: number;
  width: number;
  height: number;
  emoji: string;
  vx?: number;
  vy?: number;
  isEnemy?: boolean;
  isPowerUp?: boolean;
  isFireball?: boolean;
};

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const playerRef = useRef<Sprite>({
    x: 50,
    y: groundY,
    width: 30,
    height: 30,
    emoji: "🧑‍🚀",
    vx: 0,
    vy: 0,
  });
  const enemiesRef = useRef<Sprite[]>([]);
  const powerUpsRef = useRef<Sprite[]>([]);
  const fireballsRef = useRef<Sprite[]>([]);
  const flagPoleRef = useRef<Sprite>({
    x: 2000,
    y: groundY - 80,
    width: 20,
    height: 80,
    emoji: "🏁",
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = 0;
    let enemyTimer = 0;
    let powerUpTimer = 0;
    let flagReached = false;

    const spawnEnemy = () => {
      enemiesRef.current.push({
        x: canvasWidth + Math.random() * 300,
        y: groundY,
        width: 30,
        height: 30,
        emoji: "👹",
        vx: -moveSpeed,
        vy: 0,
        isEnemy: true,
      });
    };

    const spawnPowerUp = () => {
      powerUpsRef.current.push({
        x: canvasWidth + Math.random() * 300,
        y: groundY - 60,
        width: 20,
        height: 20,
        emoji: "🍎",
        vx: -moveSpeed,
        vy: 0,
        isPowerUp: true,
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const player = playerRef.current;
      if (e.code === "Space" || e.code === "ArrowUp") {
        if (player.y >= groundY) {
          player.vy = jumpStrength;
        }
      }
      if (e.code === "KeyF") {
        // fireball
        fireballsRef.current.push({
          x: player.x + player.width,
          y: player.y + player.height / 2,
          width: 20,
          height: 20,
          emoji: "🔥",
          vx: 5,
          vy: 0,
          isFireball: true,
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const update = (dt: number) => {
      const player = playerRef.current;
      // player physics
      player.vy += gravity;
      player.y += player.vy;
      if (player.y > groundY) {
        player.y = groundY;
        player.vy = 0;
      }

      // move background
      enemiesRef.current.forEach((e) => (e.x += e.vx!));
      powerUpsRef.current.forEach((p) => (p.x += p.vx!));
      fireballsRef.current.forEach((f) => (f.x += f.vx!));

      // collision detection
      enemiesRef.current = enemiesRef.current.filter((e) => {
        if (e.x + e.width < 0) return false;
        if (rectIntersect(player, e)) {
          if (player.y + player.height < e.y + 10) {
            // jump on enemy
            player.vy = jumpStrength / 2;
            return false; // enemy removed
          } else {
            // hit by enemy
            // reset player position
            player.x = 50;
            player.y = groundY;
            player.vy = 0;
          }
        }
        return true;
      });

      powerUpsRef.current = powerUpsRef.current.filter((p) => {
        if (p.x + p.width < 0) return false;
        if (rectIntersect(player, p)) {
          // power up collected
          // simple effect: increase jump strength temporarily
          player.vy = jumpStrength * 1.5;
          return false;
        }
        return true;
      });

      fireballsRef.current = fireballsRef.current.filter((f) => {
        if (f.x > canvasWidth) return false;
        let hit = false;
        enemiesRef.current = enemiesRef.current.filter((e) => {
          if (rectIntersect(f, e)) {
            hit = true;
            return false;
          }
          return true;
        });
        return !hit;
      });

      // flag pole
      if (!flagReached && rectIntersect(player, flagPoleRef.current)) {
        flagReached = true;
        alert("Level Complete!");
      }

      // spawn logic
      enemyTimer += dt;
      if (enemyTimer > 2000) {
        spawnEnemy();
        enemyTimer = 0;
      }
      powerUpTimer += dt;
      if (powerUpTimer > 3000) {
        spawnPowerUp();
        powerUpTimer = 0;
      }
    };

    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      // draw ground
      ctx.fillStyle = "#654321";
      ctx.fillRect(0, groundY + 10, canvasWidth, canvasHeight - groundY);

      // draw flag pole
      drawSprite(ctx, flagPoleRef.current);

      // draw player
      drawSprite(ctx, playerRef.current);

      // draw enemies
      enemiesRef.current.forEach((e) => drawSprite(ctx, e));

      // draw power-ups
      powerUpsRef.current.forEach((p) => drawSprite(ctx, p));

      // draw fireballs
      fireballsRef.current.forEach((f) => drawSprite(ctx, f));
    };

    const rectIntersect = (a: Sprite, b: Sprite) => {
      return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      );
    };

    const drawSprite = (ctx: CanvasRenderingContext2D, s: Sprite) => {
      ctx.font = `${s.height}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(s.emoji, s.x + s.width / 2, s.y + s.height / 2);
    };

    const loop = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;
      update(dt);
      draw();
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(animationRef.current!);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{ border: "1px solid #000", background: "#87ceeb" }}
    />
  );
}
