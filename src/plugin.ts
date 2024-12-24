import { Octokit } from "@octokit/rest";
import { LogLevel, Logs } from "@ubiquity-dao/ubiquibot-logger";
import { decideHandler as decideHandler } from "./handlers/decide-handler";
import { Context, Env, PluginInputs } from "./types";
import { isIssueCommentEvent } from "./types/typeguards";

/**
 * The main plugin function. Split for easier testing.
 */
export async function runPlugin(context: Context) {
  const { logger, eventName } = context;

  if (isIssueCommentEvent(context)) {
    return await decideHandler(context);
  }

  logger.error(`Unsupported event: ${eventName}`);
}

/**
 * How a worker executes the plugin.
 */
export async function plugin(inputs: PluginInputs, env: Env) {
  const octokit = new Octokit({ auth: inputs.authToken });

  const context: Context = {
    eventName: inputs.eventName,
    payload: inputs.eventPayload,
    config: inputs.settings,
    octokit,
    env,
    logger: new Logs("info" as LogLevel),
  };

  /**
   * NOTICE: Consider non-database storage solutions unless necessary
   *
   * Initialize storage adapters here. For example, to use Supabase:
   *
   * import { createClient } from "@supabase/supabase-js";
   *
   * const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
   * context.adapters = createAdapters(supabase, context);
   */

  await runPlugin(context);
}
