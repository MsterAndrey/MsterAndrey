# NEXUS CUBE — recogida de datos del equipo (sólo lectura).
# No modifica nada, no usa la red y no lee archivos de usuario.
# Requiere ejecutarse como administrador para leer TPM, Secure Boot y BitLocker.
$ErrorActionPreference = 'SilentlyContinue'
$r = [ordered]@{}
$id = [Security.Principal.WindowsIdentity]::GetCurrent()
$r.is_admin = (New-Object Security.Principal.WindowsPrincipal $id).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
$r.collected_at = (Get-Date).ToString('yyyy-MM-ddTHH:mm:ss')
$r.hostname = $env:COMPUTERNAME
$os = Get-CimInstance Win32_OperatingSystem
if ($os) { $r.os_caption = $os.Caption; $r.os_build = [int]$os.BuildNumber; $r.os_version = $os.Version }
$cs = Get-CimInstance Win32_ComputerSystem
if ($cs) { $r.manufacturer = $cs.Manufacturer; $r.model = $cs.Model }
$t = Get-CimInstance -Namespace 'root/cimv2/security/microsofttpm' -ClassName Win32_Tpm
if ($t) {
  $r.tpm_present = $true
  $r.tpm_spec = [string]$t.SpecVersion
  $r.tpm_enabled = [bool]$t.IsEnabled_InitialValue
  $r.tpm_activated = [bool]$t.IsActivated_InitialValue
} elseif ($r.is_admin) {
  $r.tpm_present = $false
}
$g = Get-Tpm
if ($g) { $r.tpm_ready = [bool]$g.TpmReady }
try { $r.secure_boot = [bool](Confirm-SecureBootUEFI -ErrorAction Stop) }
catch [System.PlatformNotSupportedException] { $r.secure_boot = $false }
catch { }
$b = Get-BitLockerVolume -MountPoint $env:SystemDrive
if ($b) { $r.bitlocker_on = ([string]$b.ProtectionStatus -eq 'On') }
$h = Get-HotFix | Where-Object { $_.InstalledOn } | Sort-Object InstalledOn -Descending | Select-Object -First 1
if ($h) { $r.last_update_days = [int]((Get-Date) - $h.InstalledOn).TotalDays }
$r | ConvertTo-Json -Compress
