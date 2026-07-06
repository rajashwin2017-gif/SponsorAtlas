import { NextResponse } from "next/server";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Central catch-all for route handlers: known ApiErrors surface their message,
// anything else is logged server-side and returned as a generic 500 so
// internal details (stack traces, DB errors) never leak to the client.
export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return errorResponse(err.message, err.status);
  }
  console.error("Unhandled API error:", err);
  return errorResponse("Something went wrong. Please try again.", 500);
}
