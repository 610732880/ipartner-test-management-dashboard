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
$status = if ($summary.compatibility_status) { [string]$summary.compatibility_status } else { [string]$summary.functional_status }
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
$payload | Add-Member -NotePropertyName artifact_paths -NotePropertyValue @($paths)
$result = Invoke-RestMethod -Uri "$baseUrl/api/runs" -Method Post -Headers ($headers + @{ 'Content-Type' = 'application/json' }) -Body ($payload | ConvertTo-Json -Depth 30)
Write-Output "Uploaded $($paths.Count) artifacts for $($summary.run_id); expires $($result.run.expires_at)."
