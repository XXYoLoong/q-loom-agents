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

import { useEffect, useRef } from "react";
import type { AgentEvent } from "../lib/types";
import { ThreeConsole } from "./ThreeConsole";

interface AgentConsoleProps {
  events: AgentEvent[];
}

export function AgentConsole({ events }: AgentConsoleProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const consoleRef = useRef<ThreeConsole | null>(null);

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }
    consoleRef.current = new ThreeConsole(hostRef.current);
    return () => consoleRef.current?.dispose();
  }, []);

  useEffect(() => {
    consoleRef.current?.setEvents(events);
  }, [events]);

  return <div className="scene" ref={hostRef} aria-label="四智能体 3D 状态控制台" />;
}

