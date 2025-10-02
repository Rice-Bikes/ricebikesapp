/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// This file is kept to avoid breaking imports in other files
// The actual implementation has been moved to FlashMessageContext.tsx
// to avoid circular dependencies

import {
  FlashMessageProvider,
  FlashMessageContextInstance as ContextInstance,
  useFlashMessageContext as useContextFromMain,
} from "./FlashMessageContext";

// Re-export from main file
export const useFlashMessageContext = useContextFromMain;
export const FlashMessageContextInstance = ContextInstance;
export const FlashMessageContext = FlashMessageProvider;

// No context is created in this file anymore
