import { expect, test, describe, spyOn, beforeEach, afterEach } from "bun:test";
import { logger } from "./logger";

describe("Logger", () => {
    const mockDate = "2023-01-01T00:00:00.000Z";
    let dateSpy: any;
    let logSpy: any;
    let warnSpy: any;
    let errorSpy: any;

    beforeEach(() => {
        dateSpy = spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);
        logSpy = spyOn(console, 'log').mockImplementation(() => {});
        warnSpy = spyOn(console, 'warn').mockImplementation(() => {});
        errorSpy = spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        dateSpy.mockRestore();
        logSpy.mockRestore();
        warnSpy.mockRestore();
        errorSpy.mockRestore();
    });

    describe("info", () => {
        test("should log message with info level", () => {
            logger.info("Test message");
            expect(logSpy).toHaveBeenCalledWith(`[${mockDate}] [INFO] Test message`);
        });

        test("should log message with object context", () => {
            const context = { user: "test", id: 123 };
            logger.info("Test message", context);
            expect(logSpy).toHaveBeenCalledWith(`[${mockDate}] [INFO] Test message | Context: ${JSON.stringify(context)}`);
        });

        test("should log message with primitive context", () => {
            logger.info("Test message", "some context");
            expect(logSpy).toHaveBeenCalledWith(`[${mockDate}] [INFO] Test message | Context: some context`);
        });

        test("should handle unserializable object in context", () => {
            const circular: any = {};
            circular.self = circular;
            logger.info("Test message", circular);
            expect(logSpy).toHaveBeenCalledWith(`[${mockDate}] [INFO] Test message | Context: [Unserializable Object]`);
        });
    });

    describe("warn", () => {
        test("should log message with warn level", () => {
            logger.warn("Warning message");
            expect(warnSpy).toHaveBeenCalledWith(`[${mockDate}] [WARN] Warning message`);
        });
    });

    describe("error", () => {
        test("should log message with error level", () => {
            logger.error("Error message");
            expect(errorSpy).toHaveBeenCalledWith(`[${mockDate}] [ERROR] Error message`);
        });

        test("should log message with Error object", () => {
            const error = new Error("Something went wrong");
            // Set a fixed stack for consistency if needed, but normally we just check if it's included
            error.stack = "Error: Something went wrong\n    at Object.<anonymous> (test.ts:1:1)";

            logger.error("Error occurred", error);
            expect(errorSpy).toHaveBeenCalledWith(
                `[${mockDate}] [ERROR] Error occurred | Error: ${error.message}\nStack: ${error.stack}`
            );
        });

        test("should log message with additional context", () => {
            const error = { code: 500 };
            const additional = { attempt: 3 };
            logger.error("Failed again", error, additional);
            expect(errorSpy).toHaveBeenCalledWith(
                `[${mockDate}] [ERROR] Failed again | Context: ${JSON.stringify(error)} | Additional: ${JSON.stringify(additional)}`
            );
        });
    });
});
