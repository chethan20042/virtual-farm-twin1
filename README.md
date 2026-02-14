Virtual Farm Twin 1

Quick: how to push this project to GitHub

1) Create a repository on GitHub
   - Go to github.com → New repository
   - Name it (e.g. `virtual-farm-twin1`) and do NOT initialize with README/.gitignore/license

2) (Optional) Create a Personal Access Token (HTTPS auth)
   - GitHub → Settings → Developer settings → Personal access tokens
   - Generate new token (classic or fine-grained) and give `repo` scope
   - Copy the token; use it as your password when Git prompts during `git push` over HTTPS

3) From PowerShell in the project root (`d:\virtual-farm-twin1`), run:

```powershell
cd d:\virtual-farm-twin1
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Replace `YOUR_USERNAME/YOUR_REPO.git` with your repo URL. If you get prompted for credentials, use your GitHub username and the Personal Access Token as the password.

Notes:
- I removed a nested `.git` inside `frontend` so the frontend folder is tracked in this repo.
- If you want, provide the repository HTTPS URL here and I can add the remote and push for you.
