import { LogLevel, logLevelSeverity } from "../src/logging"

describe("logging", () => {
  it("logLevelSeverity", async () => {
    expect(logLevelSeverity(LogLevel.DEBUG)).toBe(20)
    expect(logLevelSeverity(LogLevel.INFO)).toBe(40)
    expect(logLevelSeverity(LogLevel.WARN)).toBe(60)
    expect(logLevelSeverity(LogLevel.ERROR)).toBe(80)
  })
})
