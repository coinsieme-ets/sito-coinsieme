$baseDir = "C:\Users\Utente\.gemini\antigravity\scratch\coinsieme-proto"
$brainDir = "C:\Users\Utente\.gemini\antigravity\brain\2b1ee6a7-5eb2-49ff-9a73-2ac89ec9a393"

New-Item -ItemType Directory -Force -Path "$baseDir\data" | Out-Null
New-Item -ItemType Directory -Force -Path "$baseDir\templates" | Out-Null
New-Item -ItemType Directory -Force -Path "$baseDir\scripts" | Out-Null
New-Item -ItemType Directory -Force -Path "$baseDir\docs" | Out-Null
New-Item -ItemType Directory -Force -Path "$baseDir\build-preview" | Out-Null

Copy-Item -Path "$baseDir\articolo.html" -Destination "$baseDir\templates\articolo-template.html" -Force
Copy-Item -Path "$baseDir\articolo.html" -Destination "$baseDir\templates\pubblicazione-template.html" -Force

$artInv = Import-Csv "$brainDir\inventario_articoli_lotto2.csv" -Encoding UTF8
$artExec = Import-Csv "$brainDir\matrice_esecutiva_articoli_lotto2.csv" -Encoding UTF8

$artJson = @()
foreach ($a in $artExec) {
    $inv = $artInv | ? URLCanonico -eq $a.URLOriginale
    
    $obj = @{
        titolo = $a.Titolo
        slug = $a.SlugProposto -replace '^/articoli/', '' -replace '/index\.html$', ''
        urlOriginale = $a.URLOriginale
        fileSorgente = $a.HTMLSorgente
        testoCompletoDisponibile = if ($a.StatoMigrazioneTesto -eq "testo-incompleto") { $false } else { $true }
        sintesi = $inv.Sintesi
        autore = if ($inv.Autore -notmatch "Non dichiarato") { $inv.Autore } else { $null }
        data = if ($inv.Data -notmatch "Non dichiarata") { $inv.Data } else { $null }
        immagine = if ($a.ImmagineOriginale) { $a.ImmagineOriginale } else { $null }
        idImmagine = if ($a.ID_Immagine -ne "Nessuna") { $a.ID_Immagine } else { $null }
        azioneImmagine = $a.AzioneImmagine
        allegatiPDF = if ($a.AllegatiPDF) { $a.AllegatiPDF } else { $null }
        audio = if ($a.Audio) { $a.Audio } else { $null }
        collegamentiEsterni = $inv.Links
        statoTesto = $a.StatoMigrazioneTesto
        statoComplessivo = $a.StatoComplessivo
        redirectPrevisto = $a.SlugProposto
    }
    
    if ($a.StatoMigrazioneTesto -eq "testo-incompleto") {
        $obj.nota = "Testo editoriale originale mancante. Riferimento al link originario per recupero."
    }
    if ($a.StatoMigrazioneTesto -eq "testo-da-correggere") {
        $obj.nota = "Rimuovere ChatGPT/UTM parametri; correggere link malformati se presenti."
    }
    
    $artJson += $obj
}

$artJson | ConvertTo-Json -Depth 5 | Out-File "$baseDir\data\articoli.json" -Encoding UTF8

$pubInv = Import-Csv "$brainDir\inventario_pubblicazioni_lotto2.csv" -Encoding UTF8
$pubExec = Import-Csv "$brainDir\matrice_esecutiva_pubblicazioni_lotto2.csv" -Encoding UTF8

$pubJson = @()
foreach ($p in $pubExec) {
    $inv = $pubInv | ? FileLocale -eq $p.PaginaSorgente
    $obj = @{
        titolo = $p.Titolo
        slug = $p.PaginaProposta -replace '^/pubblicazioni/', '' -replace '/index\.html$', ''
        tipologia = $p.Tipologia
        paginaSorgente = $p.PaginaSorgente
        copertina = if ($p.Copertina -ne "Nessuna") { $p.Copertina } else { $null }
        risorsa = $p.Risorsa
        autore = if ($p.Autore) { $p.Autore } else { $null }
        editore = if ($p.Editore) { $p.Editore } else { $null }
        anno = if ($p.Anno) { $p.Anno } else { $null }
        isbn = if ($p.ISBN) { $p.ISBN } else { $null }
        audiolibro = if ($p.Audiolibro -match "S") { $true } else { $false }
        statoRisorsa = $p.StatoRisorsa
        statoDiritti = $p.StatoDiritti
        statoMigrazione = $p.StatoMigrazione
    }
    $pubJson += $obj
}
$pubJson | ConvertTo-Json -Depth 5 | Out-File "$baseDir\data\pubblicazioni.json" -Encoding UTF8


$audExec = Import-Csv "$brainDir\matrice_esecutiva_audio_lotto2.csv" -Encoding UTF8
$audJson = @()
foreach ($au in $audExec) {
    $obj = @{
        contenuto = $au.Contenuto
        paginaSorgente = $au.PaginaSorgente
        disponibilita = $au.Disponibilita
        accessibilita = $au.Accessibilita
        trascrizione = $au.Trascrizione
        titolarita = $au.Titolarita
        azioneProposta = $au.AzioneProposta
    }
    $audJson += $obj
}
$audJson | ConvertTo-Json -Depth 5 | Out-File "$baseDir\data\audio.json" -Encoding UTF8
