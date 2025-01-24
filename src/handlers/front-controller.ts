import { Context } from "../types";
import { sayHello } from "./say-hello";

/**
 * NOTICE: Remove this file or use it as a template for your own plugins.
 *
 * This encapsulates the logic for a plugin if the only thing it does is say "Hello, world!".
 *
 * Try it out by running your local kernel worker and running the `yarn worker` command.
 * Comment on an issue in a repository where your GitHub App is installed and see the magic happen!
 *
 * Logger examples are provided to show how to log different types of data.
 */
export async function delegate(context: Context) {
  const { logger, payload, octokit } = context;

  const sender = payload.comment.user?.login;
  const repo = payload.repository.name;
  const issueNumber = payload.issue.number;
  const owner = payload.repository.owner.login;
  const body = payload.comment.body;

  logger.debug(`Executing decideHandler:`, { sender, repo, issueNumber, owner });

  const targetUser = body.match(/^\B@([a-z0-9](?:-(?=[a-z0-9])|[a-z0-9]){0,38}(?<=[a-z0-9]))/i);
  if (!targetUser) {
    logger.error(`Missing target username from comment: ${body}`);
    return;
  }
  const personalAgentOwner = targetUser[0].replace("@", "");

  logger.info(`Comment received:`, { owner, personalAgentOwner, comment: body });

  let reply;

  if (body.match(/^\B@([a-z0-9](?:-(?=[a-z0-9])|[a-z0-9]){0,38}(?<=[a-z0-9]))\s+say\s+hello$/i)) {
    reply = sayHello();
  } else {
    reply = "I could not understand your comment to give you a quick response. I will get back to you later.";
    logger.error(`Invalid command.`, { body });
  }

  const replyWithQuote = ["> ", `${body}`, "\n\n", reply].join("");

  try {
    await octokit.issues.createComment({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: payload.issue.number,
      body: replyWithQuote,
    });
  } catch (error) {
    /**
     * logger.fatal should not be used in 9/10 cases. Use logger.error instead.
     *
     * Below are examples of passing error objects to the logger, only one is needed.
     */
    if (error instanceof Error) {
      logger.error(`Error creating comment:`, { error: error, stack: error.stack });
      throw error;
    } else {
      logger.error(`Error creating comment:`, { err: error, error: new Error() });
      throw error;
    }
  }

  logger.ok(`Comment created: ${reply}`);
  logger.verbose(`Exiting decideHandler`);
}
