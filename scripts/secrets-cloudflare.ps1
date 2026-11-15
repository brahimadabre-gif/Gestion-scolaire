# ===============================================================
#  Envoi des secrets du site a Cloudflare (aucune valeur affichee)
#  A lancer dans le dossier du site :
#    powershell -ExecutionPolicy Bypass -File scripts\secrets-cloudflare.ps1
#
#  - DATABASE_URL   : adresse Neon collee par vous (connexion 'pooler')
#  - JWT_SECRET     : genere ici au hasard (Netlify ne laisse pas relire
#                     l'ancien ; les utilisateurs se reconnectent une fois)
#  - RESEND_API_KEY : cle Resend collee par vous (Entree pour passer)
# ===============================================================
$ErrorActionPreference = 'Continue'
Set-Location (Split-Path $PSScriptRoot -Parent)

function Lire-Cache([string]$invite) {
  $s = Read-Host $invite -AsSecureString
  $p = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($p).Trim() }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($p) }
}

Write-Host ""
Write-Host "=== 1/3  Adresse de la base Neon ===" -ForegroundColor Cyan
$neon = Lire-Cache "Collez l'adresse de connexion Neon (postgresql://...) puis Entree"
# Accepte aussi un extrait du type DATABASE_URL='postgresql://...' ou psql '...'
if ($neon -match "(postgres(ql)?://[^\s'`"]+)") { $neon = $Matches[1] }
if ($neon -notmatch '^postgres(ql)?://') { Write-Host "Ce n'est pas une adresse postgresql:// : rien n'a ete envoye." -ForegroundColor Red; exit 1 }
$direct = $neon -replace '-pooler\.', '.'
$pool = $direct -replace '@(ep-[^.]+)\.', '@$1-pooler.'
Write-Host "Adresse Neon recue (non affichee)." -ForegroundColor Green

Write-Host ""
Write-Host "=== 2/3  Cles ===" -ForegroundColor Cyan
$octets = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($octets)
$jwt = [Convert]::ToBase64String($octets).TrimEnd('=').Replace('+', '-').Replace('/', '_')
Write-Host "JWT_SECRET genere (64 caracteres, non affiche)." -ForegroundColor Green

$secrets = @{ DATABASE_URL = $pool; JWT_SECRET = $jwt }
$resend = Lire-Cache "Collez la cle Resend (re_...) puis Entree - ou Entree seule pour passer"
if ($resend -match '^re_') { $secrets.RESEND_API_KEY = $resend; Write-Host "RESEND_API_KEY recue (non affichee)." -ForegroundColor Green }
elseif ($resend) { Write-Host "Ce n'est pas une cle Resend (elle commence par re_) : ignoree." -ForegroundColor Yellow }
else { Write-Host "RESEND_API_KEY passee : les e-mails 'mot de passe oublie' attendront." -ForegroundColor Yellow }

Write-Host ""
Write-Host "=== 3/3  Envoi a Cloudflare ===" -ForegroundColor Cyan
$tmp = Join-Path $env:TEMP ("gspp-secrets-" + [guid]::NewGuid().ToString() + ".json")
try {
  [IO.File]::WriteAllText($tmp, ($secrets | ConvertTo-Json -Compress), (New-Object System.Text.UTF8Encoding $false))
  npx.cmd wrangler secret bulk $tmp --config wrangler.jsonc
  $code = $LASTEXITCODE
} finally {
  Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  $secrets.Clear(); $neon = $null; $direct = $null; $pool = $null; $jwt = $null; $resend = $null
}
if ($code -ne 0) { Write-Host "L'envoi a Cloudflare a echoue." -ForegroundColor Red; exit 1 }
Write-Host ""
Write-Host "Termine. Prevenez Claude : il peut tester le site Cloudflare." -ForegroundColor Green
