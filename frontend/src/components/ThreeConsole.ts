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
import type { AgentEvent } from "../lib/types";

const COLORS = {
  generator: 0x6fb7ff,
  monitor: 0x65d6a3,
  acceptance: 0xf5c75d,
  supervisor: 0xe987a5,
  floor: 0xf2f6f7,
  ink: 0x1f2933,
};

interface MascotRig {
  root: THREE.Group;
  head: THREE.Mesh;
  body: THREE.Mesh;
  halo: THREE.Mesh;
  task: THREE.Mesh;
  baseY: number;
}

function material(color: number, roughness = 0.72): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.08 });
}

function makeMascot(color: number, taskShape: "pen" | "lens" | "stamp" | "orb"): MascotRig {
  const root = new THREE.Group();
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 24), material(0xffdfc8));
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.44, 8, 24), material(color));
  const leftEar = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), material(color));
  const rightEar = leftEar.clone();
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), material(COLORS.ink));
  const rightEye = leftEye.clone();
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.015, 8, 48),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35 }),
  );

  head.position.y = 0.78;
  body.position.y = 0.24;
  leftEar.position.set(-0.34, 1.1, 0);
  rightEar.position.set(0.34, 1.1, 0);
  leftEye.position.set(-0.13, 0.84, 0.39);
  rightEye.position.set(0.13, 0.84, 0.39);
  halo.position.y = 0.55;
  halo.rotation.x = Math.PI / 2;

  const task = makeTaskProp(taskShape, color);
  task.position.set(0, 0.35, 0.62);
  root.add(body, head, leftEar, rightEar, leftEye, rightEye, halo, task);
  return { root, head, body, halo, task, baseY: 0 };
}

function makeTaskProp(shape: "pen" | "lens" | "stamp" | "orb", color: number): THREE.Mesh {
  if (shape === "pen") {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 16), material(color));
    mesh.rotation.z = Math.PI / 6;
    return mesh;
  }
  if (shape === "lens") {
    return new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.026, 12, 32), material(color));
  }
  if (shape === "stamp") {
    return new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.28), material(color));
  }
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 24, 16),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.45 }),
  );
}

export class ThreeConsole {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  private renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  private rigs: MascotRig[] = [];
  private frame = 0;
  private events: AgentEvent[] = [];
  private animationId = 0;

  constructor(private host: HTMLElement) {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.host.appendChild(this.renderer.domElement);
    this.createScene();
    this.resize();
    window.addEventListener("resize", this.resize);
    this.animate();
  }

  setEvents(events: AgentEvent[]) {
    this.events = events;
  }

  dispose() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener("resize", this.resize);
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
    this.scene.background = new THREE.Color(0xeef4f3);
    this.camera.position.set(0, 3.15, 6.8);
    this.camera.lookAt(0, 0.45, 0);

    const ambient = new THREE.HemisphereLight(0xffffff, 0xb8c7c4, 2.1);
    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(3, 5, 4);
    key.castShadow = true;
    this.scene.add(ambient, key);

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(3.7, 3.95, 0.28, 96),
      material(COLORS.floor, 0.84),
    );
    platform.position.y = -0.18;
    platform.receiveShadow = true;
    this.scene.add(platform);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.72, 0.018, 12, 96),
      new THREE.MeshStandardMaterial({ color: 0x5ca3a8, emissive: 0x5ca3a8, emissiveIntensity: 0.45 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.03;
    this.scene.add(ring);

    const configs = [
      { color: COLORS.generator, shape: "pen" as const, angle: -2.35 },
      { color: COLORS.monitor, shape: "lens" as const, angle: -0.78 },
      { color: COLORS.acceptance, shape: "stamp" as const, angle: 0.78 },
      { color: COLORS.supervisor, shape: "orb" as const, angle: 2.35 },
    ];

    configs.forEach((config) => {
      const rig = makeMascot(config.color, config.shape);
      rig.root.position.set(Math.cos(config.angle) * 2.15, 0, Math.sin(config.angle) * 1.32);
      rig.root.rotation.y = -config.angle + Math.PI / 2;
      this.rigs.push(rig);
      this.scene.add(rig.root);
    });
  }

  private animate = () => {
    this.frame += 0.018;
    this.rigs.forEach((rig, index) => {
      const event = this.events[index];
      const active = event && event.status !== "idle";
      const pulse = active ? Math.sin(this.frame * 5 + index) * 0.08 : Math.sin(this.frame + index) * 0.025;
      rig.root.position.y = rig.baseY + pulse;
      rig.head.rotation.z = Math.sin(this.frame * 2 + index) * 0.04;
      rig.halo.scale.setScalar(active ? 1.05 + Math.sin(this.frame * 6) * 0.05 : 0.92);
      rig.task.rotation.y += active ? 0.045 : 0.012;
      rig.body.scale.y = active ? 1 + Math.sin(this.frame * 5 + index) * 0.025 : 1;
    });

    this.scene.rotation.y = Math.sin(this.frame * 0.28) * 0.08;
    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame(this.animate);
  };
}
