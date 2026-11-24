#!/usr/bin/env bash
set -euo pipefail
version=8.30.1
case "$(uname -m)" in
  x86_64) arch=x64; checksum=551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb ;;
  aarch64|arm64) arch=arm64; checksum=e4a487ee7ccd7d3a7f7ec08657610aa3606637dab924210b3aee62570fb4b080 ;;
  *) printf 'Unsupported architecture for this Linux installer.\n' >&2; exit 1 ;;
esac
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
archive="gitleaks_${version}_linux_${arch}.tar.gz"
curl --fail --location --silent --show-error "https://github.com/gitleaks/gitleaks/releases/download/v${version}/${archive}" --output "$work/$archive"
printf '%s  %s\n' "$checksum" "$work/$archive" | sha256sum -c -
tar -xzf "$work/$archive" -C "$work" gitleaks
mkdir -p "${GITLEAKS_INSTALL_DIR:-$HOME/.local/bin}"
install -m 0755 "$work/gitleaks" "${GITLEAKS_INSTALL_DIR:-$HOME/.local/bin}/gitleaks"
printf 'Installed checksum-verified Gitleaks %s.\n' "$version"
