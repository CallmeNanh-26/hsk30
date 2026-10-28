# Tao ban trang dung cho Claude Artifact (bo the html/head, nhung CSS vao trang).
# Chay: powershell -ExecutionPolicy Bypass -File tools\build-artifact.ps1
$root = Split-Path -Parent $PSScriptRoot
$utf8 = New-Object Text.UTF8Encoding $false
$html = [IO.File]::ReadAllText((Join-Path $root 'index.html'), $utf8)
$css = [IO.File]::ReadAllText((Join-Path $root 'style.css'), $utf8)
$title = [regex]::Match($html, '<title>.*?</title>').Value
$body = [regex]::Match($html, '(?s)<body>(.*)</body>').Groups[1].Value
$out = $title + "`n" + '<meta name="claude:viewport-fit-sides" content="cover">' + "`n<style>`n" + $css + "</style>`n" + $body
New-Item -ItemType Directory -Force (Join-Path $root 'dist') | Out-Null
[IO.File]::WriteAllText((Join-Path $root 'dist\artifact.html'), $out, $utf8)
"ok: dist\artifact.html"
