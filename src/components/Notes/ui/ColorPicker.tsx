/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { JSX } from "react";

import "./ColorPicker.css";

import { calculateZoomLevel } from "@lexical/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import * as React from "react";

import TextInput from "./TextInput";

let skipAddingToHistoryStack = false;

interface ColorPickerProps {
  color: string;
  onChange?: (value: string, skipHistoryStack: boolean) => void;
}

export function parseAllowedColor(input: string) {
  return /^rgb\(\d+, \d+, \d+\)$/.test(input) ? input : "";
}

// Import color utilities
import { transformColor, Position, clamp } from "./ColorPickerUtils";

const basicColors = [
  "#d0021b",
  "#f5a623",
  "#f8e71c",
  "#8b572a",
  "#7ed321",
  "#417505",
  "#bd10e0",
  "#9013fe",
  "#4a90e2",
  "#50e3c2",
  "#b8e986",
  "#000000",
  "#4a4a4a",
  "#9b9b9b",
  "#ffffff",
];

const WIDTH = 214;
const HEIGHT = 150;

export default function ColorPicker({
  color,
  onChange,
}: Readonly<ColorPickerProps>): JSX.Element {
  const [selfColor, setSelfColor] = useState(transformColor("hex", color));
  const [inputColor, setInputColor] = useState(color);
  const innerDivRef = useRef(null);

  const saturationPosition = useMemo(
    () => ({
      x: (selfColor.hsv.s / 100) * WIDTH,
      y: ((100 - selfColor.hsv.v) / 100) * HEIGHT,
    }),
    [selfColor.hsv.s, selfColor.hsv.v],
  );

  const huePosition = useMemo(
    () => ({
      x: (selfColor.hsv.h / 360) * WIDTH,
    }),
    [selfColor.hsv],
  );

  const onSetHex = (hex: string) => {
    setInputColor(hex);
    if (/^#[0-9A-Fa-f]{6}$/i.test(hex)) {
      const newColor = transformColor("hex", hex);
      setSelfColor(newColor);
    }
  };

  const onMoveSaturation = ({ x, y }: Position) => {
    const newHsv = {
      ...selfColor.hsv,
      s: (x / WIDTH) * 100,
      v: 100 - (y / HEIGHT) * 100,
    };
    const newColor = transformColor("hsv", newHsv);
    setSelfColor(newColor);
    setInputColor(newColor.hex);
  };

  const onMoveHue = ({ x }: Position) => {
    const newHsv = { ...selfColor.hsv, h: (x / WIDTH) * 360 };
    const newColor = transformColor("hsv", newHsv);

    setSelfColor(newColor);
    setInputColor(newColor.hex);
  };

  useEffect(() => {
    // Check if the dropdown is actually active
    if (innerDivRef.current !== null && onChange) {
      onChange(selfColor.hex, skipAddingToHistoryStack);
      setInputColor(selfColor.hex);
    }
  }, [selfColor, onChange]);

  useEffect(() => {
    if (color === undefined) {
      return;
    }
    const newColor = transformColor("hex", color);
    setSelfColor(newColor);
    setInputColor(newColor.hex);
  }, [color]);

  return (
    <div
      className="color-picker-wrapper"
      style={{ width: WIDTH }}
      ref={innerDivRef}
    >
      <TextInput label="Hex" onChange={onSetHex} value={inputColor} />
      <div className="color-picker-basic-color">
        {basicColors.map((basicColor) => (
          <button
            className={basicColor === selfColor.hex ? " active" : ""}
            key={basicColor}
            style={{ backgroundColor: basicColor }}
            onClick={() => {
              setInputColor(basicColor);
              setSelfColor(transformColor("hex", basicColor));
            }}
          />
        ))}
      </div>
      <MoveWrapper
        className="color-picker-saturation"
        style={{ backgroundColor: `hsl(${selfColor.hsv.h}, 100%, 50%)` }}
        onChange={onMoveSaturation}
      >
        <div
          className="color-picker-saturation_cursor"
          style={{
            backgroundColor: selfColor.hex,
            left: saturationPosition.x,
            top: saturationPosition.y,
          }}
        />
      </MoveWrapper>
      <MoveWrapper className="color-picker-hue" onChange={onMoveHue}>
        <div
          className="color-picker-hue_cursor"
          style={{
            backgroundColor: `hsl(${selfColor.hsv.h}, 100%, 50%)`,
            left: huePosition.x,
          }}
        />
      </MoveWrapper>
      <div
        className="color-picker-color"
        style={{ backgroundColor: selfColor.hex }}
      />
    </div>
  );
}

// Position interface is now imported from ColorPickerUtils

interface MoveWrapperProps {
  className?: string;
  style?: React.CSSProperties;
  onChange: (position: Position) => void;
  children: JSX.Element;
}

function MoveWrapper({
  className,
  style,
  onChange,
  children,
}: MoveWrapperProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);

  const move = (e: React.MouseEvent | MouseEvent): void => {
    if (divRef.current) {
      const { current: div } = divRef;
      const { width, height, left, top } = div.getBoundingClientRect();
      const zoom = calculateZoomLevel(div);
      const x = clamp(e.clientX / zoom - left, width, 0);
      const y = clamp(e.clientY / zoom - top, height, 0);

      onChange({ x, y });
    }
  };

  const onMouseDown = (e: React.MouseEvent): void => {
    if (e.button !== 0) {
      return;
    }

    move(e);

    const onMouseMove = (_e: MouseEvent): void => {
      draggedRef.current = true;
      skipAddingToHistoryStack = true;
      move(_e);
    };

    const onMouseUp = (_e: MouseEvent): void => {
      if (draggedRef.current) {
        skipAddingToHistoryStack = false;
      }

      document.removeEventListener("mousemove", onMouseMove, false);
      document.removeEventListener("mouseup", onMouseUp, false);

      move(_e);
      draggedRef.current = false;
    };

    document.addEventListener("mousemove", onMouseMove, false);
    document.addEventListener("mouseup", onMouseUp, false);
  };

  return (
    <div
      ref={divRef}
      className={className}
      style={style}
      onMouseDown={onMouseDown}
    >
      {children}
    </div>
  );
}

// Removed color utility functions to ColorPickerUtils.ts
