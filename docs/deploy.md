# Deploy

Live URL: https://baditaflorin.github.io/civic-asset-audit-walker/

Repository: https://github.com/baditaflorin/civic-asset-audit-walker

## Publishing Strategy

GitHub Pages serves `main` branch `/docs`.

`make build` writes the static app into `docs/` and preserves documentation such as `docs/adr/`.

## Publish

```bash
make lint
make test
make smoke
git status --short
git add .
git commit -m "feat: describe the change"
git push
```

## Rollback

Revert the publishing commit and push:

```bash
git revert <commit>
git push
```

## Custom Domain

No custom domain is configured in v0.1.0. To add one later:

1. Add `docs/CNAME` containing the domain.
2. Configure DNS according to GitHub Pages documentation.
3. Confirm HTTPS enforcement in repository Pages settings.

GitHub Pages documentation: https://docs.github.com/pages

## Pages Gotchas

- The Vite base path is `/civic-asset-audit-walker/`.
- GitHub Pages does not support `_headers` or `_redirects`.
- `docs/404.html` is copied from `docs/index.html` for SPA fallback behavior.
- Service worker scope must remain under `/civic-asset-audit-walker/`.
