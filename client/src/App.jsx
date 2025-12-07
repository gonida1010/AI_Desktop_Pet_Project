import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import axios from "axios";
import "./App.css";

const {
  Engine,
  Render,
  World,
  Bodies,
  Mouse,
  MouseConstraint,
  Runner,
  Events,
  Body,
} = Matter;

const App = () => {
  const sceneRef = useRef(null);
  const [serverStatus, setServerStatus] = useState("Conn...");
  const catRef = useRef(null);
  const latestCommand = useRef("idle");
  const textures = useRef({});

  const interactionState = useRef({
    isHit: false,
    isAttacking: false,
    currentAction: "idle",
    currentFrame: 1,
    lastUpdateTime: 0,
    facingLeft: false,
  });

  const animationConfig = {
    idle: { frames: 4, prefix: "idle", fps: 5, loop: true },
    walk: { frames: 5, prefix: "walk", fps: 10, loop: true },
    jump: { frames: 5, prefix: "jump", fps: 12, loop: true },
    hit: { frames: 4, prefix: "hit", fps: 12, loop: false },
    attack: { frames: 5, prefix: "attack", fps: 15, loop: false },
    sleep: { frames: 3, prefix: "die", fps: 3, loop: false },
  };

  useEffect(() => {
    const preloadImages = () => {
      Object.values(animationConfig).forEach((config) => {
        for (let i = 1; i <= config.frames; i++) {
          const img = new Image();
          const path = `/${config.prefix}${i}.png`;
          img.src = path;
          textures.current[path] = img;
        }
      });
    };
    preloadImages();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!catRef.current) return;
      const cat = catRef.current;
      if (
        interactionState.current.isHit ||
        interactionState.current.isAttacking
      )
        return;

      axios
        .get("http://127.0.0.1:8000/ai-command", {
          params: { cat_x: cat.position.x, cat_y: cat.position.y },
        })
        .then((res) => {
          const { command, mood } = res.data;
          setServerStatus(`${mood} : ${command}`);
          latestCommand.current = command;

          if (command === "left") {
            Body.setVelocity(cat, { x: -2, y: cat.velocity.y });
            interactionState.current.facingLeft = true;
          } else if (command === "right") {
            Body.setVelocity(cat, { x: 2, y: cat.velocity.y });
            interactionState.current.facingLeft = false;
          } else if (command === "attack" || command === "sleep") {
            Body.setVelocity(cat, { x: 0, y: cat.velocity.y });
            if (command === "attack")
              interactionState.current.isAttacking = true;
          } else {
            Body.setVelocity(cat, { x: 0, y: cat.velocity.y });
          }
        })
        .catch(() => setServerStatus("AI Disconnected"));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const engine = Engine.create();
    const width = window.innerWidth;
    const height = window.innerHeight;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: width,
        height: height,
        wireframes: false,
        background: "transparent",
      },
    });

    const cat = Bodies.rectangle(width / 2, 200, 80, 80, {
      inertia: Infinity,
      friction: 0,
      frictionAir: 0.05,
      render: { sprite: { texture: "/idle1.png", xScale: 0.5, yScale: 0.5 } },
    });
    catRef.current = cat;

    const wallOpts = { isStatic: true, render: { visible: false } };
    const ground = Bodies.rectangle(width / 2, height, width, 50, wallOpts);
    const left = Bodies.rectangle(0, height / 2, 50, height, wallOpts);
    const right = Bodies.rectangle(width, height / 2, 50, height, wallOpts);
    const top = Bodies.rectangle(width / 2, -50, width, 50, wallOpts);

    World.add(engine.world, [cat, ground, left, right, top]);

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } },
    });
    World.add(engine.world, mouseConstraint);

    Events.on(mouseConstraint, "mousedown", (event) => {
      if (Matter.Bounds.contains(cat.bounds, event.mouse.position)) {
        if (!interactionState.current.isHit) {
          interactionState.current.isHit = true;
          interactionState.current.isAttacking = false;
          Body.setVelocity(cat, { x: 0, y: -5 });
        }
      }
    });

    Events.on(engine, "beforeUpdate", (event) => {
      const v = cat.velocity;
      const state = interactionState.current;
      const cmd = latestCommand.current;
      let nextAction = state.currentAction;

      if (state.isHit) nextAction = "hit";
      else if (state.isAttacking) nextAction = "attack";
      else if (cmd === "sleep") nextAction = "sleep";
      else {
        if (Math.abs(v.x) > 0.5) nextAction = "walk";
        else nextAction = "idle";
      }

      if (!state.isHit && !state.isAttacking && nextAction !== "sleep") {
        if (v.x < -0.1) state.facingLeft = true;
        else if (v.x > 0.1) state.facingLeft = false;
      }

      if (state.currentAction !== nextAction) {
        state.currentAction = nextAction;
        state.currentFrame = 1;
      }

      const config =
        animationConfig[state.currentAction] || animationConfig.idle;
      if (event.timestamp - state.lastUpdateTime >= 1000 / config.fps) {
        state.lastUpdateTime = event.timestamp;
        let next = state.currentFrame + 1;

        if (!config.loop && next > config.frames) {
          if (state.isHit) state.isHit = false;
          if (state.isAttacking) state.isAttacking = false;
          next = config.frames;
        } else {
          next = (state.currentFrame % config.frames) + 1;
        }
        state.currentFrame = next;

        const path = `/${config.prefix}${next}.png`;
        if (cat.render.sprite.texture !== path) {
          cat.render.sprite.texture = path;
        }
      }

      const baseScale = 0.5;
      cat.render.sprite.xScale = state.facingLeft ? -baseScale : baseScale;
      cat.render.sprite.yScale = baseScale;
    });

    if (window.require) {
      const { ipcRenderer } = window.require("electron");
      Events.on(mouseConstraint, "mousemove", (e) => {
        const hit = Matter.Bounds.contains(cat.bounds, e.mouse.position);
        ipcRenderer.send("set-ignore-mouse-events", !hit);
        render.canvas.style.cursor = hit ? "pointer" : "default";
      });
    }

    Runner.run(Runner.create(), engine);
    Render.run(render);

    return () => {
      Render.stop(render);
      World.clear(engine.world);
      Engine.clear(engine);
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <div ref={sceneRef} />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          color: "white",
          textShadow: "1px 1px 2px black",
          pointerEvents: "none",
        }}
      >
        {serverStatus}
      </div>
    </div>
  );
};

export default App;
