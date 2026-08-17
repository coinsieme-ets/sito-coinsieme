$ErrorActionPreference = "Stop"
$node = "..\node-v20.11.1-win-x64\node.exe"
$baseUrl = "http://127.0.0.1:8080"
$script = "scripts\collaudo-visivo-singolo.js"

$pages = @(
    @{ url="$baseUrl/articoli/dal-2027-cambiano-le-regole-per-l-invalidita-civile-e-la-legge-104/index.html"; outName="dal-2027" },
    @{ url="$baseUrl/articoli/dalla-lotta-armata-alla-lotta-per-gli-ultimi/index.html"; outName="lotta-armata" },
    @{ url="$baseUrl/articoli/energia-pulita-inclusione-reale-a-grottaferrata-prende-vita-il-primo-fotovoltaico-sociale/index.html"; outName="energia-pulita" },
    @{ url="$baseUrl/articoli/bando-digitale-sociale/index.html"; outName="bando-digitale" }
)

foreach ($page in $pages) {
    Write-Host "Test Mobile (375px) per: $($page.outName)" -ForegroundColor Yellow
    & $node $script --url $page.url --width 375 --output "$($page.outName)-375px.png"
    if ($LASTEXITCODE -ne 0) { Write-Error "Test Mobile fallito per $($page.outName)"; exit 1 }

    Write-Host "Test Desktop (1440px) per: $($page.outName)" -ForegroundColor Yellow
    & $node $script --url $page.url --width 1440 --output "$($page.outName)-1440px.png"
    if ($LASTEXITCODE -ne 0) { Write-Error "Test Desktop fallito per $($page.outName)"; exit 1 }
}

Write-Host "Test completati con successo!" -ForegroundColor Green
