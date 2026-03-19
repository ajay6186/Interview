# Exercise 6.5 — Final Challenge

## What you'll learn
- Apply every Jenkins concept in a single production-ready pipeline
- Handle failure gracefully with notifications and rollback
- Write a maintainable, well-structured Jenkinsfile

## Challenge
Build the `exercise/Jenkinsfile` from scratch. The pipeline must:

1. **Build**: Install deps + lint + test inside a Docker agent
2. **Quality**: Parallel security scan + code coverage
3. **Docker**: Build image tagged with git SHA
4. **Push**: Push to registry (main branch only)
5. **Staging**: Deploy via Helm to staging (main branch)
6. **Approval**: Manual gate with 2-hour timeout (production)
7. **Production**: Helm deploy to prod + update GitOps repo
8. **Notifications**: Slack on success/failure with build link
9. **Rollback**: On failure in production, helm rollback automatically

## Checklist
- [ ] All stages clearly named and ordered correctly
- [ ] `when {}` conditions prevent staging/prod from running on feature branches
- [ ] Credentials never hardcoded (all via `withCredentials`)
- [ ] `post { always }` cleans up Docker images
- [ ] `post { failure }` sends Slack alert + triggers rollback
- [ ] Pipeline-level timeout prevents hung builds
- [ ] `archiveArtifacts` saves test results
