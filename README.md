# spiffo-up

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.tsx
```

## GCP manual deploy prerequisites

GCP deploy runs only from explicit TUI lifecycle actions. Tests use fakes and never create cloud resources.

Before a real deploy, configure locally:

- GCP Application Default Credentials, e.g. `gcloud auth application-default login`.
- A GCP project with Compute Engine API enabled.
- `projectId`, region, zone and instance type on the server draft.
- Pulumi CLI: the TUI can install it automatically (opt-in) to `~/.spiffo-up/bin/pulumi/<version>/`, or you can pre-install it on `PATH`. Windows manual fallback: `winget install Pulumi.Pulumi`, then restart terminal.
- Tests do not download Pulumi or create cloud resources.
- Optional public RCON CIDRs. Unsafe CIDRs `0.0.0.0/0` or `::/0` require explicit confirmation.

This project was created using `bun init` in bun v1.3.12. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
