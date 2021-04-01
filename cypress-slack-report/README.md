# Cypress Slack Report Action

This action will message slack channels with a cypress report including screenshots and videos

## Inputs

### `tests_passed`

**Required** Boolean for pass or fail

### `test_run_message`

**Required** Message to describe the context the test was executed in

### `slack_token`

**Required** Slack app token

### `channels`

**Required** Slack channels to ping

### `include_media`

**Required** Should screenshots & videos be included in slack report

## Example usages

```yaml
uses: @rigup/github-actions/cypress-slack-report
if: always()
with:
  tests_passed: ${{ job.status == 'success' }}
  test_run_message: Scheduled smoke test
  slack_token:  ${{ secrets.SLACK_TOKEN }}
  channels: team-test-reports
  include_media: ${{ job.status != 'success' }}
```
