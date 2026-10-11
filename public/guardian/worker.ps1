# Trading Guardian helper.
#
# A long-running process the desktop app talks to over stdin/stdout, one
# JSON request per line and one JSON reply per line. It reads screen regions
# with Windows' own OCR (no extra software), checks whether Trade Terminal is
# running, and asks it to close the normal way.
#
# It NEVER force-kills anything: closing is CloseMainWindow(), the same
# request as clicking the window's X, so Trade Terminal can save its layout.

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Physical pixels everywhere, so regions drawn on a scaled display line up.
Add-Type -Namespace Guardian -Name Dpi -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(System.IntPtr value);
[DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
'@
try {
  if (-not [Guardian.Dpi]::SetProcessDpiAwarenessContext([System.IntPtr]::new(-4))) { [void][Guardian.Dpi]::SetProcessDPIAware() }
} catch { try { [void][Guardian.Dpi]::SetProcessDPIAware() } catch {} }

# Finds a program's visible top-level windows by title — Trade Terminal's
# "Alert" dialog — and where they sit on screen.
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public static class GuardianWindows {
  delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc callback, IntPtr lParam);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] static extern bool IsIconic(IntPtr hWnd);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int max);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
  struct RECT { public int Left, Top, Right, Bottom; }

  public static List<int[]> Find(int[] pids, string title) {
    var wanted = new HashSet<uint>();
    foreach (var pid in pids) wanted.Add((uint)pid);
    var found = new List<int[]>();
    EnumWindows((hWnd, lParam) => {
      if (!IsWindowVisible(hWnd) || IsIconic(hWnd)) return true;
      uint pid;
      GetWindowThreadProcessId(hWnd, out pid);
      if (!wanted.Contains(pid)) return true;
      var text = new StringBuilder(256);
      GetWindowText(hWnd, text, 256);
      if (!string.Equals(text.ToString().Trim(), title, StringComparison.OrdinalIgnoreCase)) return true;
      RECT r;
      if (GetWindowRect(hWnd, out r) && r.Right - r.Left > 50 && r.Bottom - r.Top > 50) {
        found.Add(new[] { r.Left, r.Top, r.Right, r.Bottom });
      }
      return true;
    }, IntPtr.Zero);
    return found;
  }
}
'@

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime]

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
})[0]

function Await($operation, [Type]$type) {
  $task = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($operation))
  $task.Wait() | Out-Null
  $task.Result
}

$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()

function Get-PrimaryBounds {
  [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
}

# Grabs a region, enlarged three times and in high-contrast grey: small
# terminal fonts read far more reliably that way.
function Capture-Region($region, $scale = 3) {
  $x1 = [int]$region[0]; $y1 = [int]$region[1]; $x2 = [int]$region[2]; $y2 = [int]$region[3]
  $w = [Math]::Max(1, $x2 - $x1); $h = [Math]::Max(1, $y2 - $y1)
  $raw = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($raw)
  $g.CopyFromScreen($x1, $y1, 0, 0, (New-Object System.Drawing.Size $w, $h))
  $g.Dispose()

  $big = New-Object System.Drawing.Bitmap ($w * $scale), ($h * $scale)
  $g = [System.Drawing.Graphics]::FromImage($big)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $c = 2.0; $t = (1.0 - $c) / 2.0
  $lum = @(0.299, 0.587, 0.114)
  $matrix = New-Object System.Drawing.Imaging.ColorMatrix (,[single[][]]@(
    [single[]]@(($lum[0] * $c), ($lum[0] * $c), ($lum[0] * $c), 0, 0),
    [single[]]@(($lum[1] * $c), ($lum[1] * $c), ($lum[1] * $c), 0, 0),
    [single[]]@(($lum[2] * $c), ($lum[2] * $c), ($lum[2] * $c), 0, 0),
    [single[]]@(0, 0, 0, 1, 0),
    [single[]]@($t, $t, $t, 0, 1)
  ))
  $attributes = New-Object System.Drawing.Imaging.ImageAttributes
  $attributes.SetColorMatrix($matrix)
  $dest = New-Object System.Drawing.Rectangle 0, 0, ($w * $scale), ($h * $scale)
  $g.DrawImage($raw, $dest, 0, 0, $w, $h, [System.Drawing.GraphicsUnit]::Pixel, $attributes)
  $g.Dispose()
  $raw.Dispose()
  $big
}

function Read-Bitmap($bitmap, $separator = ' ') {
  $ms = New-Object System.IO.MemoryStream
  $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $bytes = $ms.ToArray()
  $ms.Dispose()
  $stream = New-Object Windows.Storage.Streams.InMemoryRandomAccessStream
  $writer = New-Object Windows.Storage.Streams.DataWriter($stream.GetOutputStreamAt(0))
  $writer.WriteBytes($bytes)
  $null = Await ($writer.StoreAsync()) ([UInt32])
  $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $soft = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
  $result = Await ($engine.RecognizeAsync($soft)) ([Windows.Media.Ocr.OcrResult])
  ($result.Lines | ForEach-Object { $_.Text }) -join $separator
}

function Get-TerminalProcesses($name) {
  $base = [System.IO.Path]::GetFileNameWithoutExtension([string]$name)
  @(Get-Process -Name $base -ErrorAction SilentlyContinue)
}

function Handle($request) {
  switch ($request.op) {
    'ping' {
      return @{ ok = $true; ocr = [bool]$engine }
    }
    'status' {
      return @{ ok = $true; running = ((Get-TerminalProcesses $request.process).Count -gt 0) }
    }
    'read' {
      if (-not $engine) { throw 'Windows OCR is not available on this machine' }
      $texts = @{}
      foreach ($property in $request.regions.PSObject.Properties) {
        $bitmap = Capture-Region $property.Value
        try { $texts[$property.Name] = Read-Bitmap $bitmap } finally { $bitmap.Dispose() }
      }
      return @{ ok = $true; texts = $texts }
    }
    'alerts' {
      # Reads every open alert window of the program, line by line.
      if (-not $engine) { throw 'Windows OCR is not available on this machine' }
      $pids = [int[]]@((Get-TerminalProcesses $request.process) | ForEach-Object { $_.Id })
      $windows = @()
      if ($pids.Count -gt 0) {
        foreach ($rect in [GuardianWindows]::Find($pids, [string]$request.title)) {
          $bitmap = Capture-Region $rect 2
          try { $windows += ,(Read-Bitmap $bitmap "`n") } finally { $bitmap.Dispose() }
        }
        # A docked alerts list, read the same way, line by line.
        foreach ($region in @($request.panels)) {
          if ($null -eq $region) { continue }
          $bitmap = Capture-Region $region 2
          try { $windows += ,(Read-Bitmap $bitmap "`n") } finally { $bitmap.Dispose() }
        }
      }
      return @{ ok = $true; windows = $windows }
    }
    'shot' {
      $bounds = Get-PrimaryBounds
      $bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
      $g = [System.Drawing.Graphics]::FromImage($bitmap)
      $g.CopyFromScreen($bounds.X, $bounds.Y, 0, 0, $bounds.Size)
      $g.Dispose()
      $bitmap.Save([string]$request.path, [System.Drawing.Imaging.ImageFormat]::Png)
      $bitmap.Dispose()
      return @{ ok = $true; x = $bounds.X; y = $bounds.Y; width = $bounds.Width; height = $bounds.Height }
    }
    'close' {
      # The normal close request, like clicking X. Never Kill().
      $requested = 0
      foreach ($process in (Get-TerminalProcesses $request.process)) {
        if ($process.MainWindowHandle -ne [System.IntPtr]::Zero) {
          if ($process.CloseMainWindow()) { $requested++ }
        }
      }
      return @{ ok = $true; requested = $requested }
    }
    default { throw "Unknown op: $($request.op)" }
  }
}

[Console]::Out.WriteLine((@{ ready = $true; ocr = [bool]$engine } | ConvertTo-Json -Compress))
[Console]::Out.Flush()

while ($true) {
  $line = [Console]::In.ReadLine()
  if ($null -eq $line) { break }
  if (-not $line.Trim()) { continue }
  $id = $null
  try {
    $request = $line | ConvertFrom-Json
    $id = $request.id
    $reply = Handle $request
  } catch {
    $reply = @{ ok = $false; error = $_.Exception.Message }
  }
  $reply.id = $id
  [Console]::Out.WriteLine(($reply | ConvertTo-Json -Compress -Depth 5))
  [Console]::Out.Flush()
}
