$src = "C:\Users\Utente\.gemini\antigravity\scratch\coinsieme-proto"
$baseDest = "C:\Users\Utente\OneDrive\Documenti\COINSIEME\Backup_coinsieme-proto_prima_lotto2A_2026-08-15"
$dest = $baseDest
if (Test-Path $dest) {
    $time = Get-Date -Format "HHmm"
    $dest = "${baseDest}_${time}"
}
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item -Path "$src\*" -Destination $dest -Recurse -Force
$srcCount = (Get-ChildItem -Path $src -Recurse -File).Count
$destCount = (Get-ChildItem -Path $dest -Recurse -File).Count
Write-Host "Backup completato."
Write-Host "Destinazione: $dest"
Write-Host "File sorgente: $srcCount"
Write-Host "File copiati: $destCount"
