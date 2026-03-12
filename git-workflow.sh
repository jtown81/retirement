#!/bin/bash

###############################################################################
# Git Workflow Helper Script
#
# Interactive script to guide developers through master/dev branch workflow
# Usage: ./git-workflow.sh [command]
#
# Commands:
#   feature   - Start a new feature
#   commit    - Make a commit with proper message format
#   push      - Push changes to remote
#   pr        - Create a pull request
#   sync      - Sync with latest dev branch
#   release   - Release to master
#   hotfix    - Create a critical production fix
#   clean     - Clean up local branches
#   help      - Show this help message
#   menu      - Show interactive menu (default)
#
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

# Check if git is initialized
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not a git repository. Run this script from a git project directory."
        exit 1
    fi
}

# Get current branch
get_current_branch() {
    git rev-parse --abbrev-ref HEAD
}

# Get repository name
get_repo_name() {
    basename "$(git rev-parse --show-toplevel)"
}

# Validate branch name
validate_branch_name() {
    local name=$1
    if [[ ! $name =~ ^[a-z0-9\-]+$ ]]; then
        print_error "Invalid branch name. Use lowercase letters, numbers, and hyphens only."
        return 1
    fi
    return 0
}

# Start a new feature
start_feature() {
    print_header "START NEW FEATURE"

    check_git_repo

    print_info "Current branch: $(get_current_branch)"
    echo ""

    read -p "Feature type (feature/fix/docs/chore) [feature]: " feature_type
    feature_type=${feature_type:-feature}

    read -p "Feature name (e.g., user-authentication): " feature_name

    if ! validate_branch_name "$feature_name"; then
        return 1
    fi

    local branch_name="${feature_type}/${feature_name}"

    echo ""
    print_info "Creating branch: $branch_name"

    # Fetch latest
    print_info "Fetching latest from remote..."
    git fetch origin

    # Switch to dev
    print_info "Checking out dev branch..."
    git checkout dev
    git pull origin dev

    # Create feature branch
    print_info "Creating feature branch..."
    git checkout -b "$branch_name" dev

    echo ""
    print_success "Feature branch created: $branch_name"
    print_info "You are now on: $(get_current_branch)"
    echo ""
    echo "Next steps:"
    echo "  1. Make your changes"
    echo "  2. Run: $0 commit"
    echo "  3. Run: $0 push"
    echo "  4. Create PR on GitHub"
}

# Make a commit with proper formatting
make_commit() {
    print_header "CREATE COMMIT"

    check_git_repo

    print_info "Current branch: $(get_current_branch)"

    # Show status
    git status
    echo ""

    read -p "Stage all changes? (y/n) [y]: " stage_all
    if [[ "$stage_all" != "n" ]]; then
        git add .
        print_success "Changes staged"
    fi

    echo ""
    echo "Commit message format:"
    echo "  feat:     Add new feature"
    echo "  fix:      Fix bug"
    echo "  docs:     Update documentation"
    echo "  refactor: Reorganize code"
    echo "  perf:     Performance improvement"
    echo "  chore:    Maintenance tasks"
    echo ""

    read -p "Commit type (feat/fix/docs/refactor/perf/chore): " commit_type
    read -p "Short description: " short_desc

    echo ""
    print_info "Enter longer description (optional, press Enter twice to finish):"
    local long_desc=""
    while true; do
        read -p "> " line
        if [[ -z "$line" ]]; then
            break
        fi
        long_desc="${long_desc}${line}\\n"
    done

    read -p "Issue number to close (optional, e.g., 123): " issue_num

    # Build commit message
    local commit_msg="${commit_type}: ${short_desc}"
    if [[ -n "$long_desc" ]]; then
        commit_msg="${commit_msg}\\n\\n${long_desc}"
    fi
    if [[ -n "$issue_num" ]]; then
        commit_msg="${commit_msg}\\nCloses #${issue_num}"
    fi

    echo ""
    echo "Commit message:"
    echo "───────────────────────────────────────────────────────"
    echo -e "$commit_msg"
    echo "───────────────────────────────────────────────────────"
    echo ""

    read -p "Confirm commit? (y/n) [y]: " confirm
    if [[ "$confirm" == "n" ]]; then
        print_warning "Commit cancelled"
        return 1
    fi

    git commit -m "$(echo -e "$commit_msg")"
    print_success "Commit created"
}

# Push changes to remote
push_changes() {
    print_header "PUSH CHANGES"

    check_git_repo

    local current_branch=$(get_current_branch)
    print_info "Current branch: $current_branch"

    if [[ "$current_branch" == "master" || "$current_branch" == "main" ]]; then
        print_error "Cannot push directly to master/main. Push feature branches instead."
        return 1
    fi

    echo ""
    read -p "Push branch '$current_branch' to remote? (y/n) [y]: " confirm
    if [[ "$confirm" == "n" ]]; then
        print_warning "Push cancelled"
        return 1
    fi

    print_info "Pushing $current_branch to origin..."
    git push origin "$current_branch"

    echo ""
    print_success "Branch pushed to GitHub"
    echo ""
    echo "Next steps:"
    echo "  1. Visit GitHub and create a Pull Request"
    echo "  2. Base: dev"
    echo "  3. Compare: $current_branch"
    echo "  4. Run: $0 pr"
}

# Create a pull request
create_pr() {
    print_header "CREATE PULL REQUEST"

    check_git_repo

    local current_branch=$(get_current_branch)

    if [[ "$current_branch" == "dev" || "$current_branch" == "master" || "$current_branch" == "main" ]]; then
        print_error "Cannot create PR from $current_branch. Use a feature branch."
        return 1
    fi

    print_info "Current branch: $current_branch"
    echo ""

    # Check if gh CLI is available
    if ! command -v gh &> /dev/null; then
        print_warning "GitHub CLI (gh) not found. Install it to use this feature."
        echo "Alternatively, create PR manually at: https://github.com/jtown81/$(get_repo_name)"
        return 1
    fi

    read -p "PR title: " pr_title
    read -p "PR description: " pr_desc

    echo ""
    echo "PR Details:"
    echo "───────────────────────────────────────────────────────"
    echo "Title: $pr_title"
    echo "Description: $pr_desc"
    echo "Base branch: dev"
    echo "Head branch: $current_branch"
    echo "───────────────────────────────────────────────────────"
    echo ""

    read -p "Create PR? (y/n) [y]: " confirm
    if [[ "$confirm" == "n" ]]; then
        print_warning "PR creation cancelled"
        return 1
    fi

    gh pr create --base dev --head "$current_branch" \
        --title "$pr_title" \
        --body "$pr_desc"

    print_success "Pull request created!"
    print_info "Visit GitHub to review and merge"
}

# Sync with dev branch
sync_with_dev() {
    print_header "SYNC WITH DEV"

    check_git_repo

    local current_branch=$(get_current_branch)
    print_info "Current branch: $current_branch"

    echo ""
    print_info "Fetching latest from remote..."
    git fetch origin

    if [[ "$current_branch" == "dev" ]]; then
        print_info "Pulling latest dev branch..."
        git pull origin dev
        print_success "Dev branch synced with remote"
    else
        print_info "Rebasing on latest dev..."
        git rebase origin/dev

        echo ""
        read -p "Force push to update remote? (y/n) [n]: " force_push
        if [[ "$force_push" == "y" ]]; then
            git push origin "$current_branch" --force-with-lease
            print_success "Branch rebased and pushed"
        else
            print_info "To push your changes later, run: git push origin $current_branch --force-with-lease"
        fi
    fi
}

# Release to master
release_to_master() {
    print_header "RELEASE TO MASTER"

    check_git_repo

    local current_branch=$(get_current_branch)

    if [[ "$current_branch" != "dev" && "$current_branch" != "main" && "$current_branch" != "master" ]]; then
        print_warning "It's recommended to run this from dev branch"
        read -p "Continue anyway? (y/n) [n]: " continue_anyway
        if [[ "$continue_anyway" != "y" ]]; then
            return 1
        fi
    fi

    echo ""
    print_warning "This will merge dev → master and create a release tag"
    echo ""

    read -p "Version number (e.g., 1.0.0): " version
    if ! [[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        print_error "Invalid version format. Use semver (e.g., 1.0.0)"
        return 1
    fi

    read -p "Release description: " release_desc

    echo ""
    echo "Release Details:"
    echo "───────────────────────────────────────────────────────"
    echo "Version: v$version"
    echo "Description: $release_desc"
    echo "Repository: $(get_repo_name)"
    echo "───────────────────────────────────────────────────────"
    echo ""

    read -p "Create release v$version? (y/n) [y]: " confirm
    if [[ "$confirm" == "n" ]]; then
        print_warning "Release cancelled"
        return 1
    fi

    echo ""
    print_info "Checking out master..."
    git checkout master

    print_info "Pulling latest master..."
    git pull origin master

    print_info "Merging dev into master..."
    git merge dev

    print_info "Pushing master..."
    git push origin master

    print_info "Creating tag v$version..."
    git tag -a "v$version" -m "$release_desc"

    print_info "Pushing tag..."
    git push origin "v$version"

    echo ""
    print_success "Release v$version created!"

    # Sync dev
    echo ""
    read -p "Sync dev branch with master? (y/n) [y]: " sync_dev
    if [[ "$sync_dev" != "n" ]]; then
        print_info "Updating dev..."
        git checkout dev
        git merge master
        git push origin dev
        print_success "Dev branch synced"
    fi
}

# Create a hotfix
create_hotfix() {
    print_header "CREATE HOTFIX"

    check_git_repo

    print_warning "Hotfixes are for CRITICAL production issues only"
    echo ""

    read -p "Hotfix name (e.g., critical-bug): " hotfix_name

    if ! validate_branch_name "$hotfix_name"; then
        return 1
    fi

    local hotfix_branch="hotfix/${hotfix_name}"

    echo ""
    print_info "This hotfix will:"
    echo "  1. Branch from master"
    echo "  2. Allow you to fix the issue"
    echo "  3. Merge back to both master AND dev"
    echo "  4. Create a patch version tag"
    echo ""

    read -p "Continue? (y/n) [y]: " confirm
    if [[ "$confirm" == "n" ]]; then
        return 1
    fi

    print_info "Fetching latest..."
    git fetch origin

    print_info "Checking out master..."
    git checkout master
    git pull origin master

    print_info "Creating hotfix branch: $hotfix_branch"
    git checkout -b "$hotfix_branch" master

    echo ""
    print_success "Hotfix branch created: $hotfix_branch"
    echo ""
    echo "Next steps:"
    echo "  1. Make your critical fix"
    echo "  2. Test thoroughly"
    echo "  3. Run: $0 commit"
    echo "  4. Run: $0 release (from master after merging hotfix)"
    echo "  5. Remember to merge back to dev!"
}

# Clean up branches
clean_branches() {
    print_header "CLEAN UP BRANCHES"

    check_git_repo

    print_info "Fetching latest..."
    git fetch origin --prune

    echo ""
    echo "Local branches:"
    git branch -v

    echo ""
    read -p "Delete merged branches? (y/n) [n]: " delete_merged
    if [[ "$delete_merged" == "y" ]]; then
        git branch --merged | grep -v "master\|main\|dev" | xargs -r git branch -d
        print_success "Merged branches deleted"
    fi

    echo ""
    read -p "Delete a specific branch? Enter name or press Enter to skip: " branch_to_delete
    if [[ -n "$branch_to_delete" ]]; then
        git branch -D "$branch_to_delete"
        print_success "Branch deleted"
    fi
}

# Show help
show_help() {
    cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════════════╗
║                    Git Workflow Helper Script                             ║
║                                                                           ║
║  Interactive script to guide developers through master/dev workflow      ║
╚═══════════════════════════════════════════════════════════════════════════╝

USAGE:
  ./git-workflow.sh [command]

COMMANDS:
  feature   - Start a new feature branch
  commit    - Create a commit with proper message format
  push      - Push your feature branch to remote
  pr        - Create a pull request on GitHub
  sync      - Sync your branch with latest dev
  release   - Release dev to master with version tag
  hotfix    - Create a critical production fix
  clean     - Clean up local branches
  help      - Show this help message
  menu      - Show interactive menu (default)

EXAMPLES:
  ./git-workflow.sh feature        # Start new feature (interactive)
  ./git-workflow.sh commit         # Create commit (interactive)
  ./git-workflow.sh push           # Push changes to remote
  ./git-workflow.sh release        # Release to master
  ./git-workflow.sh               # Show interactive menu

WORKFLOW:
  1. Start feature:    ./git-workflow.sh feature
  2. Make changes:     git add . && edit files
  3. Create commit:    ./git-workflow.sh commit
  4. Push branch:      ./git-workflow.sh push
  5. Create PR:        ./git-workflow.sh pr
  6. Code review:      Wait for approval on GitHub
  7. Release:          ./git-workflow.sh release

DOCUMENTATION:
  • /projects/workflow.md         - Complete workflow guide
  • /projects/QUICK-REFERENCE.md  - Common git commands
  • Each project's CLAUDE.md      - Project-specific guidelines

EOF
}

# Show interactive menu
show_menu() {
    print_header "Git Workflow Helper"

    check_git_repo

    local repo=$(get_repo_name)
    local branch=$(get_current_branch)

    echo "Repository: $repo"
    echo "Current branch: $branch"
    echo ""
    echo "Choose an action:"
    echo "  1) Start a new feature"
    echo "  2) Create a commit"
    echo "  3) Push changes to remote"
    echo "  4) Create pull request"
    echo "  5) Sync with dev branch"
    echo "  6) Release to master"
    echo "  7) Create hotfix"
    echo "  8) Clean up branches"
    echo "  9) Show help"
    echo "  0) Exit"
    echo ""

    read -p "Select action [0-9]: " choice

    case $choice in
        1) start_feature ;;
        2) make_commit ;;
        3) push_changes ;;
        4) create_pr ;;
        5) sync_with_dev ;;
        6) release_to_master ;;
        7) create_hotfix ;;
        8) clean_branches ;;
        9) show_help ;;
        0) echo "Goodbye!" && exit 0 ;;
        *) print_error "Invalid choice" && show_menu ;;
    esac

    echo ""
    read -p "Continue? (y/n) [y]: " continue_menu
    if [[ "$continue_menu" != "n" ]]; then
        show_menu
    fi
}

# Main script logic
main() {
    local command=${1:-menu}

    case $command in
        feature) start_feature ;;
        commit) make_commit ;;
        push) push_changes ;;
        pr) create_pr ;;
        sync) sync_with_dev ;;
        release) release_to_master ;;
        hotfix) create_hotfix ;;
        clean) clean_branches ;;
        help) show_help ;;
        menu) show_menu ;;
        *)
            print_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
