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
import type { AgentEvent, AgentRunResponse } from "../lib/types";
import { ThreeWorkshop } from "./ThreeWorkshop";

interface WorkshopConsoleProps {
  busy: boolean;
  events: AgentEvent[];
  result: AgentRunResponse | null;
  onRun: () => void;
  onScreenOpen: () => void;
}

export function WorkshopConsole({
  busy,
  events,
  result,
  onRun,
  onScreenOpen,
}: WorkshopConsoleProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const workshopRef = useRef<ThreeWorkshop | null>(null);
  const onRunRef = useRef(onRun);
  const onScreenOpenRef = useRef(onScreenOpen);

  onRunRef.current = onRun;
  onScreenOpenRef.current = onScreenOpen;

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }
    workshopRef.current = new ThreeWorkshop(hostRef.current, {
      onRun: () => onRunRef.current(),
      onScreenOpen: () => onScreenOpenRef.current(),
    });
    return () => workshopRef.current?.dispose();
  }, []);

  useEffect(() => {
    workshopRef.current?.setState(events, result, busy);
  }, [busy, events, result]);

  return <div className="workshopScene" ref={hostRef} aria-label="全 3D 智能体工作坊" />;
}

