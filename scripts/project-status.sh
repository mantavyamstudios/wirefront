#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
# Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
#
# Moves an issue on the Wirefront Shell Overhaul board (mantavyamstudios project #3).
# This is the only board this script touches.
#
#   scripts/project-status.sh <issue> <todo|progress|done>
#   scripts/project-status.sh --list [milestone title]
#
# Field and option ids are looked up by name on every run, so renaming or
# re-creating an option on the board never leaves a stale id here.
set -euo pipefail

OWNER=mantavyamstudios
PROJECT=3
REPO=mantavyamstudios/wirefront

usage() {
  echo "usage: $0 <issue> <todo|progress|done>" >&2
  echo "       $0 --list [milestone title]" >&2
  exit 2
}

[ $# -ge 1 ] || usage

if [ "$1" = "--list" ]; then
  milestone="${2:-}"
  gh project item-list "$PROJECT" --owner "$OWNER" --format json --limit 500 \
    --jq ".items[] | select(\"$milestone\" == \"\" or .milestone.title == \"$milestone\") | \"#\(.content.number)\t\(.status)\t\(.content.title)\"" |
    sort -t'#' -k2 -n
  exit 0
fi

[ $# -eq 2 ] || usage
issue="$1"
case "$2" in
  todo | Todo) status="Todo" ;;
  progress | "in-progress" | "In Progress") status="In Progress" ;;
  done | Done) status="Done" ;;
  *) usage ;;
esac

project_id=$(gh project view "$PROJECT" --owner "$OWNER" --format json --jq .id)
field_json=$(gh project field-list "$PROJECT" --owner "$OWNER" --format json --jq '.fields[] | select(.name == "Status")')
field_id=$(jq -r .id <<<"$field_json")
option_id=$(jq -r --arg s "$status" '.options[] | select(.name == $s) | .id' <<<"$field_json")
[ -n "$option_id" ] || { echo "no Status option named '$status' on the board" >&2; exit 1; }

item_id=$(gh project item-list "$PROJECT" --owner "$OWNER" --format json --limit 500 \
  --jq ".items[] | select(.content.number == $issue) | .id")
if [ -z "$item_id" ]; then
  echo "#$issue is not on the board yet; adding it" >&2
  item_id=$(gh project item-add "$PROJECT" --owner "$OWNER" \
    --url "https://github.com/$REPO/issues/$issue" --format json --jq .id)
fi

gh project item-edit --id "$item_id" --project-id "$project_id" \
  --field-id "$field_id" --single-select-option-id "$option_id" >/dev/null
echo "#$issue -> $status"
