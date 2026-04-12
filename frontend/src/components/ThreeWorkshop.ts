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
  floor: 0xdfe8e4,
  backWall: 0xc8d9d4,
  sideWall: 0xb6cbc6,
  beam: 0x5d7778,
  wood: 0x9c7a5b,
  ink: 0x17212b,
  glass: 0x88d4d2,
  screen: 0x102a2e,
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

  for (let i = 0; i < 5; i += 1) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.025, 8), mat(0xc8d3d0));
    stripe.position.set(-4.8 + i * 2.4, 0.002, 0);
    scene.add(stripe);
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
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 32, 24), skin);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.285, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(0x34424a));
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.35, 8, 20), mat(color));
  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 10), skin);
  const rightHand = leftHand.clone();
  const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.019, 10, 8), mat(ROOM.ink));
  const eye2 = eye1.clone();

  head.position.set(0, 1.08, 0.14);
  hair.position.copy(head.position).add(new THREE.Vector3(0, 0.08, 0));
  body.position.set(0, 0.67, 0.15);
  leftHand.position.set(-0.25, 0.84, 0.38);
  rightHand.position.set(0.25, 0.84, 0.38);
  eye1.position.set(-0.078, 1.09, 0.395);
  eye2.position.set(0.078, 1.09, 0.395);
  root.add(body, head, hair, leftHand, rightHand, eye1, eye2);

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
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  ctx.fillStyle = "#0d262a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#79f2dc";
  ctx.font = "700 54px Microsoft YaHei, sans-serif";
  ctx.fillText("Q-Loom 运行大屏", 46, 78);
  ctx.font = "28px Microsoft YaHei, sans-serif";
  ctx.fillStyle = busy ? "#ffd36b" : "#bdf7ee";
  ctx.fillText(busy ? "状态：闭环运行中" : "状态：待命 / 点击大屏查看详情", 48, 128);

  events.forEach((event, index) => {
    const y = 190 + index * 82;
    ctx.fillStyle = ["#61a9ff", "#5ecf99", "#e6b84c", "#e87e9f"][index] ?? "#ffffff";
    ctx.fillRect(48, y, Math.max(16, event.progress * 5.6), 18);
    ctx.fillStyle = "#f4fffb";
    ctx.font = "700 28px Microsoft YaHei, sans-serif";
    ctx.fillText(`${event.agent}  ${event.progress}%`, 48, y - 12);
    ctx.font = "22px Microsoft YaHei, sans-serif";
    ctx.fillStyle = "#cfeee8";
    ctx.fillText(event.message.slice(0, 34), 48, y + 52);
  });

  ctx.fillStyle = "#f8fff9";
  ctx.font = "24px Microsoft YaHei, sans-serif";
  const decision = result?.acceptance?.acceptance_decision ?? "pending";
  ctx.fillText(`验收：${decision}`, 48, 560);
  ctx.fillText("点击大屏：全屏查看 / 交互切换", 48, 606);
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

  setState(events: AgentEvent[], result: AgentRunResponse | null, busy: boolean) {
    this.events = events;
    this.result = result;
    this.busy = busy;
    drawStatusTexture(this.screenCanvas, this.events, this.result, this.busy);
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
    this.scene.background = new THREE.Color(0xcbdad6);
    this.camera.position.set(0, 3.15, 6.4);
    this.camera.lookAt(0, 1.35, -1.4);

    const ambient = new THREE.HemisphereLight(0xffffff, 0x82928f, 2.15);
    const key = new THREE.DirectionalLight(0xffffff, 2.9);
    key.position.set(4, 5.5, 4.5);
    key.castShadow = true;
    this.scene.add(ambient, key);
    makeRoom(this.scene);

    this.wallScreen.position.set(0, 2.35, -3.86);
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

    const configs = [
      {
        agent: "生成 Agent",
        role: "generator" as const,
        task: "在电脑前敲代码，生成江徽音人格样本",
        x: -3.5,
        z: -0.9,
        color: AGENT_COLORS[0],
      },
      {
        agent: "质量监测 Agent",
        role: "monitor" as const,
        task: "拿着放大镜巡查字段、长度、情绪与上下文",
        x: -1.2,
        z: 0.15,
        color: AGENT_COLORS[1],
      },
      {
        agent: "验收 Agent",
        role: "acceptance" as const,
        task: "翻阅文件，比对评分后执行 accept/reject",
        x: 1.2,
        z: 0.15,
        color: AGENT_COLORS[2],
      },
      {
        agent: "监督 Agent",
        role: "supervisor" as const,
        task: "挥舞监督鞭，检查前三个智能体的逻辑闭环",
        x: 3.5,
        z: -0.9,
        color: AGENT_COLORS[3],
      },
    ];

    configs.forEach((config, index) => {
      const desk = makeDesk(config.color);
      desk.group.position.set(config.x, 0, config.z);
      desk.group.rotation.y = index < 2 ? -0.18 : 0.18;
      this.scene.add(desk.group);

      const rig = makeChibi(config.color, config.role, config.agent, config.task);
      rig.root.position.set(config.x, 0, config.z + 0.45);
      rig.root.rotation.y = index < 2 ? -0.1 : 0.1;
      rig.keyboard = desk.keyboard;
      this.rigs.push(rig);
      this.scene.add(rig.root);
      rig.root.traverse((child) => {
        this.hoverTargets.set(child, rig);
      });
    });
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
      const tempo = active ? 5.4 : 1.5;
      rig.root.position.y = rig.baseY + Math.sin(this.frame * tempo + index) * (active ? 0.028 : 0.012);
      rig.head.rotation.z = Math.sin(this.frame * 2 + index) * 0.035;

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

    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame(this.animate);
  };
}

