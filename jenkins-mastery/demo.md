 Step 1 — Start Jenkins Locally

  docker run -d \
    --name jenkins \
    -p 8080:8080 \
    -p 50000:50000 \
    -v jenkins_home:/var/jenkins_home \
    -v /var/run/docker.sock:/var/run/docker.sock \
    jenkins/jenkins:lts

  The -v /var/run/docker.sock line lets Jenkins run Docker commands (needed for Phase 3+).

  Step 2 — Unlock Jenkins

  # Get the initial admin password
  docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

  Then open http://localhost:8080, paste the password, and install suggested plugins.

  Step 3 — Install Extra Plugins

  Go to Manage Jenkins → Plugins → Available and install:

  - Docker Pipeline — for agent { docker { image '...' } }
  - Pipeline — (usually pre-installed)

  Step 4 — Run an Exercise

  The simplest approach — paste directly into Jenkins:

  1. Click New Item
  2. Enter a name (e.g., exercise-1-1)
  3. Choose Pipeline → OK
  4. Scroll to Pipeline section
  5. Set Definition to Pipeline script
  6. Copy/paste the content of the exercise Jenkinsfile
  7. Click Save → Build Now

  ---
  Step 5 — Practice Workflow

  For each exercise:

  1. Open exercise/Jenkinsfile in VS Code
  2. Read the README.md for what to do
  3. Fill in the ??? placeholders
  4. Paste into Jenkins → Build Now
  5. Check Console Output
  6. Compare with solution/Jenkinsfile

  ---