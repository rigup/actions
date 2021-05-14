import * as core from "@actions/core";
import { createReadStream } from "fs";
import * as walkSync from "walk-sync";
import { WebClient } from "@slack/web-api";

async function run(): Promise<void> {
  try {
    const tests_passed = core.getInput("tests_passed") === "true";
    const test_run_message = core.getInput("test_run_message");
    const slack_token = core.getInput("slack_token");
    const channels = core.getInput("channels");
    const include_media = core.getInput("include_media") === "true";
    const workdir = core.getInput("workdir") || "cypress";

    const slack = new WebClient(slack_token);
    const videos = walkSync(workdir, { globs: ["**/*.mp4"] });
    const screenshots = walkSync(workdir, { globs: ["**/*.png"] });
    const logs = walkSync(workdir, { globs: ["**/*.txt"] });

    core.debug("Sending initial slack message");
    const result = await slack.chat.postMessage({
      text: `${test_run_message}`,
      channel: channels
    });

    const threadID = result.ts as string;
    const channelId = result.channel as string;
    if (include_media) {
      await Promise.all(
        screenshots.map(screenshot =>
          slack.files.upload({
            filename: screenshot,
            file: createReadStream(`${workdir}/${screenshot}`),
            thread_ts: threadID,
            channels: channelId
          })
        )
      );
      await Promise.all(
        videos.map(video =>
          slack.files.upload({
            filename: video,
            file: createReadStream(`${workdir}/${video}`),
            thread_ts: threadID,
            channels: channelId
          })
        )
      );
      await Promise.all(
        logs.map(log =>
          slack.files.upload({
            filename: log,
            file: createReadStream(`${workdir}/${log}`),
            thread_ts: threadID,
            channels: channelId
          })
        )
      );
    }
    await slack.chat.update({
      ts: threadID,
      channel: channelId,
      text:
        (tests_passed ? "✅ Passed" : "‼️ Failed") +
        " - " +
        (test_run_message || "No test run message provided")
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
