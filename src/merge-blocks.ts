/* eslint-disable @typescript-eslint/no-explicit-any */

import { LogLevel, makeConsoleLogger } from "./logging"

const logger = makeConsoleLogger("merge-blocks")

/**
 * Determines append or delete action to existing blocks to merge new blocks to existing blocks,
 *
 * @param existingBlocks
 * @param newBlocks
 * @param appendBlocks
 * @param deleteBlock
 */
export async function mergeBlocks(
  existingBlocks: any[],
  newBlocks: any[],
  appendBlocks: (blocks: any[], after?: any) => Promise<void>,
  deleteBlock: (_: any) => Promise<void>
) {
  let existingIndex = 0
  let newIndex = 0
  let appendIndex = -1
  let afterIndex = -1

  while (existingIndex < existingBlocks.length || newIndex < newBlocks.length) {
    if (existingIndex >= existingBlocks.length) {
      await appendBlocks(
        newBlocks.slice(newIndex),
        afterIndex === -1 ? null : existingBlocks[afterIndex]
      )
      break
    }

    const same = compareBlock(
      existingBlocks[existingIndex],
      newBlocks[newIndex]
    )
    logger(LogLevel.DEBUG, "comparing block", {
      same,
      existingIndex,
      newIndex,
      existing: existingBlocks[existingIndex],
      newBlock: newBlocks[newIndex],
    })
    if (same) {
      if (appendIndex !== -1) {
        await appendBlocks(
          newBlocks.slice(appendIndex, newIndex),
          existingIndex === 0 ? null : existingBlocks[afterIndex]
        )
        appendIndex = -1
      }
      existingIndex++
      newIndex++
      afterIndex++
    } else {
      if (appendIndex === -1) appendIndex = newIndex
      newIndex++
      if (newIndex >= newBlocks.length) {
        await deleteBlock(existingBlocks[existingIndex])
        newIndex = appendIndex
        appendIndex = -1
        existingIndex++
      }
    }
  }
}

export function compareBlock(targetBlock: any, baseBlock: any): boolean {
  logger(LogLevel.DEBUG, "comparing block", { targetBlock, baseBlock })
  if (!baseBlock) return false
  // Function to deeply compare two objects
  function deepCompare(targetObject: any, baseObject: any): boolean {
    if (
      typeof targetObject !== "object" ||
      targetObject === null ||
      baseObject === null
    ) {
      const compareObject =
        baseObject === undefined ? (baseObject = null) : baseObject
      logger(LogLevel.DEBUG, "comparing", {
        targetObject,
        compareObject,
        equals: targetObject === compareObject,
      })
      if (targetObject === undefined && compareObject === null) return true
      return targetObject === compareObject
    }

    logger(LogLevel.DEBUG, "comparing block", { targetBlock, baseBlock })
    const baseKeys = Object.keys(baseObject)

    for (const key of baseKeys) {
      // Skip comparing url type which is not present in the target object
      if (baseObject[key] === "url" && key === "type") return true
      if (!!targetObject[key] !== !!baseObject[key]) return false
      if (!deepCompare(targetObject[key], baseObject[key])) return false
    }

    return true
  }

  return deepCompare(targetBlock, baseBlock)
}
