@echo off
setlocal

REM ----------------------------------------
REM Lancement rapide du site Next.js
REM Mise a jour automatique a chaque modification (mode dev)
REM ----------------------------------------

cd /d "%~dp0"

if not exist "package.json" (
  echo [ERREUR] package.json introuvable dans ce dossier.
  pause
  exit /b 1
)

REM Eviter les conflits de serveurs Next deja ouverts
echo [INFO] Fermeture des anciens processus Node (si presents)...
taskkill /F /IM node.exe >nul 2>nul

if not exist "node_modules" (
  echo [INFO] Dependances absentes. Installation en cours...
  call npm install
  if errorlevel 1 (
    echo [ERREUR] Echec npm install.
    pause
    exit /b 1
  )
)

REM Nettoyage cache Next pour eviter les erreurs de chunks
if exist ".next" (
  echo [INFO] Nettoyage du cache .next ...
  rmdir /s /q ".next" >nul 2>nul
)

echo.
echo [INFO] Lancement du serveur...
echo [INFO] Le site se mettra a jour automatiquement quand tu modifies les fichiers.
echo [INFO] URL: http://localhost:3000
echo [INFO] Arret: CTRL + C
echo [INFO] Mode SAFE active (clean cache + dev stable)
echo [INFO] Turbopack desactive pour eviter les erreurs internes intermittentes
echo.

set NEXT_DISABLE_TURBOPACK=1
call npm run dev:safe

endlocal

