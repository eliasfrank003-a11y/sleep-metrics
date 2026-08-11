/** One tracked sleep event, straight from the calendar. */
export interface SleepSession {
  id: number;
  /** Google Calendar event id. The unique key that makes re-syncing a no-op. */
  external_id: string;
  started_at: string;
  ended_at: string;
  /**
   * The night this belongs to, named after the evening it began. A session that
   * starts at 01:30 belongs to the previous evening's night, not its own date -
   * see `nightOf` in lib/sleep.
   */
  night_of: string;
}
