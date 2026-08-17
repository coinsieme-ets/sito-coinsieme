param(
    [string]$wsUrl,
    [string]$outDir
)

$csharpCode = @"
using System;
using System.Net.WebSockets;
using System.Threading;
using System.Threading.Tasks;
using System.Text;
using System.IO;
using System.Drawing;

public class CDPVisualRunner3 {
    public static async Task<bool> CaptureViewportScreenshot(string wsUrl, string targetUrl, int width, int height, string outFile) {
        using (var ws = new ClientWebSocket()) {
            await ws.ConnectAsync(new Uri(wsUrl), CancellationToken.None);
            
            await Send(ws, "{\"id\":1,\"method\":\"Page.enable\"}");
            await Send(ws, "{\"id\":2,\"method\":\"Emulation.setDeviceMetricsOverride\",\"params\":{\"width\":" + width + ",\"height\":" + height + ",\"deviceScaleFactor\":1,\"mobile\":" + (width < 800 ? "true" : "false") + "}}");
            await Send(ws, "{\"id\":3,\"method\":\"Page.navigate\",\"params\":{\"url\":\"" + targetUrl + "\"}}");
            
            // Wait for DOM, CSS, Fonts, Network Idle
            await Task.Delay(2500); 

            // Scroll to top
            await Send(ws, "{\"id\":4,\"method\":\"Runtime.evaluate\",\"params\":{\"expression\":\"window.scrollTo(0, 0);\"}}");
            await Task.Delay(500);

            // Capture viewport screenshot (NOT full page)
            await Send(ws, "{\"id\":5,\"method\":\"Page.captureScreenshot\",\"params\":{\"format\":\"png\",\"clip\":{\"x\":0,\"y\":0,\"width\":" + width + ",\"height\":" + height + ",\"scale\":1}}}");
            
            int attempts = 0;
            while (ws.State == WebSocketState.Open && attempts < 15) {
                var response = await ReceiveLarge(ws);
                if (response.Contains("\"id\":5")) {
                    string search = "\"data\":\"";
                    int idx = response.IndexOf(search);
                    if (idx > 0) {
                        int endIdx = response.IndexOf("\"", idx + search.Length);
                        string b64 = response.Substring(idx + search.Length, endIdx - (idx + search.Length));
                        byte[] bytes = Convert.FromBase64String(b64);
                        File.WriteAllBytes(outFile, bytes);
                        return true;
                    }
                }
                attempts++;
            }
            return false;
        }
    }

    private static async Task Send(ClientWebSocket ws, string msg) {
        var bytes = Encoding.UTF8.GetBytes(msg);
        await ws.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
    }

    private static async Task<string> ReceiveLarge(ClientWebSocket ws) {
        var ms = new MemoryStream();
        var buffer = new byte[16384];
        var cts = new CancellationTokenSource(3000);
        try {
            while (ws.State == WebSocketState.Open) {
                var result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), cts.Token);
                ms.Write(buffer, 0, result.Count);
                if (result.EndOfMessage) break;
            }
            return Encoding.UTF8.GetString(ms.ToArray());
        } catch {
            return Encoding.UTF8.GetString(ms.ToArray());
        }
    }

    public static bool AnalyzeImageNonWhite(string filePath, out long sizeBytes, out int nonWhitePercentage) {
        sizeBytes = new FileInfo(filePath).Length;
        nonWhitePercentage = 0;

        try {
            using (var bmp = new Bitmap(filePath)) {
                int totalPixels = 0;
                int nonWhitePixels = 0;
                int stepX = Math.Max(1, bmp.Width / 100);
                int stepY = Math.Max(1, bmp.Height / 100);

                for (int x = 0; x < bmp.Width; x += stepX) {
                    for (int y = 0; y < bmp.Height; y += stepY) {
                        Color c = bmp.GetPixel(x, y);
                        totalPixels++;
                        if (c.R < 250 || c.G < 250 || c.B < 250) {
                            nonWhitePixels++;
                        }
                    }
                }

                if (totalPixels > 0) {
                    nonWhitePercentage = (nonWhitePixels * 100) / totalPixels;
                }
                return nonWhitePercentage > 5;
            }
        } catch {
            return false;
        }
    }
}
"@

Add-Type -TypeDefinition $csharpCode -ReferencedAssemblies "System.Drawing.dll"

$tasks = @(
    @{ Name = "homepage_375";   Page = "index.html";        Width = 375;  Height = 900;  Title = "Homepage (375x900)" },
    @{ Name = "homepage_768";   Page = "index.html";        Width = 768;  Height = 1000; Title = "Homepage (768x1000)" },
    @{ Name = "homepage_1440";  Page = "index.html";        Width = 1440; Height = 1000; Title = "Homepage (1440x1000)" },
    @{ Name = "chi_siamo_375";  Page = "chi-siamo.html";    Width = 375;  Height = 900;  Title = "Chi siamo (375x900)" },
    @{ Name = "domotica_375";   Page = "domotica.html";     Width = 375;  Height = 900;  Title = "Domotica (375x900)" },
    @{ Name = "pubblicazioni_375"; Page = "pubblicazioni.html"; Width = 375; Height = 900; Title = "Pubblicazioni (375x900)" }
)

$errors = @()

foreach ($t in $tasks) {
    $targetUrl = "http://localhost:3000/" + $t.Page
    $outFile = Join-Path $outDir "$($t.Name).png"
    if (Test-Path $outFile) { Remove-Item $outFile -Force }

    Write-Host "`n---> Cattura visiva per $($t.Title) su $targetUrl"

    # HTTP Pre-Check
    $req = Invoke-WebRequest -Uri $targetUrl -UseBasicParsing
    if ($req.StatusCode -ne 200) {
        $errors += "HTTP Status $($req.StatusCode) su $targetUrl"
        continue
    }

    # CDP Capture
    $success = [CDPVisualRunner3]::CaptureViewportScreenshot($wsUrl, $targetUrl, $t.Width, $t.Height, $outFile).GetAwaiter().GetResult()
    if (-not $success -or -not (Test-Path $outFile)) {
        $errors += "Impossibile salvare screenshot per $($t.Title)"
        continue
    }

    # Image Non-White Verification
    $fileSize = 0
    $nonWhitePct = 0
    $isValid = [CDPVisualRunner3]::AnalyzeImageNonWhite($outFile, [ref]$fileSize, [ref]$nonWhitePct)

    Write-Host "File: $($t.Name).png | Peso: $($fileSize) byte | Pixel non bianchi: $($nonWhitePct)%"

    if ($fileSize -lt 20480) {
        $errors += "Screenshot $($t.Name).png troppo piccolo ($fileSize byte < 20KB)"
    }
    if ($nonWhitePct -lt 5) {
        $errors += "Screenshot $($t.Name).png bianco o monocromatico (non-white: $nonWhitePct%)"
    }
}

if ($errors.Count -eq 0) {
    Write-Host "`n✅ TUTTI E 6 GLI SCREENSHOT SONO REALI, COLORATI E SUPERATI (0 ERRORI)!"
} else {
    Write-Host "`n❌ ERRORI RILEVATI:"
    foreach ($e in $errors) { Write-Host " - $e" }
    exit 1
}
