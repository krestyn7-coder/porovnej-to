$port = 8090
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)

$contentTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png" = "image/png"
  ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".svg" = "image/svg+xml"
  ".webmanifest" = "application/manifest+json; charset=utf-8"
}

function Write-HttpResponse {
  param(
    [Parameter(Mandatory = $true)] $Client,
    [int] $StatusCode,
    [string] $StatusText,
    [string] $ContentType,
    [byte[]] $Body
  )

  $stream = $Client.GetStream()
  $headers = @(
    "HTTP/1.1 $StatusCode $StatusText",
    "Content-Type: $ContentType",
    "Content-Length: $($Body.Length)",
    "Connection: close",
    "",
    ""
  ) -join "`r`n"

  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
  $stream.Write($headerBytes, 0, $headerBytes.Length)
  $stream.Write($Body, 0, $Body.Length)
  $stream.Flush()
  $stream.Close()
  $Client.Close()
}

try {
  $listener.Start()
  Write-Host "Porovnej To bezi na http://localhost:$port/"
  Write-Host "V domaci Wi-Fi ji otevres na http://192.168.1.18:$port/"

  while ($true) {
    $client = $listener.AcceptTcpClient()

    try {
      $stream = $client.GetStream()
      $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()

      if ([string]::IsNullOrWhiteSpace($requestLine)) {
        $client.Close()
        continue
      }

      $parts = $requestLine.Split(" ")
      $rawPath = if ($parts.Length -ge 2) { $parts[1] } else { "/" }
      $pathOnly = $rawPath.Split("?")[0]
      $decodedPath = [System.Uri]::UnescapeDataString($pathOnly.TrimStart("/"))
      if ([string]::IsNullOrWhiteSpace($decodedPath)) {
        $decodedPath = "index.html"
      }

      $safePath = $decodedPath.Replace("/", "\")
      $fullPath = Join-Path $root $safePath

      if ((Test-Path $fullPath) -and -not (Get-Item $fullPath).PSIsContainer) {
        $extension = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
        $contentType = $contentTypes[$extension]
        if (-not $contentType) {
          $contentType = "application/octet-stream"
        }

        $body = [System.IO.File]::ReadAllBytes($fullPath)
        Write-HttpResponse -Client $client -StatusCode 200 -StatusText "OK" -ContentType $contentType -Body $body
      }
      else {
        $body = [System.Text.Encoding]::UTF8.GetBytes("404")
        Write-HttpResponse -Client $client -StatusCode 404 -StatusText "Not Found" -ContentType "text/plain; charset=utf-8" -Body $body
      }
    }
    catch {
      try {
        $body = [System.Text.Encoding]::UTF8.GetBytes("500")
        Write-HttpResponse -Client $client -StatusCode 500 -StatusText "Server Error" -ContentType "text/plain; charset=utf-8" -Body $body
      }
      catch {
        $client.Close()
      }
    }
  }
}
finally {
  if ($listener) {
    $listener.Stop()
  }
}
