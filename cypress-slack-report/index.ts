import * as core from "@actions/core";
import { createReadStream, statSync } from "fs";
import * as https from "https";
import { URL } from "url";
import * as walkSync from "walk-sync";
import { WebClient } from "@slack/web-api";

async function uploadToUrl(uploadUrl: string, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const fileStream = createReadStream(filePath);
    const fileSize = statSync(filePath).size;
    const url = new URL(uploadUrl);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": fileSize
      }
    };

    const req = https.request(options, res => {
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${res.statusCode}`));
      }
      res.resume();
    });

    req.on("error", reject);
    fileStream.pipe(req);
  });
}

async function uploadFileToSlack(
  slack: WebClient,
  filePath: string,
  filename: string,
  channelId: string,
  threadID: string
): Promise<void> {
  const fileSize = statSync(filePath).size;

  const urlResponse = (await slack.apiCall("files.getUploadURLExternal", {
    filename,
    length: fileSize
  })) as unknown as { upload_url: string; file_id: string };

  await uploadToUrl(urlResponse.upload_url, filePath);

  await slack.apiCall("files.completeUploadExternal", {
    files: [{ id: urlResponse.file_id }],
    channel_id: channelId,
    thread_ts: threadID
  });
}

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
          uploadFileToSlack(
            slack,
            `${workdir}/${screenshot}`,
            screenshot,
            channelId,
            threadID
          )
        )
      );
      await Promise.all(
        videos.map(video =>
          uploadFileToSlack(
            slack,
            `${workdir}/${video}`,
            video,
            channelId,
            threadID
          )
        )
      );
      await Promise.all(
        logs.map(log =>
          uploadFileToSlack(
            slack,
            `${workdir}/${log}`,
            log,
            channelId,
            threadID
          )
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
