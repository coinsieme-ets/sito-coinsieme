$d = "C:\Users\Utente\.gemini\antigravity\scratch\coinsieme-proto\data"
$t = "C:\Users\Utente\.gemini\antigravity\scratch\coinsieme-proto\templates"
$b = "C:\Users\Utente\.gemini\antigravity\scratch\coinsieme-proto\build-preview"

$art = Get-Content "$d\articoli.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$pub = Get-Content "$d\pubblicazioni.json" -Raw -Encoding UTF8 | ConvertFrom-Json

Write-Host "Validazione JSON:"
Write-Host "Articoli: $($art.Count) (attesi 88)"
Write-Host "Pubblicazioni: $($pub.Count) (attese 8)"

$a1 = $art | Where-Object { $_.statoComplessivo -eq "migrabile-senza-immagine" -and $_.azioneImmagine -eq "omettere-immagine" } | Select-Object -First 1

$p1 = $pub | Where-Object { $_.statoMigrazione -eq "migrabile-scheda-senza-download" } | Select-Object -First 1

New-Item -ItemType Directory -Force -Path "$b\articoli\$($a1.slug)" | Out-Null
New-Item -ItemType Directory -Force -Path "$b\pubblicazioni\$($p1.slug)" | Out-Null

$aHtml = Get-Content "$t\articolo-template.html" -Raw -Encoding UTF8
$aHtml = $aHtml -replace '<title>.*?</title>', "<title>$($a1.titolo) - COINSIEME ETS</title>"
$aHtml = $aHtml -replace '<h1[^>]*>.*?</h1>', "<h1>$($a1.titolo)</h1>"
$aHtml = $aHtml -replace '<img[^>]*id="main-image"[^>]*>', ''
[System.IO.File]::WriteAllText("$b\articoli\$($a1.slug)\index.html", $aHtml, (New-Object System.Text.UTF8Encoding($false)))

$pHtml = Get-Content "$t\pubblicazione-template.html" -Raw -Encoding UTF8
$pHtml = $pHtml -replace '<title>.*?</title>', "<title>$($p1.titolo) - Pubblicazioni</title>"
$pHtml = $pHtml -replace '<h1[^>]*>.*?</h1>', "<h1>$($p1.titolo)</h1>"
$pHtml = $pHtml -replace '<a[^>]*class="download-btn"[^>]*>.*?</a>', '<span class="note">Disponibilità da verificare</span>'
[System.IO.File]::WriteAllText("$b\pubblicazioni\$($p1.slug)\index.html", $pHtml, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "Pagine generate in $b"
Write-Host "Articolo testato: $($a1.slug)"
Write-Host "Pubblicazione testata: $($p1.slug)"
