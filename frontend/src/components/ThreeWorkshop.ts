// Copyright 2026 Jiacheng Ni
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as THREE from "three";
import type { AgentEvent, AgentRunResponse } from "../lib/types";

const ROOM = {
  floor: 0xe9ece8,
  backWall: 0xd8d8df,
  sideWall: 0xc9ced8,
  beam: 0x6e7486,
  wood: 0xb9906c,
  ink: 0x17212b,
  glass: 0x88d4d2,
  screen: 0x102a2e,
  suit: 0x27303e,
};

const AGENT_COLORS = [0x61a9ff, 0x5ecf99, 0xe6b84c, 0xe87e9f];

interface WorkshopOptions {
  onRun: () => void;
  onScreenOpen: () => void;
}

interface AgentRig {
  agent: string;
  role: "generator" | "monitor" | "acceptance" | "supervisor";
  root: THREE.Group;
  head: THREE.Mesh;
  body: THREE.Mesh;
  leftHand: THREE.Mesh;
  rightHand: THREE.Mesh;
  prop: THREE.Object3D;
  keyboard?: THREE.Mesh;
  papers?: THREE.Group;
  baseY: number;
  task: string;
}

function mat(color: number, roughness = 0.7, metalness = 0.05) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function emissiveMat(color: number, intensity = 0.45) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.46,
    metalness: 0.08,
  });
}

function roundedBox(w: number, h: number, d: number, color: number) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
}

function addOutline(group: THREE.Group, mesh: THREE.Mesh, scale = 1.05) {
  const outline = new THREE.Mesh(
    mesh.geometry,
    new THREE.MeshBasicMaterial({ color: 0x1b2029, side: THREE.BackSide }),
  );
  outline.position.copy(mesh.position);
  outline.rotation.copy(mesh.rotation);
  outline.scale.copy(mesh.scale).multiplyScalar(scale);
  group.add(outline);
  return outline;
}

function addEdges(mesh: THREE.Mesh, color = 0x202433) {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.42 }),
  );
  edges.position.copy(mesh.position);
  edges.rotation.copy(mesh.rotation);
  edges.scale.copy(mesh.scale);
  mesh.parent?.add(edges);
  return edges;
}

function addFramedBox(group: THREE.Group | THREE.Scene, mesh: THREE.Mesh) {
  group.add(mesh);
  addEdges(mesh);
  return mesh;
}

function makeRoom(scene: THREE.Scene) {
  const floor = new THREE.Mesh(new THREE.BoxGeometry(12, 0.18, 8), mat(ROOM.floor));
  floor.position.set(0, -0.12, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(12, 4.8, 0.2), mat(ROOM.backWall));
  backWall.position.set(0, 2.25, -4);
  backWall.receiveShadow = true;
  scene.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.8, 8), mat(ROOM.sideWall));
  leftWall.position.set(-6, 2.25, 0);
  scene.add(leftWall);

  const rightWall = leftWall.clone();
  rightWall.position.x = 6;
  scene.add(rightWall);

  for (let i = 0; i < 9; i += 1) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.026, 8), mat(0xc9d0cf));
    stripe.position.set(-5.1 + i * 1.28, 0.003, 0);
    scene.add(stripe);
  }

  for (let i = 0; i < 10; i += 1) {
    const wallPanel = new THREE.Mesh(new THREE.BoxGeometry(0.025, 4.2, 0.026), mat(0xb8bcc9));
    wallPanel.position.set(-5.4 + i * 1.2, 2.25, -3.87);
    scene.add(wallPanel);
  }

  const ceilingRail = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.08, 0.1), mat(ROOM.beam));
  ceilingRail.position.set(0, 4.45, -1.4);
  scene.add(ceilingRail);

  [-3.3, 0, 3.3].forEach((x) => {
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.18, 32), emissiveMat(0xf6fff9, 0.8));
    lamp.position.set(x, 4.25, -1.4);
    scene.add(lamp);
    const light = new THREE.PointLight(0xffffff, 1.6, 5.2);
    light.position.set(x, 3.9, -1.25);
    scene.add(light);
  });
}

function makeMiniScreen(width: number, height: number, color = 0x1a3d48) {
  const group = new THREE.Group();
  const frame = roundedBox(width + 0.08, height + 0.08, 0.06, 0x232b3a);
  const screen = roundedBox(width, height, 0.018, color);
  screen.position.z = 0.045;
  group.add(frame, screen);
  for (let i = 0; i < 7; i += 1) {
    const line = roundedBox(width * (0.22 + ((i * 17) % 34) / 100), 0.012, 0.008, i % 3 === 0 ? 0x83f5da : 0x49a6ff);
    line.position.set(-width * 0.32 + i * 0.018, height * 0.32 - i * 0.08, 0.06);
    group.add(line);
  }
  const glow = new THREE.PointLight(0x4ce6ff, 0.08, 1.2);
  glow.position.set(0, 0, 0.18);
  group.add(glow);
  return group;
}

function makeMonitorRack(x: number, side: "left" | "right") {
  const group = new THREE.Group();
  const cabinet = roundedBox(1.18, 2.95, 0.42, 0xd5d7dd);
  cabinet.position.set(0, 1.45, 0);
  addFramedBox(group, cabinet);
  const ySlots = [2.42, 1.82, 1.18, 0.48];
  ySlots.forEach((y, i) => {
    const screen = makeMiniScreen(0.86, i === 3 ? 0.42 : 0.48, i % 2 === 0 ? 0x153848 : 0x1a4250);
    screen.position.set(0, y, 0.24);
    group.add(screen);
  });
  const drawer = roundedBox(0.88, 0.16, 0.06, 0x9da4b4);
  drawer.position.set(0, 0.2, 0.245);
  group.add(drawer);
  group.position.set(x, 0, -2.55);
  group.rotation.y = side === "left" ? 0.14 : -0.14;
  return group;
}

function makePlant(scale = 1) {
  const group = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * scale, 0.18 * scale, 0.2 * scale, 18), mat(0x61748a));
  pot.position.y = 0.1 * scale;
  group.add(pot);
  for (let i = 0; i < 6; i += 1) {
    const leaf = new THREE.Mesh(new THREE.CapsuleGeometry(0.035 * scale, 0.28 * scale, 5, 10), mat(0x4caf65));
    leaf.position.set(Math.sin(i) * 0.08 * scale, 0.29 * scale, Math.cos(i) * 0.08 * scale);
    leaf.rotation.z = -0.75 + i * 0.28;
    leaf.rotation.x = 0.42;
    group.add(leaf);
  }
  return group;
}

function makeCoffeeCup() {
  const group = new THREE.Group();
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.16, 20), mat(0xe8e6dc));
  cup.position.y = 0.08;
  const coffee = new THREE.Mesh(new THREE.CylinderGeometry(0.067, 0.067, 0.008, 20), mat(0x4a2c1e));
  coffee.position.y = 0.165;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.01, 8, 20), mat(0xe8e6dc));
  handle.position.set(0.08, 0.09, 0);
  handle.rotation.y = Math.PI / 2;
  group.add(cup, coffee, handle);
  return group;
}

function makeCable(start: THREE.Vector3, end: THREE.Vector3) {
  const mid = start.clone().lerp(end, 0.5).add(new THREE.Vector3(0, -0.12, 0.16));
  const curve = new THREE.CatmullRomCurve3([start, mid, end]);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.012, 8, false), mat(0x20232c));
}

function makeSticky(color: number) {
  const note = roundedBox(0.22, 0.012, 0.18, color);
  note.rotation.x = -Math.PI / 2;
  return note;
}

function makeLongDesk() {
  const group = new THREE.Group();
  const top = roundedBox(5.55, 0.18, 1.12, ROOM.wood);
  top.position.set(0, 0.78, 0);
  addFramedBox(group, top);

  [-2.35, 2.35].forEach((x) => {
    const drawers = roundedBox(0.72, 0.74, 0.92, 0x778096);
    drawers.position.set(x, 0.36, 0.02);
    addFramedBox(group, drawers);
    [0.48, 0.2].forEach((y) => {
      const handle = roundedBox(0.28, 0.035, 0.035, 0x222838);
      handle.position.set(x, y, 0.49);
      group.add(handle);
    });
  });

  [-0.95, 0.95].forEach((x) => {
    const monitor = makeMiniScreen(1.2, 0.58, 0x143b4d);
    monitor.position.set(x, 1.2, -0.43);
    monitor.rotation.x = -0.08;
    group.add(monitor);
    const stand = roundedBox(0.08, 0.32, 0.05, 0x26313a);
    stand.position.set(x, 0.96, -0.42);
    group.add(stand);
  });

  const keyboard = roundedBox(0.84, 0.05, 0.26, 0x202936);
  keyboard.position.set(0, 0.91, 0.24);
  group.add(keyboard);

  const chairBack = roundedBox(0.92, 0.9, 0.16, 0x2c3444);
  chairBack.position.set(0, 0.86, 0.88);
  addFramedBox(group, chairBack);
  const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.1, 28), mat(0x242b37));
  chairBase.position.set(0, 0.38, 0.86);
  group.add(chairBase);

  const mug = makeCoffeeCup();
  mug.position.set(-1.55, 0.88, 0.36);
  group.add(mug);

  [0xf2dc64, 0xeff0f2, 0x82d4ff].forEach((color, i) => {
    const note = makeSticky(color);
    note.position.set(0.78 + i * 0.28, 0.885, 0.32 - i * 0.05);
    note.rotation.z = -0.16 + i * 0.08;
    group.add(note);
  });

  group.add(makeCable(new THREE.Vector3(-0.2, 0.78, 0.46), new THREE.Vector3(-0.6, 0.05, 1.2)));
  group.add(makeCable(new THREE.Vector3(0.28, 0.78, 0.43), new THREE.Vector3(0.72, 0.05, 1.12)));

  return { group, keyboard };
}

function makeReadingDesk() {
  const group = new THREE.Group();
  const top = roundedBox(1.7, 0.14, 1.05, 0xb99574);
  top.position.y = 0.72;
  addFramedBox(group, top);
  const book = roundedBox(0.82, 0.045, 0.58, 0xf6f0df);
  book.position.set(0.05, 0.82, 0.08);
  book.rotation.y = -0.16;
  group.add(book);
  for (let i = 0; i < 8; i += 1) {
    const line = roundedBox(0.28 + (i % 3) * 0.08, 0.006, 0.012, 0x7e8b98);
    line.position.set(-0.22 + (i % 2) * 0.42, 0.855, -0.16 + Math.floor(i / 2) * 0.08);
    group.add(line);
  }
  const cup = makeCoffeeCup();
  cup.position.set(-0.62, 0.8, 0.36);
  group.add(cup);
  return group;
}

function makeDesk(labelColor: number) {
  const group = new THREE.Group();
  const top = roundedBox(1.8, 0.16, 0.92, ROOM.wood);
  top.position.y = 0.78;
  const leftLeg = roundedBox(0.12, 0.78, 0.12, 0x6d5645);
  const rightLeg = leftLeg.clone();
  const backLeg = leftLeg.clone();
  const backLeg2 = leftLeg.clone();
  leftLeg.position.set(-0.75, 0.35, 0.34);
  rightLeg.position.set(0.75, 0.35, 0.34);
  backLeg.position.set(-0.75, 0.35, -0.34);
  backLeg2.position.set(0.75, 0.35, -0.34);

  const monitor = roundedBox(0.78, 0.48, 0.05, 0x24343a);
  monitor.position.set(0, 1.16, -0.32);
  const screen = roundedBox(0.68, 0.38, 0.012, labelColor);
  screen.position.set(0, 1.16, -0.356);
  const stand = roundedBox(0.08, 0.22, 0.05, 0x24343a);
  stand.position.set(0, 0.91, -0.32);
  const keyboard = roundedBox(0.64, 0.05, 0.18, 0x233238);
  keyboard.position.set(0, 0.91, 0.18);

  group.add(top, leftLeg, rightLeg, backLeg, backLeg2, monitor, screen, stand, keyboard);
  return { group, keyboard };
}

function makeChibi(color: number, role: AgentRig["role"], agent: string, task: string): AgentRig {
  const root = new THREE.Group();
  const skin = mat(0xffd9bf, 0.82);
  const hairColors = {
    generator: 0x3b241d,
    monitor: 0x7a62c8,
    acceptance: 0xf2c76b,
    supervisor: 0x5a2d22,
  };
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 36, 26), skin);
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.355, 36, 18, 0, Math.PI * 2, 0, Math.PI * 0.58),
    mat(hairColors[role]),
  );
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.42, 8, 22), mat(ROOM.suit));
  const shirt = roundedBox(0.19, 0.2, 0.026, 0xf6f4ef);
  const tie = roundedBox(0.045, 0.18, 0.03, color);
  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 10), skin);
  const rightHand = leftHand.clone();
  const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.019, 10, 8), mat(ROOM.ink));
  const eye2 = eye1.clone();
  const blush1 = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 8), mat(0xf4a7a2));
  const blush2 = blush1.clone();

  head.position.set(0, 1.14, 0.14);
  hair.position.copy(head.position).add(new THREE.Vector3(0, 0.08, 0));
  body.position.set(0, 0.66, 0.15);
  shirt.position.set(0, 0.78, 0.35);
  tie.position.set(0, 0.72, 0.37);
  leftHand.position.set(-0.25, 0.84, 0.38);
  rightHand.position.set(0.25, 0.84, 0.38);
  eye1.position.set(-0.09, 1.15, 0.46);
  eye2.position.set(0.09, 1.15, 0.46);
  blush1.position.set(-0.16, 1.08, 0.455);
  blush2.position.set(0.16, 1.08, 0.455);
  addOutline(root, body, 1.07);
  addOutline(root, head, 1.035);
  addOutline(root, hair, 1.025);
  root.add(body, shirt, tie, head, hair, leftHand, rightHand, eye1, eye2, blush1, blush2);

  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.004, 8, 18, Math.PI), mat(0x8a4038));
  smile.position.set(0, 1.075, 0.47);
  smile.rotation.z = Math.PI;
  root.add(smile);

  if (role === "supervisor") {
    const pony = new THREE.Mesh(new THREE.SphereGeometry(0.19, 22, 16), mat(hairColors[role]));
    pony.position.set(-0.34, 1.12, 0.02);
    pony.scale.set(0.92, 1.26, 0.82);
    addOutline(root, pony, 1.03);
    root.add(pony);
  }

  if (role === "monitor") {
    const glasses = new THREE.Group();
    const left = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.006, 8, 18), mat(0x2b303b));
    const right = left.clone();
    left.position.set(-0.09, 1.15, 0.478);
    right.position.set(0.09, 1.15, 0.478);
    const bridge = roundedBox(0.08, 0.006, 0.006, 0x2b303b);
    bridge.position.set(0, 1.15, 0.478);
    glasses.add(left, right, bridge);
    root.add(glasses);
  }

  let prop: THREE.Object3D;
  let papers: THREE.Group | undefined;
  if (role === "monitor") {
    prop = new THREE.Group();
    const lens = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.014, 12, 32), emissiveMat(0xaee9e6, 0.55));
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.24, 12), mat(0x516a6d));
    handle.position.set(0.13, -0.13, 0);
    handle.rotation.z = -Math.PI / 4;
    prop.add(lens, handle);
  } else if (role === "acceptance") {
    papers = new THREE.Group();
    for (let i = 0; i < 4; i += 1) {
      const paper = roundedBox(0.28, 0.012, 0.38, 0xf9fbf4);
      paper.position.set(i * 0.035, i * 0.018, i * 0.02);
      paper.rotation.y = -0.12 + i * 0.04;
      papers.add(paper);
    }
    prop = papers;
  } else if (role === "supervisor") {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.12, 0.05, 0.1),
      new THREE.Vector3(0.28, 0.08, 0.02),
      new THREE.Vector3(0.46, -0.02, 0.12),
    ]);
    prop = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.012, 8, false), mat(0x2e3033));
  } else {
    prop = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.03, 0.14), emissiveMat(0xb7d9ff, 0.65));
  }
  prop.position.set(0.22, 0.93, 0.43);
  root.add(prop);

  return {
    agent,
    role,
    root,
    head,
    body,
    leftHand,
    rightHand,
    prop,
    papers,
    baseY: 0,
    task,
  };
}

function drawStatusTexture(
  canvas: HTMLCanvasElement,
  events: AgentEvent[],
  result: AgentRunResponse | null,
  busy: boolean,
  stageIndex: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  ctx.fillStyle = "#0d262a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#12363e";
  ctx.fillRect(24, 24, 976, 592);
  ctx.strokeStyle = "#68f0dc";
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, 976, 592);
  ctx.fillStyle = "#79f2dc";
  ctx.font = "700 50px Microsoft YaHei, sans-serif";
  ctx.fillText("Q-Loom AgentOps", 54, 78);
  ctx.font = "24px Microsoft YaHei, sans-serif";
  ctx.fillStyle = busy ? "#ffd36b" : "#bdf7ee";
  ctx.fillText(
    busy ? `LIVE / STAGE ${Math.max(stageIndex, 1)} OF 4` : "READY / CLICK AGENT TO RUN",
    58,
    122,
  );

  ctx.strokeStyle = "#2f7480";
  ctx.lineWidth = 1;
  for (let x = 54; x < 962; x += 42) {
    ctx.beginPath();
    ctx.moveTo(x, 150);
    ctx.lineTo(x, 584);
    ctx.stroke();
  }
  for (let y = 150; y < 584; y += 36) {
    ctx.beginPath();
    ctx.moveTo(54, y);
    ctx.lineTo(962, y);
    ctx.stroke();
  }

  events.forEach((event, index) => {
    const y = 185 + index * 78;
    ctx.fillStyle = ["#61a9ff", "#5ecf99", "#e6b84c", "#e87e9f"][index] ?? "#ffffff";
    ctx.fillRect(60, y, Math.max(16, event.progress * 3.9), 16);
    ctx.fillStyle = "#f4fffb";
    ctx.font = "700 25px Microsoft YaHei, sans-serif";
    ctx.fillText(`${event.agent}  ${event.progress}%`, 60, y - 10);
    ctx.font = "19px Microsoft YaHei, sans-serif";
    ctx.fillStyle = "#cfeee8";
    ctx.fillText(event.message.slice(0, 22), 60, y + 44);
  });

  ctx.strokeStyle = "#63e5ff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(520, 448);
  [548, 576, 604, 632, 660, 688, 716, 744].forEach((x, i) => {
    ctx.lineTo(x, 430 - Math.sin(i * 0.8 + (busy ? 1 : 0)) * 58);
  });
  ctx.stroke();

  ["SAMPLE", "SCORE", "ACCEPT", "AUDIT"].forEach((label, i) => {
    ctx.fillStyle = "#0f2b31";
    ctx.fillRect(792, 176 + i * 74, 146, 44);
    ctx.strokeStyle = "#56d9ce";
    ctx.strokeRect(792, 176 + i * 74, 146, 44);
    ctx.fillStyle = i === 2 && result ? "#ffd36b" : "#bff8ed";
    ctx.font = "700 20px Microsoft YaHei, sans-serif";
    ctx.fillText(label, 812, 205 + i * 74);
  });

  ctx.fillStyle = "#f8fff9";
  ctx.font = "23px Microsoft YaHei, sans-serif";
  const decision = result?.acceptance?.acceptance_decision ?? "pending";
  ctx.fillText(`Decision: ${decision}`, 58, 564);
  ctx.fillText("Click wall screen: fullscreen status", 500, 564);
}

export class ThreeWorkshop {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  private renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true,
  });
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2(-10, -10);
  private rigs: AgentRig[] = [];
  private hoverTargets = new Map<THREE.Object3D, AgentRig>();
  private screenCanvas = document.createElement("canvas");
  private screenTexture: THREE.CanvasTexture;
  private wallScreen: THREE.Mesh;
  private events: AgentEvent[] = [];
  private result: AgentRunResponse | null = null;
  private busy = false;
  private stageIndex = 0;
  private stageBeacons: THREE.Mesh[] = [];
  private stageLinks: THREE.Mesh[] = [];
  private frame = 0;
  private animationId = 0;
  private tooltip: HTMLDivElement;

  constructor(
    private host: HTMLElement,
    private options: WorkshopOptions,
  ) {
    this.screenCanvas.width = 1024;
    this.screenCanvas.height = 640;
    this.screenTexture = new THREE.CanvasTexture(this.screenCanvas);
    this.wallScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 3),
      new THREE.MeshStandardMaterial({
        map: this.screenTexture,
        emissive: 0x17484c,
        emissiveIntensity: 0.55,
        roughness: 0.34,
      }),
    );
    this.tooltip = document.createElement("div");
    this.tooltip.className = "workshopTooltip";
    this.host.appendChild(this.renderer.domElement);
    this.host.appendChild(this.tooltip);
    this.createScene();
    this.resize();
    window.addEventListener("resize", this.resize);
    this.renderer.domElement.addEventListener("pointermove", this.onPointerMove);
    this.renderer.domElement.addEventListener("click", this.onClick);
    this.animate();
  }

  setState(events: AgentEvent[], result: AgentRunResponse | null, busy: boolean, stageIndex: number) {
    this.events = events;
    this.result = result;
    this.busy = busy;
    this.stageIndex = stageIndex;
    drawStatusTexture(this.screenCanvas, this.events, this.result, this.busy, this.stageIndex);
    this.screenTexture.needsUpdate = true;
  }

  dispose() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener("resize", this.resize);
    this.renderer.domElement.removeEventListener("pointermove", this.onPointerMove);
    this.renderer.domElement.removeEventListener("click", this.onClick);
    this.renderer.dispose();
    this.host.replaceChildren();
  }

  private resize = () => {
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private createScene() {
    this.scene.background = new THREE.Color(0xd8dde5);
    this.camera.position.set(0, 3.05, 7.35);
    this.camera.lookAt(0, 1.35, -1.2);

    const ambient = new THREE.HemisphereLight(0xffffff, 0x82928f, 2.15);
    const key = new THREE.DirectionalLight(0xffffff, 2.9);
    key.position.set(4, 5.5, 4.5);
    key.castShadow = true;
    this.scene.add(ambient, key);
    makeRoom(this.scene);

    this.wallScreen.position.set(0, 2.55, -3.86);
    this.scene.add(this.wallScreen);
    this.hoverTargets.set(this.wallScreen, {
      agent: "系统大屏",
      role: "supervisor",
      root: new THREE.Group(),
      head: new THREE.Mesh(),
      body: new THREE.Mesh(),
      leftHand: new THREE.Mesh(),
      rightHand: new THREE.Mesh(),
      prop: new THREE.Group(),
      baseY: 0,
      task: "点击全屏查看系统状态与本轮输出",
    });

    this.scene.add(makeMonitorRack(-5.15, "left"));
    this.scene.add(makeMonitorRack(5.15, "right"));

    [-4.3, 4.15].forEach((x, i) => {
      const topScreen = makeMiniScreen(1.05, 0.42, i === 0 ? 0x173e52 : 0x173b46);
      topScreen.position.set(x, 3.42, -3.83);
      topScreen.rotation.y = x < 0 ? 0.08 : -0.08;
      this.scene.add(topScreen);
    });

    const longDesk = makeLongDesk();
    longDesk.group.position.set(0, 0, -0.05);
    this.scene.add(longDesk.group);

    const researchDesk = makeReadingDesk();
    researchDesk.position.set(-3.25, 0, 1.5);
    researchDesk.rotation.y = -0.42;
    this.scene.add(researchDesk);

    const rightSideTable = makeReadingDesk();
    rightSideTable.position.set(3.82, 0, 1.42);
    rightSideTable.rotation.y = 0.35;
    rightSideTable.scale.set(0.82, 0.82, 0.82);
    this.scene.add(rightSideTable);

    [
      { x: -5.45, z: 1.35, s: 1.25 },
      { x: 3.6, z: -2.85, s: 0.85 },
      { x: 4.6, z: 2.35, s: 0.9 },
    ].forEach((plantInfo) => {
      const plant = makePlant(plantInfo.s);
      plant.position.set(plantInfo.x, 0, plantInfo.z);
      this.scene.add(plant);
    });

    const floorCable = makeCable(new THREE.Vector3(-2.2, 0.04, 1.3), new THREE.Vector3(2.8, 0.04, 1.25));
    this.scene.add(floorCable);

    const configs = [
      {
        agent: "监督 Agent",
        role: "supervisor" as const,
        task: "挥舞监督鞭，检查前三个智能体的逻辑闭环",
        x: -4.2,
        z: -0.55,
        y: 0,
        rotation: 0.58,
        color: AGENT_COLORS[3],
      },
      {
        agent: "质量监测 Agent",
        role: "monitor" as const,
        task: "拿着放大镜巡查字段、长度、情绪与上下文",
        x: -3.22,
        z: 1.92,
        y: 0,
        rotation: 0.15,
        color: AGENT_COLORS[1],
      },
      {
        agent: "生成 Agent",
        role: "generator" as const,
        task: "在电脑前敲代码，生成江徽音人格样本",
        x: 0,
        z: 0.62,
        y: 0,
        rotation: Math.PI,
        color: AGENT_COLORS[0],
      },
      {
        agent: "验收 Agent",
        role: "acceptance" as const,
        task: "拿着文件阅读比对，执行 accept/reject",
        x: 3.78,
        z: -0.35,
        y: 0,
        rotation: -0.52,
        color: AGENT_COLORS[2],
      },
    ];

    configs.forEach((config) => {
      const rig = makeChibi(config.color, config.role, config.agent, config.task);
      rig.root.position.set(config.x, config.y, config.z);
      rig.root.rotation.y = config.rotation;
      if (config.role === "generator") {
        rig.keyboard = longDesk.keyboard;
      }
      this.rigs.push(rig);
      this.scene.add(rig.root);
      rig.root.traverse((child) => {
        this.hoverTargets.set(child, rig);
      });
    });

    this.createStagePath([
      new THREE.Vector3(0, 0.08, 1.28),
      new THREE.Vector3(-3.22, 0.08, 2.42),
      new THREE.Vector3(3.78, 0.08, 0.2),
      new THREE.Vector3(-4.2, 0.08, -0.05),
    ]);

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }

  private createStagePath(points: THREE.Vector3[]) {
    points.forEach((point, index) => {
      const beacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.035, 32),
        emissiveMat(AGENT_COLORS[index] ?? 0xffffff, 0.55),
      );
      beacon.position.copy(point);
      this.stageBeacons.push(beacon);
      this.scene.add(beacon);
    });

    for (let i = 0; i < points.length - 1; i += 1) {
      const curve = new THREE.CatmullRomCurve3([
        points[i],
        points[i].clone().lerp(points[i + 1], 0.5).add(new THREE.Vector3(0, 0.035, 0)),
        points[i + 1],
      ]);
      const link = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 32, 0.018, 10, false),
        emissiveMat(0x65e6df, 0.28),
      );
      this.stageLinks.push(link);
      this.scene.add(link);
    }
  }

  private onPointerMove = (event: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.tooltip.style.left = `${event.clientX - rect.left + 18}px`;
    this.tooltip.style.top = `${event.clientY - rect.top + 18}px`;
  };

  private onClick = () => {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObject(this.wallScreen, true);
    if (hits.length > 0) {
      this.options.onScreenOpen();
      return;
    }
    const mascotHits = this.raycaster.intersectObjects(this.rigs.map((rig) => rig.root), true);
    if (mascotHits.length > 0 && !this.busy) {
      this.options.onRun();
    }
  };

  private updateHover() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const targets = [...this.rigs.map((rig) => rig.root), this.wallScreen];
    const hits = this.raycaster.intersectObjects(targets, true);
    if (hits.length === 0) {
      this.tooltip.classList.remove("visible");
      this.renderer.domElement.style.cursor = "default";
      return;
    }
    let object: THREE.Object3D | null = hits[0].object;
    let rig: AgentRig | undefined;
    while (object && !rig) {
      rig = this.hoverTargets.get(object);
      object = object.parent;
    }
    if (!rig) {
      this.tooltip.classList.remove("visible");
      return;
    }
    const event = this.events.find((item) => item.agent === rig.agent);
    this.tooltip.innerHTML = `<strong>${rig.agent}</strong><span>${event?.message ?? rig.task}</span>`;
    this.tooltip.classList.add("visible");
    this.renderer.domElement.style.cursor = rig.agent === "系统大屏" || !this.busy ? "pointer" : "default";
  }

  private animate = () => {
    this.frame += 0.018;
    this.updateHover();

    this.rigs.forEach((rig, index) => {
      const event = this.events.find((item) => item.agent === rig.agent);
      const active = Boolean(event && event.status !== "idle");
      const currentStageAgent = this.events[this.stageIndex - 1]?.agent;
      const spotlighted = currentStageAgent === rig.agent;
      const tempo = active ? 5.4 : 1.5;
      rig.root.position.y =
        rig.baseY + Math.sin(this.frame * tempo + index) * (spotlighted ? 0.07 : active ? 0.028 : 0.012);
      rig.head.rotation.z = Math.sin(this.frame * 2 + index) * 0.035;
      rig.body.scale.setScalar(spotlighted ? 1.08 : 1);

      if (rig.role === "generator") {
        rig.leftHand.position.y = 0.84 + Math.sin(this.frame * 18) * 0.035;
        rig.rightHand.position.y = 0.84 + Math.sin(this.frame * 18 + 1.8) * 0.035;
        if (rig.keyboard) {
          rig.keyboard.scale.x = 1 + Math.sin(this.frame * 12) * 0.018;
        }
      }
      if (rig.role === "monitor") {
        rig.prop.position.x = 0.17 + Math.sin(this.frame * 3.2) * 0.16;
        rig.prop.rotation.z = Math.sin(this.frame * 4) * 0.28;
      }
      if (rig.role === "acceptance" && rig.papers) {
        rig.papers.rotation.y = Math.sin(this.frame * 2.4) * 0.24;
        rig.papers.children.forEach((paper, paperIndex) => {
          paper.rotation.x = Math.sin(this.frame * 4 + paperIndex) * 0.08;
        });
      }
      if (rig.role === "supervisor") {
        rig.prop.rotation.z = -0.3 + Math.sin(this.frame * 5.2) * 0.85;
        rig.rightHand.rotation.z = Math.sin(this.frame * 5.2) * 0.32;
      }
    });

    this.stageBeacons.forEach((beacon, index) => {
      const active = this.stageIndex === index + 1;
      const completed = this.stageIndex > index + 1;
      const scale = active ? 1.35 + Math.sin(this.frame * 8) * 0.18 : completed ? 1.12 : 0.88;
      beacon.scale.set(scale, 1, scale);
      const beaconMaterial = beacon.material as THREE.MeshStandardMaterial;
      beaconMaterial.emissiveIntensity = active ? 1.35 : completed ? 0.75 : 0.22;
    });

    this.stageLinks.forEach((link, index) => {
      const material = link.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = this.stageIndex > index + 1 ? 0.9 : this.stageIndex === index + 1 ? 0.55 : 0.18;
    });

    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame(this.animate);
  };
}
