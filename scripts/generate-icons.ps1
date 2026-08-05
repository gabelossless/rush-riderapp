Add-Type -AssemblyName System.Drawing

function New-RushIcon {
  param(
    [int]$Size,
    [string]$Path,
    [bool]$Maskable = $false
  )

  $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb(255, 9, 10, 15))

  $pad = 0
  if ($Maskable) {
    $pad = [int]($Size * 0.16)
  }

  $inner = $Size - (2 * $pad)
  $rect = New-Object System.Drawing.Rectangle $pad, $pad, $inner, $inner

  $c1 = [System.Drawing.Color]::FromArgb(38, 0, 240, 255)
  $c2 = [System.Drawing.Color]::FromArgb(38, 112, 0, 255)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $c1, $c2, 55
  $g.FillEllipse($brush, $rect)

  $f = $Size / 100.0

  $p1 = New-Object System.Drawing.PointF (18 * $f), (14 * $f)
  $p2 = New-Object System.Drawing.PointF (46 * $f), (14 * $f)
  $p3 = New-Object System.Drawing.PointF (82 * $f), (86 * $f)
  $p4 = New-Object System.Drawing.PointF (54 * $f), (86 * $f)
  $pts1 = @($p1, $p2, $p3, $p4)
  $sc = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(170, 0, 240, 255))
  $g.FillPolygon($sc, $pts1)

  $q1 = New-Object System.Drawing.PointF (54 * $f), (14 * $f)
  $q2 = New-Object System.Drawing.PointF (82 * $f), (14 * $f)
  $q3 = New-Object System.Drawing.PointF (46 * $f), (86 * $f)
  $q4 = New-Object System.Drawing.PointF (18 * $f), (86 * $f)
  $pts2 = @($q1, $q2, $q3, $q4)
  $sc2 = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(190, 112, 0, 255))
  $g.FillPolygon($sc2, $pts2)

  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), (9 * $f)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

  $b1 = New-Object System.Drawing.PointF (58 * $f), (24 * $f)
  $b2 = New-Object System.Drawing.PointF (36 * $f), (55 * $f)
  $b3 = New-Object System.Drawing.PointF (51 * $f), (55 * $f)
  $b4 = New-Object System.Drawing.PointF (43 * $f), (76 * $f)
  $b5 = New-Object System.Drawing.PointF (68 * $f), (44 * $f)
  $b6 = New-Object System.Drawing.PointF (52 * $f), (44 * $f)
  $b7 = New-Object System.Drawing.PointF (60 * $f), (24 * $f)
  $pts3 = @($b1, $b2, $b3, $b4, $b5, $b6, $b7)
  $g.DrawLines($pen, $pts3)

  $sc.Dispose()
  $sc2.Dispose()
  $pen.Dispose()
  $brush.Dispose()
  $g.Dispose()
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output "Generated $Path ($Size x $Size)"
}

New-RushIcon -Size 192 -Path "public\pwa-192x192.png"
New-RushIcon -Size 512 -Path "public\pwa-512x512.png"
New-RushIcon -Size 512 -Path "public\pwa-512-maskable.png" -Maskable $true
New-RushIcon -Size 180 -Path "public\apple-touch-icon.png"
