import { LogLevel, makeConsoleLogger } from "./logging"


const logger = makeConsoleLogger("sync-to-notion")

/**
 * Merge two blocks into a single blocks.
 *
 * @param existingBlocks
 * @param newBlocks
 * @param appendBlocks
 * @param deleteBlock
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mergeBlocks(existingBlocks: any[], newBlocks: any[], appendBlocks: (blocks: any[], after?: any) => void, deleteBlock: (_: any) => void) {

  let existingIndex = 0;
  let newIndex = 0;
  let appendIndex = -1;
  let afterIndex = -1;
  while (existingIndex < existingBlocks.length || newIndex < newBlocks.length) {
    if (existingIndex >= existingBlocks.length) {
      appendBlocks(newBlocks.slice(newIndex), afterIndex === -1 ? null : existingBlocks[afterIndex])
      break
    }
    if (compareBlock(existingBlocks[existingIndex], newBlocks[newIndex])) {
      if (appendIndex !== -1) {
        appendBlocks(newBlocks.slice(appendIndex, newIndex), existingIndex === 0 ? null : existingBlocks[afterIndex])
        appendIndex = -1;
      }
      existingIndex++;
      newIndex++;
      afterIndex++
    } else {
      if (appendIndex === -1) appendIndex = newIndex;
      newIndex++;

      if (newIndex >= newBlocks.length) {
        deleteBlock(existingBlocks[existingIndex]);
        newIndex = appendIndex;
        appendIndex = -1;
        existingIndex++;
      }
    }
  }
}

// Function to compare two blocks after filtering block1
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function compareBlock(targetBlock: any, baseBlock: any): boolean {

  logger(LogLevel.DEBUG, "comparing block", { targetBlock, baseBlock })
  // Function to deeply compare two objects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  function deepCompare(targetObject: any, baseObject: any): boolean {

    if (typeof targetObject !== 'object' || targetObject === null || baseObject === null) {
      const compareObject = baseObject === undefined ? baseObject = null : baseObject
      logger(LogLevel.DEBUG, "comparing", { targetObject, compareObject, equals: targetObject === compareObject })
      if (targetObject === undefined && compareObject === null) return true;
      if (targetObject === undefined && compareObject === 'url') return true;
      return targetObject === compareObject;
    }

    const baseKeys = Object.keys(baseObject);

    for (const key of baseKeys) {
      if (!deepCompare(targetObject[key], baseObject[key])) return false;
    }

    return true;
  }

  return deepCompare(targetBlock, baseBlock);
}