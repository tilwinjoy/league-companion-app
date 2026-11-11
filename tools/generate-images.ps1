<#
.SYNOPSIS
    Regenerates the production preview images from the full-resolution masters.

.DESCRIPTION
    Reads every PNG in assets/images/originals/<theme>/ and writes an optimised
    JPEG (max width 1280px, quality 82) to assets/images/<theme>/.
    The JPEGs are what index.html references; the PNGs are never served.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File tools/generate-images.ps1
#>
param(
    [int]$MaxWidth = 1280,
    [int]$Quality = 82
)

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$images = Join-Path $root 'assets/images'

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq 'image/jpeg' }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)

foreach ($theme in 'dark', 'light') {
    $srcDir = Join-Path $images "originals/$theme"
    $outDir = Join-Path $images $theme

    if (-not (Test-Path $srcDir)) {
        Write-Warning "No masters found in $srcDir"
        continue
    }
    New-Item -ItemType Directory -Force $outDir | Out-Null

    Get-ChildItem -Path $srcDir -Filter *.png | ForEach-Object {
        $source = [System.Drawing.Image]::FromFile($_.FullName)
        try {
            $width = $source.Width
            $height = $source.Height

            if ($width -gt $MaxWidth) {
                $newWidth = $MaxWidth
                $newHeight = [int][Math]::Round($height * ($MaxWidth / $width))
            } else {
                $newWidth = $width
                $newHeight = $height
            }

            $canvas = New-Object System.Drawing.Bitmap($newWidth, $newHeight, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
            $graphics = [System.Drawing.Graphics]::FromImage($canvas)
            try {
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                $graphics.DrawImage($source, 0, 0, $newWidth, $newHeight)
            } finally {
                $graphics.Dispose()
            }

            $dest = Join-Path $outDir ($_.BaseName + '.jpg')
            $canvas.Save($dest, $jpegCodec, $encoderParams)
            $canvas.Dispose()

            Write-Host ('{0} -> {1} ({2}x{3}, {4} KB)' -f $_.Name, (Split-Path $dest -Leaf), $newWidth, $newHeight, [Math]::Round((Get-Item $dest).Length / 1KB))
        } finally {
            $source.Dispose()
        }
    }
}
