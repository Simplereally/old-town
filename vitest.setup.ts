// Deterministic test environment.
// Pin the timezone to UTC so any date/time-derived logic is reproducible across machines.
// (Locale-sensitive formatting should pass explicit locales rather than rely on the host.)
process.env.TZ = "UTC";
