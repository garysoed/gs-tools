/**
 * Wrapper around `console.log`.
 *
 * This adds namespace to the start of every log. You can also enable / disable logging using the
 * [[setEnabled]] method.
 */
class Log {
  private static ENABLED_: boolean = true;

  private namespace_: string;

  /**
   * @param namespace Namespace of the log messages.
   */
  constructor(namespace: string) {
    this.namespace_ = namespace;
  }

  private callIfEnabled_(fn: (message: string) => void, message: string): void {
    if (Log.ENABLED_) {
      fn(`[${this.namespace_}] ${message}`);
    }
  }

  /**
   * Logs info message.
   *
   * @param message The message to log.
   */
  info(message: string): void {
    this.callIfEnabled_(console.info.bind(console), message);
  }

  /**
   * Enables / disables logging.
   *
   * @param enabled True iff logging should be enabled.
   */
  static setEnabled(enabled: boolean): void {
    Log.ENABLED_ = enabled;
  }
}

export default Log;
