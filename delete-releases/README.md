# Delete Releases Action

This action deletes all releases before a provided commit.

## Inputs

### `commit`

**Required** Commit hash indicating the start point for deleting Releases

### `github_token`

**Required** Github access token

### `prerelease_only`

Only delete prereleases. Defaults to false.

## Example usages

```yaml
uses: @rigup/github-actions/delete-releases
with:
  commit: ${{ github.ref }}
  github_token: ${{ secrets.GITHUB_TOKEN }} # This is provided by GitHub and doesn't need to be set
```

```yaml
uses: @rigup/github-actions/delete-releases
with:
  commit: ${{ github.ref }}
  github_token: ${{ secrets.GITHUB_TOKEN }} # This is provided by GitHub and doesn't need to be set
  prerelease_only: true
```
