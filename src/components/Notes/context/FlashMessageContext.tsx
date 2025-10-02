/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { JSX } from "react";

import { ReactNode, useCallback, useEffect, useState } from "react";

import FlashMessage from "../ui/FlashMessage";
import { FLASH_MESSAGE_CONSTANTS } from "./flashMessageConstants";
import { createContext } from "react";

export type ShowFlashMessage = (
  message?: React.ReactNode,
  duration?: number,
) => void;

// Create context directly here to avoid circular dependency
export const FlashMessageContextInstance = createContext<
  ShowFlashMessage | undefined
>(undefined);
const { INITIAL_STATE, DEFAULT_DURATION } = FLASH_MESSAGE_CONSTANTS;

export const FlashMessageProvider = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element => {
  const [props, setProps] = useState(INITIAL_STATE);
  const showFlashMessage = useCallback<ShowFlashMessage>(
    (message, duration) =>
      setProps(message ? { duration, message } : INITIAL_STATE),
    [],
  );
  useEffect(() => {
    if (props.message) {
      const timeoutId = setTimeout(
        () => setProps(INITIAL_STATE),
        props.duration ?? DEFAULT_DURATION,
      );
      return () => clearTimeout(timeoutId);
    }
  }, [props]);
  return (
    <FlashMessageContextInstance.Provider value={showFlashMessage}>
      {children}
      {props.message && <FlashMessage>{props.message}</FlashMessage>}
    </FlashMessageContextInstance.Provider>
  );
};

// Define hook here to avoid circular dependency
import { useContext } from "react";

export const useFlashMessageContext = (): ShowFlashMessage => {
  const ctx = useContext(FlashMessageContextInstance);
  if (!ctx) {
    throw new Error("Missing FlashMessageContext");
  }
  return ctx;
};

// Export FlashMessageContext component as default for backwards compatibility
export default FlashMessageProvider;
