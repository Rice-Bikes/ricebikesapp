/**
 * Constants for the Flash Message Context
 * Extracted to separate file to avoid React Fast Refresh warnings
 */

import { ReactNode } from "react";

export interface FlashMessageProps {
  message?: ReactNode;
  duration?: number;
}

export const FLASH_MESSAGE_PROPS_TYPE: FlashMessageProps =
  {} as FlashMessageProps;

export const FLASH_MESSAGE_CONSTANTS = {
  INITIAL_STATE: {} as FlashMessageProps,
  DEFAULT_DURATION: 1000,
};
