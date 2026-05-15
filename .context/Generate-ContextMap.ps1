$OutputFile = "$PSScriptRoot\graphify_out\repo_map.txt"
$Date = Get-Date

"=== REPOSITORY MAP GENERATED ON $Date ===" | Out-File -FilePath $OutputFile -Encoding utf8
"" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"--- CURRENT AGENT TASKS ---" | Out-File -FilePath $OutputFile -Append -Encoding utf8
Get-Content "$PSScriptRoot\AGENT_TASKS.md" | Out-File -FilePath $OutputFile -Append -Encoding utf8

"" | Out-File -FilePath $OutputFile -Append -Encoding utf8
"--- DIRECTORY STRUCTURE ---" | Out-File -FilePath $OutputFile -Append -Encoding utf8
tree (Resolve-Path "$PSScriptRoot\..\").Path /f /A | Out-File -FilePath $OutputFile -Append -Encoding utf8

Write-Host "Graphical memory generated successfully at $OutputFile"
