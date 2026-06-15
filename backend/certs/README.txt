# This directory holds optional corporate root-CA certificates.
# Drop any *.crt or *.pem here to have the Docker build trust a
# TLS-intercepting proxy (e.g. Cars24 Cloudflare Gateway) so Maven
# Central and outbound HTTPS work from inside the build/runtime.
#
# Ships EMPTY (only this file) — no-op on direct-egress networks.
# Certs dropped here are gitignored so they never get committed.
