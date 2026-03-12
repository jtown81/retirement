@echo off
REM ==============================================================================
REM Git Workflow Helper Script - Windows
REM
REM Interactive script to guide developers through master/dev branch workflow
REM Usage: git-workflow.bat [command]
REM ==============================================================================

setlocal enabledelayedexpansion

set "COMMAND=%1"
if "!COMMAND!"=="" set "COMMAND=menu"

REM Check if git is installed
where git >nul 2>nul
if errorlevel 1 (
    echo Error: Git is not installed or not in PATH
    exit /b 1
)

REM Check if we're in a git repository
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo Error: Not in a git repository
    exit /b 1
)

goto !COMMAND!

:menu
cls
echo.
echo ============================================================
echo         Git Workflow Helper - Interactive Menu
echo ============================================================
echo.
echo Choose an action:
echo   1) Start a new feature
echo   2) Create a commit
echo   3) Push changes to remote
echo   4) Create pull request
echo   5) Sync with dev branch
echo   6) Release to master
echo   7) Create hotfix
echo   8) Clean up branches
echo   9) Show help
echo   0) Exit
echo.
set /p choice="Select action [0-9]: "

if "!choice!"=="0" (
    echo Goodbye!
    exit /b 0
)
if "!choice!"=="1" goto feature
if "!choice!"=="2" goto commit
if "!choice!"=="3" goto push
if "!choice!"=="4" goto pr
if "!choice!"=="5" goto sync
if "!choice!"=="6" goto release
if "!choice!"=="7" goto hotfix
if "!choice!"=="8" goto clean
if "!choice!"=="9" goto help
echo Invalid choice
goto menu

:feature
cls
echo.
echo ============================================================
echo         START NEW FEATURE
echo ============================================================
echo.
git branch
echo.
set /p type="Feature type (feature/fix/docs) [feature]: "
if "!type!"=="" set "type=feature"

set /p name="Feature name (e.g., user-auth): "
set "branch=!type!/!name!"

echo.
echo Creating branch: !branch!
echo.

git fetch origin
git checkout dev
git pull origin dev
git checkout -b "!branch!" dev

echo.
echo Success! Feature branch created: !branch!
echo Next steps:
echo   1. Make your changes
echo   2. Run: git-workflow.bat commit
echo   3. Run: git-workflow.bat push
echo.
set /p menu="Continue? (y/n) [y]: "
if "!menu!"=="n" exit /b 0
goto menu

:commit
cls
echo.
echo ============================================================
echo         CREATE COMMIT
echo ============================================================
echo.
git status
echo.
set /p stage="Stage all changes? (y/n) [y]: "
if not "!stage!"=="n" (
    git add .
    echo Changes staged
)

echo.
echo Commit types:
echo   feat:     Add new feature
echo   fix:      Fix bug
echo   docs:     Update documentation
echo   refactor: Reorganize code
echo   perf:     Performance improvement
echo   chore:    Maintenance tasks
echo.
set /p type="Commit type: "
set /p desc="Short description: "

echo.
set /p issue="Issue number to close (optional): "

echo.
echo Commit message:
echo ───────────────────────────────────────
if "!issue!"=="" (
    echo !type!: !desc!
) else (
    echo !type!: !desc!
    echo.
    echo Closes #!issue!
)
echo ───────────────────────────────────────
echo.
set /p confirm="Confirm commit? (y/n) [y]: "
if "!confirm!"=="n" goto menu

if "!issue!"=="" (
    git commit -m "!type!: !desc!"
) else (
    git commit -m "!type!: !desc!"
)
echo Commit created!
set /p menu="Continue? (y/n) [y]: "
if not "!menu!"=="n" goto menu
exit /b 0

:push
cls
echo.
echo ============================================================
echo         PUSH CHANGES
echo ============================================================
echo.
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set "branch=%%i"
echo Current branch: !branch!

if "!branch!"=="master" (
    echo Error: Cannot push directly to master
    goto menu
)

echo.
set /p confirm="Push '!branch!' to remote? (y/n) [y]: "
if "!confirm!"=="n" goto menu

git push origin "!branch!"
echo.
echo Success! Branch pushed to GitHub
echo Next: Create PR on GitHub (base: dev, compare: !branch!)
echo.
set /p menu="Continue? (y/n) [y]: "
if not "!menu!"=="n" goto menu
exit /b 0

:pr
cls
echo.
echo ============================================================
echo         CREATE PULL REQUEST
echo ============================================================
echo.
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set "branch=%%i"
echo Current branch: !branch!

if "!branch!"=="dev" (
    echo Error: Cannot create PR from dev
    goto menu
)

echo.
set /p title="PR title: "
set /p desc="PR description: "

echo.
echo Note: Pull requests must be created on GitHub
echo URL: https://github.com/jtown81
echo Base: dev
echo Compare: !branch!
echo.
set /p menu="Continue? (y/n) [y]: "
if not "!menu!"=="n" goto menu
exit /b 0

:sync
cls
echo.
echo ============================================================
echo         SYNC WITH DEV
echo ============================================================
echo.
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set "branch=%%i"
echo Current branch: !branch!

echo.
echo Fetching latest...
git fetch origin

if "!branch!"=="dev" (
    echo Pulling latest dev...
    git pull origin dev
) else (
    echo Rebasing on latest dev...
    git rebase origin/dev
)

echo Success! Branch synced
echo.
set /p menu="Continue? (y/n) [y]: "
if not "!menu!"=="n" goto menu
exit /b 0

:release
cls
echo.
echo ============================================================
echo         RELEASE TO MASTER
echo ============================================================
echo.
echo This will merge dev to master and create a release tag
echo.
set /p version="Version number (e.g., 1.0.0): "
set /p desc="Release description: "

echo.
echo Checking out master...
git checkout master
git pull origin master

echo Merging dev...
git merge dev

echo Pushing master...
git push origin master

echo Creating tag v!version!...
git tag -a "v!version!" -m "!desc!"

echo Pushing tag...
git push origin "v!version!"

echo.
echo Success! Release v!version! created
echo.
set /p menu="Continue? (y/n) [y]: "
if not "!menu!"=="n" goto menu
exit /b 0

:hotfix
cls
echo.
echo ============================================================
echo         CREATE HOTFIX
echo ============================================================
echo.
echo WARNING: Hotfixes are for CRITICAL production issues only
echo.
set /p name="Hotfix name (e.g., critical-bug): "
set "branch=hotfix/!name!"

echo.
echo Creating hotfix branch: !branch!
echo.
git fetch origin
git checkout master
git pull origin master
git checkout -b "!branch!" master

echo.
echo Success! Hotfix branch created: !branch!
echo Next: Fix the issue, commit, then merge back to master AND dev
echo.
set /p menu="Continue? (y/n) [y]: "
if not "!menu!"=="n" goto menu
exit /b 0

:clean
cls
echo.
echo ============================================================
echo         CLEAN UP BRANCHES
echo ============================================================
echo.
echo Fetching latest...
git fetch origin --prune

echo.
echo Local branches:
git branch -v

echo.
set /p delete="Delete merged branches? (y/n) [n]: "
if "!delete!"=="y" (
    for /f "tokens=*" %%i in ('git branch --merged') do (
        if not "%%i"=="*master" if not "%%i"=="*main" if not "%%i"=="*dev" (
            git branch -d "%%i"
        )
    )
)

echo Success!
echo.
set /p menu="Continue? (y/n) [y]: "
if not "!menu!"=="n" goto menu
exit /b 0

:help
cls
echo.
echo ============================================================
echo         Git Workflow Helper - Help
echo ============================================================
echo.
echo USAGE:
echo   git-workflow.bat [command]
echo.
echo COMMANDS:
echo   feature   - Start a new feature branch
echo   commit    - Create a commit with proper format
echo   push      - Push your feature branch to remote
echo   pr        - Create a pull request on GitHub
echo   sync      - Sync your branch with latest dev
echo   release   - Release dev to master with version tag
echo   hotfix    - Create a critical production fix
echo   clean     - Clean up local branches
echo   help      - Show this help message
echo   menu      - Show interactive menu (default)
echo.
echo WORKFLOW:
echo   1. Start feature:    git-workflow.bat feature
echo   2. Make changes:     Edit files
echo   3. Create commit:    git-workflow.bat commit
echo   4. Push branch:      git-workflow.bat push
echo   5. Create PR:        git-workflow.bat pr
echo   6. Code review:      Wait for approval on GitHub
echo   7. Release:          git-workflow.bat release
echo.
echo DOCUMENTATION:
echo   • \projects\workflow.md         - Complete workflow guide
echo   • \projects\QUICK-REFERENCE.md  - Common git commands
echo   • Project CLAUDE.md             - Project-specific guidelines
echo.
set /p menu="Continue? (y/n) [y]: "
if not "!menu!"=="n" goto menu
exit /b 0

:default
echo Unknown command: %COMMAND%
echo Use: git-workflow.bat help
exit /b 1
