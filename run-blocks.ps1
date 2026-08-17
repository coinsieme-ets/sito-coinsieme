Write-Host "Inizio collaudo visivo per 2 pagine (Indici)" -ForegroundColor Cyan

$baseUrl = "http://localhost:8080"
$node = "..\node-v20.11.1-win-x64\node.exe"
$script = "scripts\collaudo-visivo-singolo.js"

$pages = @(
    @{ urls=@(
    "http://127.0.0.1:8080/articoli/dal-2027-cambiano-le-regole-per-l-invalidita-civile-e-la-legge-104/index.html",
    "http://127.0.0.1:8080/articoli/dalla-lotta-armata-alla-lotta-per-gli-ultimi/index.html",
    "http://127.0.0.1:8080/articoli/energia-pulita-inclusione-reale-a-grottaferrata-prende-vita-il-primo-fotovoltaico-sociale/index.html",
    "http://127.0.0.1:8080/articoli/bando-digitale-sociale/index.html"
); outName="idx-pubblicazioni" }
)

foreach ($page in $pages) {

    Write-Host "Test Desktop (1440px) per: $($page.outName)" -ForegroundColor Yellow
    & $node $script --url $page.url --width 1440 --output "$($page.outName)-1440px.png"
    if ($LASTEXITCODE -ne 0) { Write-Error "Test Desktop fallito per $($page.outName)"; exit 1 }
}

Write-Host "Tutti i collaudi visivi (2 pagine, 4 screenshot) completati con successo." -ForegroundColor Green
