param(
  [Parameter(Mandatory=$true)][string]$SummaryPath,
  [Parameter(Mandatory=$true)][string]$ArtifactDirectory,
  [Parameter(Mandatory=$true)][string]$DashboardUrl,
  [Parameter(Mandatory=$true)][string]$UploadSecret
)

$ErrorActionPreference = 'Stop'
$summary = Get-Content -Raw -LiteralPath $SummaryPath | ConvertFrom-Json
$baseUrl = $DashboardUrl.TrimEnd('/')
$headers = @{ Authorization = "Bearer $UploadSecret" }
$functionalStatus = if ($summary.functional_status) { [string]$summary.functional_status } else { [string]$summary.overall_functional }
$compatibilityStatus = if ($summary.compatibility_status) { [string]$summary.compatibility_status } else { [string]$summary.overall_compatibility }
$status = if ($compatibilityStatus) { $compatibilityStatus } else { $functionalStatus }
if (-not $summary.run_id -or -not $summary.environment -or -not $functionalStatus) { throw 'summary.json is missing run_id, environment, or functional status.' }
$paths = [System.Collections.Generic.List[string]]::new()

Get-ChildItem -LiteralPath $ArtifactDirectory -Recurse -File | ForEach-Object {
  if ($_.FullName -eq (Resolve-Path -LiteralPath $SummaryPath).Path) { return }
  $relative = ($_.FullName.Substring((Resolve-Path -LiteralPath $ArtifactDirectory).Path.Length) -replace '^[\\/]+','') -replace '\\','/'
  $uploadHeaders = $headers.Clone()
  $uploadHeaders['x-run-id'] = [string]$summary.run_id
  $uploadHeaders['x-run-status'] = $status
  $uploadHeaders['x-relative-path'] = $relative
  $response = Invoke-RestMethod -Uri "$baseUrl/api/artifacts" -Method Post -Headers $uploadHeaders -Form @{ file = $_ }
  $paths.Add([string]$response.pathname)
}

$payload = $summary | Select-Object *
if (-not $payload.case_id) { $payload | Add-Member -NotePropertyName case_id -NotePropertyValue ([string]($summary.compatibility_case ?? $summary.source_regression)) }
if (-not $payload.functional_status) { $payload | Add-Member -NotePropertyName functional_status -NotePropertyValue $functionalStatus }
if (-not $payload.compatibility_status -and $compatibilityStatus) { $payload | Add-Member -NotePropertyName compatibility_status -NotePropertyValue $compatibilityStatus }
$payload | Add-Member -NotePropertyName artifact_paths -NotePropertyValue @($paths)
$result = Invoke-RestMethod -Uri "$baseUrl/api/runs" -Method Post -Headers ($headers + @{ 'Content-Type' = 'application/json' }) -Body ($payload | ConvertTo-Json -Depth 30)
Write-Output "Uploaded $($paths.Count) artifacts for $($summary.run_id); expires $($result.run.expires_at)."
